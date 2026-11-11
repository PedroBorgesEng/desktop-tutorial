"""Dados fictícios para demonstração local, idempotentes."""
import os
from sqlalchemy import select
from .database import SessionLocal
from .models import Product, User
from .security import hash_password

SAMPLES = [
('Red Velvet dos Sonhos','Massa aveludada, creme de cream cheese e delicados confeitos.','Especiais',1590,16,'Red velvet','❤️',True),
('Pistache & Afeto','Cupcake amanteigado com cobertura de pistache e toque de chocolate branco.','Especiais',1890,12,'Pistache','💚',True),
('Chocolate Intenso','Chocolate belga em dose dupla, recheio cremoso e ganache.','Clássicos',1490,22,'Chocolate','🍫',True),
('Baunilha Encantada','Baunilha de verdade, buttercream leve e confeitos artesanais.','Clássicos',1290,25,'Baunilha','🌼',False),
('Morango Nuvem','Massa fofinha com geleia de morango e chantilly rosé.','Frutados',1490,18,'Morango','🍓',True),
('Limão Siciliano','Limão perfumado, cobertura cítrica e frescor irresistível.','Frutados',1390,14,'Limão','🍋',False),
('Doce de Leite','Massa macia com doce de leite cremoso e farofa crocante.','Clássicos',1490,17,'Doce de leite','🍯',False),
('Coco Tropical','Coco fresco com brigadeiro branco e toque delicado de baunilha.','Frutados',1390,13,'Coco','🥥',False),
]

def seed_data():
    with SessionLocal() as db:
        if not db.scalar(select(Product.id).limit(1)):
            db.add_all([Product(name=n,description=d,category=c,price_cents=p,stock=s,flavor=f,emoji=e,featured=t) for n,d,c,p,s,f,e,t in SAMPLES])
        admin_email=os.getenv('ADMIN_EMAIL')
        admin_password=os.getenv('ADMIN_PASSWORD')
        if admin_email and admin_password and len(admin_password)>=8:
            existing=db.scalar(select(User).where(User.email==admin_email.lower()))
            if not existing:
                db.add(User(name='Administrador',email=admin_email.lower(),password_hash=hash_password(admin_password),is_admin=True))
        db.commit()

if __name__=='__main__':
    from .database import Base, engine
    Base.metadata.create_all(engine)
    seed_data()
    print('Banco preparado com sucesso.')
