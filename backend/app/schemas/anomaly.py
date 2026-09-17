from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, field_validator

class AnomalyResponse(BaseModel):
    id: str
    waste_entry_id: str
    transaction_code: Optional[str] = None
    user_id: str
    meter_number: Optional[str] = None
    user_name: Optional[str] = None
    ward_name: Optional[str] = None
    waste_type: Optional[str] = None
    weight_kg: Optional[float] = None
    anomaly_type: str
    description: str
    severity: str
    status: str
    admin_notes: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class AnomalyReviewRequest(BaseModel):
    status: str = Field(..., description="Must be 'CONFIRMED' or 'DISMISSED'")
    admin_notes: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ["CONFIRMED", "DISMISSED"]:
            raise ValueError("Status must be 'CONFIRMED' or 'DISMISSED'")
        return v
