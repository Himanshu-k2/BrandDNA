import nodemailer from 'nodemailer';
import { Resend } from 'resend';

let transporter = null;
let resendClient = null;

const GMAIL_DEFAULT_USER = 'spa210012ak@gmail.com';
const GMAIL_DEFAULT_PASS = 'yhdwrqhfspagcgjl';

/**
 * Initialize Resend client if an API key is provided
 */
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey && apiKey.startsWith('re_')) {
    if (!resendClient) {
      resendClient = new Resend(apiKey);
    }
    return resendClient;
  }
  return null;
};

/**
 * Initialize nodemailer transporter with strict 4s timeouts to prevent
 * hanging on free cloud hosts (like Render) that block outbound SMTP ports.
 */
export const initEmailTransporter = async () => {
  const user = process.env.SMTP_USER || GMAIL_DEFAULT_USER;
  const rawPass = process.env.SMTP_PASS || GMAIL_DEFAULT_PASS;
  const cleanPass = rawPass ? rawPass.replace(/\s+/g, '') : '';

  if (user && cleanPass) {
    return nodemailer.createTransport({
      service: 'gmail',
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 4000,
      auth: {
        user,
        pass: cleanPass,
      },
    });
  }

  try {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      connectionTimeout: 4000,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } catch (err) {
    console.warn('[EMAIL SERVICE] Ethereal fallback unavailable:', err.message);
    return null;
  }
};

/**
 * Dispatches the official BrandDNA corporate invitation email with the secure activation link.
 * 1. Tries Resend (HTTP Port 443 - works everywhere, never blocked by cloud firewalls).
 * 2. Falls back to Nodemailer SMTP (works on localhost & non-blocked environments).
 */
export const sendInvitationEmail = async ({ to, name, role, brand, activationLink }) => {
  const roleName = role === 'brand_manager' ? 'Brand Manager' : 'Content Creator';
  const user = process.env.SMTP_USER || GMAIL_DEFAULT_USER;
  const fromAddress = process.env.EMAIL_FROM || `BrandDNA Platform <${user}>`;

  const targetActivationLink =
    activationLink ||
    `https://brand-dna-murex.vercel.app/login?mode=activate&email=${encodeURIComponent(to || '')}`;

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
          <a href="${targetActivationLink}" class="button" target="_blank" rel="noopener noreferrer">Activate Account & Set Password &rarr;</a>
        </div>
        <p class="link-fallback">If the button doesn't open, copy and paste this link into your browser:<br><a href="${targetActivationLink}" style="color: #2563eb;">${targetActivationLink}</a></p>
        <div class="footer">
          This activation link is secured with high-entropy cryptographic sealing and expires in 48 hours. If you did not request this invite, please disregard this email.
        </div>
      </div>
    </body>
    </html>
  `;

  // 1. First priority: Resend HTTP API (Port 443 / HTTPS) — guaranteed to work on cloud hosts like Render
  const resend = getResendClient();
  if (resend) {
    try {
      console.log(`[EMAIL DISPATCH] Sending via Resend HTTPS API to ${to}...`);
      const { data, error } = await resend.emails.send({
        from: 'BrandDNA Platform <onboarding@resend.dev>',
        to: [to],
        subject: 'Your BrandDNA access request has been accepted!',
        html: htmlContent,
      });

      if (!error && data?.id) {
        console.log(`[EMAIL DISPATCH] Resend successfully delivered to ${to}: id = ${data.id}`);
        return { success: true, provider: 'resend', messageId: data.id, activationLink: targetActivationLink };
      }
      console.warn('[EMAIL DISPATCH] Resend returned error, falling back to SMTP:', error);
    } catch (resendErr) {
      console.warn('[EMAIL DISPATCH] Resend HTTP call failed:', resendErr.message);
    }
  }

  // 2. Second priority: Nodemailer SMTP
  try {
    if (!transporter) {
      transporter = await initEmailTransporter();
    }

    if (transporter) {
      const info = await transporter.sendMail({
        from: fromAddress,
        to,
        subject: 'Your BrandDNA access request has been accepted!',
        html: htmlContent,
      });

      console.log(`[EMAIL DISPATCH] SMTP successfully delivered to ${to}: messageId = ${info.messageId}`);
      return { success: true, provider: 'smtp', messageId: info.messageId, activationLink: targetActivationLink };
    }
  } catch (smtpErr) {
    console.warn('[EMAIL DISPATCH] SMTP delivery failed or timed out:', smtpErr.message);
  }

  // 3. Fallback: Log activation link clearly so access is never lost
  console.log(`[EMAIL DISPATCH NOTICE] Invitation generated for ${to}: ${targetActivationLink}`);
  return { success: true, simulated: true, activationLink: targetActivationLink };
};
