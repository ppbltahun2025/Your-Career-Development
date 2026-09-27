// Lapisan data terpadu: kalau user login (ada token), data disimpan lewat backend.
// Kalau tidak (mode tamu), data disimpan lokal di browser (localStorage) -
// jadi aplikasi tetap berfungsi penuh tanpa server sama sekali.

const GUEST_PROFILE_KEY = 'kk_guest_profile';
const GUEST_OPPS_KEY = 'kk_guest_opportunities';

function isLoggedIn() {
  return !!localStorage.getItem('kk_token');
}

function defaultProfile() {
  return {
    biography: '',
    currentRole: '',
    currentCompany: '',
    skills: '',
    experience: [],
    education: [],
  };
}

const Storage = {
  isLoggedIn,

  async getProfile() {
    if (isLoggedIn()) {
      const res = await apiFetch('/api/profile');
      if (res.ok) return res.data;
      // fallback ke tamu kalau server tidak terjangkau
    }
    const raw = localStorage.getItem(GUEST_PROFILE_KEY);
    return raw ? JSON.parse(raw) : defaultProfile();
  },

  async saveProfile(profile) {
    if (isLoggedIn()) {
      const res = await apiFetch('/api/profile', { method: 'PUT', body: JSON.stringify(profile) });
      if (res.ok) return { ok: true };
      return { ok: false, error: res.error };
    }
    localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(profile));
    return { ok: true };
  },

  async getOpportunities() {
    if (isLoggedIn()) {
      const res = await apiFetch('/api/opportunities');
      if (res.ok) return res.data.opportunities;
    }
    const raw = localStorage.getItem(GUEST_OPPS_KEY);
    return raw ? JSON.parse(raw) : [];
  },

  async addOpportunity(opp) {
    if (isLoggedIn()) {
      const res = await apiFetch('/api/opportunities', { method: 'POST', body: JSON.stringify(opp) });
      if (res.ok) return { ok: true, opportunity: res.data.opportunity };
      return { ok: false, error: res.error };
    }
    const list = await Storage.getOpportunities();
    const newOpp = { id: Date.now(), created_at: new Date().toISOString(), source: 'manual', ...opp };
    list.unshift(newOpp);
    localStorage.setItem(GUEST_OPPS_KEY, JSON.stringify(list));
    return { ok: true, opportunity: newOpp };
  },

  async updateOpportunity(id, patch) {
    if (isLoggedIn()) {
      const res = await apiFetch(`/api/opportunities/${id}`, { method: 'PUT', body: JSON.stringify(patch) });
      return res.ok ? { ok: true } : { ok: false, error: res.error };
    }
    const list = await Storage.getOpportunities();
    const idx = list.findIndex((o) => String(o.id) === String(id));
    if (idx >= 0) list[idx] = { ...list[idx], ...patch };
    localStorage.setItem(GUEST_OPPS_KEY, JSON.stringify(list));
    return { ok: true };
  },

  async deleteOpportunity(id) {
    if (isLoggedIn()) {
      const res = await apiFetch(`/api/opportunities/${id}`, { method: 'DELETE' });
      return res.ok ? { ok: true } : { ok: false, error: res.error };
    }
    const list = (await Storage.getOpportunities()).filter((o) => String(o.id) !== String(id));
    localStorage.setItem(GUEST_OPPS_KEY, JSON.stringify(list));
    return { ok: true };
  },

  async searchExternalJobs(query) {
    // Hanya tersedia saat backend aktif (butuh proxy supaya aman & bisa pakai API key nanti).
    const res = await apiFetch(`/api/opportunities/search?q=${encodeURIComponent(query)}`);
    if (res.ok) return res.data.results || [];
    return [];
  },
};
