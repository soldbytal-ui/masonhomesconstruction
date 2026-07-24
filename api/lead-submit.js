/*
  Vercel Serverless Function: POST /api/lead-submit
  Receives a lead from the site's public forms (chat widget, contact form,
  free-estimate form) and inserts a row into the Supabase `leads` table.

  Accepts either JSON body or form-encoded body. Returns { ok: true, id }
  on success, { ok: false, error } on failure.

  Reads Supabase config from Vercel env vars:
    - SUPABASE_URL          e.g. https://xxxxx.supabase.co
    - SUPABASE_ANON_KEY     the anon/public key (row-level security applies)

  Security note: with the default RLS policies from /site/admin/data-model.md,
  anon inserts on leads are blocked. Either add a policy that allows anon to
  INSERT on leads (see below), or set SUPABASE_SERVICE_ROLE_KEY in Vercel and
  it will be preferred here (bypasses RLS).

  Suggested RLS policy for anon inserts (run in Supabase SQL editor):
    create policy "anon_can_insert_leads"
      on leads for insert
      to anon
      with check (true);
*/

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.status(405).send(JSON.stringify({ ok: false, error: 'Method not allowed' }));
    return;
  }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Prefer service role key for INSERTs (bypasses RLS); fall back to anon
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || anon;

  if (!url || !key) {
    res.status(500).send(JSON.stringify({
      ok: false,
      error: 'Supabase not configured. Set SUPABASE_URL and either SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY.',
    }));
    return;
  }

  try {
    const body = await parseBody(req);

    // Simple honeypot: if bot-field is filled, silently accept and drop
    if (body['bot-field']) {
      res.status(200).send(JSON.stringify({ ok: true, id: 'ignored' }));
      return;
    }

    // Map incoming fields (accept several common shapes)
    const first = body.first_name || '';
    const last  = body.last_name || '';
    const composedName = `${first} ${last}`.trim();
    const name = body.name || body.full_name || composedName;

    const formName = body['form-name'] || body.form_name || 'web';
    const sourceMap = {
      'mason-chat': 'chat_widget',
      contact: 'form',
      estimate: 'form',
    };

    if (!name && !body.email && !body.phone) {
      res.status(400).send(JSON.stringify({
        ok: false,
        error: 'Submission missing name, email and phone. At least one required.',
      }));
      return;
    }

    const row = {
      source:   sourceMap[formName] || 'web',
      project:  body.project || body.project_type || body.service || body.subject || null,
      budget:   body.budget || null,
      timeline: body.timeline || body.start_time || null,
      location: body.location || body.city || body.zip || null,
      name:     name || '(no name)',
      phone:    body.phone || body.tel || null,
      email:    body.email || null,
      status:   'new',
      page:     body.page || body.referrer || null,
      notes:    body.message || body.notes || body.details || null,
    };

    const supaRes = await fetch(`${url}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(row),
    });

    if (!supaRes.ok) {
      const text = await supaRes.text();
      throw new Error(`Supabase ${supaRes.status}: ${text.slice(0, 300)}`);
    }

    const inserted = await supaRes.json();
    const id = Array.isArray(inserted) && inserted[0] ? inserted[0].id : null;
    res.status(200).send(JSON.stringify({ ok: true, id }));
  } catch (err) {
    res.status(200).send(JSON.stringify({
      ok: false,
      error: err.message || String(err),
    }));
  }
};

async function parseBody(req) {
  // Vercel already parses common bodies but not always urlencoded — handle both
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }

  const chunks = [];
  await new Promise((resolve, reject) => {
    req.on('data', (c) => chunks.push(c));
    req.on('end', resolve);
    req.on('error', reject);
  });
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};

  const ct = (req.headers['content-type'] || '').toLowerCase();
  if (ct.includes('application/json')) {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  if (ct.includes('application/x-www-form-urlencoded')) {
    const out = {};
    raw.split('&').forEach((pair) => {
      const [k, v = ''] = pair.split('=');
      out[decodeURIComponent(k.replace(/\+/g, ' '))] = decodeURIComponent(v.replace(/\+/g, ' '));
    });
    return out;
  }
  try { return JSON.parse(raw); } catch { return {}; }
}
