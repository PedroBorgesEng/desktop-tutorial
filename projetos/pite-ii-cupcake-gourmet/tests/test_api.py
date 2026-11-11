from .conftest import auth,admin,address

def test_health_frontend_and_openapi(client):
    assert client.get('/api/health').json()['ok']
    assert 'Cupcake Gourmet' in client.get('/').text
    assert client.get('/static/app.js').status_code==200
    assert client.get('/openapi.json').status_code==200

def test_catalog_search_category_and_featured(client):
    p=client.get('/api/products').json()
    assert len(p)==8
    assert all(x['price_cents']>0 for x in p)
    assert len(client.get('/api/products?q=chocolate').json())==2
    assert all(x['category']=='Frutados' for x in client.get('/api/products?category=Frutados').json())
    assert all(x['featured'] for x in client.get('/api/products?featured=true').json())

def test_registration_and_session(client):
    assert client.post('/api/auth/register',json={'name':'A','email':'invalid','password':'123'}).status_code==422
    h=auth(client)
    assert client.get('/api/auth/me',headers=h).json()['email']=='cliente@exemplo.com'
    assert client.post('/api/auth/register',json={'name':'Cliente','email':'cliente@exemplo.com','password':'12345678'}).status_code==409
    assert client.post('/api/auth/login',json={'email':'cliente@exemplo.com','password':'incorreta'}).status_code==401
    assert client.post('/api/auth/logout',headers=h).status_code==204
    assert client.get('/api/auth/me',headers=h).status_code==401

def test_recovery_single_use_invalidates_session(client):
    h=auth(client)
    res=client.post('/api/auth/forgot-password',json={'email':'cliente@exemplo.com'}).json()
    token=res['demo_reset_token']
    assert client.post('/api/auth/reset-password',json={'token':token,'new_password':'NovaSenha123!'}).status_code==200
    assert client.post('/api/auth/reset-password',json={'token':token,'new_password':'NovaSenha123!'}).status_code==400
    assert client.get('/api/auth/me',headers=h).status_code==401
    assert client.post('/api/auth/login',json={'email':'cliente@exemplo.com','password':'NovaSenha123!'}).status_code==200
    assert 'demo_reset_token' not in client.post('/api/auth/forgot-password',json={'email':'naoexiste@test.com'}).json()

def test_addresses_private_and_validation(client):
    h=auth(client); a=address(client,h)
    assert len(client.get('/api/addresses',headers=h).json())==1
    assert client.post('/api/addresses',headers=h,json={'label':'X','street':'Rua Abc','number':'1','neighborhood':'Centro','city':'Curitiba','state':'PR','postal_code':'123'}).status_code==422
    h2=auth(client,email='outro@exemplo.com')
    assert client.delete(f'/api/addresses/{a}',headers=h2).status_code==404
    assert client.delete(f'/api/addresses/{a}',headers=h).status_code==204

def test_checkout_calculation_order_and_inventory(client):
    h=auth(client); addr=address(client,h)
    item=client.get('/api/products').json()[0]
    res=client.post('/api/orders',headers=h,json={'address_id':addr,'items':[{'product_id':item['id'],'quantity':2}],'payment_method':'PIX_SIMULADO'})
    assert res.status_code==201,res.text
    order=res.json()
    assert order['subtotal_cents']==item['price_cents']*2
    assert order['delivery_cents']==990
    assert order['total_cents']==item['price_cents']*2+990
    assert order['payment_status']=='pendente'
    updated=next(p for p in client.get('/api/products').json() if p['id']==item['id'])
    assert updated['stock']==item['stock']-2
    assert client.get('/api/orders',headers=h).json()[0]['id']==order['id']
    assert client.delete(f'/api/addresses/{addr}',headers=h).status_code==409

def test_free_shipping_at_threshold_and_duplicate_cart_items(client):
    h=auth(client); addr=address(client,h)
    products=client.get('/api/products').json()
    pid=products[1]['id'];price=products[1]['price_cents']
    res=client.post('/api/orders',headers=h,json={'address_id':addr,'items':[{'product_id':pid,'quantity':2},{'product_id':pid,'quantity':3}],'payment_method':'CARTAO_SIMULADO'})
    assert res.status_code==201,res.text
    order=res.json()
    assert len(order['items'])==1 and order['items'][0]['quantity']==5
    assert order['subtotal_cents']==price*5
    assert order['delivery_cents']==0

