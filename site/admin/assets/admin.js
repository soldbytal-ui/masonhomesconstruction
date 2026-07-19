/* ================================================================
   MASON HOMES ADMIN — CRM Core JS
   Auth gate, localStorage data model, seed data, rendering helpers.
   Data model is Supabase-ready — see /admin/data-model.md
   ================================================================ */

(function(){
'use strict';

// ---------- AUTH (client-side prototype only, NOT secure) ----------
const AUTH_KEY = 'mh_admin_auth';
const AUTH_PASSWORD = 'mason2026'; // change in /admin/settings/ once persisted

function isAuthed(){
  const v = sessionStorage.getItem(AUTH_KEY);
  return v && (Date.now() - parseInt(v,10)) < 8 * 60 * 60 * 1000; // 8h session
}
function authenticate(pw){
  if(pw === (localStorage.getItem('mh_admin_password') || AUTH_PASSWORD)){
    sessionStorage.setItem(AUTH_KEY, String(Date.now()));
    return true;
  }
  return false;
}
function logout(){ sessionStorage.removeItem(AUTH_KEY); location.href = '/admin/'; }

window.mhAuth = { isAuthed, authenticate, logout };

// ---------- DATA MODEL (localStorage; mirrors Supabase schema) ----------
const DB_KEY = 'mh_admin_db_v1';
const SCHEMAS = ['leads','projects','estimates','invoices','team','tasks','communications','settings'];

function loadDB(){
  try { return JSON.parse(localStorage.getItem(DB_KEY)) || null; } catch(e) { return null; }
}
function saveDB(db){ localStorage.setItem(DB_KEY, JSON.stringify(db)); }
function uid(){ return 'id_' + Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4); }
function nowISO(){ return new Date().toISOString(); }

function seedIfEmpty(){
  const existing = loadDB();
  if(existing && existing.leads && existing.leads.length) return existing;

  const daysAgo = (n) => new Date(Date.now() - n*24*3600*1000).toISOString();
  const hoursAgo = (h) => new Date(Date.now() - h*3600*1000).toISOString();

  const db = {
    leads: [
      { id: uid(), source:'chat_widget', project:'Kitchen', budget:'$50K – $100K', timeline:'Next 3 months', location:'South Tampa', name:'Elena Vasquez', phone:'(813) 555-2481', email:'elena.v@example.com', status:'qualified', notes:'Hyde Park bungalow, existing walls. Interested in waterfall island + custom cabs.', page:'/services/kitchen-remodeling/', created_at:hoursAgo(3), updated_at:hoursAgo(3) },
      { id: uid(), source:'chat_widget', project:'Bathroom', budget:'$25K – $50K', timeline:'This month', location:'Carrollwood', name:'Marcus Chen', phone:'(813) 555-8712', email:'marcus.chen@example.com', status:'estimate_sent', notes:'Master bath gut. Wants walk-in shower + double vanity.', page:'/services/bathroom-remodeling/', created_at:daysAgo(2), updated_at:daysAgo(1) },
      { id: uid(), source:'form', project:'Whole Home', budget:'$250K+', timeline:'Next 6 months', location:'Wesley Chapel', name:'Priya Iyer', phone:'(813) 555-4416', email:'p.iyer@example.com', status:'proposal_sent', notes:'2,800 sqft ranch — full gut. Design phase.', page:'/free-estimate/', created_at:daysAgo(6), updated_at:daysAgo(1) },
      { id: uid(), source:'chat_widget', project:'Addition', budget:'$100K – $250K', timeline:'Next 3 months', location:'Brandon', name:'Sofia Kowalski', phone:'(813) 555-9932', email:'sofia.k@example.com', status:'contacted', notes:'400sqft addition — bedroom + bath. FishHawk area.', page:'/services/home-additions/', created_at:daysAgo(4), updated_at:daysAgo(3) },
      { id: uid(), source:'form', project:'Custom Build', budget:'$250K+', timeline:'Just researching', location:'Odessa', name:'Rohan Bhatt', phone:'(813) 555-1147', email:'r.bhatt@example.com', status:'new', notes:'2.5 acre lot in Keystone. Wants a 4,500sqft custom.', page:'/free-estimate/', created_at:hoursAgo(18), updated_at:hoursAgo(18) },
      { id: uid(), source:'referral', project:'ADU', budget:'$100K – $250K', timeline:'Next 6 months', location:'St. Petersburg', name:'Jordan Whitfield', phone:'(727) 555-6203', email:'jordan.w@example.com', status:'won', notes:'Detached ADU for aging parent. Snell Isle.', page:'/services/adu-accessory-dwelling-units/', created_at:daysAgo(28), updated_at:daysAgo(14) },
      { id: uid(), source:'chat_widget', project:'Kitchen', budget:'$25K – $50K', timeline:'Next 3 months', location:'Clearwater', name:'Maya Fitzgerald', phone:'(727) 555-3341', email:'maya.f@example.com', status:'new', notes:'Countryside townhome. Cosmetic refresh.', page:'/', created_at:hoursAgo(1), updated_at:hoursAgo(1) },
      { id: uid(), source:'form', project:'Whole Home', budget:'$100K – $250K', timeline:'Next 3 months', location:'Riverview', name:'Aiden Boateng', phone:'(813) 555-7724', email:'aiden.b@example.com', status:'lost', notes:'Chose a different GC — timing conflict.', page:'/locations/riverview/', created_at:daysAgo(45), updated_at:daysAgo(21) },
    ],
    projects: [
      { id: uid(), client_name:'Jordan Whitfield', address:'2418 Snell Isle Blvd NE, St. Petersburg', service:'ADU Construction', phase:'build', budget_planned:185000, budget_actual:142300, start_date:daysAgo(60), target_end_date:daysAgo(-45), status:'active', progress_pct:68, notes:'Detached 620sqft ADU. Foundation and CBS complete. Framing next week.', created_at:daysAgo(60) },
      { id: uid(), client_name:'Wilson Family', address:'820 Bayshore Blvd, Tampa', service:'Whole Home Renovation', phase:'design', budget_planned:420000, budget_actual:12500, start_date:daysAgo(14), target_end_date:daysAgo(-180), status:'active', progress_pct:12, notes:'Historic Hyde Park bungalow. Currently in design + selections.', created_at:daysAgo(14) },
      { id: uid(), client_name:'Kaminski Household', address:'1204 Countryside Blvd, Clearwater', service:'Kitchen Remodel', phase:'permitting', budget_planned:78500, budget_actual:8200, start_date:daysAgo(30), target_end_date:daysAgo(-60), status:'active', progress_pct:28, notes:'Permit review with City of Clearwater. Expected approval next week.', created_at:daysAgo(30) },
      { id: uid(), client_name:'Ramirez, T.', address:'5540 Estuary Dr, Wesley Chapel', service:'Master Bath Remodel', phase:'walkthrough', budget_planned:52000, budget_actual:51100, start_date:daysAgo(90), target_end_date:daysAgo(-3), status:'active', progress_pct:96, notes:'Final punch list. Walkthrough scheduled Thursday.', created_at:daysAgo(90) },
      { id: uid(), client_name:'Delgado, R.', address:'815 Palma Ceia Ave, Tampa', service:'Kitchen + Great Room', phase:'consultation', budget_planned:0, budget_actual:0, start_date:null, target_end_date:null, status:'on-hold', progress_pct:0, notes:'Consulted 3/12. Waiting on client architect selection.', created_at:daysAgo(35) },
      { id: uid(), client_name:'Nguyen, K.', address:'2201 Alafia River Dr, Riverview', service:'Screened Deck Addition', phase:'complete', budget_planned:48000, budget_actual:46200, start_date:daysAgo(180), target_end_date:daysAgo(120), actual_end_date:daysAgo(112), status:'complete', progress_pct:100, notes:'Delivered under budget + on time. Client referred a neighbor.', created_at:daysAgo(180) },
    ],
    estimates: [
      { id: uid(), lead_name:'Marcus Chen', project_type:'Bathroom Remodel', items:[
        { description:'Demolition + haul-off', qty:1, unit:'lot', price:2400, total:2400 },
        { description:'Plumbing rough-in (drain relocation)', qty:1, unit:'lot', price:4800, total:4800 },
        { description:'Electrical (GFCI, sconces, fan)', qty:1, unit:'lot', price:2200, total:2200 },
        { description:'Tile floor + shower surround', qty:120, unit:'sqft', price:22, total:2640 },
        { description:'Frameless glass shower enclosure', qty:1, unit:'unit', price:2800, total:2800 },
        { description:'Vanity + quartz top (double)', qty:1, unit:'unit', price:4200, total:4200 },
        { description:'Fixtures + trim (Kohler)', qty:1, unit:'lot', price:3400, total:3400 },
        { description:'Labor (framing, drywall, paint, finish)', qty:1, unit:'lot', price:12500, total:12500 },
        { description:'Permit fee', qty:1, unit:'lot', price:450, total:450 },
        { description:'Contingency (10%)', qty:1, unit:'lot', price:3540, total:3540 },
      ], subtotal:35390, contingency:3540, total:38930, status:'sent', sent_at:daysAgo(1), created_at:daysAgo(2) },
      { id: uid(), lead_name:'Priya Iyer', project_type:'Whole Home Renovation', items:[
        { description:'Design services + drawings', qty:1, unit:'lot', price:14000, total:14000 },
        { description:'Demo + haul-off (whole home)', qty:1, unit:'lot', price:18500, total:18500 },
        { description:'Structural (2x load-bearing removal + LVL beams)', qty:2, unit:'unit', price:9800, total:19600 },
        { description:'MEP rough-in (whole home)', qty:1, unit:'lot', price:48000, total:48000 },
        { description:'Insulation + drywall + paint', qty:2800, unit:'sqft', price:9, total:25200 },
        { description:'LVP flooring throughout', qty:2400, unit:'sqft', price:8, total:19200 },
        { description:'Kitchen (cabinets, quartz, appliances)', qty:1, unit:'lot', price:62000, total:62000 },
        { description:'Baths (3 full)', qty:3, unit:'unit', price:24000, total:72000 },
        { description:'Trim, doors, hardware', qty:1, unit:'lot', price:14500, total:14500 },
        { description:'Labor + PM', qty:1, unit:'lot', price:52000, total:52000 },
        { description:'Permits', qty:1, unit:'lot', price:2400, total:2400 },
        { description:'Contingency (12%)', qty:1, unit:'lot', price:41208, total:41208 },
      ], subtotal:347400, contingency:41208, total:388608, status:'draft', created_at:daysAgo(5) },
    ],
    invoices: [
      { id: uid(), project_client:'Jordan Whitfield', description:'Draw #4 — Foundation complete', amount:37000, status:'paid', due_date:daysAgo(20), paid_at:daysAgo(18) },
      { id: uid(), project_client:'Kaminski Household', description:'Draw #1 — Design + permits', amount:8200, status:'paid', due_date:daysAgo(15), paid_at:daysAgo(12) },
      { id: uid(), project_client:'Ramirez, T.', description:'Final draw — Punch list', amount:5100, status:'sent', due_date:daysAgo(-7), paid_at:null },
      { id: uid(), project_client:'Wilson Family', description:'Draw #1 — Design retainer', amount:12500, status:'paid', due_date:daysAgo(10), paid_at:daysAgo(9) },
      { id: uid(), project_client:'Jordan Whitfield', description:'Draw #5 — CBS + slab', amount:32000, status:'sent', due_date:daysAgo(-3), paid_at:null },
    ],
    team: [
      { id: uid(), name:'Founder / Owner', role:'owner', email:'info@masonhomesfl.com', phone:'(813) 999-5910', active:true },
      { id: uid(), name:'Lead Project Manager', role:'project_manager', email:'pm1@masonhomesfl.com', phone:'(813) 555-2200', active:true },
      { id: uid(), name:'Lead Carpenter', role:'lead_carpenter', email:'', phone:'(813) 555-3100', active:true },
      { id: uid(), name:'Estimator', role:'estimator', email:'', phone:'(813) 555-4400', active:true },
      { id: uid(), name:'Office Admin', role:'admin', email:'admin@masonhomesfl.com', phone:'(813) 999-5910', active:true },
    ],
    tasks: [
      { id: uid(), project_client:'Ramirez, T.', title:'Final punch walkthrough', due_date:daysAgo(-2), status:'todo', priority:'high', assignee:'Lead Project Manager' },
      { id: uid(), project_client:'Kaminski Household', title:'Follow up on Clearwater permit review', due_date:daysAgo(-3), status:'in_progress', priority:'high', assignee:'Office Admin' },
      { id: uid(), project_client:'Jordan Whitfield', title:'Schedule CBS inspection', due_date:daysAgo(-1), status:'todo', priority:'high', assignee:'Lead Project Manager' },
      { id: uid(), project_client:'Wilson Family', title:'Send finish selection binder', due_date:daysAgo(-5), status:'todo', priority:'normal', assignee:'Estimator' },
      { id: uid(), project_client:'Marcus Chen', title:'Send estimate reminder + follow-up', due_date:daysAgo(-1), status:'todo', priority:'normal', assignee:'Office Admin' },
      { id: uid(), project_client:'Priya Iyer', title:'Design review meeting', due_date:daysAgo(-4), status:'todo', priority:'normal', assignee:'Founder / Owner' },
    ],
    communications: [
      { id: uid(), lead_name:'Marcus Chen', type:'chat', direction:'inbound', subject:'Website chat', body:'Started chat via widget. Completed intake — bath remodel, $25-50K, this month.', created_at:daysAgo(2) },
      { id: uid(), lead_name:'Marcus Chen', type:'email', direction:'outbound', subject:'Estimate — Bathroom Remodel', body:'Sent line-item estimate ($38,930). Attached 2 project references.', created_at:daysAgo(1) },
      { id: uid(), lead_name:'Priya Iyer', type:'phone', direction:'inbound', subject:'Design phase check-in', body:'Discussed cabinet selections. Client leaning toward matte white shaker.', created_at:daysAgo(2) },
      { id: uid(), lead_name:'Jordan Whitfield', type:'email', direction:'outbound', subject:'Draw #5 invoice', body:'Sent invoice for CBS + slab pour. $32,000 due in 15 days.', created_at:daysAgo(3) },
    ],
    settings: {
      company_name:'Mason Homes Inc',
      display_name:'Mason Homes',
      license:'CGC062538',
      phone:'(813) 999-5910',
      email:'info@masonhomesfl.com',
      address:'5816 Little River Dr, Tampa, FL 33615',
      hours:'Mon – Sat · 8a – 6p',
      contingency_default_pct:10,
      trades_labor_rate_hr:52,
      admin_password_hint:'mason2026',
    },
  };

  saveDB(db);
  return db;
}

let db;
function getDB(){ db = db || loadDB() || seedIfEmpty(); return db; }
function resetDB(){ localStorage.removeItem(DB_KEY); db = null; return seedIfEmpty(); }

window.mhDB = { get: getDB, save: saveDB, reset: resetDB, uid, nowISO };

// ---------- FORMATTING HELPERS ----------
function fmtMoney(n){
  if(n == null) return '—';
  const abs = Math.abs(n);
  if(abs >= 1000000) return '$' + (n/1000000).toFixed(1) + 'M';
  if(abs >= 1000) return '$' + Math.round(n/1000) + 'K';
  return '$' + n.toLocaleString();
}
function fmtMoneyFull(n){
  if(n == null) return '—';
  return '$' + n.toLocaleString(undefined, { minimumFractionDigits:0, maximumFractionDigits:0 });
}
function fmtDate(d){
  if(!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}
function fmtDateShort(d){
  if(!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-US', { month:'short', day:'numeric' });
}
function fmtRelative(d){
  if(!d) return '—';
  const dt = new Date(d);
  const diff = Date.now() - dt.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if(mins < 60) return mins < 1 ? 'just now' : mins + 'm ago';
  if(hrs < 24) return hrs + 'h ago';
  if(days < 30) return days + 'd ago';
  return fmtDateShort(d);
}
function initials(name){
  return (name||'').split(/\s+/).slice(0,2).map(s=>s[0]||'').join('').toUpperCase() || '?';
}

window.mhFmt = { money:fmtMoney, moneyFull:fmtMoneyFull, date:fmtDate, dateShort:fmtDateShort, relative:fmtRelative, initials };

// ---------- LOGIN + BOOT ----------
function renderLogin(){
  document.body.className = 'login-body';
  document.body.innerHTML = ''
    + '<div class="login-screen">'
    +   '<form class="login-card" id="login-form">'
    +     '<div class="logo">MASON <span class="amp">&amp;</span> HOMES</div>'
    +     '<div class="eyebrow">Admin · CRM</div>'
    +     '<h1>Welcome <em>back</em>.</h1>'
    +     '<label for="pw">Passcode</label>'
    +     '<input type="password" id="pw" autocomplete="current-password" required autofocus/>'
    +     '<div class="error" id="err" style="display:none">Incorrect passcode. Try again.</div>'
    +     '<button type="submit" class="btn-primary"><span>Enter Dashboard</span></button>'
    +     '<div class="hint">Prototype build · Passcode: <code>mason2026</code></div>'
    +   '</form>'
    + '</div>';
  document.getElementById('login-form').addEventListener('submit', function(e){
    e.preventDefault();
    const pw = document.getElementById('pw').value;
    if(authenticate(pw)){
      location.reload();
    } else {
      document.getElementById('err').style.display = 'block';
      document.getElementById('pw').value = '';
      document.getElementById('pw').focus();
    }
  });
}

// ---------- LAYOUT (sidebar + topbar) ----------
function currentPath(){
  const p = location.pathname.replace(/^\/admin\//, '').replace(/\/$/, '');
  if(!p || p === 'index.html') return 'dashboard';
  return p.split('/')[0];
}

function svgIcon(name){
  const icons = {
    dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>',
    leads: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    projects: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
    estimates: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>',
    schedule: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    tasks: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    invoices: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    team: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    reports: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
    external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  };
  return icons[name] || '';
}

function renderSidebar(active, badges){
  badges = badges || {};
  const items = [
    { section:'Command Center' },
    { key:'dashboard', href:'/admin/', icon:'dashboard', label:'Dashboard' },
    { key:'leads', href:'/admin/leads/', icon:'leads', label:'Leads', badge:badges.leads },
    { section:'Delivery' },
    { key:'projects', href:'/admin/projects/', icon:'projects', label:'Projects' },
    { key:'tasks', href:'/admin/tasks/', icon:'tasks', label:'Tasks', badge:badges.tasks },
    { key:'schedule', href:'/admin/schedule/', icon:'schedule', label:'Schedule' },
    { section:'Financials' },
    { key:'estimates', href:'/admin/estimates/', icon:'estimates', label:'Estimates' },
    { key:'invoices', href:'/admin/invoices/', icon:'invoices', label:'Invoices' },
    { section:'Company' },
    { key:'team', href:'/admin/team/', icon:'team', label:'Team' },
    { key:'reports', href:'/admin/reports/', icon:'reports', label:'Reports' },
    { key:'settings', href:'/admin/settings/', icon:'settings', label:'Settings' },
  ];
  const cfg = getDB().settings;
  const nav = items.map(i => {
    if(i.section) return '<div class="nav-section">' + i.section + '</div>';
    const active_cls = i.key === active ? ' active' : '';
    const b = i.badge ? '<span class="badge">' + i.badge + '</span>' : '';
    return '<a href="' + i.href + '" class="nav-link' + active_cls + '"><span class="icon">' + svgIcon(i.icon) + '</span>' + i.label + b + '</a>';
  }).join('');
  return ''
    + '<aside class="sidebar">'
    +   '<div class="brand">'
    +     '<a href="/admin/"><div><div class="logo">MASON <span class="amp">&amp;</span> HOMES</div><span class="tag">Admin · CRM</span></div></a>'
    +   '</div>'
    +   '<nav>' + nav + '</nav>'
    +   '<div class="user-block">'
    +     '<div class="user"><div class="avatar">M</div><div><div class="name">' + cfg.company_name + '</div><div class="role">Owner</div></div></div>'
    +     '<div class="actions">'
    +       '<a href="/" title="Back to site">' + svgIcon('external') + ' Site</a>'
    +       '<a href="#" id="logout-link">' + svgIcon('logout') + ' Logout</a>'
    +     '</div>'
    +   '</div>'
    + '</aside>';
}

function renderTopbar(title, actionsHTML){
  return ''
    + '<div class="topbar">'
    +   '<div class="page-title">' + title + '</div>'
    +   '<div class="search"><span class="icon">' + svgIcon('search') + '</span><input type="search" placeholder="Search leads, projects, clients..."/></div>'
    +   '<div class="topbar-actions">' + (actionsHTML||'')
    +     '<button class="icon-btn" title="Notifications">' + svgIcon('bell') + '<span class="dot"></span></button>'
    +   '</div>'
    + '</div>';
}

function renderLayout(pageKey, title, actions){
  const db = getDB();
  const badges = { leads: db.leads.filter(l => l.status === 'new').length || null, tasks: db.tasks.filter(t => t.status === 'todo').length || null };
  return renderSidebar(pageKey, badges) + '<main class="main">' + renderTopbar(title, actions) + '<div class="content" id="content"></div></main>';
}

// ---------- BOOT ----------
window.mhBoot = function(pageKey, title, mount){
  if(!isAuthed()){ renderLogin(); return; }
  document.body.innerHTML = '<div class="admin">' + renderLayout(pageKey, title) + '</div>';
  document.getElementById('logout-link').addEventListener('click', function(e){ e.preventDefault(); logout(); });
  mount(document.getElementById('content'));
};

// ---------- CHART primitives (pure SVG, no dependencies) ----------
function bars(data, opts){
  opts = opts || {};
  const w = opts.width || 640, h = opts.height || 240;
  const pad = { t:20, r:20, b:36, l:44 };
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const max = Math.max.apply(null, data.map(d => d.value)) || 1;
  const bw = iw / data.length * 0.68;
  const gap = iw / data.length * 0.32;
  const barW = iw / data.length - gap;
  const bars = data.map((d,i) => {
    const x = pad.l + i * (barW + gap) + gap/2;
    const bh = (d.value/max) * ih;
    const y = pad.t + ih - bh;
    return ''
      + '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + barW.toFixed(1) + '" height="' + bh.toFixed(1) + '" fill="#c8623c" rx="1"><title>' + d.label + ': ' + d.value + '</title></rect>'
      + '<text x="' + (x + barW/2).toFixed(1) + '" y="' + (pad.t + ih + 20).toFixed(1) + '" text-anchor="middle" class="label">' + d.label + '</text>';
  }).join('');
  // Y gridlines
  const grid = [0.25, 0.5, 0.75, 1].map(f => {
    const y = pad.t + ih * (1 - f);
    return ''
      + '<line x1="' + pad.l + '" y1="' + y + '" x2="' + (pad.l+iw) + '" y2="' + y + '" class="gridline"/>'
      + '<text x="' + (pad.l - 8) + '" y="' + (y+3) + '" text-anchor="end" class="label">' + Math.round(max*f).toLocaleString() + '</text>';
  }).join('');
  return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none">' + grid + bars + '</svg>';
}

function sparkline(values, opts){
  opts = opts || {};
  const w = opts.width || 160, h = opts.height || 36;
  const min = Math.min.apply(null, values), max = Math.max.apply(null, values);
  const range = max - min || 1;
  const step = w / (values.length - 1 || 1);
  let d = 'M ';
  values.forEach((v,i) => {
    const x = i * step;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    d += (i === 0 ? '' : 'L ') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
  });
  // area under curve
  const last = (values.length - 1) * step;
  const area = d + 'L ' + last.toFixed(1) + ' ' + h + ' L 0 ' + h + ' Z';
  return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" class="sparkline"><path d="' + area + '" fill="#c8623c" opacity=".14"/><path d="' + d + '" fill="none" stroke="#c8623c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

function donut(segments, opts){
  opts = opts || {};
  const size = opts.size || 180, r = size/2 - 12, cx = size/2, cy = size/2, sw = 24;
  const total = segments.reduce((s,x) => s + x.value, 0) || 1;
  let cum = 0;
  const arcs = segments.map(seg => {
    const frac = seg.value / total;
    const startA = cum * 2 * Math.PI - Math.PI/2;
    cum += frac;
    const endA = cum * 2 * Math.PI - Math.PI/2;
    const x1 = cx + r * Math.cos(startA), y1 = cy + r * Math.sin(startA);
    const x2 = cx + r * Math.cos(endA), y2 = cy + r * Math.sin(endA);
    const largeArc = frac > 0.5 ? 1 : 0;
    return '<path d="M ' + x1 + ' ' + y1 + ' A ' + r + ' ' + r + ' 0 ' + largeArc + ' 1 ' + x2 + ' ' + y2 + '" stroke="' + seg.color + '" stroke-width="' + sw + '" fill="none" stroke-linecap="butt"><title>' + seg.label + ': ' + seg.value + '</title></path>';
  }).join('');
  return '<svg viewBox="0 0 ' + size + ' ' + size + '" style="width:' + size + 'px;height:' + size + 'px">' + arcs + '<text x="' + cx + '" y="' + (cy-4) + '" text-anchor="middle" class="value-label" style="font-family:Cormorant Garamond,serif;font-size:26px;font-weight:300;fill:#1a1814">' + total + '</text><text x="' + cx + '" y="' + (cy+16) + '" text-anchor="middle" class="label">Total</text></svg>';
}

window.mhCharts = { bars, sparkline, donut };
window.mhIcon = svgIcon;

// Global search — simple filter across leads/projects
document.addEventListener('input', function(e){
  if(e.target.matches('.topbar .search input')){
    const q = e.target.value.trim().toLowerCase();
    document.querySelectorAll('.data-table tbody tr').forEach(function(row){
      if(!q){ row.style.display = ''; return; }
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  }
});

// Drawer (lead/project detail)
window.mhDrawer = {
  open: function(html){
    let d = document.getElementById('mh-drawer');
    if(!d){
      d = document.createElement('div');
      d.className = 'modal-backdrop';
      d.id = 'mh-drawer';
      document.body.appendChild(d);
      d.addEventListener('click', function(e){
        if(e.target === d) window.mhDrawer.close();
      });
      document.addEventListener('keydown', function(e){
        if(e.key === 'Escape') window.mhDrawer.close();
      });
    }
    d.innerHTML = '<div class="drawer">' + html + '</div>';
    setTimeout(function(){ d.classList.add('open'); }, 20);
    const closeBtn = d.querySelector('.drawer-close');
    if(closeBtn) closeBtn.addEventListener('click', window.mhDrawer.close);
  },
  close: function(){
    const d = document.getElementById('mh-drawer');
    if(d) d.classList.remove('open');
  }
};

})();
