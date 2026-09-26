from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.waste import WasteEntry

class EnvironmentalImpactService:
    """
    Environmental metrics calculation engine based on Central Pollution Control Board (CPCB)
    and global EPA waste reduction model factors.
    """

    # Empirical factors:
    # 1 kg recyclable diversion saves ~1.42 kg CO2 equivalent
    CO2_SAVED_PER_KG_RECYCLABLE = 1.42
    # 1 kg organic waste composted avoids ~0.55 kg CO2e methane emissions
    CO2_SAVED_PER_KG_ORGANIC = 0.55
    # 1 kg paper/plastic recycled conserves ~26 liters of industrial processing water
    WATER_SAVED_PER_KG_RECYCLABLE = 26.0
    # 1 kg recyclable material conserves ~2.1 kWh embodied energy
    ENERGY_SAVED_PER_KG_RECYCLABLE = 2.1

    @classmethod
    def calculate_impact(cls, db: Session, user_id: Optional[str] = None) -> Dict[str, Any]:
        query = db.query(WasteEntry)
        if user_id:
            query = query.filter(WasteEntry.user_id == user_id)

        entries = query.all()

        DRY_CATEGORIES = [
            "Paper & Cardboard",
            "Recyclable Metals & Cans",
            "Clean Plastic Packaging",
            "Recyclable",
            "Dry Waste",
        ]
        total_dry = sum(e.weight_kg for e in entries if e.waste_type in DRY_CATEGORIES)
        total_contaminated = sum(e.weight_kg for e in entries if e.waste_type == "Contaminated Waste")

        diverted_kg = round(total_dry, 2)
        recovered_recyclables_kg = round(total_dry, 2)

        co2_avoided_kg = round(total_dry * cls.CO2_SAVED_PER_KG_RECYCLABLE, 2)
        water_saved_liters = round(total_dry * cls.WATER_SAVED_PER_KG_RECYCLABLE, 1)
        energy_saved_kwh = round(total_dry * cls.ENERGY_SAVED_PER_KG_RECYCLABLE, 2)

        return {
            "recyclable_recovered_kg": recovered_recyclables_kg,
            "landfill_diverted_kg": diverted_kg,
            "co2_avoided_kg": co2_avoided_kg,
            "water_conserved_liters": water_saved_liters,
            "energy_saved_kwh": energy_saved_kwh,
            "is_estimate": True,
            "formula_descriptions": {
                "landfill_diverted": "Sum of clean segregated dry recyclables (paper, cardboard, plastics, metals) diverted away from landfill dump sites.",
                "co2_avoided": "1.42 kg CO2e emission avoidance per kg dry recyclables recovered for circular remanufacturing (CPCB / EPA WARM factors).",
                "water_conserved": "26.0 liters preserved per kg virgin plastic/paper material avoided through circular recovery.",
                "energy_saved": "2.1 kWh thermal & electrical equivalent saved per kg recycled polymer & paper pulp.",
            }
        }
