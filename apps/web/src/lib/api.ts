import type { HealthResponse, SessionResponse } from '@kado/contracts';
import { apiRoutes } from '@kado/domain';

const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

async function requestJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBase}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function fetchHealth() {
  return requestJson<HealthResponse>(apiRoutes.health);
}

export function fetchSession() {
  return requestJson<SessionResponse>(apiRoutes.session);
}