renderNav('learn');

let allTips = [];
let activeCategory = 'Semua';

function renderTips() {
  const filtered = activeCategory === 'Semua' ? allTips : allTips.filter((t) => t.category === activeCategory);
  document.getElementById('tips-list').innerHTML = filtered.map((t) => `
    <div class="card">
      <div class="meta">${t.category}</div>
      <h3>${t.title}</h3>
      <p>${t.content}</p>
    </div>
  `).join('');
}

function renderFilters(categories) {
  const cats = ['Semua', ...categories];
  document.getElementById('filter-row').innerHTML = cats.map((c) =>
    `<button type="button" class="btn ${c === activeCategory ? '' : 'secondary'}" data-cat="${c}">${c}</button>`
  ).join('');

  document.querySelectorAll('#filter-row button').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.cat;
      renderFilters(categories);
      renderTips();
    });
  });
}

fetch('data/career-tips.json')
  .then((r) => r.json())
  .then((tips) => {
    allTips = tips;
    const categories = [...new Set(tips.map((t) => t.category))];
    renderFilters(categories);
    renderTips();
  })
  .catch(() => {
    document.getElementById('tips-list').innerHTML = '<div class="alert error">Gagal memuat materi belajar.</div>';
  });
