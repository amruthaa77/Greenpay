import uuid
from typing import Dict, Any, List
from app.services.reward_engine import DEFAULT_RATES

class AIClassifierService:
    """
    Authoritative Waste Vision Classifier Service for GreenPay Dry-Waste Operations.
    Provides deterministic heuristic classification for sample presets with authoritative
    rates dynamically pulled from RewardEngine.DEFAULT_RATES.
    """

    CATALOG: Dict[str, Dict[str, Any]] = {
        "clean_pet_bottles_chips_wrappers": {
            "detected_object": "Clean PET Bottles & Chips Wrappers",
            "classification": "Clean Plastic Packaging",
            "confidence": 0.94,
            "description": "Clean, dry plastic bottles and chips film packaging detected with zero organic residue.",
            "action": "ACCEPT",
            "visual_indicators": ["Clean polymer / film packaging", "Unsoiled dry recyclables", "Transparent PET & flexible film"],
            "suggested_action": "Clean, dry, and record under Clean Plastic Packaging (+100 GP/kg)"
        },
        "clean_plastic_bottle": {
            "detected_object": "Clean Plastic PET / HDPE Bottle",
            "classification": "Clean Plastic Packaging",
            "confidence": 0.94,
            "description": "Unsoiled plastic container verified dry and free of moisture or chemical residue.",
            "action": "ACCEPT",
            "visual_indicators": ["Dry polymer bottle", "Rinsed clean state", "Dry recyclables"],
            "suggested_action": "Record under Clean Plastic Packaging (+100 GP/kg)"
        },
        "clean_cardboard": {
            "detected_object": "Corrugated Cardboard Box",
            "classification": "Paper & Cardboard",
            "confidence": 0.92,
            "description": "Clean corrugated paperboard and flattened packaging detected.",
            "action": "ACCEPT",
            "visual_indicators": ["Cellulose fiber", "Flattened cardboard", "Clean dry state"],
            "suggested_action": "Flatten, bundle, and log under Paper & Cardboard (+25 GP/kg)"
        },
        "clean_newspaper": {
            "detected_object": "Clean Newspapers & Printed Paper",
            "classification": "Paper & Cardboard",
            "confidence": 0.93,
            "description": "Dry newsprint and clean office paper bundle detected.",
            "action": "ACCEPT",
            "visual_indicators": ["Dry newsprint", "Clean paper bundle", "No food residue"],
            "suggested_action": "Bundle and record under Paper & Cardboard (+25 GP/kg)"
        },
        "clean_aluminum_can": {
            "detected_object": "Aluminum Beverage Can",
            "classification": "Recyclable Metals & Cans",
            "confidence": 0.95,
            "description": "Empty, rinsed aluminum beverage can detected.",
            "action": "ACCEPT",
            "visual_indicators": ["Clean metallic surface", "Aluminum alloy", "Empty and dry state"],
            "suggested_action": "Record under Recyclable Metals & Cans (+50 GP/kg)"
        },
        "clean_metal_tin": {
            "detected_object": "Clean Metal Food Tin",
            "classification": "Recyclable Metals & Cans",
            "confidence": 0.95,
            "description": "Rinsed tinplate steel food container detected.",
            "action": "ACCEPT",
            "visual_indicators": ["Metallic tinplate", "Clean rinsed container", "Dry recyclables"],
            "suggested_action": "Record under Recyclable Metals & Cans (+50 GP/kg)"
        },
        "clean_foil": {
            "detected_object": "Clean Aluminum Foil & Trays",
            "classification": "Recyclable Metals & Cans",
            "confidence": 0.91,
            "description": "Clean, grease-free aluminum foil packaging detected.",
            "action": "ACCEPT",
            "visual_indicators": ["Aluminum foil", "Clean and dry", "No food residue"],
            "suggested_action": "Record under Recyclable Metals & Cans (+50 GP/kg)"
        },
        "wet_food_scraps": {
            "detected_object": "Wet Kitchen Scraps & Food Waste",
            "classification": "Contaminated Waste",
            "confidence": 0.97,
            "description": "High-moisture organic kitchen scraps detected. GreenPay collects dry recyclables only.",
            "action": "REJECT",
            "visual_indicators": ["High moisture content", "Wet organic matter", "Non-dry waste item"],
            "suggested_action": "REJECT: Wet organic waste is not accepted. GreenPay accepts Dry Waste only."
        },
        "mixed_contaminated": {
            "detected_object": "Mixed Contaminated & Soiled Waste",
            "classification": "Contaminated Waste",
            "confidence": 0.96,
            "description": "Commingled waste with food grease and non-segregated wet contaminants detected.",
            "action": "REJECT",
            "visual_indicators": ["Food grease residue", "Unsegregated wet matter", "Cross-contamination"],
            "suggested_action": "REJECT: Apply contamination deduction. GreenPay accepts segregated dry recyclables only."
        },
    }

    # Backward compatibility aliases mapping to canonical catalog keys
    ALIASES: Dict[str, str] = {
        "plastic_bottle": "clean_plastic_bottle",
        "metal_can": "clean_aluminum_can",
        "cardboard_box": "clean_cardboard",
        "food_waste": "wet_food_scraps",
        "e_waste": "mixed_contaminated",
        "mixed_dirty": "mixed_contaminated",
        "vegetable_scraps": "wet_food_scraps",
        "soiled_styrofoam": "mixed_contaminated",
        "glass_jar": "clean_metal_tin",
        "mixed_waste": "mixed_contaminated",
    }

    @classmethod
    def classify_image(cls, identifier: str) -> Dict[str, Any]:
        """
        Classify input preset identifier deterministically.
        Extracts authoritative rates from RewardEngine.DEFAULT_RATES.
        Raises ValueError if preset is unknown.
        """
        if not identifier or not isinstance(identifier, str):
            raise ValueError("Preset identifier is required and must be a string.")

        clean_id = identifier.lower().strip()

        # Check canonical catalog
        canonical_key = None
        if clean_id in cls.CATALOG:
            canonical_key = clean_id
        elif clean_id in cls.ALIASES:
            canonical_key = cls.ALIASES[clean_id]
        else:
            # Check for substring match in aliases/catalog keys
            for k in cls.CATALOG.keys():
                if k == clean_id or clean_id in k or k in clean_id:
                    canonical_key = k
                    break
            if not canonical_key:
                for alias_k, target_k in cls.ALIASES.items():
                    if alias_k in clean_id:
                        canonical_key = target_k
                        break

        if not canonical_key or canonical_key not in cls.CATALOG:
            valid_options = sorted(list(cls.CATALOG.keys()))
            raise ValueError(
                f"Unknown vision sample preset '{identifier}'. "
                f"Valid presets are: {', '.join(valid_options)}"
            )

        data = cls.CATALOG[canonical_key]
        category = data["classification"]
        action = data["action"]

        # Pull rates authoritative from RewardEngine.DEFAULT_RATES
        rate_ind = None
        rate_comm = None
        pen_ind = None
        pen_comm = None

        if action == "ACCEPT":
            ind_cfg = DEFAULT_RATES.get("Individual", {}).get(category, {"rate_per_kg": 0.0})
            comm_cfg = DEFAULT_RATES.get("Commercial", {}).get(category, {"rate_per_kg": 0.0})
            rate_ind = ind_cfg.get("rate_per_kg", 0.0)
            rate_comm = comm_cfg.get("rate_per_kg", 0.0)
        else: # REJECT / Contaminated
            cont_ind = DEFAULT_RATES.get("Individual", {}).get("Contaminated Waste", {"penalty": 15.0})
            cont_comm = DEFAULT_RATES.get("Commercial", {}).get("Contaminated Waste", {"penalty": 30.0})
            pen_ind = -abs(cont_ind.get("penalty", 15.0))
            pen_comm = -abs(cont_comm.get("penalty", 30.0))

        return {
            "classification_id": str(uuid.uuid4()),
            "detected_object": data["detected_object"],
            "classification": category,
            "predicted_category": category, # backward compatibility
            "confidence": data["confidence"],
            "description": data["description"],
            "action": action,
            "rate_individual": rate_ind,
            "rate_commercial": rate_comm,
            "penalty_individual": pen_ind,
            "penalty_commercial": pen_comm,
            "is_assistance_only": True,
            "disclaimer": "AI prediction is provided as field assistance only. Administrative confirmation or override is required.",
            "visual_indicators": data["visual_indicators"],
            "suggested_action": data["suggested_action"],
        }
