from sqlalchemy import Column, String, ForeignKey, DateTime, Text, func
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class AnomalyFlag(BaseModel):
    __tablename__ = "anomaly_flags"
    
    waste_entry_id = Column(String(36), ForeignKey("waste_entries.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewed_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    anomaly_type = Column(String(50), nullable=False) 
    # Allowed: UNUSUAL_WEIGHT_SPIKE, DUPLICATE_LIKE, SUSPICIOUS_REWARD, INCONSISTENT_RECORD
    
    description = Column(Text, nullable=False)
    severity = Column(String(20), default="MEDIUM", nullable=False) # LOW, MEDIUM, HIGH
    status = Column(String(30), default="PENDING_REVIEW", nullable=False, index=True) # PENDING_REVIEW, CONFIRMED, DISMISSED
    admin_notes = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    waste_entry = relationship("WasteEntry", back_populates="anomalies")
    user = relationship("User", back_populates="anomaly_flags", foreign_keys=[user_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by])
