"""Entidades persistidas - modelos SQLAlchemy (camada Model do MVC)."""
from datetime import datetime, timezone
from sqlalchemy import String, Integer, ForeignKey, Text, DateTime, Boolean, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base

def utcnow():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = 'users'
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(90), nullable=False)
    email: Mapped[str] = mapped_column(String(160), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(250), nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

class SessionToken(Base):
    __tablename__ = 'sessions'
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False, index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

class PasswordReset(Base):
    __tablename__ = 'password_resets'
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used: Mapped[bool] = mapped_column(default=False, nullable=False)

class Product(Base):
    __tablename__ = 'products'
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(110), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default='')
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    price_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    stock: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    flavor: Mapped[str] = mapped_column(String(40), nullable=False, default='')
    emoji: Mapped[str] = mapped_column(String(16), nullable=False, default='🧁')
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

class Address(Base):
    __tablename__ = 'addresses'
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False, index=True)
    label: Mapped[str] = mapped_column(String(50), nullable=False, default='Casa')
    street: Mapped[str] = mapped_column(String(140), nullable=False)
    number: Mapped[str] = mapped_column(String(20), nullable=False)
    complement: Mapped[str] = mapped_column(String(80), nullable=False, default='')
    neighborhood: Mapped[str] = mapped_column(String(80), nullable=False)
    city: Mapped[str] = mapped_column(String(80), nullable=False)
    state: Mapped[str] = mapped_column(String(2), nullable=False)
    postal_code: Mapped[str] = mapped_column(String(8), nullable=False)
    user: Mapped[User] = relationship()

class Order(Base):
    __tablename__ = 'orders'
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False, index=True)
    address_id: Mapped[int] = mapped_column(ForeignKey('addresses.id'), nullable=False)
    address_snapshot: Mapped[str] = mapped_column(Text, nullable=False)
    subtotal_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    delivery_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    total_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    payment_method: Mapped[str] = mapped_column(String(30), nullable=False)
    payment_status: Mapped[str] = mapped_column(String(20), default='pendente', nullable=False)
    status: Mapped[str] = mapped_column(String(30), default='recebido', nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    user: Mapped[User] = relationship()
    items: Mapped[list['OrderItem']] = relationship(back_populates='order', cascade='all, delete-orphan', lazy='selectin')

class OrderItem(Base):
    __tablename__ = 'order_items'
    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey('orders.id'), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey('products.id'), nullable=False)
    product_name: Mapped[str] = mapped_column(String(110), nullable=False)
    unit_price_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    order: Mapped[Order] = relationship(back_populates='items')

class Feedback(Base):
    __tablename__ = 'feedbacks'
    id: Mapped[int] = mapped_column(primary_key=True)
    tester_name: Mapped[str] = mapped_column(String(90), nullable=False)
    feature: Mapped[str] = mapped_column(String(100), nullable=False)
    worked: Mapped[bool] = mapped_column(Boolean, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
