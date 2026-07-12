export interface UserResponse {
  id: string;
  email: string;
  display_name: string | null;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: UserResponse;
}

export interface FamilyProfileResponse {
  id: string;
  household_name: string | null;
  max_prep_minutes: number;
  planning_horizon_days: number;
  dinners_per_cycle: number;
  nights_per_dinner: number;
  batch_prep_day: string;
  members: HouseholdMemberResponse[];
  created_at: string;
}

export interface HouseholdMemberResponse {
  id: string;
  name: string;
  age_months: number | null;
  role: 'adult' | 'toddler' | 'infant';
  nutritional_stage: 'adult' | 'palate_expansion' | 'allergen_introduction';
  dietary_restrictions: string[];
  flavor_preferences: string[];
  texture_preferences: string[];
  allergens_introduced: string[];
  created_at: string;
}

export interface ConversationResponse {
  id: string;
  title: string | null;
  is_active: boolean;
  created_at: string;
}
