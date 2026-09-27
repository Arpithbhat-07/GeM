import os
from datetime import datetime, timedelta
from typing import Optional
import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.config import settings
from app.database import get_db
from app.models.user import UserBase

import hashlib

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/token", auto_error=False)

SALT = "gem_sentinel_cpcl_secure_salt_2026"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False
    computed = hashlib.sha256((plain_password + SALT).encode()).hexdigest()
    return computed == hashed_password

def get_password_hash(password: str) -> str:
    return hashlib.sha256((password + SALT).encode()).hexdigest()



def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> UserBase:
    # If no token provided in demo mode, return default Procurement Officer
    if not token:
        return UserBase(
            username="officer_cpcl",
            email="officer.cpcl@gov.in",
            role="PROCUREMENT_OFFICER",
            full_name="Rajesh Kumar, Senior Procurement Officer",
            department="Chennai Petroleum Corporation Limited (CPCL)"
        )
    
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    db = get_db()
    user_dict = await db["users"].find_one({"username": username})
    if user_dict is None:
        # Fallback to token payload data if user not in db
        return UserBase(
            username=username,
            email=payload.get("email", f"{username}@gem.gov.in"),
            role=payload.get("role", "PROCUREMENT_OFFICER"),
            full_name=payload.get("full_name", username.title()),
            department="Chennai Petroleum Corporation Limited (CPCL)"
        )
        
    return UserBase(
        username=user_dict["username"],
        email=user_dict["email"],
        role=user_dict.get("role", "PROCUREMENT_OFFICER"),
        full_name=user_dict.get("full_name", "Procurement Officer"),
        department=user_dict.get("department", "Chennai Petroleum Corporation Limited (CPCL)")
    )
