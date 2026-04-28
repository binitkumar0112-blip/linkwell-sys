import { auth } from '../lib/firebase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/** Attach the current user's Firebase ID token as a Bearer header. */
async function authHeaders(): Promise<HeadersInit> {
  const user = auth.currentUser;
  if (!user) return { 'Content-Type': 'application/json' };
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

// ── Problem Service ────────────────────────────────────────────────────────────

export const ProblemService = {
  async getLatestProblems(limit = 6): Promise<any[]> {
    const res = await fetch(`${API_BASE}/problems?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch problems');
    const data: any[] = await res.json();
    return data.filter((p) => p.status === 'open' && p.is_public);
  },

  async getProblemsByNgo(ngoId: string): Promise<any[]> {
    const res = await fetch(`${API_BASE}/problems`);
    if (!res.ok) throw new Error('Failed to fetch problems');
    const data: any[] = await res.json();
    return data.filter((p) => p.ngo_id === ngoId);
  },

  async getProblemsByLocality(locality: string): Promise<any[]> {
    const res = await fetch(`${API_BASE}/problems?locality=${encodeURIComponent(locality)}`);
    if (!res.ok) throw new Error('Failed to fetch problems');
    return res.json();
  },

  async reportProblem(data: any): Promise<any> {
    const headers = await authHeaders();
    const res = await fetch(`${API_BASE}/problems/report`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Submission failed' }));
      throw new Error(err.detail || 'Submission failed');
    }
    return res.json();
  },

  async updateStatus(id: string, status: string, volunteerId?: string): Promise<any> {
    const headers = await authHeaders();
    const res = await fetch(`${API_BASE}/problems/${id}/status`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status, volunteer_id: volunteerId }),
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
  },

  async upvoteProblem(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/problems/${id}/upvote`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to upvote');
    return res.json();
  },
};

// ── AI Service ─────────────────────────────────────────────────────────────────

export const AIService = {
  async prioritize(description: string, category = '', upvotes = 0): Promise<any> {
    const res = await fetch(`${API_BASE}/ai/prioritize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, category, upvotes }),
    });
    return res.json();
  },

  async checkSensitive(text: string): Promise<any> {
    const res = await fetch(`${API_BASE}/ai/check-sensitive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return res.json();
  },
  async assessUrgency(title: string, description: string, category = ''): Promise<any> {
    const res = await fetch(`${API_BASE}/ai/assess-urgency`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, category }),
    });
    return res.json();
  },
};

// ── Notification Service ───────────────────────────────────────────────────────

export const NotificationService = {
  async send(deviceToken: string, title: string, body: string, data?: Record<string, string>) {
    const res = await fetch(`${API_BASE}/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_token: deviceToken, title, body, data }),
    });
    return res.json();
  },
};
