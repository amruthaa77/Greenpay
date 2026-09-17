from sqlalchemy import Column, String, Float, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class AIClassification(BaseModel):
    __tablename__ = "ai_classifications"
    
    waste_entry_id = Column(String(36), ForeignKey("waste_entries.id", ondelete="SET NULL"), nullable=True, index=True)
    admin_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    image_url = Column(String(255), nullable=True)
    detected_object = Column(String(100), nullable=False) # e.g. "Plastic PET Bottle"
    predicted_category = Column(String(50), nullable=False) # e.g. "Recyclable"
    confidence = Column(Float, nullable=False) # e.g. 0.94
    admin_confirmed_category = Column(String(50), nullable=False) # Category confirmed or overridden by admin
    is_overridden = Column(Float, default=False)
    
    # Relationships
    waste_entry = relationship("WasteEntry", back_populates="ai_classification")
    admin = relationship("User", foreign_keys=[admin_id])
