"""Controladores HTTP: mapeiam rotas e delegam regras aos serviços (MVC)."""
from contextlib import asynccontextmanager
import os
from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException, Header, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import select, func, delete, or_
from .database import Base, engine, get_db
from .models import User, SessionToken, PasswordReset, Product, Address, Order, Feedback
from .security import hash_password, verify_password, new_token, token_digest, expiry, is_expired
from .schemas import RegisterIn, LoginIn, PasswordRequestIn, PasswordResetIn, AddressIn, ProductIn, ProductPatch, CheckoutIn, StatusIn, FeedbackIn
from .services import make_order, cancel_order, DomainError
from .seed import seed_data

@asynccontextmanager
async def lifespan(_app):
    Base.metadata.create_all(engine)
    if os.getenv('SEED_DEMO', '1') == '1':
        seed_data()
    yield

app = FastAPI(title='Cupcake Gourmet API', version='1.0.0', description='Projeto Integrador Transdisciplinar II: Loja de cupcakes gourmet', lifespan=lifespan)
PUBLIC = Path(__file__).resolve().parent / 'static'

@app.exception_handler(DomainError)
async def handle_domain_error(_request, exc: DomainError):
    return JSONResponse(status_code=exc.status, content={'detail': exc.message})

@app.exception_handler(Exception)
async def handle_unknown(request: Request, exc: Exception):
    # Não vazar stack trace/segredos para clientes.
    import logging
    logging.getLogger(__name__).exception('Erro inesperado no servidor: %s', request.url.path)
    return JSONResponse(status_code=500, content={'detail':'Erro interno. Tente novamente.'})

