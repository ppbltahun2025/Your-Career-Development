const Auth = {
  async register(name, email, password) {
    return apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  async login(email, password) {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      localStorage.setItem('kk_token', res.data.token);
      localStorage.setItem('kk_user', JSON.stringify(res.data.user));
    }
    return res;
  },

  async resendVerification(email) {
    return apiFetch('/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  logout() {
    localStorage.removeItem('kk_token');
    localStorage.removeItem('kk_user');
    window.location.href = 'index.html';
  },

  currentUser() {
    const raw = localStorage.getItem('kk_user');
    return raw ? JSON.parse(raw) : null;
  },
};
