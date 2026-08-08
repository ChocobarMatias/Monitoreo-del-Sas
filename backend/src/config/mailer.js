const nodemailer = require("nodemailer");
const { env } = require("./env");

const transporter = nodemailer.createTransport({
  host: env.MAIL_HOST,
  port: env.MAIL_PORT,
  secure: false,
  auth: {
    user: env.MAIL_USER,
    pass: env.MAIL_PASS,
  },
});

async function sendPasswordResetEmail(toEmail, resetToken) {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  await transporter.sendMail({
    from: env.MAIL_FROM,
    to: toEmail,
    subject: "Recuperación de contraseña — Guard App",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;">
        <h2 style="color:#0f172a;">Recuperar contraseña</h2>
        <p style="color:#475569;">Recibimos una solicitud para restablecer tu contraseña.</p>
        <p style="color:#475569;">Hacé clic en el botón para crear una nueva:</p>
        <a href="${resetUrl}"
           style="display:inline-block;margin:16px 0;padding:12px 24px;background:#0f172a;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
          Restablecer contraseña
        </a>
        <p style="color:#94a3b8;font-size:13px;">Este link expira en 30 minutos.</p>
        <p style="color:#94a3b8;font-size:13px;">Si no solicitaste esto, ignorá este correo.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
        <p style="color:#cbd5e1;font-size:12px;">Guard App — Sistema de monitoreo SAS</p>
      </div>
    `,
  });
}

module.exports = { sendPasswordResetEmail };
