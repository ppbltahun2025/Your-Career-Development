function renderNav(activePage) {
  const links = [
    { href: 'index.html', label: 'Beranda', key: 'home' },
    { href: 'profile.html', label: 'Biografi & Karier', key: 'profile' },
    { href: 'opportunities.html', label: 'Peluang Karier', key: 'opportunities' },
    { href: 'cv-builder.html', label: 'Pembuat CV Cepat', key: 'cv' },
    { href: 'learn.html', label: 'Belajar & Kembangkan Diri', key: 'learn' },
  ];

  const loggedIn = Storage.isLoggedIn();
  const user = Auth.currentUser();

  const navHtml = links.map((l) =>
    `<a href="${l.href}" class="${l.key === activePage ? 'active' : ''}">${l.label}</a>`
  ).join('');

  const authBox = loggedIn
    ? `<span class="badge">Akun</span><br>Masuk sebagai <strong>${user ? user.name : ''}</strong><br>
       <button class="link" onclick="Auth.logout()">Keluar</button>`
    : `<span class="badge">Mode Tamu</span><br>Data tersimpan lokal di perangkat ini.<br>
       <a href="register.html">Buat akun</a> · <a href="login.html">Masuk</a>`;

  document.getElementById('app-nav').innerHTML = `
    <div class="sidebar">
      <div class="brand">Karier<span>Ku</span></div>
      <nav>${navHtml}</nav>
      <div class="auth-box">${authBox}</div>
    </div>
  `;
}
