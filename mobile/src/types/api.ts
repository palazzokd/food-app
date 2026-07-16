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

export type MealTypeValue = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Ingredient {
  item: string;
  quantity: string | null;
  store_hint: string | null;
}

export interface RecipeSummary {
  id: string;
  title: string;
  category: MealTypeValue;
  cuisine: string | null;
  protein: string | null;
  season: string | null;
  total_minutes: number | null;
  rating: number | null;
  is_favorite: boolean;
  nutrition_tags: string[];
  created_at: string;
}

export interface RecipeDetail extends RecipeSummary {
  active_minutes: number | null;
  ingredients: Ingredient[];
  instructions: string[];
  toddler_notes: string | null;
  infant_notes: string | null;
  night2_notes: string | null;
  source: 'ai' | 'manual';
}

export interface MealPlanEntry {
  id: string;
  day_of_week: number;
  meal_type: MealTypeValue;
  recipe_id: string | null;
  title: string;
  notes: string | null;
}

export interface MealPlan {
  id: string;
  week_start_date: string;
  title: string | null;
  is_active: boolean;
  entries: MealPlanEntry[];
  created_at: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  quantity: string | null;
  store: string | null;
  deal_note: string | null;
  is_checked: boolean;
  sort_order: number;
}

export interface GroceryList {
  id: string;
  meal_plan_id: string | null;
  title: string | null;
  strategy_note: string | null;
  is_active: boolean;
  items: GroceryItem[];
  created_at: string;
}

export interface NutritionTarget {
  id: string;
  name: string;
  emoji: string | null;
  description: string | null;
  examples: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface NutritionDayStatus {
  date: string;
  hits: Record<string, boolean>; // target id -> hit
  notes: Record<string, string>;
}

export interface NutritionWeek {
  week_start: string;
  targets: NutritionTarget[];
  days: NutritionDayStatus[];
  targets_hit: number;
  targets_possible: number;
}

export interface Dashboard {
  recipe_count: number;
  favorite_count: number;
  meal_plan: MealPlan | null;
  grocery_list: GroceryList | null;
  nutrition: NutritionWeek;
  plan: string;
  trial_days_left: number | null;
}
