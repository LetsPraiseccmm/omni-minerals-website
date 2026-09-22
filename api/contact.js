const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d\s().-]{7,30}$/;
const SERVICES = new Set(['Mineral Commodities', 'Industrial Minerals', 'Equipment Solutions', 'General Enquiry']);
const attempts = new Map();

function clean(value, max) { return String(value ?? '').replace(/[<>]/g, '').trim().slice(0, max); }
function respond(res, status, body) { res.status(status).setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)); }

module.exports = async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') return respond(res, 405, { error: 'Method not allowed.' });
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const previous = attempts.get(ip) || 0;
  if (now - previous < 30_000) return respond(res, 429, { error: 'Please wait before sending another enquiry.' });
  attempts.set(ip, now);
  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}); }
  catch { return respond(res, 400, { error: 'Invalid request.' }); }
  if (clean(body._website, 100)) return respond(res, 400, { error: 'Invalid submission.' });
  if (Number(body.formStartedAt) && now - Number(body.formStartedAt) < 2500) return respond(res, 400, { error: 'Please take a moment and try again.' });
  const name = clean(body.name, 100); const company = clean(body.company, 120); const email = clean(body.email, 160);
  const phone = clean(body.phone, 30); const service = clean(body.service, 60); const message = clean(body.message, 2000);
  if (name.length < 2 || !EMAIL_RE.test(email) || !SERVICES.has(service) || message.length < 2 || body.consent !== true && body.consent !== 'true') return respond(res, 422, { error: 'Please provide the required enquiry details and consent.' });
  if (phone && !PHONE_RE.test(phone)) return respond(res, 422, { error: 'Please provide a valid phone number.' });
  if (!process.env.ZOHO_MAIL_API_URL || !process.env.ZOHO_ACCESS_TOKEN) return respond(res, 503, { error: 'Secure mail delivery is not configured yet.' });
  try {
    const response = await fetch(process.env.ZOHO_MAIL_API_URL, { method: 'POST', headers: { Authorization: `Zoho-oauthtoken ${process.env.ZOHO_ACCESS_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ to: process.env.OMNI_CONTACT_EMAIL || 'info@omniminerals.co.zm', replyTo: email, subject: `Website enquiry: ${service}`, text: `Name: ${name}\nCompany: ${company || 'Not provided'}\nPhone: ${phone || 'Not provided'}\nService: ${service}\n\n${message}` }) });
    if (!response.ok) throw new Error('Zoho delivery failed');
    return respond(res, 200, { ok: true });
  } catch { return respond(res, 502, { error: 'We could not send the enquiry. Please email info@omniminerals.co.zm.' }); }
};
