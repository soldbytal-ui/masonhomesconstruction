# Mason Homes Admin — Data Model (Supabase migration plan)

The prototype stores everything in browser `localStorage` under the key `mh_admin_db_v1`. Every field maps 1:1 to a Supabase Postgres table below. Swap the `mhDB` helpers in `/admin/assets/admin.js` for `supabase-js` calls to migrate.

## Tables

```sql
-- Leads captured from chat widget, contact form, phone log, referrals
create table leads (
  id uuid primary key default gen_random_uuid(),
  source text not null,           -- 'chat_widget' | 'form' | 'phone' | 'referral' | 'web'
  project text,                    -- kitchen | bathroom | whole_home | addition | custom | adu | flooring | countertops | other
  budget text,                     -- range enum from chat widget
  timeline text,                   -- 'This month' | 'Next 3 months' | 'Next 6 months' | 'Just researching'
  location text,
  name text not null,
  phone text,
  email text,
  status text not null default 'new',  -- new | contacted | qualified | estimate_sent | proposal_sent | won | lost
  page text,                       -- landing page URL
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on leads (status);
create index on leads (source);
create index on leads (created_at desc);

-- Projects (converted from leads or created manually)
create table projects (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete set null,
  client_name text not null,
  address text,
  service text,                    -- 'Kitchen Remodel' | 'ADU Construction' | etc.
  phase text not null default 'consultation', -- consultation | design | permitting | build | walkthrough | complete
  budget_planned numeric,
  budget_actual numeric default 0,
  start_date date,
  target_end_date date,
  actual_end_date date,
  status text not null default 'active', -- active | on-hold | complete | cancelled
  progress_pct integer default 0,
  notes text,
  created_at timestamptz not null default now()
);
create index on projects (status, phase);
create index on projects (lead_id);

-- Fixed-scope estimates with line items
create table estimates (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  lead_name text,                  -- denormalized for display
  project_type text,
  items jsonb not null default '[]',  -- [{ description, qty, unit, price, total }]
  subtotal numeric not null default 0,
  contingency_pct integer default 10,
  contingency numeric default 0,
  total numeric not null default 0,
  status text not null default 'draft', -- draft | sent | viewed | accepted | declined
  sent_at timestamptz,
  viewed_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
create index on estimates (status);
create index on estimates (project_id);

-- Invoices / draw schedule
create table invoices (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete set null,
  project_client text,             -- denormalized for display
  description text,
  amount numeric not null,
  status text not null default 'draft', -- draft | sent | paid | overdue | cancelled
  due_date date,
  sent_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index on invoices (status);
create index on invoices (project_id);

-- Team members
create table team (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,              -- owner | project_manager | lead_carpenter | designer | estimator | admin | field
  email text,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Tasks (punch list, follow-ups, milestones)
create table tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  project_client text,             -- denormalized for display
  assigned_to uuid references team(id) on delete set null,
  assignee text,                   -- denormalized name for display
  title text not null,
  description text,
  due_date date,
  status text not null default 'todo', -- todo | in_progress | done | blocked
  priority text not null default 'normal', -- low | normal | high | urgent
  created_at timestamptz not null default now()
);
create index on tasks (status, due_date);

-- Communications log (email, SMS, phone, meetings, chat)
create table communications (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  lead_name text,                  -- denormalized for display
  type text not null,              -- email | sms | phone | meeting | chat
  direction text not null,         -- inbound | outbound
  subject text,
  body text,
  created_at timestamptz not null default now()
);
create index on communications (lead_id);
create index on communications (project_id);

-- Company settings (single row)
create table settings (
  id integer primary key default 1,
  company_name text,
  display_name text,
  license text,
  phone text,
  email text,
  address text,
  hours text,
  contingency_default_pct integer default 10,
  trades_labor_rate_hr integer,
  updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);
```

## Row-Level Security (RLS) — recommended pattern

```sql
-- Enable RLS on all tables
alter table leads enable row level security;
alter table projects enable row level security;
alter table estimates enable row level security;
alter table invoices enable row level security;
alter table team enable row level security;
alter table tasks enable row level security;
alter table communications enable row level security;
alter table settings enable row level security;

-- Only authenticated Mason Homes users can read/write
create policy "mason_users_all_leads"
  on leads for all
  using (auth.role() = 'authenticated');
-- Repeat for each table.
```

## Migration path from prototype to Supabase

1. **Create Supabase project** — copy the SQL above into the SQL editor
2. **Set up Auth** — magic-link email auth is simplest; restrict to `@masonhomesfl.com` emails
3. **Replace localStorage calls** — the prototype uses `mhDB.get()` and `mhDB.save()`. Swap them for `supabase.from('leads').select()` etc.
4. **Wire the chat widget** — currently posts to Netlify Forms. Add a Supabase edge function that receives the form submission and inserts a row into `leads`
5. **Enable realtime** — Supabase supports realtime table subscriptions; the dashboard can update live as new leads come in

## Chat widget → lead capture wiring

The chat widget (`/assets/js/widgets.js`) currently posts to Netlify Forms with these fields:

```
project, budget, timeline, location, name, phone, email, source, page
```

To route these directly into Supabase:

```js
// In widgets.js submitChat():
await supabase.from('leads').insert({
  source: 'chat_widget',
  project: chatState.answers.project,
  budget: chatState.answers.budget,
  timeline: chatState.answers.timeline,
  location: chatState.answers.location,
  name: chatState.answers.name,
  phone: chatState.answers.phone,
  email: chatState.answers.email,
  page: window.location.pathname,
  status: 'new',
});
```

That single call replaces the Netlify Forms POST. Supabase realtime automatically pushes it into the admin dashboard the moment it's inserted.
