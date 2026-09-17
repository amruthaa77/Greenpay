from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class AdminKPICards(BaseModel):
    total_users: int
    individual_users: int
    commercial_users: int
    total_waste_recorded_kg: float
    recyclable_waste_kg: float
    pending_claims: int
    rewards_issued_inr: float
    flagged_anomalies: int

class WasteTrendPoint(BaseModel):
    date: str
    wet_kg: float
    dry_kg: float
    recyclable_kg: float
    contaminated_kg: float
    total_kg: float

class WardAnalyticsItem(BaseModel):
    ward_id: str
    ward_number: int
    ward_name: str
    zone: str
    registered_users: int
    waste_collected_kg: float
    wet_waste_kg: float
    dry_waste_kg: float
    recyclable_waste_kg: float
    contaminated_waste_kg: float
    avg_green_score: float
    rewards_issued_inr: float
    participation_rate_pct: float

class ForecastDataPoint(BaseModel):
    month: str
    actual_kg: Optional[float] = None
    forecast_kg: Optional[float] = None
    confidence_lower: Optional[float] = None
    confidence_upper: Optional[float] = None

class ForecastResponse(BaseModel):
    points: List[ForecastDataPoint]
    next_month_estimate_kg: float
    lower_bound_kg: float
    upper_bound_kg: float
    trend_percentage: float
    methodology: str

class EnvironmentalImpactResponse(BaseModel):
    recyclable_recovered_kg: float
    landfill_diverted_kg: float
    co2_avoided_kg: float
    water_conserved_liters: float
    energy_saved_kwh: float
    formula_descriptions: Dict[str, str]
    is_estimate: bool = True
