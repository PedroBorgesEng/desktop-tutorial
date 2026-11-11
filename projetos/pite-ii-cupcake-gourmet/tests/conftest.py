"""Isolamento: cada teste usa um banco SQLite temporário, sem tocar produção."""
import os, tempfile
from pathlib import Path
from fastapi.testclient import TestClient
import pytest

_TEMP_DIR=tempfile.TemporaryDirectory()
os.environ['DATABASE_URL']='sqlite:///'+str(Path(_TEMP_DIR.name)/'test.db')
os.environ['ADMIN_EMAIL']='admin@cupcake.test'
os.environ['ADMIN_PASSWORD']='SenhaForte123!'
os.environ['APP_ENV']='development'
os.environ['SEED_DEMO']='1'

from app.main import app
from app.database import engine, Base

@pytest.fixture()
def client():
    Base.metadata.drop_all(engine)
    with TestClient(app) as c:
        yield c

def auth(c,email='cliente@exemplo.com',password='SenhaForte123!',name='Cliente Demo'):
    c.post('/api/auth/register',json={'name':name,'email':email,'password':password})
    result=c.post('/api/auth/login',json={'email':email,'password':password})
    assert result.status_code==200,result.text
    return {'Authorization':'Bearer '+result.json()['access_token']}

def admin(c):
    return auth(c,email='admin@cupcake.test',password='SenhaForte123!')

def address(c, headers):
    r=c.post('/api/addresses',headers=headers,json={'label':'Casa','street':'Rua das Flores','number':'20','neighborhood':'Centro','city':'Curitiba','state':'PR','postal_code':'80000000'})
    assert r.status_code==201,r.text
    return r.json()['id']
