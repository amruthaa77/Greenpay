from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, field_validator

VALID_WASTE_TYPES = [
    "Paper & Cardboard",
    "Recyclable Metals & Cans",
    "Clean Plastic Packaging",
    "Contaminated Waste",
    "Dry Waste",
    "Recyclable",
]

VALID_CLAIM_STATUSES = [
    "Pending",
    "Claimed",
    "Processed"
]

VALID_JOURNEY_STAGES = [
    "Collection",
    "Sorting",
    "Processing",
    "Recycling/Disposal"
]

class WasteCreateRequest(BaseModel):
    meter_number: str = Field(..., description="Target citizen's electricity meter number")
    waste_type: str = Field(..., description="Must be one of the standard waste categories")
    weight_kg: float = Field(..., gt=0.0, le=5000.0, description="Weight in kg, must be greater than 0")
    collection_date: Optional[datetime] = None
    claim_status: Optional[str] = "Processed"
    admin_feedback: Optional[str] = None
    photo_url: Optional[str] = None
    ai_classification_id: Optional[str] = None
    greenpay_id: Optional[str] = None
    idempotency_key: Optional[str] = None # For offline sync deduplication

    @field_validator("waste_type")
    @classmethod
    def validate_waste_type(cls, v: str) -> str:
        if v.strip().lower() in ["wet waste", "wet", "food waste", "organic waste"]:
            raise ValueError(
                "Wet Waste is not accepted. GreenPay accepts Dry Waste only: "
                "Paper & Cardboard, Recyclable Metals & Cans, and Clean Plastic Packaging."
            )
        if v not in VALID_WASTE_TYPES:
            raise ValueError(f"Invalid waste type. Must be one of: {', '.join(VALID_WASTE_TYPES)}")
        return v

    @field_validator("claim_status")
    @classmethod
    def validate_claim_status(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in VALID_CLAIM_STATUSES:
            raise ValueError(f"Invalid claim status. Must be one of: {', '.join(VALID_CLAIM_STATUSES)}")
        return v

class WasteUpdateRequest(BaseModel):
    claim_status: Optional[str] = None
    journey_stage: Optional[str] = None
    admin_feedback: Optional[str] = None
    weight_kg: Optional[float] = Field(None, gt=0.0, le=5000.0)

    @field_validator("claim_status")
    @classmethod
    def validate_claim_status(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in VALID_CLAIM_STATUSES:
            raise ValueError(f"Invalid claim status. Must be one of: {', '.join(VALID_CLAIM_STATUSES)}")
        return v

    @field_validator("journey_stage")
    @classmethod
    def validate_journey_stage(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in VALID_JOURNEY_STAGES:
            raise ValueError(f"Invalid journey stage. Must be one of: {', '.join(VALID_JOURNEY_STAGES)}")
        return v

class WasteEntryResponse(BaseModel):
    id: str
    transaction_id: str
    user_id: str
    user_name: Optional[str] = None
    meter_number: Optional[str] = None
    greenpay_id: Optional[str] = None
    ai_classification_id: Optional[str] = None
    user_type: Optional[str] = None
    ward_name: Optional[str] = None
    recorder_name: Optional[str] = None
    waste_type: str
    weight_kg: float
    collection_date: datetime
    claim_status: str
    journey_stage: str
    admin_feedback: Optional[str] = None
    photo_url: Optional[str] = None
    reward_amount: Optional[float] = 0.0
    reward_breakdown: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class WasteListResponse(BaseModel):
    items: list[WasteEntryResponse]
    total: int
    page: int
    size: int
