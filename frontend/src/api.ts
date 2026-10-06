import { API_BASE_URL } from './config';
import type { AcceptedPlan, AgendaPayload, AnalyzeDayRequest, DayAnalysis } from './types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || `Request failed (${response.status})`);
  return body as T;
}

export const api = {
  getDemoDay: () => request<AgendaPayload>('/api/demo/day'),
  parseIcs: (icsText: string) => request<AgendaPayload>('/api/ics/parse', { method: 'POST', body: JSON.stringify({ icsText }) }),
  analyzeDay: (payload: AnalyzeDayRequest) => request<DayAnalysis>('/api/day/analyze', { method: 'POST', body: JSON.stringify(payload) }),
  acceptPlan: (userId: string, planId: string) => request<AcceptedPlan>('/api/plan/accept', { method: 'POST', body: JSON.stringify({ userId, planId }) }),
  history: (userId: string) => request<{ plans: AcceptedPlan[] }>(`/api/history?userId=${encodeURIComponent(userId)}`),
  explain: (change: unknown) => request<{ explanation: string; source: string }>('/api/explain', { method: 'POST', body: JSON.stringify({ change }) }),
};