def test_insufficient_stock_does_not_create_order(client):
    h=auth(client); a=address(client,h)
    products=client.get('/api/products').json(); pid=products[0]['id']
    res=client.post('/api/orders',headers=h,json={'address_id':a,'payment_method':'ENTREGA','items':[{'product_id':pid,'quantity':30}]})
    assert res.status_code==409
    assert client.get('/api/orders',headers=h).json()==[]
    assert next(x for x in client.get('/api/products').json() if x['id']==pid)['stock']==products[0]['stock']

def test_invalid_or_foreign_address_rejected(client):
    h=auth(client)
    r=client.post('/api/orders',headers=h,json={'address_id':9999,'payment_method':'ENTREGA','items':[{'product_id':1,'quantity':1}]})
    assert r.status_code==404
    other=auth(client,email='other@example.com'); a=address(client,other)
    assert client.post('/api/orders',headers=h,json={'address_id':a,'payment_method':'ENTREGA','items':[{'product_id':1,'quantity':1}]}).status_code==404

def test_cancellation_restocks_and_prevents_duplicate(client):
    h=auth(client);a=address(client,h); p=client.get('/api/products').json()[0]
    res=client.post('/api/orders',headers=h,json={'address_id':a,'payment_method':'ENTREGA','items':[{'product_id':p['id'],'quantity':2}]})
    id=res.json()['id']
    canceled=client.post(f'/api/orders/{id}/cancel',headers=h)
    assert canceled.status_code==200 and canceled.json()['status']=='cancelado'
    assert next(x for x in client.get('/api/products').json() if x['id']==p['id'])['stock']==p['stock']
    assert client.post(f'/api/orders/{id}/cancel',headers=h).status_code==409

def test_admin_role_and_product_crud(client):
    ordinary=auth(client)
    assert client.get('/api/admin/summary',headers=ordinary).status_code==403
    h=admin(client)
    payload={'name':'Maracujá','description':'Doce e azedinho','category':'Frutados','price_cents':1450,'stock':8,'flavor':'Maracujá','emoji':'🌟','featured':True}
    r=client.post('/api/admin/products',headers=h,json=payload)
    assert r.status_code==201,r.text
    pid=r.json()['id']
    assert client.patch(f'/api/admin/products/{pid}',headers=h,json={'stock':3,'price_cents':1700}).json()['stock']==3
    assert client.delete(f'/api/admin/products/{pid}',headers=h).status_code==200
    assert not any(x['id']==pid for x in client.get('/api/products').json())
    assert any(x['id']==pid for x in client.get('/api/admin/products',headers=h).json())

def test_order_status_transitions_and_no_cancel_after_sent(client):
    h=auth(client); a=address(client,h)
    oid=client.post('/api/orders',headers=h,json={'address_id':a,'payment_method':'ENTREGA','items':[{'product_id':1,'quantity':1}]}).json()['id']
    adm=admin(client)
    assert client.patch(f'/api/admin/orders/{oid}/status',headers=h,json={'status':'preparando'}).status_code==403
    assert client.patch(f'/api/admin/orders/{oid}/status',headers=adm,json={'status':'entregue'}).status_code==409
    for state in ('preparando','enviado','entregue'):
        assert client.patch(f'/api/admin/orders/{oid}/status',headers=adm,json={'status':state}).status_code==200
    assert client.post(f'/api/orders/{oid}/cancel',headers=h).status_code==409

def test_security_validation_on_order_payload(client):
    h=auth(client);a=address(client,h)
    for invalid_items in ([],[{'product_id':1,'quantity':0}],[{'product_id':1,'quantity':-1}],[{'product_id':1,'quantity':31}]):
        assert client.post('/api/orders',headers=h,json={'address_id':a,'payment_method':'ENTREGA','items':invalid_items}).status_code==422
    assert client.post('/api/orders',headers=h,json={'address_id':a,'payment_method':'CARTAO_REAL','items':[{'product_id':1,'quantity':1}]}).status_code==422
    assert client.get('/api/orders').status_code==401

def test_feedback_for_five_external_testers_can_be_collected(client):
    payload={'tester_name':'Pessoa Teste','feature':'Carrinho e pedido','worked':True,'description':'Fluxo de compra foi concluído.'}
    assert client.post('/api/feedback',json=payload).status_code==201
    assert client.post('/api/feedback',json={**payload,'description':'x'}).status_code==422
    adm=admin(client)
    assert len(client.get('/api/admin/feedback',headers=adm).json())==1
