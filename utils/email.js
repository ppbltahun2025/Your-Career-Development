const nodemailer = require('nodemailer');

function buildTransport() {
  if (!process.env.SMTP_HOST) {
    // Mode pengembangan: tidak ada SMTP asli terpasang.
    // Alih-alih gagal, kita "kirim" email dengan mencetak link-nya di console.
    return {
      sendMail: async ({ to, subject, text, html }) => {
        console.log('\n=== [EMAIL SIMULASI - SMTP belum diatur] ===');
        console.log('Kepada :', to);
        console.log('Subjek :', subject);
        console.log(text || html);
        console.log('=== salin link verifikasi di atas untuk mencoba fitur ini ===\n');
        return { simulated: true };
      },
    };
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== 'false',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const transporter = buildTransport();

async function sendVerificationEmail(to, name, token) {
  const baseUrl = process.env.APP_BASE_URL || 'http://localhost:4000';
  const link = `${baseUrl}/verify.html?token=${encodeURIComponent(token)}`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'KarierKu <no-reply@karierku.app>',
    to,
    subject: 'Verifikasi email KarierKu kamu',
    text: `Halo ${name},\n\nKlik link berikut untuk memverifikasi email kamu:\n${link}\n\nJika kamu tidak merasa mendaftar, abaikan email ini.`,
    html: `<p>Halo ${name},</p><p>Klik tombol di bawah ini untuk memverifikasi email kamu:</p>
      <p><a href="${link}" style="background:#2F5D50;color:#fff;padding:10px 18px;border-radius:4px;text-decoration:none;">Verifikasi Email</a></p>
      <p>Atau salin link ini ke browser: ${link}</p>
      <p>Jika kamu tidak merasa mendaftar, abaikan email ini.</p>`,
  });
}

module.exports = { sendVerificationEmail };
