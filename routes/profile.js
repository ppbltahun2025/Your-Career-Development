const express = require('express');
const db = require('../db/database');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  let profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.userId);
  if (!profile) {
    db.prepare('INSERT INTO profiles (user_id) VALUES (?)').run(req.userId);
    profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.userId);
  }
  res.json({
    biography: profile.biography,
    currentRole: profile.current_role,
    currentCompany: profile.current_company,
    skills: profile.skills,
    experience: JSON.parse(profile.experience_json || '[]'),
    education: JSON.parse(profile.education_json || '[]'),
  });
});

router.put('/', (req, res) => {
  const { biography, currentRole, currentCompany, skills, experience, education } = req.body || {};

  db.prepare(`
    UPDATE profiles SET
      biography = ?, current_role = ?, current_company = ?, skills = ?,
      experience_json = ?, education_json = ?, updated_at = datetime('now')
    WHERE user_id = ?
  `).run(
    biography || '',
    currentRole || '',
    currentCompany || '',
    skills || '',
    JSON.stringify(experience || []),
    JSON.stringify(education || []),
    req.userId
  );

  res.json({ message: 'Profil tersimpan.' });
});

module.exports = router;
