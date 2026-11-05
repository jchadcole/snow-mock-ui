'use strict';
// Mock ServiceNow-style CSM workspace for a state tax agency, for Genesys Cloud screen-pop demos.
// Zero dependencies: node server.js  (Node 18+)

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { seed } = require('./lib/seed');
const { getBrand, listBrands } = require('./lib/brands');
const { scenarios } = require('./lib/scenarios');

const PORT = Number(process.env.PORT || 8080);
const API_KEY = process.env.API_KEY || '';
const FRAME_ANCESTORS = (process.env.FRAME_ANCESTORS || '').trim().replace(/^"(.*)"$/, '$1').trim() || '*';
const PUBLIC_URL = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
const GENESYS = { region: process.env.GENESYS_REGION || 'mypurecloud.com', clientId: process.env.GENESYS_CLIENT_ID || '', clientSecret: process.env.GENESYS_CLIENT_SECRET || '' };
const PUBLIC_DIR = path.join(__dirname, 'public');
let brandId = process.env.BRAND || 'ohiotax';

// DEMO_PHONES adds a real caller ID (e.g. the presenter's mobile) to a demo taxpayer. Comma-separated, either form:
//   6145551234=tp-1001          (your number = taxpayer ID)
//   6145550184:+16145551234     (seeded demo number : your number)
function freshDb() {
  const brand = getBrand(brandId);
  const d = seed(brand, new Date());
  for (const pair of (process.env.DEMO_PHONES || '').split(',').map((x) => x.trim()).filter(Boolean)) {
    let num, t;
    if (pair.includes('=')) { const [n, tid] = pair.split('=').map((x) => x.trim()); num = n; t = d.taxpayers.find((x) => x.id === tid); }
    else { const [seeded, n] = pair.split(':').map((x) => x.trim()); num = n; const k = String(seeded || '').replace(/\D/g, '').slice(-10); t = k && d.taxpayers.find((x) => x.phones.some((p) => p.number.replace(/\D/g, '').endsWith(k))); }
    if (t && num) { t.phones.forEach((x) => { x.primary = false; }); t.phones.unshift({ type: 'Mobile (demo)', number: fmtPhone(num), primary: true }); }
  }
  d.botSessions = [];
  return d;
}
const tz = () => (db && db.brand.timeZone) || 'America/New_York';
const todayInTz = () => new Intl.DateTimeFormat('en-CA', { timeZone: tz(), year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
function ensureFresh() { if (process.env.RESET_DAILY !== 'false' && db.seededOn !== todayInTz()) db = freshDb(); }

// ---------- helpers ----------
const digits = (s) => String(s || '').replace(/\D/g, '');
const phoneKey = (s) => { const d = digits(s); return d.length >= 10 ? d.slice(-10) : d; };
const fmtPhone = (s) => { const d = phoneKey(s); return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : s; };
let db = null; db = freshDb();
const nowLocal = () => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz(), year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  const g = (t) => parts.find((p) => p.type === t).value;
  return `${g('year')}-${g('month')}-${g('day')}T${g('hour')}:${g('minute')}:${g('second')}`;
};
const addDays = (ymd, n) => { const d = new Date(ymd + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
let idSeq = 9000;
const newId = (p) => `${p}-${++idSeq}`;
const round2 = (n) => Math.round(n * 100) / 100;

function send(res, status, body, headers = {}) {
  const isStr = typeof body === 'string' || Buffer.isBuffer(body);
  res.writeHead(status, { 'Content-Type': isStr ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8', ...corsHeaders(), ...headers });
  res.end(isStr ? body : JSON.stringify(body, null, 2));
}
function corsHeaders() { return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key', 'Cache-Control': 'no-store' }; }
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 1e6) req.destroy(); });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        if ((req.headers['content-type'] || '').includes('application/x-www-form-urlencoded')) return resolve(Object.fromEntries(new URLSearchParams(data)));
        resolve(JSON.parse(data));
      } catch (e) { reject(Object.assign(new Error('Invalid JSON body'), { status: 400 })); }
    });
  });
}
function authorized(req, url) {
  if (!API_KEY) return true;
  // The workspace's own Genesys simulator page calls the API from the same origin; allow it without the key.
  if (req.headers['sec-fetch-site'] === 'same-origin') return true;
  const h = req.headers.authorization || '';
  if (h === `Bearer ${API_KEY}`) return true;
  if (h.startsWith('Basic ')) { const [, pass] = Buffer.from(h.slice(6), 'base64').toString().split(':'); if (pass === API_KEY) return true; }
  return req.headers['x-api-key'] === API_KEY || url.searchParams.get('apiKey') === API_KEY;
}
function baseUrl(req) {
  if (PUBLIC_URL) return PUBLIC_URL;
  const proto = (req.headers['x-forwarded-proto'] || 'http').split(',')[0];
  return `${proto}://${req.headers['x-forwarded-host'] || req.headers.host}`;
}
const bad = (msg) => Object.assign(new Error(msg), { status: 400 });
const nf = () => Object.assign(new Error('Not found'), { status: 404 });
class Created { constructor(body) { this.body = body; } }
const created = (body) => new Created(body);

