export type UserRole = 'USER' | 'ADMIN';
export type UserType = 'Individual' | 'Commercial';
export type WasteType =
  | 'Paper & Cardboard'
  | 'Recyclable Metals & Cans'
  | 'Clean Plastic Packaging'
  | 'Contaminated Waste'
  | 'Dry Waste'
  | 'Recyclable'
  | 'Non-Recyclable'
  | 'Wet Waste';
export type ClaimStatus = 'Pending' | 'Claimed' | 'Processed';
export type JourneyStage = 'Collection' | 'Sorting' | 'Processing' | 'Recycling/Disposal';

export interface Ward {
  id: string;
  ward_number: number;
  name: string;
  zone: string;
  pincode?: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  address: string;
  ward_id: string;
  ward_name?: string;
  ward_number?: number;
  user_type: UserType;
  phone_number?: string;
  green_score: number;
  score_delta_month: number;
  streak_days: number;
}

export interface User {
  id: string;
  meter_number: string;
  role: UserRole;
  is_active: boolean;
  profile?: UserProfile;
  created_at: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  role: UserRole;
  meter_number: string;
  user_id: string;
  name: string;
  user_type?: UserType;
  ward_name?: string;
  ward_number?: number;
}

export interface WasteEntry {
  id: string;
  transaction_id: string;
  user_id: string;
  user_name?: string;
  meter_number?: string;
  user_type?: UserType;
  ward_name?: string;
  recorder_name?: string;
  waste_type: WasteType;
  weight_kg: number;
  collection_date: string;
  claim_status: ClaimStatus;
  journey_stage: JourneyStage;
  admin_feedback?: string;
  photo_url?: string;
  reward_amount?: number;
  reward_breakdown?: string;
  created_at: string;
}

export interface RewardTransaction {
  id: string;
  waste_entry_id?: string;
  transaction_code?: string;
  user_id: string;
  amount: number;
  transaction_type: 'REWARD' | 'REDEEM' | 'PENALTY' | 'ADJUSTMENT';
  calculation_breakdown: string;
  timestamp: string;
}

export interface WalletOverview {
  current_balance: number;
  available_points?: number;
  total_earned: number;
  total_earned_points?: number;
  total_deductions: number;
  total_redeemed_points?: number;
  transaction_count: number;
  currency_symbol?: string;
  recent_transactions: RewardTransaction[];
}

export interface RewardItem {
  id: string;
  name: string;
  category: string;
  quantity_label: string;
  points_cost: number;
  stock_quantity: number;
  icon: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
}

export type RedemptionStatus = 'Requested' | 'Approved' | 'Ready for Collection' | 'Collected' | 'Rejected' | 'Cancelled';

export interface RewardRedemption {
  id: string;
  user_id: string;
  user_name?: string;
  meter_number?: string;
  ward_name?: string;
  ward_number?: number;
  reward_item_id?: string;
  reward_name: string;
  quantity_label: string;
  points_spent: number;
  status: RedemptionStatus;
  collection_pin: string;
  pickup_location: string;
  admin_id?: string;
  admin_notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface RedeemRequest {
  reward_item_id: string;
}

export interface ScoreComponent {
  name: string;
  score: number;
  max_score: number;
  description: string;
}

export interface ScoreBreakdown {
  total_score: number;
  rating_label: string;
  score_delta: number;
  components: ScoreComponent[];
  explanation: string;
}

export interface EnvironmentalImpact {
  recyclable_recovered_kg: number;
  landfill_diverted_kg: number;
  co2_avoided_kg: number;
  water_conserved_liters: number;
  energy_saved_kwh: number;
  is_estimate: boolean;
  formula_descriptions: {
    landfill_diverted?: string;
    co2_avoided?: string;
    water_conserved?: string;
    energy_saved?: string;
  };
}

export interface InAppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'REWARD' | 'STATUS_UPDATE' | 'ANOMALY' | 'SYSTEM';
  is_read: boolean;
  created_at: string;
}

export interface AdminKPICards {
  total_users: number;
  individual_users: number;
  commercial_users: number;
  total_waste_recorded_kg: number;
  recyclable_waste_kg: number;
  pending_claims: number;
  rewards_issued_inr: number;
  flagged_anomalies: number;
}

export interface Anomaly {
  id: string;
  waste_entry_id: string;
  transaction_code?: string;
  user_id: string;
  meter_number?: string;
  user_name?: string;
  ward_name?: string;
  waste_type?: WasteType;
  weight_kg?: number;
  anomaly_type: 'UNUSUAL_WEIGHT_SPIKE' | 'DUPLICATE_LIKE' | 'SUSPICIOUS_REWARD' | 'INCONSISTENT_RECORD';
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING_REVIEW' | 'CONFIRMED' | 'DISMISSED';
  admin_notes?: string;
  timestamp: string;
}

export interface AIClassificationResult {
  classification_id: string;
  detected_object: string;
  predicted_category: WasteType;
  confidence: number;
  is_assistance_only: boolean;
  disclaimer: string;
  visual_indicators: string[];
  suggested_action: string;
}

export interface WardAnalyticsItem {
  ward_id: string;
  ward_number: number;
  ward_name: string;
  zone: string;
  registered_users: number;
  waste_collected_kg: number;
  wet_waste_kg: number;
  dry_waste_kg: number;
  recyclable_waste_kg: number;
  contaminated_waste_kg: number;
  avg_green_score: number;
  rewards_issued_inr: number;
  participation_rate_pct: number;
}

export interface ForecastPoint {
  month: string;
  actual_kg?: number | null;
  forecast_kg?: number | null;
  confidence_lower?: number | null;
  confidence_upper?: number | null;
}

export interface ForecastData {
  points: ForecastPoint[];
  next_month_estimate_kg: number;
  lower_bound_kg: number;
  upper_bound_kg: number;
  trend_percentage: number;
  methodology: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  actor_name?: string;
  actor_meter?: string;
  actor_role: string;
  action: string;
  affected_entity_type: string;
  affected_entity_id?: string;
  previous_state?: string;
  new_state?: string;
  ip_address?: string;
  timestamp: string;
}
