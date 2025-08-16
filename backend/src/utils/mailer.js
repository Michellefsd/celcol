// En dev, si no hay SMTP, solo logueamos el link
async function sendPasswordReset(email, url) {
  if (!process.env.SMTP_HOST) {
    console.log('[DEV] Reset link:', url);
    return;
  }
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  await transporter.sendMail({
    from: 'Celcol <no-reply@celcol.local>',
    to: email,
    subject: 'Recuperar contraseña',
    html: `<p>Para restablecer tu contraseña hacé click:</p>
           <p><a href="${url}">${url}</a></p>
           <p>Vence en 15 minutos.</p>`
  });
}

module.exports = { sendPasswordReset };
