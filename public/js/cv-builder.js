renderNav('cv');

let currentCv = null;

function buildCvData(profile, targetTitle, targetNote) {
  const user = Auth.currentUser();
  const name = (user && user.name) || 'Nama Kamu (lengkapi lewat halaman Biografi)';
  const skillsList = (profile.skills || '').split(',').map((s) => s.trim()).filter(Boolean);

  let summary = profile.biography || '';
  if (targetTitle) {
    summary += (summary ? ' ' : '') + `Saat ini tertarik dan siap berkontribusi untuk posisi ${targetTitle}.`;
  }
  if (targetNote) {
    summary += ' ' + targetNote;
  }

  return {
    name,
    targetTitle: targetTitle || profile.currentRole || '',
    currentRole: profile.currentRole || '',
    currentCompany: profile.currentCompany || '',
    summary: summary.trim(),
    skills: skillsList,
    experience: profile.experience || [],
    education: profile.education || [],
  };
}

function renderPreview(cv) {
  const el = document.getElementById('cv-preview');
  el.innerHTML = `
    <h1>${cv.name}</h1>
    <div class="cv-role">${cv.targetTitle || cv.currentRole || 'Profesional'}</div>
    ${cv.summary ? `<p>${cv.summary}</p>` : ''}

    ${cv.skills.length ? `<h3>Keahlian</h3><p>${cv.skills.map((s) => `<span class="tag">${s}</span>`).join(' ')}</p>` : ''}

    ${cv.experience.length ? `<h3>Pengalaman Kerja</h3>` + cv.experience.map((e) => `
      <p><strong>${e.title || ''}</strong> — ${e.company || ''}<br>
      <em>${e.period || ''}</em><br>${e.description || ''}</p>
    `).join('') : ''}

    ${cv.education.length ? `<h3>Pendidikan</h3>` + cv.education.map((ed) => `
      <p><strong>${ed.degree || ''}</strong> — ${ed.school || ''} (${ed.year || ''})</p>
    `).join('') : ''}
  `;
  document.getElementById('cv-output').style.display = 'block';
}

function cvToPlainText(cv) {
  let lines = [cv.name, cv.targetTitle || cv.currentRole || '', ''];
  if (cv.summary) lines.push(cv.summary, '');
  if (cv.skills.length) { lines.push('KEAHLIAN', cv.skills.join(', '), ''); }
  if (cv.experience.length) {
    lines.push('PENGALAMAN KERJA');
    cv.experience.forEach((e) => {
      lines.push(`${e.title || ''} — ${e.company || ''} (${e.period || ''})`);
      if (e.description) lines.push(e.description);
      lines.push('');
    });
  }
  if (cv.education.length) {
    lines.push('PENDIDIKAN');
    cv.education.forEach((ed) => lines.push(`${ed.degree || ''} — ${ed.school || ''} (${ed.year || ''})`));
  }
  return lines.join('\n');
}

document.getElementById('generate-btn').addEventListener('click', async () => {
  const targetTitle = document.getElementById('target-title').value.trim();
  const targetNote = document.getElementById('target-note').value.trim();
  const profile = await Storage.getProfile();
  currentCv = buildCvData(profile, targetTitle, targetNote);
  renderPreview(currentCv);
});

document.getElementById('copy-btn').addEventListener('click', async () => {
  if (!currentCv) return;
  await navigator.clipboard.writeText(cvToPlainText(currentCv));
  const box = document.getElementById('alert-box');
  box.innerHTML = '<div class="alert success">Teks CV disalin ke clipboard.</div>';
});

document.getElementById('pdf-btn').addEventListener('click', () => {
  if (!currentCv || !window.jspdf) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 48;
  let y = margin;
  const lineHeight = 16;
  const maxWidth = 500;

  function addLine(text, size = 11, bold = false) {
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    const wrapped = doc.splitTextToSize(text, maxWidth);
    wrapped.forEach((line) => {
      if (y > 780) { doc.addPage(); y = margin; }
      doc.text(line, margin, y);
      y += lineHeight;
    });
  }

  addLine(currentCv.name, 18, true);
  addLine(currentCv.targetTitle || currentCv.currentRole || '', 12, true);
  y += 6;
  if (currentCv.summary) { addLine(currentCv.summary); y += 6; }
  if (currentCv.skills.length) { addLine('KEAHLIAN', 13, true); addLine(currentCv.skills.join(', ')); y += 6; }
  if (currentCv.experience.length) {
    addLine('PENGALAMAN KERJA', 13, true);
    currentCv.experience.forEach((e) => {
      addLine(`${e.title || ''} — ${e.company || ''} (${e.period || ''})`, 11, true);
      if (e.description) addLine(e.description);
      y += 4;
    });
  }
  if (currentCv.education.length) {
    addLine('PENDIDIKAN', 13, true);
    currentCv.education.forEach((ed) => addLine(`${ed.degree || ''} — ${ed.school || ''} (${ed.year || ''})`));
  }

  doc.save(`CV-${(currentCv.name || 'saya').replace(/\s+/g, '-')}.pdf`);
});

document.getElementById('docx-btn').addEventListener('click', async () => {
  if (!currentCv || !window.docx) {
    document.getElementById('alert-box').innerHTML =
      '<div class="alert error">Pustaka pembuat Word gagal dimuat (butuh koneksi internet). Coba unduh sebagai PDF atau salin sebagai teks.</div>';
    return;
  }
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = window.docx;

  const children = [
    new Paragraph({ text: currentCv.name, heading: HeadingLevel.TITLE }),
    new Paragraph({ text: currentCv.targetTitle || currentCv.currentRole || '', heading: HeadingLevel.HEADING_2 }),
  ];

  if (currentCv.summary) children.push(new Paragraph({ text: currentCv.summary }));

  if (currentCv.skills.length) {
    children.push(new Paragraph({ text: 'Keahlian', heading: HeadingLevel.HEADING_2 }));
    children.push(new Paragraph({ text: currentCv.skills.join(', ') }));
  }

  if (currentCv.experience.length) {
    children.push(new Paragraph({ text: 'Pengalaman Kerja', heading: HeadingLevel.HEADING_2 }));
    currentCv.experience.forEach((e) => {
      children.push(new Paragraph({
        children: [new TextRun({ text: `${e.title || ''} — ${e.company || ''} (${e.period || ''})`, bold: true })],
      }));
      if (e.description) children.push(new Paragraph({ text: e.description }));
    });
  }

  if (currentCv.education.length) {
    children.push(new Paragraph({ text: 'Pendidikan', heading: HeadingLevel.HEADING_2 }));
    currentCv.education.forEach((ed) => {
      children.push(new Paragraph({ text: `${ed.degree || ''} — ${ed.school || ''} (${ed.year || ''})` }));
    });
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CV-${(currentCv.name || 'saya').replace(/\s+/g, '-')}.docx`;
  a.click();
  URL.revokeObjectURL(url);
});

// Isi otomatis posisi tujuan kalau datang dari halaman Peluang Karier
(() => {
  const params = new URLSearchParams(window.location.search);
  const target = params.get('target');
  if (target) document.getElementById('target-title').value = target;
})();
