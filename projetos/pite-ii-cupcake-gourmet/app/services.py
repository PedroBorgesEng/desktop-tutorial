"""Serviços: regras de domínio, independentes do protocolo HTTP (Service/Model)."""
from sqlalchemy import select, update
from sqlalchemy.orm import Session
from .models import Product, Order, OrderItem, Address

class DomainError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.message = message
        self.status = status

def make_order(db: Session, user_id: int, payload) -> Order:
    address = db.get(Address, payload.address_id)
    if not address or address.user_id != user_id:
        raise DomainError('Endereço não encontrado para este usuário', 404)
    merged = {}
    for it in payload.items:
        merged[it.product_id] = merged.get(it.product_id, 0) + it.quantity
        if merged[it.product_id] > 30:
            raise DomainError('Limite de 30 unidades por produto')
    products = db.scalars(select(Product).where(Product.id.in_(merged.keys()))).all()
    product_map = {p.id:p for p in products}
    subtotal = 0
    snapshots = []
    for pid, qty in merged.items():
        p = product_map.get(pid)
        if p is None or not p.active:
            raise DomainError(f'Produto {pid} indisponível', 400)
        if p.stock < qty:
            raise DomainError(f'Estoque insuficiente para {p.name}', 409)
        subtotal += p.price_cents * qty
        snapshots.append((p, qty))
    shipping = 0 if subtotal >= 8000 else 990
    address_str = f'{address.street}, {address.number}, {address.complement} - {address.neighborhood}, {address.city}/{address.state} - CEP {address.postal_code}'
    try:
        # Atualização condicional em banco previne overselling sob concorrência.
        for p, qty in snapshots:
            res = db.execute(update(Product).where(Product.id == p.id, Product.stock >= qty, Product.active.is_(True)).values(stock=Product.stock-qty))
            if res.rowcount != 1:
                raise DomainError(f'Estoque insuficiente para {p.name}', 409)
        order = Order(user_id=user_id,address_id=address.id,address_snapshot=address_str,
                      subtotal_cents=subtotal,delivery_cents=shipping,total_cents=subtotal+shipping,
                      payment_method=payload.payment_method,payment_status='pendente',status='recebido')
        db.add(order)
        db.flush()
        for p,qty in snapshots:
            db.add(OrderItem(order_id=order.id,product_id=p.id,product_name=p.name,unit_price_cents=p.price_cents,quantity=qty))
        db.commit()
        db.refresh(order)
        return order
    except Exception:
        db.rollback()
        raise

def cancel_order(db: Session, order: Order):
    if order.status in {'enviado','entregue'}:
        raise DomainError('Não é possível cancelar pedido enviado/entregue', 409)
    if order.status == 'cancelado':
        raise DomainError('Pedido já cancelado', 409)
    for item in order.items:
        db.execute(update(Product).where(Product.id==item.product_id).values(stock=Product.stock+item.quantity))
    order.status='cancelado'
    order.payment_status='cancelado'
    db.commit()
    db.refresh(order)
    return order
