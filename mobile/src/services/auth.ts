import { apiFetch, setAccessToken } from './api';
import type { AuthResponse } from '../types/api';

export async function register(
  email: string,
  password: string,
  displayName?: string
): Promise<AuthResponse> {
  const response = await apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, display_name: displayName }),
  });
  const data: AuthResponse = await response.json();
  setAccessToken(data.access_token);
  return data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const data: AuthResponse = await response.json();
  setAccessToken(data.access_token);
  return data;
}

export async function getMe() {
  const response = await apiFetch('/api/auth/me');
  return response.json();
}
