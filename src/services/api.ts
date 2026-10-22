import { Visit, SchoolEvent, SchoolSettings, ActivityLog, User } from '../types/guestbook';

const API_BASE = '/api';

export interface ServerTime {
  dateStr: string;
  timeStr: string;
  isoStr: string;
  fullDateId: string;
}

export interface DashboardStats {
  totalToday: number;
  totalMonth: number;
  totalYear: number;
  activeNow: number;
  totalAllTime: number;
  categoryCounts: Record<string, number>;
  purposeCounts: Record<string, number>;
  frequentVisitors: { name: string; institution: string; phone: string; count: number }[];
  dailyTrend: { date: string; label: string; count: number }[];
  monthlyTrend: { month: string; code: string; count: number }[];
}

export const api = {
  // Server Time
  async getServerTime(): Promise<ServerTime> {
    try {
      const res = await fetch(`${API_BASE}/time`);
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (e) {
      console.warn('Failed to fetch server time, using local fallback', e);
    }
    const now = new Date();
    return {
      dateStr: now.toISOString().split('T')[0],
      timeStr: now.toTimeString().slice(0, 5),
      isoStr: now.toISOString(),
      fullDateId: now.toLocaleDateString('id-ID', { dateStyle: 'full' }),
    };
  },

  // School Settings
  async getSettings(): Promise<SchoolSettings> {
    const res = await fetch(`${API_BASE}/settings`);
    const data = await res.json();
    return data.settings;
  },

  async updateSettings(settings: Partial<SchoolSettings>, modifiedBy: string, modifiedRole: string): Promise<SchoolSettings> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings, modified_by: modifiedBy, modified_role: modifiedRole }),
    });
    const data = await res.json();
    return data.settings;
  },

  // Auth
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Login gagal.');
    }
    localStorage.setItem('excellentia_auth_user', JSON.stringify(data.user));
    localStorage.setItem('excellentia_auth_token', data.token);
    return data;
  },

  getStoredUser(): User | null {
    try {
      const u = localStorage.getItem('excellentia_auth_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },

  logout() {
    localStorage.removeItem('excellentia_auth_user');
    localStorage.removeItem('excellentia_auth_token');
  },

  // Visits
  async getVisits(params?: {
    search?: string;
    category?: string;
    status?: string;
    date?: string;
    date_from?: string;
    date_to?: string;
    event_id?: string;
  }): Promise<{ visits: Visit[]; total: number }> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') query.append(k, v);
      });
    }
    const res = await fetch(`${API_BASE}/visits?${query.toString()}`);
    return res.json();
  },

  async getVisit(id: string): Promise<Visit> {
    const res = await fetch(`${API_BASE}/visits/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Kunjungan tidak ditemukan.');
    return data.visit;
  },

  async lookupActiveVisits(query: string): Promise<Visit[]> {
    if (!query.trim()) return [];
    const res = await fetch(`${API_BASE}/visits/lookup/active?query=${encodeURIComponent(query)}`);
    const data = await res.json();
    return data.visits || [];
  },

  async createVisit(payload: {
    guest_name: string;
    institution: string;
    phone: string;
    category: string;
    purpose: string;
    purpose_detail?: string;
    person_to_meet: string;
    identity_number?: string;
    notes?: string;
    signature?: string | null;
    event_id?: string | null;
  }): Promise<{ visit: Visit; message: string }> {
    const res = await fetch(`${API_BASE}/visits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Gagal menyimpan kunjungan.');
    }
    return data;
  },

  async checkoutVisit(id: string, meta?: { user_name?: string; user_role?: string }): Promise<{ visit: Visit; message: string }> {
    const res = await fetch(`${API_BASE}/visits/${id}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(meta || {}),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Gagal mencatat jam keluar.');
    }
    return data;
  },

  async updateVisit(id: string, payload: Partial<Visit> & { reason: string; modified_by: string }): Promise<Visit> {
    const res = await fetch(`${API_BASE}/visits/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Gagal memperbarui kunjungan.');
    }
    return data.visit;
  },

  async deleteVisit(id: string, user_name: string): Promise<void> {
    const res = await fetch(`${API_BASE}/visits/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_name }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Gagal menghapus kunjungan.');
    }
  },

  // Events
  async getEvents(): Promise<SchoolEvent[]> {
    const res = await fetch(`${API_BASE}/events`);
    const data = await res.json();
    return data.events || [];
  },

  async getEvent(id: string): Promise<SchoolEvent & { attendees: Visit[]; attendee_count: number }> {
    const res = await fetch(`${API_BASE}/events/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Kegiatan tidak ditemukan.');
    return data.event;
  },

  async createEvent(event: Partial<SchoolEvent>, userName: string): Promise<SchoolEvent> {
    const res = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...event, user_name: userName }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Gagal membuat kegiatan.');
    }
    return data.event;
  },

  async updateEvent(id: string, event: Partial<SchoolEvent>, userName: string): Promise<SchoolEvent> {
    const res = await fetch(`${API_BASE}/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...event, user_name: userName }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Gagal memperbarui kegiatan.');
    }
    return data.event;
  },

  async deleteEvent(id: string, userName: string): Promise<void> {
    const res = await fetch(`${API_BASE}/events/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_name: userName }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Gagal menghapus kegiatan.');
    }
  },

  // Dashboard Stats
  async getStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/stats`);
    const data = await res.json();
    return data.stats;
  },

  // Logs
  async getLogs(): Promise<ActivityLog[]> {
    const res = await fetch(`${API_BASE}/logs`);
    const data = await res.json();
    return data.logs || [];
  },

  // Backup & Restore
  getExportBackupUrl(): string {
    return `${API_BASE}/backup/export`;
  },

  async restoreBackup(backupData: any, userName: string): Promise<void> {
    const res = await fetch(`${API_BASE}/backup/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...backupData, user_name: userName }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Gagal memulihkan database.');
    }
  },
};
