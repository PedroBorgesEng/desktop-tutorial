"""Autenticação: PBKDF2-SHA256 com salt aleatório e tokens opacos com hash."""
import hashlib
import hmac
import os
import secrets
from datetime import datetime, timezone, timedelta

def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    iterations = 260_000
    key = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, iterations)
    return f'pbkdf2_sha256${iterations}${salt.hex()}${key.hex()}'

def verify_password(password: str, stored: str) -> bool:
    try:
        scheme, n, salt, digest = stored.split('$')
        if scheme != 'pbkdf2_sha256':
            return False
        actual = hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt), int(n))
        return hmac.compare_digest(actual, bytes.fromhex(digest))
    except (ValueError, TypeError):
        return False

def new_token():
    return secrets.token_urlsafe(32)

def token_digest(token: str):
    return hashlib.sha256(token.encode('utf-8')).hexdigest()

def expiry(minutes=24*60):
    return datetime.now(timezone.utc) + timedelta(minutes=minutes)

def is_expired(date):
    return date.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc) if date.tzinfo is None else date < datetime.now(timezone.utc)