// ---------- domain ----------
const getTp = (id) => db.taxpayers.find((t) => t.id === id);
const nameOf = (t) => t.type === 'Business' ? t.businessName : `${t.firstName} ${t.lastName}`;
const balanceOf = (t) => round2(t.assessments.reduce((a, x) => a + x.balance, 0));
const openCases = (t) => db.cases.filter((c) => c.taxpayerId === t.id && !['Resolved', 'Closed', 'Cancelled'].includes(c.state));
function refundSummary(t) {
  const r = t.returns.filter((x) => x.refund).sort((a, b) => b.taxYear - a.taxYear)[0];
  return r ? { returnId: r.id, taxYear: r.taxYear, amount: r.refund.amount, status: r.refund.status, method: r.refund.method, hold: r.refund.hold || '', filed: r.filed || '', returnStatus: r.status, documentationStatus: r.documentation?.status || '' } : null;
}
function summary(t) {
  const rf = refundSummary(t); const oc = openCases(t);
  return {
    id: t.id, type: t.type, fullName: nameOf(t), firstName: t.firstName, lastName: t.lastName, businessName: t.businessName || '', tin: t.tin, dob: t.dob || '',
    phone: (t.phones.find((x) => x.primary) || t.phones[0] || {}).number || '', phones: t.phones, email: t.email, city: t.address?.city || '', language: t.language,
    flags: t.flags, balance: balanceOf(t), refund: rf, identity: t.identity.status, openCases: oc.length, openCaseNumber: oc[0]?.number || '', representative: t.representative?.name || '',
  };
}
function fullRecord(t) {
  const { demoSsn, ...rest } = t;
  return { ...rest, botSessions: db.botSessions.filter((x) => x.taxpayerId === t.id), fullName: nameOf(t), balance: balanceOf(t), refundSummary: refundSummary(t), cases: db.cases.filter((c) => c.taxpayerId === t.id).sort((a, b) => b.opened.localeCompare(a.opened)), interactions: db.interactions.filter((i) => i.taxpayerId === t.id) };
}
function search(p) {
  const q = (p.q || '').trim().toLowerCase();
  const phone = phoneKey(p.phone || p.ani || '');
  const tin = digits(p.tin || p.ssn || p.last4 || '');
  const last = (p.lastName || '').trim().toLowerCase();
  const dob = (p.dob || '').trim();
  const acct = (p.accountNumber || p.account || '').trim().toLowerCase();
  const rid = (p.returnId || '').trim().toLowerCase();
  if (p.all) return db.taxpayers;
  if (!q && !phone && !tin && !last && !dob && !acct && !rid) return [];
  return db.taxpayers.filter((t) => {
    if (phone && !(phone.length >= 7 && t.phones.some((x) => phoneKey(x.number).endsWith(phone)))) return false;
    if (tin && !digits(t.tin).endsWith(tin.slice(-4))) return false;
    if (tin.length === 9 && t.demoSsn && t.demoSsn !== tin) return false;
    if (last && !(t.lastName || '').toLowerCase().startsWith(last) && !(t.businessName || '').toLowerCase().startsWith(last)) return false;
    if (dob && t.dob !== dob) return false;
    if (acct && !t.accounts.some((a) => a.number.toLowerCase() === acct)) return false;
    if (rid && !t.returns.some((r) => r.id.toLowerCase() === rid)) return false;
    if (q) {
      const qd = digits(q);
      const hay = [nameOf(t), t.dba, `${t.lastName}, ${t.firstName}`, t.email, t.tin, t.id, ...t.returns.map((r) => r.id), ...t.accounts.map((a) => a.number), ...t.notices.map((n) => n.id), ...db.cases.filter((c) => c.taxpayerId === t.id).map((c) => c.number)].join(' | ').toLowerCase();
      const phoneHit = qd.length >= 4 && t.phones.some((x) => phoneKey(x.number).includes(qd));
      if (!hay.includes(q) && !phoneHit) return false;
    }
    return true;
  });
}
function lookupResult(matches, req, extra = {}) {
  const one = matches.length === 1 ? matches[0] : null; const s = one ? summary(one) : null;
  const qs = new URLSearchParams({ ...(one ? { taxpayerId: one.id } : extra.phone ? { phone: extra.phone } : {}), ...(extra.conversationId ? { conversationId: extra.conversationId } : {}) });
  return {
    found: matches.length > 0, count: matches.length, taxpayerId: one?.id || '', fullName: s?.fullName || '', firstName: one?.firstName || '', language: one?.language || '',
    identityStatus: s?.identity || '', refundStatus: s?.refund?.status || '', refundAmount: s?.refund?.amount ?? 0, refundHold: s?.refund?.hold || '', balanceDue: s?.balance ?? 0,
    openCaseNumber: s?.openCaseNumber || '', representative: s?.representative || '',
    refundMethod: s?.refund?.method || '', refundTaxYear: s?.refund?.taxYear ?? 0, returnReceived: s?.refund?.filed || '', returnStatus: s?.refund?.returnStatus || '', documentationStatus: s?.refund?.documentationStatus || '',
    openNoticeId: one ? (one.notices.find((n) => n.amount && !/paid|resolved/i.test(n.status))?.id || '') : '', unappliedPayments: one ? one.unapplied.filter((u) => /unapplied/i.test(u.status)).length : 0,
    popUrl: `${baseUrl(req)}/pop?${qs}`, matches: matches.map(summary),
  };
}
function activity(t, a) { const x = { id: newId('act'), date: nowLocal(), direction: 'Inbound', ...a }; t.activities.unshift(x); return x; }
function setFlag(t, flag, on) { t.flags = t.flags.filter((f) => f !== flag); if (on) t.flags.push(flag); }

