renderNav('opportunities');

const STATUS_LABEL = {
  diincar: 'Diincar', melamar: 'Sudah melamar', wawancara: 'Tahap wawancara',
  ditawari: 'Ditawari posisi', ditolak: 'Tidak lolos',
};

async function renderList() {
  const list = await Storage.getOpportunities();
  const container = document.getElementById('opportunity-list');

  if (!list.length) {
    container.innerHTML = '<p style="color:#5B5C4F;">Belum ada peluang yang dicatat.</p>';
    return;
  }

  container.innerHTML = list.map((o) => `
    <div class="card" data-id="${o.id}">
      <h3>${o.title}</h3>
      <div class="meta">${o.company || 'Perusahaan tidak dicantumkan'} · <span class="tag">${STATUS_LABEL[o.status] || o.status}</span></div>
      ${o.source_url ? `<p><a href="${o.source_url}" target="_blank" rel="noopener">Lihat sumber lowongan</a></p>` : ''}
      ${o.notes ? `<p>${o.notes}</p>` : ''}
      <div class="btn-row">
        <a class="btn secondary" href="cv-builder.html?target=${encodeURIComponent(o.title)}">Buat CV untuk posisi ini</a>
        <button type="button" class="btn danger remove-opp">Hapus</button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.remove-opp').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.closest('.card').dataset.id;
      await Storage.deleteOpportunity(id);
      renderList();
    });
  });
}

document.getElementById('add-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const opp = {
    title: document.getElementById('opp-title').value.trim(),
    company: document.getElementById('opp-company').value.trim(),
    status: document.getElementById('opp-status').value,
    sourceUrl: document.getElementById('opp-url').value.trim(),
    notes: document.getElementById('opp-notes').value.trim(),
  };
  if (!opp.title) return;

  const res = await Storage.addOpportunity(opp);
  const box = document.getElementById('alert-box');
  if (res.ok) {
    box.innerHTML = '<div class="alert success">Peluang ditambahkan.</div>';
    e.target.reset();
    renderList();
  } else {
    box.innerHTML = `<div class="alert error">${res.error}</div>`;
  }
});

document.getElementById('search-btn').addEventListener('click', async () => {
  const q = document.getElementById('search-q').value.trim();
  const results = document.getElementById('search-results');

  if (!Storage.isLoggedIn()) {
    results.innerHTML = '<div class="alert info">Pencarian lowongan eksternal butuh kamu login (agar diproses lewat server). Kamu tetap bisa menambah peluang secara manual di atas.</div>';
    return;
  }

  results.innerHTML = '<p>Mencari...</p>';
  const jobs = await Storage.searchExternalJobs(q);

  if (!jobs.length) {
    results.innerHTML = '<p style="color:#5B5C4F;">Tidak ada hasil, atau sumber eksternal sedang tidak aktif.</p>';
    return;
  }

  results.innerHTML = jobs.map((j) => `
    <div class="card">
      <h3>${j.title}</h3>
      <div class="meta">${j.company || ''} ${j.location ? '· ' + j.location : ''}</div>
      <div class="btn-row">
        <a class="btn secondary" href="${j.sourceUrl}" target="_blank" rel="noopener">Lihat lowongan</a>
        <button type="button" class="btn add-external"
          data-title="${j.title.replace(/"/g, '&quot;')}"
          data-company="${(j.company || '').replace(/"/g, '&quot;')}"
          data-url="${j.sourceUrl}">Simpan ke daftarku</button>
      </div>
    </div>
  `).join('');

  results.querySelectorAll('.add-external').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await Storage.addOpportunity({
        title: btn.dataset.title, company: btn.dataset.company,
        sourceUrl: btn.dataset.url, status: 'diincar', notes: 'Ditemukan lewat pencarian eksternal.',
      });
      renderList();
    });
  });
});

renderList();
