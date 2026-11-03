import nodemailer from 'nodemailer';

let transporter = null;

/**
 * Initialize nodemailer transporter:
 * 1. If SMTP_USER and SMTP_PASS are set in environment, connects to real SMTP (e.g. Gmail).
 * 2. In local development without credentials, initializes Ethereal test mailer with preview URL.
 */
export const initEmailTransporter = async () => {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const cleanPass = process.env.SMTP_PASS.replace(/\s+/g, '');
    const isGmail =
      (process.env.SMTP_HOST || '').includes('gmail') ||
      (process.env.SMTP_USER || '').includes('gmail.com');

    if (isGmail) {
      console.log(`[EMAIL SERVICE] Connecting to Gmail SMTP as ${process.env.SMTP_USER}`);
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: cleanPass,
        },
      });
    }

    const port = Number(process.env.SMTP_PORT) || 587;
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: cleanPass,
      },
    });
  }

  // Fallback: If in development, create an Ethereal test transporter
  try {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } catch (err) {
    console.warn('[EMAIL SERVICE] Could not initialize Ethereal fallback transporter:', err.message);
    return null;
  }
};

/**
 * Dispatches the official BrandDNA corporate invitation email with the secure activation link.
 */
export const sendInvitationEmail = async ({ to, name, role, brand, activationLink }) => {
  try {
    if (!transporter) {
      transporter = await initEmailTransporter();
    }

    const roleName = role === 'brand_manager' ? 'Brand Manager' : 'Content Creator';
    const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || 'BrandDNA Platform <noreply@branddna.com>';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f7f8; margin: 0; padding: 24px; color: #111; }
          .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e5e5e5; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
          .logo { font-size: 22px; font-weight: 800; color: #111; margin-bottom: 24px; letter-spacing: -0.5px; }
          .logo-orange { color: #f97316; }
          h2 { font-size: 20px; font-weight: 700; color: #111; margin: 0 0 16px 0; }
          p { font-size: 14px; line-height: 1.6; color: #444; margin: 0 0 16px 0; }
          .badge { display: inline-block; background: #f0f0f0; border-radius: 6px; padding: 4px 10px; font-size: 13px; font-weight: 600; color: #111; }
          .button-wrapper { margin: 28px 0; text-align: left; }
          .button { display: inline-block; background-color: #111111; color: #ffffff !important; padding: 14px 28px; border-radius: 9999px; text-decoration: none; font-size: 14px; font-weight: 700; letter-spacing: 0.2px; }
          .link-fallback { font-size: 12px; color: #888; word-break: break-all; margin-top: 16px; }
          .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">Brand<span class="logo-orange">DNA</span></div>
          <h2>Your BrandDNA access request has been accepted!</h2>
          <p>Hello <strong>${name || 'Team Member'}</strong>,</p>
          <p>Platform Administrator <strong>Jordan Blake</strong> has approved your workspace joining request for <strong>${brand || 'NovaFit Health'}</strong> as a <span class="badge">${roleName}</span>.</p>
          <p>Please click the button below to create your password and launch your personalized brand workspace:</p>
          <div class="button-wrapper">
            <a href="${activationLink}" class="button" target="_blank" rel="noopener noreferrer">Activate Account & Set Password &rarr;</a>
          </div>
          <p class="link-fallback">If the button doesn't open, copy and paste this link into your browser:<br><a href="${activationLink}" style="color: #2563eb;">${activationLink}</a></p>
          <div class="footer">
            This activation link is secured with high-entropy cryptographic sealing and expires in 48 hours. If you did not request this invite, please disregard this email.
          </div>
        </div>
      </body>
      </html>
    `;

    if (!transporter) {
      console.log(`[EMAIL DISPATCH] Sent to: ${to} | Activation Link: ${activationLink}`);
      return { success: true, simulated: true, activationLink };
    }

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject: 'Your BrandDNA access request has been accepted!',
      html: htmlContent,
    });

    console.log(`[EMAIL DISPATCH] Email successfully delivered to ${to}: messageId = ${info.messageId}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[EMAIL DISPATCH] Test mailbox preview URL: ${previewUrl}`);
    }

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error('[EMAIL DISPATCH ERROR]', error);
    return { success: false, error: error.message };
  }
};
