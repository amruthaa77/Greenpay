from typing import Optional
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.waste import WasteEntry
from app.models.anomaly import AnomalyFlag
from app.models.user import User

class AnomalyDetector:
    @staticmethod
    def inspect_waste_entry(
        db: Session,
        waste_entry: WasteEntry,
        user: User
    ) -> Optional[AnomalyFlag]:
        """
        Evaluate waste entry against user's history and municipal baselines.
        Does NOT penalize user automatically; flags for municipal supervisor review.
        """
        # 1. Check for duplicate-like submission in short timeframe
        time_threshold = waste_entry.collection_date - timedelta(minutes=30)
        recent_duplicate = (
            db.query(WasteEntry)
            .filter(
                WasteEntry.user_id == user.id,
                WasteEntry.waste_type == waste_entry.waste_type,
                WasteEntry.id != waste_entry.id,
                WasteEntry.collection_date >= time_threshold,
                WasteEntry.weight_kg == waste_entry.weight_kg,
            )
            .first()
        )

        if recent_duplicate:
            anomaly = AnomalyFlag(
                waste_entry_id=waste_entry.id,
                user_id=user.id,
                anomaly_type="DUPLICATE_LIKE",
                description=(
                    f"Possible duplicate submission: {waste_entry.weight_kg} kg of {waste_entry.waste_type} "
                    f"was logged at {recent_duplicate.collection_date.strftime('%H:%M')}."
                ),
                severity="MEDIUM",
                status="PENDING_REVIEW",
            )
            db.add(anomaly)
            return anomaly

        # 2. Check for sudden unusual quantity spike compared to history
        past_entries = (
            db.query(WasteEntry)
            .filter(
                WasteEntry.user_id == user.id,
                WasteEntry.id != waste_entry.id,
            )
            .order_by(WasteEntry.collection_date.desc())
            .limit(10)
            .all()
        )

        user_type = user.profile.user_type if user.profile else "Individual"

        if past_entries:
            weights = [e.weight_kg for e in past_entries]
            avg_weight = sum(weights) / len(weights)
            
            # If logged weight is > 4x historical average or exceeds realistic single household dump
            is_spike = False
            if user_type == "Individual" and waste_entry.weight_kg > 40.0:
                is_spike = True
            elif user_type == "Individual" and avg_weight > 0 and waste_entry.weight_kg > (avg_weight * 4.0) and waste_entry.weight_kg > 20.0:
                is_spike = True
            elif user_type == "Commercial" and waste_entry.weight_kg > 500.0:
                is_spike = True

            if is_spike:
                anomaly = AnomalyFlag(
                    waste_entry_id=waste_entry.id,
                    user_id=user.id,
                    anomaly_type="UNUSUAL_WEIGHT_SPIKE",
                    description=(
                        f"Unusual waste quantity detected for {user_type} account. "
                        f"Logged {waste_entry.weight_kg:.1f} kg compared to historical average of {avg_weight:.1f} kg."
                    ),
                    severity="HIGH",
                    status="PENDING_REVIEW",
                )
                db.add(anomaly)
                return anomaly
        else:
            # First time user with massive weight
            if user_type == "Individual" and waste_entry.weight_kg > 50.0:
                anomaly = AnomalyFlag(
                    waste_entry_id=waste_entry.id,
                    user_id=user.id,
                    anomaly_type="UNUSUAL_WEIGHT_SPIKE",
                    description=f"First recorded entry unusually high ({waste_entry.weight_kg:.1f} kg) for an Individual user.",
                    severity="MEDIUM",
                    status="PENDING_REVIEW",
                )
                db.add(anomaly)
                return anomaly

        return None
