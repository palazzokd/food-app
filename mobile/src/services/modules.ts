import { apiFetch } from './api';
import type {
  Dashboard,
  GroceryItem,
  GroceryList,
  MealPlan,
  NutritionTarget,
  NutritionWeek,
  RecipeDetail,
  RecipeSummary,
} from '../types/api';

// --- Recipes ---

export async function fetchRecipes(params?: {
  category?: string;
  favorite?: boolean;
  search?: string;
}): Promise<RecipeSummary[]> {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.favorite !== undefined) query.set('favorite', String(params.favorite));
  if (params?.search) query.set('search', params.search);
  const qs = query.toString();
  const res = await apiFetch(`/api/recipes${qs ? `?${qs}` : ''}`);
  return res.json();
}

export async function fetchRecipe(id: string): Promise<RecipeDetail> {
  const res = await apiFetch(`/api/recipes/${id}`);
  return res.json();
}

export async function toggleFavorite(id: string, isFavorite: boolean): Promise<RecipeDetail> {
  const res = await apiFetch(`/api/recipes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_favorite: isFavorite }),
  });
  return res.json();
}

export async function deleteRecipe(id: string): Promise<void> {
  await apiFetch(`/api/recipes/${id}`, { method: 'DELETE' });
}

// --- Meal plans ---

export async function fetchCurrentMealPlan(): Promise<MealPlan | null> {
  try {
    const res = await apiFetch('/api/meal-plans/current');
    return res.json();
  } catch {
    return null;
  }
}

// --- Grocery ---

export async function fetchCurrentGroceryList(): Promise<GroceryList | null> {
  try {
    const res = await apiFetch('/api/grocery/current');
    return res.json();
  } catch {
    return null;
  }
}

export async function updateGroceryItem(
  itemId: string,
  data: Partial<Pick<GroceryItem, 'is_checked' | 'name' | 'quantity' | 'store'>>
): Promise<GroceryItem> {
  const res = await apiFetch(`/api/grocery/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return res.json();
}

// --- Nutrition ---

export async function fetchNutritionWeek(start?: string): Promise<NutritionWeek> {
  const qs = start ? `?start=${start}` : '';
  const res = await apiFetch(`/api/nutrition/week${qs}`);
  return res.json();
}

export async function toggleNutritionCheck(
  targetId: string,
  date: string,
  hit: boolean,
  note?: string
): Promise<void> {
  await apiFetch('/api/nutrition/check', {
    method: 'PUT',
    body: JSON.stringify({ target_id: targetId, date, hit, note }),
  });
}

export interface TargetPayload {
  name: string;
  emoji: string | null;
  description: string | null;
  examples: string | null;
}

export async function createNutritionTarget(data: TargetPayload): Promise<NutritionTarget> {
  const res = await apiFetch('/api/nutrition/targets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateNutritionTarget(
  targetId: string,
  data: Partial<TargetPayload>
): Promise<NutritionTarget> {
  const res = await apiFetch(`/api/nutrition/targets/${targetId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteNutritionTarget(targetId: string): Promise<void> {
  await apiFetch(`/api/nutrition/targets/${targetId}`, { method: 'DELETE' });
}

// --- Dashboard ---

export async function fetchDashboard(): Promise<Dashboard> {
  const res = await apiFetch('/api/dashboard');
  return res.json();
}
