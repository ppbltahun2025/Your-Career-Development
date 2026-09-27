// Pembantu untuk memanggil backend. Mengembalikan null jika backend tidak bisa dihubungi
// sama sekali (mis. saat aplikasi dijalankan murni statis tanpa backend) supaya halaman
// tetap bisa jatuh kembali ke mode tamu (localStorage) alih-alih error.
async function apiFetch(path, options = {}) {
  const base = window.API_BASE_URL || '';
  const token = localStorage.getItem('kk_token');

  const headers = Object.assign(
    { 'Content-Type': 'application/json' },
    options.headers || {},
    token ? { Authorization: `Bearer ${token}` } : {}
  );

  let response;
  try {
    response = await fetch(base + path, { ...options, headers });
  } catch (err) {
    return { ok: false, offline: true, error: 'Tidak bisa terhubung ke server.' };
  }

  let data = {};
  try { data = await response.json(); } catch (_) { /* respons kosong */ }

  if (!response.ok) {
    return { ok: false, status: response.status, error: data.error || 'Terjadi kesalahan.' };
  }
  return { ok: true, data };
}
