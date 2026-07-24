/*
  Vercel Serverless Function: /api/leads
  Same behavior as the previous Netlify function of the same name, adapted to
  Vercel's handler signature.

  Pulls submissions from Mason Homes forms (contact, estimate, mason-chat)
  and returns them normalized to the admin CRM lead shape.

  Env vars required (set in Vercel Project → Settings → Environment Variables):
    - NETLIFY_API_TOKEN  Personal Access Token from app.netlify.com
                         (User Settings → Applications → Personal access tokens)
    - NETLIFY_SITE_ID    "API ID" from the old Netlify site
                         (Site Configuration → General → Site information)

  Rationale: leads submitted while the site was on Netlify still live in
  Netlify Forms. This function keeps the admin CRM able to read them until
  the site is on Supabase (see /site/admin/data-model.md for the migration).

  Once the forms are re-pointed at Vercel/Supabase/Formspree, this function
  becomes read-only history until the client decides to archive it.
*/

const NETLIFY_API = 'https://api.netlify.com/api/v1';
const FORM_NAMES  = ['contact', 'estimate', 'mason-chat'];

module.exports = async function handler(req, res) {
  const token  = process.env.NETLIFY_API_TOKEN;
  const siteId = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  if (!token || !siteId) {
    res.status(200).send(JSON.stringify({
      configured: false,
      leads: [],
      message: 'Set NETLIFY_API_TOKEN and NETLIFY_SITE_ID env vars in Vercel to enable Netlify Forms sync. If forms have moved to a new destination, wire that source into the admin instead.',
    }));
    return;
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
    const targets  = allForms.filter((f) => FORM_NAMES.includes(f.name));

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

    res.status(200).send(JSON.stringify({
      configured: true,
      count: leads.length,
      fetched_at: new Date().toISOString(),
      leads,
    }));
  } catch (err) {
    res.status(200).send(JSON.stringify({
      configured: true,
      error: err.message || String(err),
      leads: [],
    }));
  }
};

function normalize(sub) {
  const d = sub.data || {};
  const formName = sub.form_name;

  const first = d.first_name || '';
  const last  = d.last_name || '';
  const composedName = `${first} ${last}`.trim();
  const name = d.name || d.full_name || composedName || '(no name)';

  const location   = d.location || d.city || d.zip || '';
  const projectRaw = d.project || d.project_type || d.service || d.subject || '';
  const budget     = d.budget || '';
  const timeline   = d.timeline || d.start_time || '';
  const notes      = d.message || d.notes || d.details || '';

  const sourceMap = {
    'mason-chat': 'chat_widget',
    contact:      'form',
    estimate:     'form',
  };

  return {
    id: 'nf_' + sub.id,
    netlify_id: sub.id,
    form_name: formName,
    source: sourceMap[formName] || 'web',
    project: projectRaw,
    budget, timeline, location, name,
    phone: d.phone || d.tel || '',
    email: d.email || '',
    status: 'new',
    page: d.page || d.referrer || '',
    notes,
    created_at: sub.created_at,
    updated_at: sub.created_at,
  };
}
