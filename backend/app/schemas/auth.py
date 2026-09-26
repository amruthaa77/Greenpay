from typing import Optional
from pydantic import BaseModel, Field, field_validator
import re

class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    meter_number: str = Field(..., min_length=4, max_length=50)
    address: str = Field(..., min_length=5, max_length=255)
    ward_number: Optional[int] = Field(None, ge=1, description="Positive integer BBMP ward number")
    ward_id: Optional[str] = None
    user_type: str = Field(..., description="Must be 'Individual' or 'Commercial'")
    phone_number: Optional[str] = None
    password: str = Field(..., min_length=6)
    confirm_password: str

    @field_validator("ward_number")
    @classmethod
    def validate_ward_number(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v <= 0:
            raise ValueError("Please enter a valid ward number.")
        return v

    @field_validator("user_type")
    @classmethod
    def validate_user_type(cls, v: str) -> str:
        if v not in ["Individual", "Commercial"]:
            raise ValueError("User Type must be either 'Individual' or 'Commercial'")
        return v

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v

class AdminRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    meter_number: str = Field(..., min_length=4, max_length=50)
    password: str = Field(..., min_length=6)
    confirm_password: str
    access_code: str = Field(..., min_length=4)

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v

class LoginRequest(BaseModel):
    meter_number: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    meter_number: str
    user_id: str
    greenpay_id: Optional[str] = None
    name: str
    user_type: Optional[str] = None
    ward_name: Optional[str] = None
    ward_number: Optional[int] = None

class RefreshTokenRequest(BaseModel):
    refresh_token: str
