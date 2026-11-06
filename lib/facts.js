'use strict';
// Taxpayer facts used to word the Pilot scenarios and the Agent Assist script, so every line on a screen pop
// matches the taxpayer the call is for (name, SSN last 4, date of birth, refund, notice, payment).

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const ORD = (n) => n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th');
const parts = (d) => { const [y, m, dd] = String(d || '').slice(0, 10).split('-').map(Number); return y ? { y, m, d: dd } : null; };
const shortDate = (d) => { const p = parts(d); return p ? `${MONTHS[p.m - 1].slice(0, 3)} ${p.d}, ${p.y}` : ''; };
const spokenDay = (d) => { const p = parts(d); return p ? `${MONTHS[p.m - 1]} ${ORD(p.d)}` : ''; };
const spokenDate = (d) => { const p = parts(d); return p ? `${MONTHS[p.m - 1]} ${ORD(p.d)}, ${p.y}` : ''; };
const keypadDate = (d) => { const p = parts(d); return p ? `${String(p.m).padStart(2, '0')}/${String(p.d).padStart(2, '0')}/${p.y}` : ''; };
const money = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const moneySpoken = (n) => { const v = Number(n || 0); return Number.isInteger(v) ? '$' + v.toLocaleString('en-US') : money(v); };
const addDays = (ymd, n) => { const d = new Date(String(ymd).slice(0, 10) + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const shortNotice = (id) => String(id || '').replace(/^\D+/, '').replace(/^0+/, '') || String(id || '');
const isOpenNotice = (n) => n.amount && !/paid|resolved/i.test(n.status);

// Make sure a taxpayer can play the "notice for a payment already made" story: an open billing notice, the matching
// balance, and the caller's check sitting unapplied in suspense. Taxpayers that already have these keep their data.
function ensureNoticeStory(t, taxYear, today) {
  let n = t.notices.find(isOpenNotice);
  let a = n && t.assessments.find((x) => x.noticeId === n.id && x.balance > 0);
  if (!n) {
    a = t.assessments.find((x) => x.balance > 0);
    const amount = a ? a.balance : 1250;
    const id = `NTC000${String(4400 + t.notices.length + Number(String(t.id).replace(/\D/g, '').slice(-2) || 0)).padStart(4, '0')}`;
    if (!a) { a = { id: `ASM00${String(20400 + t.assessments.length).padStart(5, '0')}`, taxType: (t.returns[0] || {}).taxType || 'Individual Income Tax', period: String(taxYear - 1), assessed: amount, penalty: 0, interest: 0, paid: 0, balance: amount, status: 'Billed', due: addDays(today, 12) }; t.assessments.push(a); }
    n = { id, letter: 'BN-01', type: 'Billing Notice', date: addDays(today, -18), status: 'Mailed', due: addDays(today, 12), amount, taxYear: Number(a.period) || taxYear - 1 };
    a.noticeId = id; t.notices.unshift(n);
  }
  if (!a) { a = { id: `ASM00${String(20400 + t.assessments.length).padStart(5, '0')}`, taxType: 'Individual Income Tax', period: String(n.taxYear || taxYear - 1), assessed: n.amount, penalty: 0, interest: 0, paid: 0, balance: n.amount, status: 'Billed', due: n.due || addDays(today, 12), noticeId: n.id }; t.assessments.push(a); }
  if (!(t.unapplied || []).some((u) => /unapplied/i.test(u.status))) {
    const mailed = addDays(n.date, -40); const no = 1000 + (Number(String(t.id).replace(/\D/g, '')) % 900);
    t.unapplied = t.unapplied || [];
    t.unapplied.push({ id: `UNP00${String(7700 + t.unapplied.length + no % 50).padStart(5, '0')}`, amount: a.balance, method: `Check #${no}`, mailed, received: addDays(mailed, 7), status: 'Unapplied (suspense)', reason: 'Payment voucher missing; no notice or tax year on the check', bank: t.bank ? `${t.bank.bank} ••••${t.bank.last4}` : '' });
  }
  for (const f of ['Balance due', 'Unapplied payment']) if (!t.flags.includes(f)) t.flags.push(f);
}

function facts(t, brand, taxYear) {
  // For a business, the caller is the contact on file (e.g. "Sam Alvarez (Owner)").
  const first = t.type === 'Business' ? String(t.contact || t.contactName || t.businessName || '').replace(/\s*\(.*\)$/, '').split(' ')[0] : t.firstName;
  const r = t.returns.filter((x) => x.refund).sort((a, b) => b.taxYear - a.taxYear)[0] || null;
  const n = t.notices.find(isOpenNotice) || t.notices.find((x) => x.amount) || null;
  const u = (t.unapplied || []).find((x) => /unapplied/i.test(x.status)) || (t.unapplied || [])[0] || null;
  const last4 = String(t.tin || '').replace(/\D/g, '').slice(-4);
  const taxType = (r || t.returns[0] || {}).taxType || brand.taxTypes?.individual || 'Individual Income Tax';
  const refundStatus = !r ? '' : r.refund.hold ? `held for ${r.refund.hold.toLowerCase()}` : String(r.refund.status || '').toLowerCase();
  return {
    first, last: t.lastName || '', full: t.type === 'Business' ? t.businessName : `${t.firstName} ${t.lastName}`, last4, ssnMasked: `***-**-${last4}`,
    dobKeypad: keypadDate(t.dob), dobSpoken: spokenDate(t.dob), taxType, agency: brand.agency, portal: brand.portal, state: brand.state, taxYear,
    refund: r ? { year: r.taxYear, form: r.form, amount: money(r.refund.adjusted || r.refund.amount), method: r.refund.method, filed: shortDate(r.filed), returnStatus: r.status, status: r.refund.status, statusText: refundStatus,
      hold: r.refund.hold || '', doc: r.documentation ? r.documentation.status : '', issued: shortDate(r.refund.issued), expected: shortDate(r.refund.expected) } : null,
    notice: n ? { id: n.id, short: shortNotice(n.id), year: n.taxYear || taxYear - 1, amount: money(n.amount), amountSpoken: moneySpoken(n.amount), type: n.type, letter: n.letter } : null,
    payment: u ? { method: u.method, isCheck: /check/i.test(u.method), mailedShort: shortDate(u.mailed), mailedSpoken: spokenDay(u.mailed), mailedFull: spokenDate(u.mailed), receivedSpoken: spokenDay(u.received), amount: money(u.amount) } : null,
  };
}

module.exports = { facts, ensureNoticeStory, shortDate, spokenDay, money };
