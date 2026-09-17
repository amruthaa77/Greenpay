import uuid
from typing import Dict, Any, List

class AIClassifierService:
    """
    Extensible Waste Vision Classifier Service.
    In development/prototype mode, uses a deterministic heuristics catalog.
    Designed with an interchangeable interface for integrating PyTorch/TensorFlow
    or cloud CV endpoints (e.g. Google Cloud Vision API).
    """

    CATALOG: Dict[str, Dict[str, Any]] = {
        "plastic_bottle": {
            "detected_object": "PET Polyethylene Terephthalate Bottle",
            "predicted_category": "Recyclable",
            "confidence": 0.94,
            "visual_indicators": ["Transparent polymer", "Resin Identification Code 1", "Clean dry state"],
            "suggested_action": "Crush bottle and record in Recyclable category"
        },
        "cardboard_box": {
            "detected_object": "Corrugated Cardboard Packaging",
            "predicted_category": "Dry Waste",
            "confidence": 0.91,
            "visual_indicators": ["Cellulose fiber", "Unsoiled surface", "Flattenable"],
            "suggested_action": "Bundle together and log under Dry Waste"
        },
        "vegetable_scraps": {
            "detected_object": "Organic Kitchen Produce Waste",
            "predicted_category": "Wet Waste",
            "confidence": 0.96,
            "visual_indicators": ["High moisture content", "Biodegradable organic matter", "Kitchen greens"],
            "suggested_action": "Direct to ward composting facility"
        },
        "e_waste_battery": {
            "detected_object": "Lithium-Ion Household Battery / Cell",
            "predicted_category": "Contaminated Waste",
            "confidence": 0.88,
            "visual_indicators": ["Heavy metal casing", "Hazardous electrolytic material", "Non-segregated"],
            "suggested_action": "Flag as Contaminated; divert immediately to hazardous e-waste kiosk"
        },
        "soiled_styrofoam": {
            "detected_object": "Grease-Soiled Polystyrene Food Container",
            "predicted_category": "Contaminated Waste",
            "confidence": 0.86,
            "visual_indicators": ["Food residue oil stains", "Non-recyclable polymer", "Cross-contamination"],
            "suggested_action": "Log penalty deduction due to food grease contamination"
        },
        "glass_jar": {
            "detected_object": "Flint Glass Container",
            "predicted_category": "Recyclable",
            "confidence": 0.93,
            "visual_indicators": ["Inert silicate", "Reusable/meltable", "Rinsed"],
            "suggested_action": "Record as Recyclable glass fraction"
        },
        "mixed_waste": {
            "detected_object": "Unsorted Mixed Municipal Waste",
            "predicted_category": "Contaminated Waste",
            "confidence": 0.79,
            "visual_indicators": ["Wet food commingled with dry paper", "Unsegregated at source"],
            "suggested_action": "Flag for segregation advisory"
        }
    }

    @classmethod
    def classify_image(cls, identifier: str) -> Dict[str, Any]:
        """Classify input image identifier or keyword."""
        key = "plastic_bottle"
        ident_lower = identifier.lower().strip()
        
        for k in cls.CATALOG.keys():
            if k in ident_lower or ident_lower in k:
                key = k
                break
        
        # Fallbacks for common search phrases
        if "plastic" in ident_lower or "bottle" in ident_lower or "can" in ident_lower:
            key = "plastic_bottle"
        elif "organic" in ident_lower or "peel" in ident_lower or "wet" in ident_lower or "food" in ident_lower:
            key = "vegetable_scraps"
        elif "paper" in ident_lower or "box" in ident_lower or "carton" in ident_lower:
            key = "cardboard_box"
        elif "battery" in ident_lower or "chemical" in ident_lower or "electronic" in ident_lower:
            key = "e_waste_battery"
        elif "styrofoam" in ident_lower or "grease" in ident_lower:
            key = "soiled_styrofoam"

        data = cls.CATALOG[key]
        return {
            "classification_id": str(uuid.uuid4()),
            "detected_object": data["detected_object"],
            "predicted_category": data["predicted_category"],
            "confidence": data["confidence"],
            "is_assistance_only": True,
            "disclaimer": "AI prediction is provided as field assistance only. Administrative confirmation or override is required.",
            "visual_indicators": data["visual_indicators"],
            "suggested_action": data["suggested_action"],
        }
