from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Text, func
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class WasteEntry(BaseModel):
    __tablename__ = "waste_entries"
    
    transaction_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. GP-BLR-2025-10492
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recorder_admin_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    ward_id = Column(String(36), ForeignKey("wards.id"), nullable=False, index=True)
    
    waste_type = Column(String(50), nullable=False, index=True)
    # Allowed: Wet Waste, Dry Waste, Recyclable, Non-Recyclable, Contaminated Waste
    
    weight_kg = Column(Float, nullable=False)
    collection_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    claim_status = Column(String(20), default="Processed", nullable=False, index=True)
    # Allowed: Pending, Claimed, Processed
    
    journey_stage = Column(String(50), default="Recycling/Disposal", nullable=False)
    # Allowed: Collection, Sorting, Processing, Recycling/Disposal
    
    admin_feedback = Column(Text, nullable=True)
    photo_url = Column(String(255), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="waste_entries", foreign_keys=[user_id])
    recorder = relationship("User", back_populates="recorded_waste", foreign_keys=[recorder_admin_id])
    ward = relationship("Ward", back_populates="waste_entries")
    reward_transactions = relationship("RewardTransaction", back_populates="waste_entry", cascade="all, delete-orphan")
    ai_classification = relationship("AIClassification", back_populates="waste_entry", uselist=False)
    anomalies = relationship("AnomalyFlag", back_populates="waste_entry", cascade="all, delete-orphan")
