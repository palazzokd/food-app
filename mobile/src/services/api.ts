import * as SecureStore from 'expo-secure-store';

export const API_BASE_URL = __DEV__
  ? 'http://192.168.86.56:8000'
  : 'https://api.familyplate.app'; // Update for production

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// Single-flight token refresh: concurrent 401s share one refresh call so we
// don't burn the (single-use) refresh token twice
let refreshPromise: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  try {
    const refreshToken = await SecureStore.getItemAsync('refresh_token');
    if (!refreshToken) return false;

    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!response.ok) return false;

    const data = await response.json();
    accessToken = data.access_token;
    await SecureStore.setItemAsync('access_token', data.access_token);
    await SecureStore.setItemAsync('refresh_token', data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = refreshTokens().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// Auth endpoints that must never trigger a token refresh themselves
const NO_REFRESH_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
];

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const doFetch = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  };

  let response = await doFetch();

  // Access tokens expire hourly — transparently refresh and retry once
  if (
    response.status === 401 &&
    accessToken &&
    !NO_REFRESH_PATHS.includes(path)
  ) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      response = await doFetch();
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response;
}

export function getWsUrl(path: string): string {
  const wsBase = API_BASE_URL.replace('http', 'ws');
  return `${wsBase}${path}`;
}
