renderNav('profile');

let experience = [];
let education = [];

function experienceRowHtml(item, idx) {
  return `
    <div class="card" data-idx="${idx}">
      <label>Posisi</label>
      <input type="text" class="exp-title" value="${item.title || ''}">
      <label>Perusahaan</label>
      <input type="text" class="exp-company" value="${item.company || ''}">
      <label>Periode<span class="hint">mis. 2022 - sekarang</span></label>
      <input type="text" class="exp-period" value="${item.period || ''}">
      <label>Deskripsi singkat tugas/pencapaian</label>
      <textarea class="exp-desc">${item.description || ''}</textarea>
      <div class="btn-row"><button type="button" class="btn danger remove-exp">Hapus</button></div>
    </div>`;
}

function educationRowHtml(item, idx) {
  return `
    <div class="card" data-idx="${idx}">
      <label>Jenjang & Program studi</label>
      <input type="text" class="edu-degree" value="${item.degree || ''}">
      <label>Institusi</label>
      <input type="text" class="edu-school" value="${item.school || ''}">
      <label>Tahun lulus</label>
      <input type="text" class="edu-year" value="${item.year || ''}">
      <div class="btn-row"><button type="button" class="btn danger remove-edu">Hapus</button></div>
    </div>`;
}

function syncExperienceFromDom() {
  document.querySelectorAll('#experience-list .card').forEach((card, i) => {
    experience[i] = {
      title: card.querySelector('.exp-title').value,
      company: card.querySelector('.exp-company').value,
      period: card.querySelector('.exp-period').value,
      description: card.querySelector('.exp-desc').value,
    };
  });
}

function syncEducationFromDom() {
  document.querySelectorAll('#education-list .card').forEach((card, i) => {
    education[i] = {
      degree: card.querySelector('.edu-degree').value,
      school: card.querySelector('.edu-school').value,
      year: card.querySelector('.edu-year').value,
    };
  });
}

function renderExperience() {
  document.getElementById('experience-list').innerHTML =
    experience.map(experienceRowHtml).join('') || '<p style="color:#5B5C4F;">Belum ada pengalaman ditambahkan.</p>';
  document.querySelectorAll('.remove-exp').forEach((btn, i) => {
    btn.addEventListener('click', () => { syncExperienceFromDom(); experience.splice(i, 1); renderExperience(); });
  });
}

function renderEducation() {
  document.getElementById('education-list').innerHTML =
    education.map(educationRowHtml).join('') || '<p style="color:#5B5C4F;">Belum ada pendidikan ditambahkan.</p>';
  document.querySelectorAll('.remove-edu').forEach((btn, i) => {
    btn.addEventListener('click', () => { syncEducationFromDom(); education.splice(i, 1); renderEducation(); });
  });
}

document.getElementById('add-experience').addEventListener('click', () => {
  syncExperienceFromDom();
  experience.push({ title: '', company: '', period: '', description: '' });
  renderExperience();
});

document.getElementById('add-education').addEventListener('click', () => {
  syncEducationFromDom();
  education.push({ degree: '', school: '', year: '' });
  renderEducation();
});

(async () => {
  const profile = await Storage.getProfile();
  document.getElementById('biography').value = profile.biography || '';
  document.getElementById('currentRole').value = profile.currentRole || '';
  document.getElementById('currentCompany').value = profile.currentCompany || '';
  document.getElementById('skills').value = profile.skills || '';
  experience = profile.experience || [];
  education = profile.education || [];
  renderExperience();
  renderEducation();
})();

document.getElementById('profile-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  syncExperienceFromDom();
  syncEducationFromDom();

  const profile = {
    biography: document.getElementById('biography').value,
    currentRole: document.getElementById('currentRole').value,
    currentCompany: document.getElementById('currentCompany').value,
    skills: document.getElementById('skills').value,
    experience,
    education,
  };

  const box = document.getElementById('alert-box');
  const res = await Storage.saveProfile(profile);
  box.innerHTML = res.ok
    ? '<div class="alert success">Profil tersimpan.</div>'
    : `<div class="alert error">${res.error || 'Gagal menyimpan.'}</div>`;
});
