from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr

class UserBase(BaseModel):
    username: str
    email: str
    role: str = "PROCUREMENT_OFFICER"  # ADMIN, PROCUREMENT_OFFICER, AUDITOR
    full_name: str
    department: str = "Refinery Materials Management, CPCL Manali"

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: Optional[str] = Field(None, alias="_id")
    hashed_password: str
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserBase
