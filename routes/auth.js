const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { sendVerificationEmail } = require('../utils/email');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nama, email, dan password wajib diisi.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Format email tidak valid.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password minimal 8 karakter.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'Email ini sudah terdaftar. Coba login.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const verifyToken = uuidv4();

  const info = db.prepare(
    `INSERT INTO users (name, email, password_hash, email_verified, verify_token)
     VALUES (?, ?, ?, 0, ?)`
  ).run(name.trim(), email.toLowerCase(), passwordHash, verifyToken);

  db.prepare('INSERT INTO profiles (user_id) VALUES (?)').run(info.lastInsertRowid);

  try {
    await sendVerificationEmail(email, name, verifyToken);
  } catch (err) {
    console.error('Gagal mengirim email verifikasi:', err.message);
  }

  res.status(201).json({
    message: 'Pendaftaran berhasil. Cek email kamu untuk link verifikasi (lihat console server jika belum mengatur SMTP).',
  });
});

router.get('/verify', (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Token verifikasi tidak ada.' });

  const user = db.prepare('SELECT id FROM users WHERE verify_token = ?').get(token);
  if (!user) {
    return res.status(400).json({ error: 'Token verifikasi tidak valid atau sudah dipakai.' });
  }

  db.prepare('UPDATE users SET email_verified = 1, verify_token = NULL WHERE id = ?').run(user.id);
  res.json({ message: 'Email berhasil diverifikasi. Silakan login.' });
});

router.post('/resend-verification', async (req, res) => {
  const { email } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get((email || '').toLowerCase());

  if (!user) return res.status(404).json({ error: 'Email tidak ditemukan.' });
  if (user.email_verified) return res.status(400).json({ error: 'Email ini sudah terverifikasi.' });

  const verifyToken = uuidv4();
  db.prepare('UPDATE users SET verify_token = ? WHERE id = ?').run(verifyToken, user.id);
  await sendVerificationEmail(user.email, user.name, verifyToken);

  res.json({ message: 'Email verifikasi dikirim ulang.' });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get((email || '').toLowerCase());

  if (!user) return res.status(401).json({ error: 'Email atau password salah.' });

  const match = await bcrypt.compare(password || '', user.password_hash);
  if (!match) return res.status(401).json({ error: 'Email atau password salah.' });

  if (!user.email_verified) {
    return res.status(403).json({ error: 'Email belum diverifikasi. Cek inbox kamu, atau minta kirim ulang.' });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(req.userId);
  res.json({ user });
});

module.exports = router;
