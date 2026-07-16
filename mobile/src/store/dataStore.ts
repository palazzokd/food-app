import { create } from 'zustand';
import type {
  Dashboard,
  GroceryList,
  MealPlan,
  NutritionWeek,
  RecipeSummary,
} from '../types/api';
import {
  fetchCurrentGroceryList,
  fetchCurrentMealPlan,
  fetchDashboard,
  fetchNutritionWeek,
  fetchRecipes,
  toggleFavorite,
  toggleNutritionCheck,
  updateGroceryItem,
} from '../services/modules';

interface DataState {
  recipes: RecipeSummary[];
  mealPlan: MealPlan | null;
  groceryList: GroceryList | null;
  nutritionWeek: NutritionWeek | null;
  dashboard: Dashboard | null;
  loading: boolean;

  loadRecipes: () => Promise<void>;
  loadMealPlan: () => Promise<void>;
  loadGroceryList: () => Promise<void>;
  loadNutrition: () => Promise<void>;
  loadDashboard: () => Promise<void>;
  refreshAll: () => Promise<void>;

  toggleRecipeFavorite: (id: string, isFavorite: boolean) => Promise<void>;
  toggleGroceryItem: (itemId: string, isChecked: boolean) => Promise<void>;
  toggleNutritionTarget: (targetId: string, date: string, hit: boolean) => Promise<void>;
}

export const useDataStore = create<DataState>((set, get) => ({
  recipes: [],
  mealPlan: null,
  groceryList: null,
  nutritionWeek: null,
  dashboard: null,
  loading: false,

  loadRecipes: async () => {
    try {
      set({ recipes: await fetchRecipes() });
    } catch {
      // no family profile yet — leave empty
    }
  },

  loadMealPlan: async () => {
    set({ mealPlan: await fetchCurrentMealPlan() });
  },

  loadGroceryList: async () => {
    set({ groceryList: await fetchCurrentGroceryList() });
  },

  loadNutrition: async () => {
    try {
      set({ nutritionWeek: await fetchNutritionWeek() });
    } catch {
      set({ nutritionWeek: null });
    }
  },

  loadDashboard: async () => {
    try {
      set({ dashboard: await fetchDashboard() });
    } catch {
      set({ dashboard: null });
    }
  },

  refreshAll: async () => {
    set({ loading: true });
    const { loadRecipes, loadMealPlan, loadGroceryList, loadNutrition, loadDashboard } = get();
    await Promise.all([
      loadRecipes(),
      loadMealPlan(),
      loadGroceryList(),
      loadNutrition(),
      loadDashboard(),
    ]);
    set({ loading: false });
  },

  toggleRecipeFavorite: async (id, isFavorite) => {
    set((state) => ({
      recipes: state.recipes.map((r) =>
        r.id === id ? { ...r, is_favorite: isFavorite } : r
      ),
    }));
    try {
      await toggleFavorite(id, isFavorite);
    } catch {
      // revert on failure
      set((state) => ({
        recipes: state.recipes.map((r) =>
          r.id === id ? { ...r, is_favorite: !isFavorite } : r
        ),
      }));
    }
  },

  toggleGroceryItem: async (itemId, isChecked) => {
    set((state) => ({
      groceryList: state.groceryList
        ? {
            ...state.groceryList,
            items: state.groceryList.items.map((i) =>
              i.id === itemId ? { ...i, is_checked: isChecked } : i
            ),
          }
        : null,
    }));
    try {
      await updateGroceryItem(itemId, { is_checked: isChecked });
    } catch {
      set((state) => ({
        groceryList: state.groceryList
          ? {
              ...state.groceryList,
              items: state.groceryList.items.map((i) =>
                i.id === itemId ? { ...i, is_checked: !isChecked } : i
              ),
            }
          : null,
      }));
    }
  },

  toggleNutritionTarget: async (targetId, date, hit) => {
    await toggleNutritionCheck(targetId, date, hit);
    await get().loadNutrition();
  },
}));
