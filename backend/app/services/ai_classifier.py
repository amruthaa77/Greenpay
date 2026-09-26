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
            "detected_object": "PET Bottle / Dry Plastic Wrapper / Chips Packet",
            "predicted_category": "Clean Plastic Packaging",
            "confidence": 0.94,
            "visual_indicators": ["Dry polymer / film packaging", "Clean unsoiled packaging", "Dry recyclables"],
            "suggested_action": "Clean, dry, and record under Clean Plastic Packaging (+100 GP/kg)"
        },
        "metal_can": {
            "detected_object": "Clean Aluminum Beverage Can / Tin Container / Foil",
            "predicted_category": "Recyclable Metals & Cans",
            "confidence": 0.95,
            "visual_indicators": ["Clean metallic surface", "Aluminum / tin alloy", "Empty and dry state"],
            "suggested_action": "Record under Recyclable Metals & Cans (+50 GP/kg)"
        },
        "cardboard_box": {
            "detected_object": "Corrugated Cardboard / Paper / Newspaper",
            "predicted_category": "Paper & Cardboard",
            "confidence": 0.92,
            "visual_indicators": ["Cellulose fiber", "Clean dry paper or cardboard", "Flattenable packaging"],
            "suggested_action": "Flatten, bundle, and log under Paper & Cardboard (+25 GP/kg)"
        },
        "vegetable_scraps": {
            "detected_object": "Wet Organic Food / Kitchen Produce Waste",
            "predicted_category": "Contaminated Waste",
            "confidence": 0.96,
            "visual_indicators": ["High moisture content", "Wet organic matter", "Non-dry waste item"],
            "suggested_action": "REJECT: Wet organic waste is not accepted. GreenPay accepts Dry Waste only."
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
            "suggested_action": "Reject or log penalty deduction due to wet/food grease contamination"
        },
        "glass_jar": {
            "detected_object": "Clean Glass Container / Bottle",
            "predicted_category": "Recyclable Metals & Cans",
            "confidence": 0.93,
            "visual_indicators": ["Inert silicate", "Clean dry state", "Rinsed dry recyclable"],
            "suggested_action": "Record under hard dry recyclables"
        },
        "mixed_waste": {
            "detected_object": "Unsorted Mixed Municipal Waste / Wet-Contaminated",
            "predicted_category": "Contaminated Waste",
            "confidence": 0.85,
            "visual_indicators": ["Wet food commingled with dry paper", "Unsegregated wet matter"],
            "suggested_action": "REJECT: Mixed or wet-contaminated waste is not accepted. GreenPay collects dry recyclables only."
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
        if "can" in ident_lower or "metal" in ident_lower or "tin" in ident_lower or "foil" in ident_lower:
            key = "metal_can"
        elif "plastic" in ident_lower or "bottle" in ident_lower or "chips" in ident_lower or "wrapper" in ident_lower:
            key = "plastic_bottle"
        elif "organic" in ident_lower or "peel" in ident_lower or "wet" in ident_lower or "food" in ident_lower or "scrap" in ident_lower:
            key = "vegetable_scraps"
        elif "paper" in ident_lower or "box" in ident_lower or "carton" in ident_lower or "cardboard" in ident_lower or "newspaper" in ident_lower:
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
