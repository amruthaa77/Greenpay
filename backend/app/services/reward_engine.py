from typing import Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.reward import RewardRule, RewardTransaction
from app.models.user import User, UserProfile
from app.models.waste import WasteEntry

# Default fallbacks if rules are not yet customized in the DB
DEFAULT_RATES = {
    "Individual": {
        "Paper & Cardboard": {"rate_per_kg": 25.0, "penalty": 0.0},
        "Recyclable Metals & Cans": {"rate_per_kg": 50.0, "penalty": 0.0},
        "Clean Plastic Packaging": {"rate_per_kg": 100.0, "penalty": 0.0},
        "Contaminated Waste": {"rate_per_kg": 0.0, "penalty": 15.0},
        "Dry Waste": {"rate_per_kg": 25.0, "penalty": 0.0},
        "Recyclable": {"rate_per_kg": 50.0, "penalty": 0.0},
    },
    "Commercial": {
        "Paper & Cardboard": {"rate_per_kg": 20.0, "penalty": 0.0},
        "Recyclable Metals & Cans": {"rate_per_kg": 40.0, "penalty": 0.0},
        "Clean Plastic Packaging": {"rate_per_kg": 80.0, "penalty": 0.0},
        "Contaminated Waste": {"rate_per_kg": 0.0, "penalty": 30.0},
        "Dry Waste": {"rate_per_kg": 20.0, "penalty": 0.0},
        "Recyclable": {"rate_per_kg": 40.0, "penalty": 0.0},
    },
}

class RewardEngine:
    @staticmethod
    def calculate_reward(
        db: Session,
        waste_type: str,
        weight_kg: float,
        user_type: str = "Individual"
    ) -> Tuple[float, str, str]:
        """
        Calculate transparent reward or penalty.
        Returns: (amount, transaction_type, breakdown_string)
        """
        rule = None
        if db is not None:
            rule = (
                db.query(RewardRule)
                .filter(
                    RewardRule.waste_type == waste_type,
                    RewardRule.user_type == user_type,
                    RewardRule.is_active == True,
                )
                .first()
            )

        if rule:
            rate_per_kg = rule.rate_per_kg
            penalty_rate = rule.penalty_flat_rate
        else:
            defaults = DEFAULT_RATES.get(user_type, DEFAULT_RATES["Individual"])
            type_cfg = defaults.get(waste_type, {"rate_per_kg": 2.0, "penalty": 0.0})
            rate_per_kg = type_cfg["rate_per_kg"]
            penalty_rate = type_cfg["penalty"]

        if waste_type == "Contaminated Waste":
            amount = -abs(float(penalty_rate))
            trans_type = "PENALTY"
            breakdown = f"Contamination penalty deduction: -{abs(penalty_rate):g} GP"
        else:
            amount = round(float(weight_kg) * float(rate_per_kg), 1)
            trans_type = "REWARD"
            breakdown = f"{weight_kg:.2f} kg × {rate_per_kg:g} GP/kg = +{amount:g} GP"

        return amount, trans_type, breakdown

    @staticmethod
    def create_reward_entry(
        db: Session,
        waste_entry: WasteEntry,
        user: User,
        admin_id: str,
    ) -> RewardTransaction:
        user_type = user.profile.user_type if user.profile else "Individual"
        amount, trans_type, breakdown = RewardEngine.calculate_reward(
            db=db,
            waste_type=waste_entry.waste_type,
            weight_kg=waste_entry.weight_kg,
            user_type=user_type,
        )

        reward_tx = RewardTransaction(
            waste_entry_id=waste_entry.id,
            user_id=user.id,
            admin_id=admin_id,
            amount=amount,
            transaction_type=trans_type,
            calculation_breakdown=breakdown,
        )
        db.add(reward_tx)

        # Update User Green Score dynamically
        RewardEngine.update_user_green_score(db, user.id)

        return reward_tx

    @staticmethod
    def update_user_green_score(db: Session, user_id: str) -> float:
        """
        Dynamically calculate Green Score based on:
        1. Segregation quality (ratio of sorted waste vs contaminated)
        2. Recyclable volume proportion
        3. Activity frequency / consistency
        Clamped between 20.0 and 100.0.
        """
        profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
        if not profile:
            return 75.0

        entries = db.query(WasteEntry).filter(WasteEntry.user_id == user_id).all()
        if not entries:
            return profile.green_score

        total_entries = len(entries)
        contaminated_count = sum(1 for e in entries if e.waste_type == "Contaminated Waste")
        recyclable_count = sum(1 for e in entries if e.waste_type in [
            "Paper & Cardboard",
            "Recyclable Metals & Cans",
            "Clean Plastic Packaging",
            "Recyclable",
            "Dry Waste"
        ])

        # Base 65
        score = 65.0

        # Segregation Quality: clean dry recyclables vs contaminated (max +20)
        clean_ratio = (total_entries - contaminated_count) / max(total_entries, 1)
        score += clean_ratio * 20.0

        # High-value dry recyclables volume contribution (max +10)
        rec_ratio = recyclable_count / max(total_entries, 1)
        score += rec_ratio * 10.0

        # Contamination penalty (-12 per contaminated incident)
        score -= contaminated_count * 12.0

        # Consistency bonus (max +5)
        if total_entries >= 10:
            score += 5.0
        elif total_entries >= 4:
            score += 3.0

        final_score = round(max(20.0, min(100.0, score)), 1)
        old_score = profile.green_score
        profile.score_delta_month = round(final_score - old_score, 1)
        profile.green_score = final_score

        return final_score