// ---------- screen pop (SSE push) ----------
const sseClients = new Set();
function pushScreenPop(pop) {
  db.screenpops.unshift(pop); db.screenpops = db.screenpops.slice(0, 50);
  let delivered = 0;
  for (const c of sseClients) { const target = (pop.agent || '*').toLowerCase(); if (target === '*' || target === c.agent || target === c.userId) { c.res.write(`event: screenpop\ndata: ${JSON.stringify(pop)}\n\n`); delivered++; } }
  return delivered;
}
setInterval(() => { for (const c of sseClients) c.res.write(': keepalive\n\n'); }, 25000).unref();

// ---------- Genesys Cloud (optional, client credentials) ----------
let gcToken = { value: '', exp: 0 };
async function genesysToken() {
  if (gcToken.value && Date.now() < gcToken.exp - 60000) return gcToken.value;
  const r = await fetch(`https://login.${GENESYS.region}/oauth/token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${Buffer.from(`${GENESYS.clientId}:${GENESYS.clientSecret}`).toString('base64')}` }, body: 'grant_type=client_credentials' });
  if (!r.ok) throw Object.assign(new Error(`Genesys OAuth failed: ${r.status}`), { status: 502 });
  const j = await r.json(); gcToken = { value: j.access_token, exp: Date.now() + j.expires_in * 1000 }; return gcToken.value;
}
async function genesysConversation(id) {
  const token = await genesysToken();
  const r = await fetch(`https://api.${GENESYS.region}/api/v2/conversations/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw Object.assign(new Error(`Genesys conversation lookup failed: ${r.status}`), { status: r.status === 404 ? 404 : 502 });
  const c = await r.json();
  const cust = (c.participants || []).find((p) => ['customer', 'external'].includes(p.purpose)) || {};
  const addr = cust.ani || cust.address || (cust.calls?.[0]?.other?.addressNormalized) || '';
  const acd = (c.participants || []).find((p) => p.purpose === 'acd') || {};
  return { conversationId: c.id, phone: addr.replace(/^tel:/, ''), customerName: cust.name || '', attributes: cust.attributes || {}, mediaType: cust.calls ? 'voice' : (cust.chats || cust.messages ? 'message' : 'other'), queue: acd.queueName || cust.queueName || '' };
}

// ---------- router ----------
const routes = [];
const route = (method, pattern, handler, opts = {}) => routes.push({ method, re: new RegExp(`^${pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)')}$`), handler, ...opts });
const needTp = (id) => { const t = getTp(id); if (!t) throw nf(); return t; };

route('GET', '/api/health', () => ({ status: 'ok', version: (process.env.RENDER_GIT_COMMIT || 'local').slice(0, 7), brand: brandId, seededOn: db.seededOn, time: nowLocal(), taxpayers: db.taxpayers.length, genesysLookup: !!GENESYS.clientId, frameAncestors: FRAME_ANCESTORS }));
route('GET', '/api/config', (req) => ({ baseUrl: baseUrl(req), brand: db.brand, brands: listBrands(), today: todayInTz(), now: nowLocal(), taxYear: db.taxYear, groups: db.groups, genesysLookup: !!GENESYS.clientId, apiKeyRequired: !!API_KEY }));
route('GET', '/api/brands', () => listBrands());
route('GET', '/api/users', () => db.users);

route('GET', '/api/taxpayers', (req, url) => search(Object.fromEntries(url.searchParams)).map(summary));
route('GET', '/api/taxpayers/lookup', (req, url) => {
  const p = Object.fromEntries(url.searchParams);
  const matches = p.taxpayerId ? [getTp(p.taxpayerId)].filter(Boolean) : search(p);
  return lookupResult(matches, req, { phone: p.phone || p.ani, conversationId: p.conversationId });
}, { secure: true });
route('POST', '/api/taxpayers', async (req) => {
  const b = await readBody(req);
  if (!b.lastName && !b.businessName) throw bad('lastName or businessName is required');
  const t = {
    id: newId('tp'), type: b.businessName ? 'Business' : 'Individual', firstName: b.firstName || b.businessName || '', lastName: b.lastName || '', businessName: b.businessName || '', tin: b.last4 ? `***-**-${digits(b.last4).slice(-4)}` : 'Not provided', dob: b.dob || '',
    phones: b.phone ? [{ type: 'Mobile', number: fmtPhone(b.phone), primary: true }] : [], email: b.email || '', address: { line: b.addressLine || '', city: b.city || '', state: db.brand.stateAbbr, zip: b.zip || '', county: '' },
    language: b.language || 'English', flags: ['New contact'], identity: { status: 'Not verified', method: '', date: null }, bank: null, representative: null, portalEnrolled: false,
    returns: [], assessments: [], payments: [], paymentPlan: null, notices: [], activities: [], filingStatus: '', preferredContact: 'Phone', accounts: [],
  };
  db.taxpayers.push(t); return created(fullRecord(t));
});
route('GET', '/api/taxpayers/:id', (req, url, { id }) => fullRecord(needTp(id)));
route('PATCH', '/api/taxpayers/:id', async (req, url, { id }) => {
  const t = needTp(id); const b = await readBody(req);
  if (b.address) { t.previousAddress = t.address; t.address = { ...t.address, ...b.address }; activity(t, { type: 'Account update', direction: 'Internal', by: b.by || 'Agent', subject: 'Mailing address updated', text: `${t.address.line}, ${t.address.city}, ${t.address.state} ${t.address.zip}` }); }
  for (const k of ['email', 'preferredContact', 'language', 'portalEnrolled']) if (b[k] !== undefined) t[k] = b[k];
  if (b.phones) t.phones = b.phones.map((x) => ({ ...x, number: fmtPhone(x.number) }));
  return fullRecord(t);
});
route('POST', '/api/taxpayers/:id/identity', async (req, url, { id }) => {
  const t = needTp(id); const b = await readBody(req);
  const checks = b.checks || {}; const failed = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
  if (failed.length) { activity(t, { type: 'Identity', direction: 'Internal', by: b.by || 'Agent', subject: 'Identity verification failed', text: `Not matched: ${failed.join(', ')}` }); throw bad(`Identity not verified. Not matched: ${failed.join(', ')}`); }
  t.identity = { status: 'Verified', method: b.method || 'Agent-assisted (phone)', date: todayInTz(), by: b.by || 'Agent' };
  setFlag(t, 'Identity verification required', false);
  t.returns.forEach((r) => r.steps.forEach((s) => { if (s.name === 'Identity verification') { s.status = 'Verified by agent'; s.date = todayInTz(); } }));
  activity(t, { type: 'Identity', direction: 'Internal', by: b.by || 'Agent', subject: 'Identity verified', text: `${t.identity.method}. Checks matched: ${Object.keys(checks).join(', ') || 'all'}.` });
  return fullRecord(t);
});
route('POST', '/api/taxpayers/:id/returns/:rid/release', async (req, url, { id, rid }) => {
  const t = needTp(id); const b = await readBody(req); const r = t.returns.find((x) => x.id === rid); if (!r || !r.refund) throw nf();
  if (t.identity.status !== 'Verified') throw bad('Verify the taxpayer\'s identity before releasing the refund');
  r.refund.status = 'Released'; r.refund.hold = ''; r.refund.releaseId = `RRQ${String(4400 + (idSeq % 100)).padStart(7, '0')}`; r.refund.expected = addDays(todayInTz(), r.refund.method === 'Direct deposit' ? 5 : 12);
  r.status = 'Refund released';
  r.steps.forEach((s) => { if (s.name === 'Refund approved') { s.status = 'Complete'; s.date = todayInTz(); } if (s.name === 'Refund issued') { s.status = 'Scheduled'; s.date = r.refund.expected; } if (/letter/i.test(s.name) && /undeliverable/i.test(s.status)) s.status = 'Superseded (verified by phone)'; });
  setFlag(t, 'Refund on hold', false); setFlag(t, 'Refund released', true);
  t.notices.forEach((n) => { if (n.returnId === rid && n.status !== 'Responded') n.status = 'Resolved'; });
  activity(t, { type: 'Refund', direction: 'Internal', by: b.by || 'Agent', subject: `Refund released (${r.refund.releaseId})`, text: `$${r.refund.amount.toFixed(2)} for tax year ${r.taxYear}. Expected by ${r.refund.expected} via ${r.refund.method.toLowerCase()}.` });
  return { taxpayer: fullRecord(t), refund: r.refund };
});
route('PATCH', '/api/taxpayers/:id/returns/:rid/refund', async (req, url, { id, rid }) => {
  const t = needTp(id); const b = await readBody(req); const r = t.returns.find((x) => x.id === rid); if (!r || !r.refund) throw nf();
  if (b.method === 'Direct deposit') {
    const acct = digits(b.account); if (digits(b.routing).length !== 9 || acct.length < 4) throw bad('Enter a 9-digit routing number and an account number');
    t.bank = { type: b.accountType || 'Checking', last4: acct.slice(-4), bank: b.bank || 'Bank on file' };
    r.refund.method = 'Direct deposit'; if (r.refund.expected) r.refund.expected = addDays(todayInTz(), 5);
    r.steps.forEach((s) => { if (s.name === 'Refund issued' && s.status === 'Scheduled') s.date = r.refund.expected; });
  } else if (b.method) r.refund.method = b.method;
  activity(t, { type: 'Refund', direction: 'Internal', by: b.by || 'Agent', subject: 'Refund method changed', text: `${r.refund.method}${t.bank ? ` (${t.bank.type} ••••${t.bank.last4})` : ''} for ${r.id}.` });
  return { taxpayer: fullRecord(t), refund: r.refund };
});
route('POST', '/api/taxpayers/:id/payments', async (req, url, { id }) => {
  const t = needTp(id); const b = await readBody(req); const amt = round2(Number(b.amount || 0));
  if (!(amt > 0)) throw bad('amount must be > 0');
  const a = t.assessments.find((x) => x.id === b.assessmentId) || t.assessments.find((x) => x.balance > 0);
  if (a) { a.paid = round2(a.paid + amt); a.balance = round2(Math.max(0, a.balance - amt)); if (a.balance === 0) a.status = 'Paid'; }
  const pay = { id: newId('pmt'), date: todayInTz(), amount: amt, method: b.method || 'Electronic check', confirmation: `EP${Math.floor(Math.random() * 9e7 + 1e7)}`, appliedTo: a ? a.id : 'Account', status: 'Accepted', takenBy: b.by || '' };
  t.payments.unshift(pay);
  if (balanceOf(t) === 0) { setFlag(t, 'Balance due', false); t.notices.forEach((n) => { if (n.amount) n.status = 'Paid'; }); }
  activity(t, { type: 'Payment', direction: 'Inbound', by: b.by || 'Agent', subject: `Payment accepted ${pay.confirmation}`, text: `$${amt.toFixed(2)} by ${pay.method.toLowerCase()} applied to ${pay.appliedTo}.` });
  return created({ payment: pay, balance: balanceOf(t), taxpayer: fullRecord(t) });
});
route('POST', '/api/taxpayers/:id/payment-plans', async (req, url, { id }) => {
  const t = needTp(id); const b = await readBody(req); const months = Number(b.months || 12);
  const bal = balanceOf(t); if (!(bal > 0)) throw bad('No balance due');
  const down = round2(Number(b.downPayment || 0));
  const monthly = round2((bal - down) / months);
  t.paymentPlan = { id: `PP${Math.floor(Math.random() * 9e5 + 1e5)}`, months, monthly, downPayment: down, firstDue: addDays(todayInTz(), 30), autopay: !!b.autopay, status: 'Active', created: todayInTz(), balance: bal };
  t.assessments.forEach((a) => { if (a.balance > 0) a.status = 'Payment plan'; });
  setFlag(t, 'Payment plan', true);
  activity(t, { type: 'Payment plan', direction: 'Internal', by: b.by || 'Agent', subject: `Payment plan ${t.paymentPlan.id} created`, text: `${months} payments of $${monthly.toFixed(2)}${t.paymentPlan.autopay ? ' (automatic debit)' : ''}, first due ${t.paymentPlan.firstDue}.` });
  return created({ plan: t.paymentPlan, taxpayer: fullRecord(t) });
});
route('POST', '/api/taxpayers/:id/notices/:nid/resend', async (req, url, { id, nid }) => {
  const t = needTp(id); const b = await readBody(req); const n = t.notices.find((x) => x.id === nid); if (!n) throw nf();
  n.status = `Re-sent (${b.method || 'Mail'})`; n.resent = todayInTz(); if (b.extendDays) n.due = addDays(todayInTz(), Number(b.extendDays));
  activity(t, { type: 'Notice', direction: 'Outbound', by: b.by || 'Agent', subject: `${n.letter} re-sent`, text: `${n.type} re-sent by ${(b.method || 'mail').toLowerCase()}${b.method === 'Mail' || !b.method ? ` to ${t.address.line}` : ''}.` });
  return fullRecord(t);
});
route('PATCH', '/api/taxpayers/:id/notices/:nid', async (req, url, { id, nid }) => {
  const t = needTp(id); const b = await readBody(req); const n = t.notices.find((x) => x.id === nid); if (!n) throw nf();
  if (b.extendDays) { n.due = addDays(n.due || todayInTz(), Number(b.extendDays)); n.status = 'Extended'; activity(t, { type: 'Notice', direction: 'Internal', by: b.by || 'Agent', subject: `${n.letter} due date extended`, text: `New due date ${n.due}.` }); }
  if (b.status) n.status = b.status;
  return fullRecord(t);
});
route('POST', '/api/taxpayers/:id/activities', async (req, url, { id }) => {
  const t = needTp(id); const b = await readBody(req);
  const a = activity(t, { type: b.type || 'Phone', direction: b.direction || 'Inbound', by: b.by || '', subject: b.subject || 'Contact', text: b.text || '', wrapCode: b.wrapCode || '', conversationId: b.conversationId || '', queue: b.queue || '', durationSec: b.durationSec || 0, ai: !!b.ai });
  if (['Phone', 'Chat', 'Message', 'Email'].includes(a.type) && b.conversationId) db.interactions.unshift({ id: `IMS${Math.floor(Math.random() * 9e7 + 1e7)}`, taxpayerId: t.id, ...a });
  if (b.caseId) { const c = db.cases.find((x) => x.id === b.caseId); if (c) { c.notes.unshift({ date: a.date, author: a.by, text: `${a.subject}: ${a.text}` }); c.updated = a.date; } }
  return created(a);
});
route('POST', '/api/taxpayers/:id/emails', async (req, url, { id }) => {
  const t = needTp(id); const b = await readBody(req);
  return created(activity(t, { type: 'Email', direction: 'Outbound', by: b.by || 'Agent', subject: b.subject || 'Email', text: b.body || '', to: t.email }));
});

route('GET', '/api/cases', (req, url) => {
  const p = Object.fromEntries(url.searchParams);
  return db.cases.filter((c) => (!p.assignedTo || c.assignedTo === p.assignedTo) && (!p.taxpayerId || c.taxpayerId === p.taxpayerId) && (!p.state || (p.state === 'open' ? !['Resolved', 'Closed', 'Cancelled'].includes(c.state) : c.state === p.state)) && (!p.group || c.group === p.group))
    .sort((a, b) => b.updated.localeCompare(a.updated)).map((c) => ({ ...c, taxpayerName: getTp(c.taxpayerId) ? nameOf(getTp(c.taxpayerId)) : '' }));
});
route('POST', '/api/cases', async (req) => {
  const b = await readBody(req); const t = getTp(b.taxpayerId); if (!t) throw bad('taxpayerId is required');
  const c = { id: newId('cs'), number: `CS${String(1046 + db.cases.length).padStart(7, '0')}`, taxpayerId: t.id, shortDescription: b.shortDescription || 'New case', description: b.description || '', category: b.category || 'General inquiry', subcategory: b.subcategory || '', state: 'New', priority: b.priority || '4 - Low', group: b.group || 'Taxpayer Services', assignedTo: b.assignedTo || '', channel: b.channel || 'Phone', opened: nowLocal(), updated: nowLocal(), notes: b.note ? [{ date: nowLocal(), author: b.by || '', text: b.note }] : [] };
  db.cases.push(c); activity(t, { type: 'Case', direction: 'Internal', by: b.by || '', subject: `Case ${c.number} opened`, text: c.shortDescription });
  return created(c);
});
route('GET', '/api/cases/:id', (req, url, { id }) => { const c = db.cases.find((x) => x.id === id || x.number === id); if (!c) throw nf(); return { ...c, taxpayerName: nameOf(getTp(c.taxpayerId)) }; });
route('PATCH', '/api/cases/:id', async (req, url, { id }) => {
  const c = db.cases.find((x) => x.id === id || x.number === id); if (!c) throw nf(); const b = await readBody(req);
  for (const k of ['shortDescription', 'description', 'category', 'subcategory', 'state', 'priority', 'group', 'assignedTo', 'resolution', 'resolutionCode']) if (b[k] !== undefined) c[k] = b[k];
  c.updated = nowLocal();
  if (b.state === 'Resolved') { const t = getTp(c.taxpayerId); t && activity(t, { type: 'Case', direction: 'Internal', by: b.by || '', subject: `Case ${c.number} resolved`, text: b.resolution || '' }); }
  return { ...c, taxpayerName: nameOf(getTp(c.taxpayerId)) };
});
route('POST', '/api/cases/:id/notes', async (req, url, { id }) => {
  const c = db.cases.find((x) => x.id === id || x.number === id); if (!c) throw nf(); const b = await readBody(req);
  if (!b.text) throw bad('text is required');
  const n = { date: nowLocal(), author: b.by || '', text: b.text, type: b.type || 'Work note' }; c.notes.unshift(n); c.updated = n.date; return created(n);
});

route('GET', '/api/kb', (req, url) => { const q = (url.searchParams.get('q') || '').toLowerCase(); return db.kb.filter((k) => !q || `${k.title} ${k.summary} ${k.category}`.toLowerCase().includes(q)); });
route('GET', '/api/kb/:id', (req, url, { id }) => { const k = db.kb.find((x) => x.id === id); if (!k) throw nf(); return k; });
route('GET', '/api/interactions', () => db.interactions);

// ---------- suspense (unapplied) payments ----------
route('POST', '/api/taxpayers/:id/unapplied/:uid/apply', async (req, url, { id, uid }) => {
  const t = needTp(id); const b = await readBody(req); const u = t.unapplied.find((x) => x.id === uid); if (!u) throw nf();
  if (!/unapplied/i.test(u.status)) throw bad('Payment already applied');
  const a = t.assessments.find((x) => x.id === b.assessmentId) || t.assessments.find((x) => x.balance > 0);
  if (!a) throw bad('No balance to apply the payment to');
  const amt = Math.min(u.amount, a.balance);
  a.paid = round2(a.paid + amt); a.balance = round2(a.balance - amt); if (a.balance === 0) a.status = 'Paid';
  u.status = `Applied to ${a.id}`; u.appliedOn = todayInTz();
  const pay = { id: newId('pmt'), date: u.received, amount: amt, method: u.method, confirmation: u.id, appliedTo: a.id, status: 'Posted (from suspense)', takenBy: b.by || '' };
  t.payments.unshift(pay);
  const n = t.notices.find((x) => x.id === a.noticeId); if (n && a.balance === 0) n.status = 'Resolved - payment applied';
  setFlag(t, 'Unapplied payment', false); if (balanceOf(t) === 0) setFlag(t, 'Balance due', false);
  activity(t, { type: 'Payment', direction: 'Internal', by: b.by || 'Agent', subject: `Suspense payment applied (${u.method})`, text: `$${amt.toFixed(2)} received ${u.received} applied to ${a.id} (${a.period}).${n ? ` Notice ${n.id} resolved.` : ''}` });
  return { payment: pay, balance: balanceOf(t), taxpayer: fullRecord(t) };
});

// ---------- virtual agent (Pilot) sessions ----------
route('GET', '/api/bot-scenarios', () => scenarios(db.brand, db.taxYear));
function saveBotSession(b) {
  const t = b.taxpayerId ? getTp(b.taxpayerId) : (b.phone ? search({ phone: b.phone })[0] : null);
  const s = {
    id: newId('bot'), date: nowLocal(), conversationId: b.conversationId || `demo-${Date.now()}`, phone: fmtPhone(b.phone || (t ? t.phones[0].number : '')), taxpayerId: t ? t.id : '',
    botName: b.botName || 'Pilot', scenario: b.scenario || '', intent: b.intent || '', taxType: b.taxType || '', confidence: Number(b.confidence || 0),
    outcome: b.outcome || 'Contained', queue: b.queue || '', authenticated: b.authenticated === true || b.authenticated === 'true', authMethod: b.authMethod || '', slots: Object.fromEntries(Object.entries(b.slots || {}).filter(([, v]) => v !== '' && v != null)), linksShared: b.linksShared || [],
    transcript: Array.isArray(b.transcript) ? b.transcript : String(b.transcript || '').split('\n').map((x) => x.trim()).filter(Boolean).map((line) => { const m = line.match(/^([^:]{1,30}):\s*(.*)$/); if (!m) return { who: 'bot', text: line }; return { who: m[1].trim().toLowerCase() === String(b.botName || 'Pilot').toLowerCase() ? 'bot' : 'cust', text: m[2] }; }), summary: b.summary || '',
  };
  db.botSessions.unshift(s); db.botSessions = db.botSessions.slice(0, 100);
  if (t) {
    activity(t, { type: 'Virtual agent', direction: 'Inbound', by: s.botName, subject: `${s.botName} (virtual agent): ${s.intent || 'Inbound call'} - ${s.outcome.toLowerCase()}`, text: s.summary, conversationId: s.conversationId, botSessionId: s.id, wrapCode: s.outcome === 'Contained' ? 'Contained by virtual agent' : 'Transferred to agent', ai: true });
    if (s.outcome === 'Contained') db.interactions.unshift({ id: newId('ix'), date: s.date, taxpayerId: t.id, type: 'Virtual agent', text: s.summary, wrapCode: 'Contained by virtual agent', conversationId: s.conversationId, queue: s.queue, by: s.botName });
  }
  return s;
}
route('POST', '/api/bot-sessions', async (req) => created(saveBotSession(await readBody(req))), { secure: true });
route('GET', '/api/bot-sessions', (req, url) => { const c = url.searchParams.get('conversationId'); const tid = url.searchParams.get('taxpayerId'); return db.botSessions.filter((s) => (!c || s.conversationId === c) && (!tid || s.taxpayerId === tid)); });
// Run a scripted scenario: saves the bot session; for a transfer, also pushes the screen pop to `agent` unless push is false.
route('POST', '/api/bot-scenarios/:id/run', async (req, url, { id }) => {
  const sc = scenarios(db.brand, db.taxYear).find((x) => x.id === id); if (!sc) throw nf(); const b = await readBody(req);
  const t = getTp(sc.taxpayerId); const phone = b.phone || t.phones[0].number;
  const s = saveBotSession({ ...sc, scenario: sc.id, phone, taxpayerId: t.id, conversationId: b.conversationId });
  let delivered = 0;
  if (sc.outcome === 'Transferred' && b.push !== false) {
    const pop = { id: newId('pop'), receivedAt: nowLocal(), agent: (b.agent || '*').toLowerCase(), phone: fmtPhone(phone), conversationId: s.conversationId, direction: 'Inbound', queue: sc.queue, mediaType: 'voice', customerName: nameOf(t), intent: sc.intent, taxpayerIds: [t.id], tab: 'notices', botSessionId: s.id };
    delivered = pushScreenPop(pop);
  }
  return { session: s, deliveredTo: delivered, popUrl: `${baseUrl(req)}/pop?${new URLSearchParams({ taxpayerId: t.id, phone, conversationId: s.conversationId, queue: sc.queue, intent: sc.intent })}` };
});

route('POST', '/api/screenpop', async (req, url) => {
  const b = { ...Object.fromEntries(url.searchParams), ...(await readBody(req)) }; delete b.apiKey;
  const phone = b.phone || b.ani || '';
  const matches = b.taxpayerId ? [getTp(b.taxpayerId)].filter(Boolean) : search({ phone, last4: b.last4, returnId: b.returnId, accountNumber: b.accountNumber });
  const pop = { id: newId('pop'), receivedAt: nowLocal(), agent: (b.agent || b.agentEmail || b.userId || '*').toLowerCase(), phone: fmtPhone(phone), conversationId: b.conversationId || '', direction: b.direction || 'Inbound', queue: b.queue || '', mediaType: b.mediaType || 'voice', customerName: b.customerName || '', intent: b.intent || '', taxpayerIds: matches.map((m) => m.id), tab: b.tab || '' };
  const delivered = pushScreenPop(pop);
  return { ...lookupResult(matches, req, { phone, conversationId: pop.conversationId }), screenPopId: pop.id, deliveredTo: delivered };
}, { secure: true });
route('GET', '/api/screenpop/recent', () => db.screenpops);
route('GET', '/api/genesys/conversations/:id', async (req, url, { id }) => {
  if (!GENESYS.clientId) throw Object.assign(new Error('Genesys lookup not configured (set GENESYS_CLIENT_ID, GENESYS_CLIENT_SECRET, GENESYS_REGION)'), { status: 501 });
  const c = await genesysConversation(id);
  return { ...c, ...lookupResult(c.phone ? search({ phone: c.phone }) : [], req, { phone: c.phone, conversationId: id }) };
});
route('POST', '/api/admin/reset', async (req) => {
  const b = await readBody(req);
  if (b.brand) { if (!listBrands().some((x) => x.id === b.brand)) throw bad('Unknown brand'); brandId = b.brand; }
  db = freshDb(); return { status: 'reset', brand: brandId, seededOn: db.seededOn };
});

// ---------- static ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
function serveStatic(req, res, pathname) {
  let file = path.normalize(path.join(PUBLIC_DIR, decodeURIComponent(pathname)));
  if (!file.startsWith(PUBLIC_DIR)) return send(res, 403, 'Forbidden');
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { const html = `${file}.html`; file = fs.existsSync(html) ? html : path.join(PUBLIC_DIR, 'index.html'); }
  const headers = { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' };
  if (FRAME_ANCESTORS !== '*') headers['Content-Security-Policy'] = `frame-ancestors ${FRAME_ANCESTORS}`;
  res.writeHead(200, headers); fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'OPTIONS') return send(res, 204, '');
  ensureFresh();
  try {
    if (url.pathname === '/api/screenpop/events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', Connection: 'keep-alive', ...corsHeaders(), 'X-Accel-Buffering': 'no' });
      const client = { res, agent: (url.searchParams.get('agent') || '').toLowerCase(), userId: (url.searchParams.get('userId') || '').toLowerCase() };
      sseClients.add(client); res.write(`event: hello\ndata: ${JSON.stringify({ connected: true, agent: client.agent })}\n\n`);
      req.on('close', () => sseClients.delete(client)); return;
    }
    if (url.pathname === '/retail') { res.writeHead(301, { Location: '/retail/' }); return res.end(); }
    for (const r of routes) {
      if (r.method !== req.method) continue;
      const m = url.pathname.replace(/\/$/, '').match(r.re); if (!m) continue;
      if (r.secure && !authorized(req, url)) return send(res, 401, { error: 'Unauthorized: supply Authorization: Bearer <API_KEY> or x-api-key' });
      const out = await r.handler(req, url, m.groups || {});
      return send(res, out instanceof Created ? 201 : 200, out instanceof Created ? out.body : out);
    }
    if (url.pathname.startsWith('/api/')) return send(res, 404, { error: 'No such endpoint' });
    return serveStatic(req, res, url.pathname === '/' ? '/index.html' : url.pathname);
  } catch (e) {
    if (!e.status) console.error(e);
    return send(res, e.status || 500, { error: e.message });
  }
});

if (require.main === module) server.listen(PORT, () => console.log(`Mock tax agency workspace (${brandId}) listening on http://localhost:${PORT}`));
module.exports = { server };
