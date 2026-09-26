from typing import Optional, List
from pydantic import BaseModel, Field

class VisionClassifyRequest(BaseModel):
    preset: Optional[str] = Field(None, description="Preset identifier or sample tag")
    image_name_or_keyword: Optional[str] = Field(None, description="Alias for preset")
    custom_notes: Optional[str] = None

class AIClassificationRequest(BaseModel):
    preset: Optional[str] = Field(None, description="Preset identifier or sample tag")
    image_name_or_keyword: Optional[str] = Field("plastic_bottle", description="Image filename, preset tag, or base64 preview")
    custom_notes: Optional[str] = None

class VisionClassifyResponse(BaseModel):
    classification_id: str
    detected_object: str
    classification: str
    predicted_category: str
    confidence: float
    description: str
    action: str = Field(..., description="Action must be 'ACCEPT' or 'REJECT'")
    rate_individual: Optional[float] = None
    rate_commercial: Optional[float] = None
    penalty_individual: Optional[float] = None
    penalty_commercial: Optional[float] = None
    is_assistance_only: bool = True
    disclaimer: str = "AI prediction is provided as field assistance only. Administrative confirmation or override is required."
    visual_indicators: List[str] = Field(default_factory=list)
    suggested_action: str

# Maintain AIClassificationResponse compatibility
class AIClassificationResponse(VisionClassifyResponse):
    pass

class AIConfirmRequest(BaseModel):
    classification_id: str
    confirmed_category: str
    waste_entry_id: Optional[str] = None
