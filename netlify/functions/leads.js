/*
  Netlify Function: /api/leads
  Pulls submissions from all Mason Homes forms (contact, estimate, mason-chat)
  and returns them normalized to the admin CRM lead shape.

  Auth: requires the following Netlify env vars
    - NETLIFY_API_TOKEN  (Personal Access Token from app.netlify.com -> User Settings -> Applications)
    - NETLIFY_SITE_ID    (Site ID from Site Settings -> General -> Site information -> "API ID")

  If the env vars are missing the endpoint returns { configured: false } so the
  admin UI can render a setup instruction instead of failing.
*/

const NETLIFY_API = 'https://api.netlify.com/api/v1';
const FORM_NAMES = ['contact', 'estimate', 'mason-chat'];

exports.handler = async () => {
  const token = process.env.NETLIFY_API_TOKEN;
  const siteId = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;

  const jsonHeaders = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  };

  if (!token || !siteId) {
    return {
      statusCode: 200,
      headers: jsonHeaders,
      body: JSON.stringify({
        configured: false,
        leads: [],
        message: 'Set NETLIFY_API_TOKEN and NETLIFY_SITE_ID in Netlify env to enable live sync.',
      }),
    };
  }

  try {
    const formsRes = await fetch(`${NETLIFY_API}/sites/${siteId}/forms`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!formsRes.ok) {
      const text = await formsRes.text();
      throw new Error(`Forms list: ${formsRes.status} ${text.slice(0, 200)}`);
    }
    const allForms = await formsRes.json();
    const targets = allForms.filter((f) => FORM_NAMES.includes(f.name));

    const collected = [];
    for (const form of targets) {
      const subRes = await fetch(
        `${NETLIFY_API}/forms/${form.id}/submissions?per_page=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!subRes.ok) continue;
      const subs = await subRes.json();
      subs.forEach((s) => collected.push({ form_name: form.name, ...s }));
    }

    const leads = collected
      .map(normalize)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return {
      statusCode: 200,
      headers: jsonHeaders,
      body: JSON.stringify({
        configured: true,
        count: leads.length,
        fetched_at: new Date().toISOString(),
        leads,
      }),
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: jsonHeaders,
      body: JSON.stringify({
        configured: true,
        error: err.message || String(err),
        leads: [],
      }),
    };
  }
};

function normalize(sub) {
  const d = sub.data || {};
  const formName = sub.form_name;

  const first = d.first_name || '';
  const last = d.last_name || '';
  const composedName = `${first} ${last}`.trim();
  const name = d.name || d.full_name || composedName || '(no name)';

  const location = d.location || d.city || d.zip || '';

  const projectRaw = d.project || d.project_type || d.service || d.subject || '';
  const budget = d.budget || '';
  const timeline = d.timeline || d.start_time || '';
  const notes = d.message || d.notes || d.details || '';

  const sourceMap = {
    'mason-chat': 'chat_widget',
    contact: 'form',
    estimate: 'form',
  };

  return {
    id: 'nf_' + sub.id,
    netlify_id: sub.id,
    form_name: formName,
    source: sourceMap[formName] || 'web',
    project: projectRaw,
    budget,
    timeline,
    location,
    name,
    phone: d.phone || d.tel || '',
    email: d.email || '',
    status: 'new',
    page: d.page || d.referrer || '',
    notes,
    created_at: sub.created_at,
    updated_at: sub.created_at,
  };
}
