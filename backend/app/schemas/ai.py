from typing import Optional
from pydantic import BaseModel, Field

class AIClassificationRequest(BaseModel):
    image_name_or_keyword: Optional[str] = Field("plastic_bottle", description="Image filename, preset tag, or base64 preview")
    custom_notes: Optional[str] = None

class AIClassificationResponse(BaseModel):
    classification_id: str
    detected_object: str
    predicted_category: str
    confidence: float
    is_assistance_only: bool = True
    disclaimer: str = "AI prediction is provided as field assistance only. Administrative confirmation or override is required."
    visual_indicators: list[str]
    suggested_action: str

class AIConfirmRequest(BaseModel):
    classification_id: str
    confirmed_category: str
    waste_entry_id: Optional[str] = None
