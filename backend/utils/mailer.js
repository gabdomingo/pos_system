import nodemailer from 'nodemailer';

let transporterPromise = null;

function parseBoolean(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

function getMailConfig() {
  const host = String(process.env.SMTP_HOST || '').trim();
  const from = String(process.env.MAIL_FROM || '').trim();
  const port = Number(process.env.SMTP_PORT || 0);

  if (!host || !from || !port) {
    return null;
  }

  const user = String(process.env.SMTP_USER || '').trim();
  const pass = String(process.env.SMTP_PASS || '').trim();
  const auth = user && pass ? { user, pass } : undefined;

  return {
    host,
    from,
    port,
    secure: parseBoolean(process.env.SMTP_SECURE) || port === 465,
    auth
  };
}

export function isEmailDeliveryConfigured() {
  return Boolean(getMailConfig());
}

async function getTransporter() {
  if (!transporterPromise) {
    const config = getMailConfig();
    if (!config) return null;

    transporterPromise = (async () => {
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: config.auth,
      });

      await transporter.verify();
      return transporter;
    })().catch((error) => {
      transporterPromise = null;
      throw error;
    });
  }

  return transporterPromise;
}

function buildPasswordResetEmail({ recipientName, code, ttlMinutes }) {
  const safeName = String(recipientName || '').trim() || 'Charlie PC user';
  const expirationText = ttlMinutes === 1 ? '1 minute' : `${ttlMinutes} minutes`;

  return {
    subject: 'Charlie PC password reset code',
    text: [
      `Hello ${safeName},`,
      '',
      'We received a request to reset your Charlie PC password.',
      `Your verification code is: ${code}`,
      `This code expires in ${expirationText}.`,
      '',
      'If you did not request this reset, you can ignore this message.',
      '',
      'Charlie PC Store'
    ].join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; color: #163567; line-height: 1.6;">
        <p>Hello ${safeName},</p>
        <p>We received a request to reset your Charlie PC password.</p>
        <p style="margin: 20px 0;">
          <span style="display: inline-block; padding: 12px 18px; border-radius: 12px; background: #EEF5FF; border: 1px solid #C9D9F4; font-size: 24px; font-weight: 700; letter-spacing: 4px; color: #0B5ED7;">
            ${code}
          </span>
        </p>
        <p>This code expires in <strong>${expirationText}</strong>.</p>
        <p>If you did not request this reset, you can ignore this message.</p>
        <p style="margin-top: 24px;">Charlie PC Store</p>
      </div>
    `
  };
}

export async function sendPasswordResetEmail({ to, recipientName, code, ttlMinutes }) {
  const config = getMailConfig();

  if (!config) {
    if (process.env.NODE_ENV !== 'production') {
      return { mode: 'preview' };
    }

    const error = new Error('Password reset email is not configured. Please set SMTP credentials before using this feature.');
    error.statusCode = 503;
    throw error;
  }

  const transporter = await getTransporter();
  const message = buildPasswordResetEmail({ recipientName, code, ttlMinutes });

  try {
    await transporter.sendMail({
      from: config.from,
      to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });

    return { mode: 'smtp' };
  } catch (error) {
    const deliveryError = new Error('Unable to deliver the reset email right now. Please try again later.');
    deliveryError.statusCode = 503;
    deliveryError.cause = error;
    throw deliveryError;
  }
}
