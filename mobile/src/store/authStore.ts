import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { UserResponse } from '../types/api';
import { setAccessToken } from '../services/api';
import * as authService from '../services/auth';

interface AuthState {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authService.login(email, password);
      await SecureStore.setItemAsync('access_token', result.access_token);
      await SecureStore.setItemAsync('refresh_token', result.refresh_token);
      set({ user: result.user, isAuthenticated: true, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  register: async (email, password, displayName) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authService.register(email, password, displayName);
      await SecureStore.setItemAsync('access_token', result.access_token);
      await SecureStore.setItemAsync('refresh_token', result.refresh_token);
      set({ user: result.user, isAuthenticated: true, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    setAccessToken(null);
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  restoreSession: async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (token) {
        setAccessToken(token);
        const user = await authService.getMe();
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      setAccessToken(null);
      set({ isLoading: false });
    }
  },
}));
