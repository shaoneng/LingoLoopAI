const SENDGRID_ENDPOINT = 'https://api.sendgrid.com/v3/mail/send';

function ensureMailFrom() {
  const from = process.env.MAIL_FROM;
  if (!from) {
    throw new Error('MAIL_FROM is not configured.');
  }
  return from;
}

async function sendViaSendgrid({ to, subject, text, html }) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    return false;
  }
  const from = ensureMailFrom();
  const body = {
    personalizations: [
      {
        to: [{ email: to }],
        subject,
      },
    ],
    from: { email: from },
    content: [
      html ? { type: 'text/html', value: html } : null,
      text ? { type: 'text/plain', value: text } : null,
    ].filter(Boolean),
  };
  const resp = await fetch(SENDGRID_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const detail = await resp.text().catch(() => resp.statusText);
    throw new Error(`SendGrid request failed: ${resp.status} ${detail}`);
  }
  return true;
}

function logMail({ to, subject, text, html }) {
  console.info('[mail:console]', { to, subject, text, html });
}

export async function sendMail({ to, subject, text, html }) {
  if (!to) throw new Error('Missing email recipient.');
  if (!subject) throw new Error('Missing email subject.');

  try {
    const delivered = await sendViaSendgrid({ to, subject, text, html });
    if (delivered) return;
  } catch (error) {
    console.error('sendMail via SendGrid failed:', error);
    throw error;
  }

  const mode = process.env.MAIL_FALLBACK_MODE || 'console';
  if (mode === 'console') {
    logMail({ to, subject, text, html });
    return;
  }

  throw new Error('Mail delivery is not configured.');
}
