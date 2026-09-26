import uuid
import base64
import json
import logging
from typing import Dict, Any, List, Optional
import httpx
from app.services.reward_engine import DEFAULT_RATES
from app.core.config import settings

logger = logging.getLogger("uvicorn.error")

class VisionProviderNotConfiguredError(Exception):
    """Raised when an actual image is provided for AI vision analysis but no provider API key is set."""
    pass

class AIClassifierService:
    """
    Authoritative Waste Vision Classifier Service for GreenPay Dry-Waste Operations.
    Provides real multimodal LLM vision analysis for uploaded image bytes, plus
    deterministic fallback classification for demo/training sample presets.
    Authoritative rates are dynamically extracted from RewardEngine.DEFAULT_RATES.
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

    @classmethod
    def _normalize_category(cls, raw_text: str) -> str:
        s = (raw_text or "").strip().lower()
        if "plastic" in s or "bottle" in s or "wrapper" in s or "polymer" in s or "packet" in s or "container" in s:
            return "Clean Plastic Packaging"
        if "metal" in s or "can" in s or "tin" in s or "aluminum" in s or "foil" in s:
            return "Recyclable Metals & Cans"
        if "paper" in s or "cardboard" in s or "box" in s or "newspaper" in s or "carton" in s:
            return "Paper & Cardboard"
        return "Contaminated Waste"

    @classmethod
    async def classify_real_image(
        cls,
        image_bytes: bytes,
        mime_type: str,
        filename: str = "upload.jpg"
    ) -> Dict[str, Any]:
        """
        Analyze real image bytes using configured multimodal vision provider (Google Gemini or OpenAI).
        If no API key is configured, raises VisionProviderNotConfiguredError.
        """
        gemini_key = settings.GEMINI_API_KEY or settings.VISION_API_KEY
        openai_key = settings.OPENAI_API_KEY

        if not gemini_key and not openai_key:
            raise VisionProviderNotConfiguredError(
                "No vision model provider configured. Please set GEMINI_API_KEY or OPENAI_API_KEY "
                "in the server environment variables to enable real image analysis."
            )

        prompt = (
            "You are a professional municipal dry-waste segregation vision assistant for Bengaluru (BBMP GreenPay).\n"
            "Analyze this uploaded image and classify the waste item into EXACTLY ONE of these 4 categories:\n"
            "1. 'Paper & Cardboard' (Newspapers, office paper, magazines, cardboard packaging, cartons)\n"
            "2. 'Recyclable Metals & Cans' (Aluminum beverage cans, clean food tins, clean foil)\n"
            "3. 'Clean Plastic Packaging' (Clean PET/HDPE bottles, containers, clean chips wrappers and packets)\n"
            "4. 'Contaminated Waste' (Greasy/soiled paper or plastics, wet food/kitchen scraps, organic waste, unsegregated garbage, hazardous waste)\n\n"
            "Important guidelines:\n"
            "- Inspect the actual visual characteristics of the item in the image.\n"
            "- If there is organic kitchen food residue or grease, classify as 'Contaminated Waste' with action 'REJECT'.\n"
            "- If it is clean dry recyclable material, classify accordingly with action 'ACCEPT'.\n"
            "- Provide a genuine confidence score between 0.00 and 1.00 based on visual clarity and certainty.\n"
            "- Respond strictly in valid JSON format matching this schema:\n"
            "{\n"
            "  \"detected_object\": \"<concise item name, e.g. Corrugated Cardboard Box, Crushed Aluminum Soda Can>\",\n"
            "  \"classification\": \"<One of the 4 exact categories>\",\n"
            "  \"confidence\": <float between 0.0 and 1.0>,\n"
            "  \"description\": \"<Brief 1-2 sentence explanation of visual condition and reasoning>\",\n"
            "  \"action\": \"<ACCEPT or REJECT>\",\n"
            "  \"visual_indicators\": [\"<feature 1>\", \"<feature 2>\"],\n"
            "  \"suggested_action\": \"<Recommended operator action>\"\n"
            "}"
        )

        base64_img = base64.b64encode(image_bytes).decode("utf-8")
        parsed: Dict[str, Any] = {}

        if gemini_key:
            model_name = settings.VISION_MODEL or "gemini-1.5-flash"
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={gemini_key}"
            payload = {
                "contents": [{
                    "role": "user",
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": base64_img
                            }
                        }
                    ]
                }],
                "generationConfig": {
                    "response_mime_type": "application/json",
                    "temperature": 0.1
                }
            }
            async with httpx.AsyncClient(timeout=25.0) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code != 200:
                    logger.error(f"Gemini API error {resp.status_code}: {resp.text}")
                    raise RuntimeError(f"Vision provider API returned HTTP {resp.status_code}: {resp.text[:200]}")
                data = resp.json()
                text_content = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(text_content)
        elif openai_key:
            url = "https://api.openai.com/v1/chat/completions"
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a professional municipal dry-waste segregation vision assistant for Bengaluru (BBMP GreenPay). Return JSON strictly."
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:{mime_type};base64,{base64_img}"}
                            }
                        ]
                    }
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.1
            }
            async with httpx.AsyncClient(timeout=25.0) as client:
                resp = await client.post(url, json=payload, headers={"Authorization": f"Bearer {openai_key}"})
                if resp.status_code != 200:
                    logger.error(f"OpenAI API error {resp.status_code}: {resp.text}")
                    raise RuntimeError(f"Vision provider API returned HTTP {resp.status_code}: {resp.text[:200]}")
                data = resp.json()
                text_content = data["choices"][0]["message"]["content"]
                parsed = json.loads(text_content)

        # Normalize outputs
        category = cls._normalize_category(parsed.get("classification", ""))
        action = "REJECT" if category == "Contaminated Waste" or str(parsed.get("action", "")).upper() == "REJECT" else "ACCEPT"
        
        try:
            confidence = float(parsed.get("confidence", 0.85))
        except (ValueError, TypeError):
            confidence = 0.85
        confidence = round(max(0.05, min(0.99, confidence)), 2)

        detected_object = parsed.get("detected_object", "Detected Waste Object")
        description = parsed.get("description", f"Visual analysis complete. Item identified as {category}.")
        visual_indicators = parsed.get("visual_indicators", ["Visual image features verified by vision model"])
        if not isinstance(visual_indicators, list):
            visual_indicators = [str(visual_indicators)]
        suggested_action = parsed.get("suggested_action", f"Verify item and record under {category}")

        # Authoritative rates from RewardEngine.DEFAULT_RATES
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
            "detected_object": detected_object,
            "classification": category,
            "predicted_category": category,
            "confidence": confidence,
            "description": description,
            "action": action,
            "rate_individual": rate_ind,
            "rate_commercial": rate_comm,
            "penalty_individual": pen_ind,
            "penalty_commercial": pen_comm,
            "is_assistance_only": True,
            "disclaimer": "AI prediction is provided as field assistance only. Administrative confirmation or override is required.",
            "visual_indicators": visual_indicators,
            "suggested_action": suggested_action,
        }
