/*
  Vercel Serverless Function: GET /api/leads
  Returns all leads from Supabase, newest first, normalized to the admin CRM
  shape. Used by /admin/ pages to populate the leads inbox and dashboard KPIs.

  Reads Supabase config from Vercel env vars:
    - SUPABASE_URL          e.g. https://xxxxx.supabase.co
    - SUPABASE_ANON_KEY     the anon/public key (protected by RLS)

  If either env var is missing, the endpoint returns { configured: false } so
  the admin can render a setup banner instead of erroring.
*/

module.exports = async function handler(req, res) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  if (!url || !key) {
    res.status(200).send(JSON.stringify({
      configured: false,
      leads: [],
      message: 'Set SUPABASE_URL and SUPABASE_ANON_KEY env vars in Vercel to enable live sync.',
    }));
    return;
  }

  try {
    const supaRes = await fetch(
      `${url}/rest/v1/leads?select=*&order=created_at.desc`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Accept: 'application/json',
        },
      }
    );

    if (!supaRes.ok) {
      const text = await supaRes.text();
      throw new Error(`Supabase ${supaRes.status}: ${text.slice(0, 300)}`);
    }

    const rows = await supaRes.json();
    const leads = rows.map(normalize);

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

function normalize(row) {
  return {
    id: row.id,
    source: row.source,
    project: row.project || '',
    budget: row.budget || '',
    timeline: row.timeline || '',
    location: row.location || '',
    name: row.name || '(no name)',
    phone: row.phone || '',
    email: row.email || '',
    status: row.status || 'new',
    page: row.page || '',
    notes: row.notes || '',
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
