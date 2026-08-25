import os
import base64
import hashlib
from cryptography.fernet import Fernet

_SECRET = os.environ.get("JARVIS_SECRET_KEY", "jarvis_super_secret_master_key_2026")
_KEY = base64.urlsafe_b64encode(hashlib.sha256(_SECRET.encode()).digest())
_cipher = Fernet(_KEY)

def encrypt_data(data: str) -> str:
    if not data:
        return ""
    return _cipher.encrypt(data.encode()).decode()

def decrypt_data(token: str) -> str:
    if not token:
        return ""
    try:
        return _cipher.decrypt(token.encode()).decode()
    except Exception:
        return ""
