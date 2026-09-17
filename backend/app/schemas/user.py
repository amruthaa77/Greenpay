from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class WardResponse(BaseModel):
    id: str
    ward_number: int
    name: str
    zone: str
    pincode: Optional[str] = None

    class Config:
        from_attributes = True

class UserProfileResponse(BaseModel):
    id: str
    user_id: str
    name: str
    address: str
    ward_id: str
    ward_name: Optional[str] = None
    ward_number: Optional[int] = None
    user_type: str
    phone_number: Optional[str] = None
    green_score: float
    score_delta_month: float
    streak_days: int

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: str
    meter_number: str
    role: str
    is_active: bool
    profile: Optional[UserProfileResponse] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ScoreBreakdownComponent(BaseModel):
    name: str
    score: float
    max_score: float
    description: str

class ScoreBreakdownResponse(BaseModel):
    total_score: float
    rating_label: str # Excellent, Good, Fair, Needs Improvement
    score_delta: float
    components: List[ScoreBreakdownComponent]
    explanation: str