def current_user(authorization: str | None = Header(default=None), db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(401,'Faça login para continuar')
    token = authorization[7:].strip()
    record=db.scalar(select(SessionToken).where(SessionToken.token_hash==token_digest(token)))
    if not record or is_expired(record.expires_at):
        raise HTTPException(401,'Sessão inválida ou expirada')
    user=db.get(User,record.user_id)
    if not user:
        raise HTTPException(401,'Conta não encontrada')
    return user

def admin_user(user: User = Depends(current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(403,'Acesso restrito ao administrador')
    return user

def public_user(u: User):
    return {'id':u.id,'name':u.name,'email':u.email,'is_admin':u.is_admin}

def product_view(p: Product):
    return {field:getattr(p,field) for field in ('id','name','description','category','price_cents','stock','flavor','emoji','featured','active')}

def address_view(a: Address):
    return {field:getattr(a,field) for field in ('id','label','street','number','complement','neighborhood','city','state','postal_code')}

def order_view(o: Order):
    return {'id':o.id,'status':o.status,'payment_status':o.payment_status,'payment_method':o.payment_method,'created_at':o.created_at.isoformat(),'subtotal_cents':o.subtotal_cents,'delivery_cents':o.delivery_cents,'total_cents':o.total_cents,'address_snapshot':o.address_snapshot,
            'items':[{'product_id':i.product_id,'product_name':i.product_name,'quantity':i.quantity,'unit_price_cents':i.unit_price_cents} for i in o.items], 'user_name':o.user.name if o.user else ''}

@app.get('/api/health')
def health():
    return {'ok':True,'app':'Cupcake Gourmet API','version':'1.0.0'}

@app.post('/api/auth/register',status_code=201)
def register(payload: RegisterIn,db:Session=Depends(get_db)):
    if db.scalar(select(User).where(User.email==payload.email)):
        raise HTTPException(409,'E-mail já cadastrado')
    u=User(name=payload.name.strip(),email=payload.email,password_hash=hash_password(payload.password))
    db.add(u);db.commit();db.refresh(u)
    return public_user(u)

@app.post('/api/auth/login')
def login(payload: LoginIn,db:Session=Depends(get_db)):
    u=db.scalar(select(User).where(User.email==payload.email.strip().lower()))
    if not u or not verify_password(payload.password,u.password_hash):
        raise HTTPException(401,'E-mail ou senha inválidos')
    raw=new_token()
    db.add(SessionToken(user_id=u.id,token_hash=token_digest(raw),expires_at=expiry()))
    db.commit()
    return {'access_token':raw,'token_type':'bearer','user':public_user(u)}

@app.post('/api/auth/logout',status_code=204)
def logout(authorization:str|None=Header(default=None),_user:User=Depends(current_user),db:Session=Depends(get_db)):
    db.execute(delete(SessionToken).where(SessionToken.token_hash==token_digest(authorization[7:].strip())))
    db.commit()

@app.get('/api/auth/me')
def me(user:User=Depends(current_user)):
    return public_user(user)

@app.post('/api/auth/forgot-password')
def forgot_password(payload:PasswordRequestIn,db:Session=Depends(get_db)):
    # Resposta indistinguível impede enumeração de usuários.
    u=db.scalar(select(User).where(User.email==payload.email.strip().lower()))
    response={'message':'Se o e-mail existir, as instruções de recuperação serão disponibilizadas.'}
    if u:
        raw=new_token()
        db.add(PasswordReset(user_id=u.id,token_hash=token_digest(raw),expires_at=expiry(15)))
        db.commit()
        # Sem provedor SMTP configurado, link somente retornado em desenvolvimento.
        if os.getenv('APP_ENV','production') == 'development':
            response['demo_reset_token']=raw
    return response

@app.post('/api/auth/reset-password')
def reset_password(payload:PasswordResetIn,db:Session=Depends(get_db)):
    reset=db.scalar(select(PasswordReset).where(PasswordReset.token_hash==token_digest(payload.token)))
    if not reset or reset.used or is_expired(reset.expires_at):
        raise HTTPException(400,'Link inválido ou expirado')
    u=db.get(User,reset.user_id)
    u.password_hash=hash_password(payload.new_password)
    reset.used=True
    db.execute(delete(SessionToken).where(SessionToken.user_id==u.id))
    db.commit()
    return {'message':'Senha alterada com sucesso'}

@app.get('/api/products')
def products(q:str='',category:str='',featured:bool|None=None,db:Session=Depends(get_db)):
    stmt=select(Product).where(Product.active.is_(True))
    if q.strip():
        stmt=stmt.where(or_(Product.name.ilike(f'%{q.strip()}%'), Product.description.ilike(f'%{q.strip()}%')))
    if category.strip():
        stmt=stmt.where(Product.category==category.strip())
    if featured is not None:
        stmt=stmt.where(Product.featured.is_(featured))
    return [product_view(p) for p in db.scalars(stmt.order_by(Product.id)).all()]

@app.get('/api/addresses')
def get_addresses(user:User=Depends(current_user),db:Session=Depends(get_db)):
    return [address_view(a) for a in db.scalars(select(Address).where(Address.user_id==user.id).order_by(Address.id.desc())).all()]

@app.post('/api/addresses',status_code=201)
def add_address(payload:AddressIn,user:User=Depends(current_user),db:Session=Depends(get_db)):
    a=Address(user_id=user.id,**payload.model_dump())
    db.add(a);db.commit();db.refresh(a)
    return address_view(a)

@app.delete('/api/addresses/{address_id}',status_code=204)
def delete_address(address_id:int,user:User=Depends(current_user),db:Session=Depends(get_db)):
    a=db.get(Address,address_id)
    if not a or a.user_id!=user.id:
        raise HTTPException(404,'Endereço não encontrado')
    if db.scalar(select(Order.id).where(Order.address_id==address_id).limit(1)):
        raise HTTPException(409,'Endereço usado em pedidos não pode ser removido')
    db.delete(a);db.commit()

@app.post('/api/orders',status_code=201)
def checkout(payload:CheckoutIn,user:User=Depends(current_user),db:Session=Depends(get_db)):
    return order_view(make_order(db,user.id,payload))

@app.get('/api/orders')
def my_orders(user:User=Depends(current_user),db:Session=Depends(get_db)):
    return [order_view(o) for o in db.scalars(select(Order).where(Order.user_id==user.id).order_by(Order.id.desc())).all()]

@app.post('/api/orders/{order_id}/cancel')
def cancel_my_order(order_id:int,user:User=Depends(current_user),db:Session=Depends(get_db)):
    order=db.get(Order,order_id)
    if not order or order.user_id!=user.id:
        raise HTTPException(404,'Pedido não encontrado')
    return order_view(cancel_order(db,order))

@app.get('/api/admin/summary')
def summary(_admin:User=Depends(admin_user),db:Session=Depends(get_db)):
    return {'products':db.scalar(select(func.count(Product.id))), 'orders':db.scalar(select(func.count(Order.id))),
            'pending':db.scalar(select(func.count(Order.id)).where(Order.status.in_(['recebido','preparando']))),
            'revenue_cents':db.scalar(select(func.coalesce(func.sum(Order.total_cents),0)).where(Order.status!='cancelado'))}

@app.get('/api/admin/products')
def admin_products(_admin:User=Depends(admin_user),db:Session=Depends(get_db)):
    return [product_view(p) for p in db.scalars(select(Product).order_by(Product.id)).all()]

@app.post('/api/admin/products',status_code=201)
def create_product(payload:ProductIn,_admin:User=Depends(admin_user),db:Session=Depends(get_db)):
    p=Product(**payload.model_dump());db.add(p);db.commit();db.refresh(p)
    return product_view(p)

@app.patch('/api/admin/products/{pid}')
def edit_product(pid:int,payload:ProductPatch,_admin:User=Depends(admin_user),db:Session=Depends(get_db)):
    p=db.get(Product,pid)
    if not p:raise HTTPException(404,'Produto não encontrado')
    for field,value in payload.model_dump(exclude_unset=True).items():
        setattr(p,field,value)
    db.commit();db.refresh(p)
    return product_view(p)

@app.delete('/api/admin/products/{pid}')
def deactivate_product(pid:int,_admin:User=Depends(admin_user),db:Session=Depends(get_db)):
    p=db.get(Product,pid)
    if not p:raise HTTPException(404,'Produto não encontrado')
    p.active=False;db.commit()
    return {'message':'Produto desativado'}

@app.get('/api/admin/orders')
def admin_orders(_admin:User=Depends(admin_user),db:Session=Depends(get_db)):
    return [order_view(o) for o in db.scalars(select(Order).order_by(Order.id.desc())).all()]

@app.patch('/api/admin/orders/{order_id}/status')
def change_order_status(order_id:int,payload:StatusIn,_admin:User=Depends(admin_user),db:Session=Depends(get_db)):
    o=db.get(Order,order_id)
    if not o:raise HTTPException(404,'Pedido não encontrado')
    if o.status=='cancelado':raise HTTPException(409,'Pedido cancelado não pode mudar de status')
    if payload.status=='cancelado':return order_view(cancel_order(db,o))
    transitions={'recebido':{'preparando'},'preparando':{'enviado'},'enviado':{'entregue'},'entregue':set()}
    if payload.status not in transitions.get(o.status,set()):
        raise HTTPException(409,'Transição de status não permitida')
    o.status=payload.status;db.commit();db.refresh(o)
    return order_view(o)

@app.post('/api/feedback',status_code=201)
def feedback(payload:FeedbackIn,db:Session=Depends(get_db)):
    f=Feedback(**payload.model_dump());db.add(f);db.commit()
    return {'message':'Avaliação registrada. Obrigado!'}

@app.get('/api/admin/feedback')
def admin_feedback(_admin:User=Depends(admin_user),db:Session=Depends(get_db)):
    return [{'name':f.tester_name,'feature':f.feature,'worked':f.worked,'description':f.description,'date':f.created_at.isoformat()} for f in db.scalars(select(Feedback).order_by(Feedback.id.desc())).all()]

app.mount('/static', StaticFiles(directory=PUBLIC), name='static')

@app.get('/',include_in_schema=False)
def home():return FileResponse(PUBLIC/'index.html')
