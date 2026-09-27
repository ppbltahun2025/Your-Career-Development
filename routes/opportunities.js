const express = require('express');
const db = require('../db/database');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM opportunities WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.userId);
  res.json({ opportunities: rows });
});

router.post('/', (req, res) => {
  const { title, company, sourceUrl, status, notes } = req.body || {};
  if (!title) return res.status(400).json({ error: 'Judul posisi wajib diisi.' });

  const info = db.prepare(`
    INSERT INTO opportunities (user_id, title, company, source, source_url, status, notes)
    VALUES (?, ?, ?, 'manual', ?, ?, ?)
  `).run(req.userId, title, company || '', sourceUrl || '', status || 'diincar', notes || '');

  const row = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ opportunity: row });
});

router.put('/:id', (req, res) => {
  const { title, company, sourceUrl, status, notes } = req.body || {};
  const existing = db.prepare('SELECT * FROM opportunities WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Data tidak ditemukan.' });

  db.prepare(`
    UPDATE opportunities SET title = ?, company = ?, source_url = ?, status = ?, notes = ?
    WHERE id = ? AND user_id = ?
  `).run(
    title ?? existing.title,
    company ?? existing.company,
    sourceUrl ?? existing.source_url,
    status ?? existing.status,
    notes ?? existing.notes,
    req.params.id,
    req.userId
  );

  const row = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(req.params.id);
  res.json({ opportunity: row });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM opportunities WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.json({ message: 'Dihapus.' });
});

// Pencarian lowongan eksternal (contoh: API publik Remotive, tanpa API key).
// Ganti fungsi ini jika ingin memakai sumber lain (mis. Adzuna, Jooble) yang butuh API key,
// simpan key itu di file .env, JANGAN pernah taruh key di kode frontend.
router.get('/search', async (req, res) => {
  if (process.env.ENABLE_EXTERNAL_JOBS === 'false') {
    return res.status(200).json({ results: [], disabled: true });
  }

  const q = (req.query.q || '').toString();
  try {
    const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(q)}&limit=10`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Status ${response.status}`);
    const data = await response.json();

    const results = (data.jobs || []).map((job) => ({
      title: job.title,
      company: job.company_name,
      sourceUrl: job.url,
      location: job.candidate_required_location,
      type: job.job_type,
    }));

    res.json({ results });
  } catch (err) {
    console.error('Gagal mengambil lowongan eksternal:', err.message);
    res.status(502).json({ error: 'Tidak bisa mengambil data lowongan eksternal saat ini.', results: [] });
  }
});

module.exports = router;
