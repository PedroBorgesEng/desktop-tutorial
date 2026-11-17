"""Validação dos dados de entrada por DTOs Pydantic."""
from pydantic import BaseModel, Field, field_validator
from typing import Literal
import re

class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=90)
    email: str = Field(min_length=5, max_length=160)
    password: str = Field(min_length=8, max_length=128)
    @field_validator('email')
    @classmethod
    def email_valid(cls, v):
        v = v.strip().lower()
        if not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', v):
            raise ValueError('E-mail inválido')
        return v

class LoginIn(BaseModel):
    email: str
    password: str

class PasswordRequestIn(BaseModel):
    email: str

class PasswordResetIn(BaseModel):
    token: str = Field(min_length=20)
    new_password: str = Field(min_length=8, max_length=128)

class AddressIn(BaseModel):
    label: str = Field(default='Casa', min_length=1, max_length=50)
    street: str = Field(min_length=3, max_length=140)
    number: str = Field(min_length=1, max_length=20)
    complement: str = Field(default='', max_length=80)
    neighborhood: str = Field(min_length=2, max_length=80)
    city: str = Field(min_length=2, max_length=80)
    state: str = Field(min_length=2, max_length=2)
    postal_code: str
    @field_validator('postal_code')
    @classmethod
    def cep_valid(cls, v):
        d = re.sub(r'\D','',v)
        if len(d)!=8:
            raise ValueError('CEP deve ter 8 dígitos')
        return d

class ProductIn(BaseModel):
    name: str = Field(min_length=2, max_length=110)
    description: str = Field(default='', max_length=2000)
    category: str = Field(min_length=2, max_length=50)
    price_cents: int = Field(gt=0, le=1000000)
    stock: int = Field(ge=0, le=100000)
    flavor: str = Field(default='', max_length=40)
    emoji: str = Field(default='🧁', max_length=16)
    active: bool = True
    featured: bool = False

class ProductPatch(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=110)
    description: str | None = Field(default=None, max_length=2000)
    category: str | None = Field(default=None, min_length=2, max_length=50)
    price_cents: int | None = Field(default=None, gt=0, le=1000000)
    stock: int | None = Field(default=None, ge=0, le=100000)
    flavor: str | None = Field(default=None, max_length=40)
    emoji: str | None = Field(default=None, max_length=16)
    active: bool | None = None
    featured: bool | None = None

class CartItemIn(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0, le=30)

class CheckoutIn(BaseModel):
    items: list[CartItemIn] = Field(min_length=1, max_length=30)
    address_id: int = Field(gt=0)
    payment_method: Literal['PIX_SIMULADO','CARTAO_SIMULADO','ENTREGA']

class StatusIn(BaseModel):
    status: Literal['recebido', 'preparando', 'enviado', 'entregue', 'cancelado']

class FeedbackIn(BaseModel):
    tester_name: str = Field(min_length=2, max_length=90)
    feature: str = Field(min_length=2, max_length=100)
    worked: bool
    description: str = Field(min_length=5, max_length=1500)
