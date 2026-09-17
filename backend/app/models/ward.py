from sqlalchemy import Column, String, Integer, Float
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Ward(BaseModel):
    __tablename__ = "wards"
    
    ward_number = Column(Integer, unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False, index=True) # e.g. Koramangala, Indiranagar
    zone = Column(String(50), nullable=False) # e.g. South, East, West, Bommanahalli
    pincode = Column(String(10), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # Relationships
    profiles = relationship("UserProfile", back_populates="ward")
    waste_entries = relationship("WasteEntry", back_populates="ward")
