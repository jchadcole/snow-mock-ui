'use strict';
// Agent Assist scripts for the v3 interaction screen: what the caller and agent say on a live call, and which knowledge
// article Agent Assist suggests for each line (with the phrase to highlight). Configurable demo data, not real AI.
// Scripts are chosen by topic: the Pilot scenario the call came from, otherwise what the taxpayer's record shows
// (suspense payment, held refund, balance, information request). Each line is worded from the taxpayer's own
// record (lib/facts.js). {agent} is replaced in the browser with the agent's first name.

const { facts } = require('./facts');

// Short question the Copilot shows for a caller line (`q`). Falls back to the caller's own words.

const SCRIPTS = {
  'notice-paid': (f) => [
    { who: 'agent', text: `Thank you for calling, this is {agent}. I see Pilot passed along notice ${f.notice?.short || ''} and the check you mailed on ${f.payment?.mailedSpoken || 'the date you gave'}. How else can I help you today, ${f.first}?` },
    { who: 'cust', text: `Yeah, I was wondering if you actually got my check, because the notice says I still owe ${f.notice?.amountSpoken || 'money'}.`, kb: 'KB0020426', q: `Was the check ${f.payment?.mailedSpoken ? 'mailed on ' + f.payment.mailedSpoken + ' ' : ''}received and applied to notice ${f.notice?.short || ''}?`, hl: 'check unapplied (suspense) payments first' },
    { who: 'agent', text: `That's a great question. Checks mailed without the payment voucher can post to suspense, so I'm checking that now.${f.payment ? ` I found it, we received it on ${f.payment.receivedSpoken}.` : ''}` },
    { who: 'cust', text: 'Do I still need to send you the canceled check?', kb: 'KB0020427', q: 'Is a canceled check image still required once the payment is found?', hl: 'no response or canceled check image is needed' },
    { who: 'agent', text: `No. Once I apply it to your ${f.notice?.year || ''} balance, notice ${f.notice?.short || ''} is resolved, so there's nothing to send.` },
    { who: 'cust', text: 'And how long does it take to show on my account?', kb: 'KB0020428', q: 'How long until an applied payment shows on the account?', hl: 'post to the account immediately' },
    { who: 'agent', text: "It posts right away, and you'll see the updated balance online by the next business day." },
  ],
  'refund-identity': (f) => [
    { who: 'agent', text: `Thank you for calling, this is {agent}. How can I help you today, ${f.first}?` },
    { who: 'cust', text: `Hi, I'm calling about my ${f.refund?.year || ''} state refund of ${f.refund?.amount || 'my refund'}. It's been on hold for weeks.`, kb: 'KB0020416', q: `How long does a refund take once a return is filed?`, hl: 'usually processed within 15 business days' },
    { who: 'cust', text: 'I was told a letter was coming so I could verify my identity, but it never arrived.', kb: 'KB0020415', q: 'Can identity be verified by phone if the Identity Confirmation Quiz letter never arrived?', hl: 'an agent can verify identity by phone' },
    { who: 'agent', text: `I can verify your identity with you right now, ${f.first}, and release the refund.` },
    { who: 'cust', text: 'How long after that until I get my refund?', kb: 'KB0020415', q: 'When is the refund released after identity is verified?', hl: 'released within 4 business days' },
    ...(f.refund && !/direct/i.test(f.refund.method) ? [{ who: 'cust', text: 'Can you send it by direct deposit instead of a check?', kb: 'KB0020416', q: 'Can the refund be switched from a paper check to direct deposit?', hl: 'Direct deposit arrives 5-7 business days sooner' }] : []),
  ],
  'refund-docs': (f) => [
    { who: 'agent', text: `Thank you for calling, this is {agent}. How can I help you today, ${f.first}?` },
    { who: 'cust', text: `I'm checking on my ${f.refund?.year || ''} refund of ${f.refund?.amount || ''}. Did you get the documents I sent?`, kb: 'KB0020425', q: 'Do documents that show as received need to be sent again?', hl: 'the taxpayer does not need to send them again' },
    { who: 'agent', text: `Yes, your documentation shows as ${String(f.refund?.doc || 'received').toLowerCase()}, so you don't need to resend anything.` },
    { who: 'cust', text: 'How much longer will the review take?', kb: 'KB0020425', q: 'How long does the documentation review take?', hl: 'usually completes within 30 days of receipt' },
  ],
  refund: (f) => [
    { who: 'agent', text: `Thank you for calling, this is {agent}. How can I help you today, ${f.first}?` },
    { who: 'cust', text: `I have a question about my ${f.refund?.year || ''} refund${f.refund ? ` of ${f.refund.amount}` : ''}.`, kb: 'KB0020416', hl: 'usually processed within 15 business days' },
    ...(f.refund && /offset|applied|partial/i.test(f.refund.status + f.refund.returnStatus) ? [{ who: 'cust', text: 'Why was my refund smaller than I expected?', kb: 'KB0020420', q: 'Why can a refund be smaller than the amount shown on the return?', hl: 'Refunds can be applied to tax balances or certified debts' }] : []),
  ],
  balance: (f) => [
    { who: 'agent', text: `Thank you for calling, this is {agent}. How can I help you today, ${f.first}?` },
    { who: 'cust', text: `I got a bill saying I owe ${f.notice?.amountSpoken || 'a balance'} and I can't pay it all at once.`, kb: 'KB0020418', q: 'What options does a taxpayer have for a billing notice?', hl: 'set up a payment plan' },
    { who: 'cust', text: 'Can I pay it off monthly?', kb: 'KB0020417', q: 'How long can a payment plan run?', hl: 'payment plan of up to 24 months' },
  ],
  docs: (f) => [
    { who: 'agent', text: `Thank you for calling, this is {agent}. How can I help you today, ${f.first}?` },
    { who: 'cust', text: 'I got a letter asking for my W-2s and I need more time to find them.', kb: 'KB0020419', q: 'Can the deadline to send W-2s be extended?', hl: 'A one-time 30-day extension can be granted' },
  ],
  default: (f) => [
    { who: 'agent', text: `Thank you for calling, this is {agent}. How can I help you today, ${f.first}?` },
    { who: 'cust', text: 'I have a question about my account.', kb: 'KB0020416', hl: 'usually processed within 15 business days' },
  ],
};

function topicFor(t, scenario) {
  if (scenario && SCRIPTS[scenario]) return scenario;
  if ((t.unapplied || []).some((u) => /unapplied/i.test(u.status))) return 'notice-paid';
  const r = t.returns.find((x) => x.refund && /hold|pending/i.test(x.refund.status));
  if (r && /identity/i.test(r.refund.hold || '')) return 'refund-identity';
  if (r && r.documentation) return 'refund-docs';
  if (t.notices.some((n) => /information/i.test(n.type))) return 'docs';
  if (t.assessments.some((a) => a.balance > 0)) return 'balance';
  if (t.returns.some((x) => x.refund)) return 'refund';
  return 'default';
}

function assistScript(scenario, t, brand, taxYear) {
  if (!t) return SCRIPTS.default({ first: '' });
  return SCRIPTS[topicFor(t, scenario)](facts(t, brand, taxYear));
}

// Wrap-up content for the Copilot "Wrap-up Codes" panel: AI-suggested codes plus a generated summary.
// Wording per topic can be replaced in ui.copilot.topics (see lib/brands.js).
const fillText = (txt, v) => String(txt || '').replace(/\{(\w+)\}/g, (m, k) => (v[k] != null ? v[k] : m));
const WRAP = {
  'notice-paid': (f) => ({ reason: 'Notice for a payment already made', resolution: 'Payment found in suspense and applied; notice resolved', actions: 'Follow up not needed',
    details: `{first} called about ${f.notice ? `notice ${f.notice.short} for ${f.notice.year} showing ${f.notice.amount} owed` : 'a billing notice'}. {first} had mailed a check${f.payment?.mailedFull ? ' on ' + f.payment.mailedFull : ''}. The agent found the check in suspense, applied it to the balance and confirmed that no canceled check image or online response is needed.`, codes: ['Payment applied', 'Notice resolved', 'Requires follow up'] }),
  'refund-identity': (f) => ({ reason: 'Refund on hold for identity verification', resolution: 'Identity verified by phone and refund released', actions: 'Follow up not needed',
    details: `{first} called about the ${f.refund?.year || ''} refund of ${f.refund?.amount || ''} held for identity verification because the quiz letter never arrived. The agent verified identity by phone, released the refund and reviewed the delivery method.`, codes: ['Identity verified', 'Refund released', 'Requires follow up'] }),
  'refund-docs': (f) => ({ reason: 'Refund held for documentation review', resolution: 'Documentation confirmed received; no action needed from the caller', actions: 'Follow up not needed',
    details: `{first} asked about the ${f.refund?.year || ''} refund of ${f.refund?.amount || ''}. The agent confirmed the documentation shows as ${String(f.refund?.doc || 'received').toLowerCase()} and explained the review timeline.`, codes: ['Refund status provided', 'Documentation received', 'Requires follow up'] }),
  refund: (f) => ({ reason: 'Refund status', resolution: 'Refund status provided', actions: 'Follow up not needed', details: `{first} asked about the ${f.refund?.year || ''} refund${f.refund ? ' of ' + f.refund.amount : ''}. The agent reviewed the status and the expected timeline.`, codes: ['Refund status provided', 'General question', 'Requires follow up'] }),
  balance: (f) => ({ reason: 'Balance due', resolution: 'Payment options reviewed', actions: 'Follow up as needed', details: `{first} called about a balance of ${f.notice?.amount || 'the amount shown on the bill'}. The agent reviewed the billing notice and the payment plan options.`, codes: ['Payment arranged', 'Payment plan set up', 'Requires follow up'] }),
  docs: (f) => ({ reason: 'Request for information', resolution: 'Document and extension options explained', actions: 'Follow up as needed', details: `{first} asked how to respond to the request for information and whether the deadline can be extended.`, codes: ['Information provided', 'Extension requested', 'Requires follow up'] }),
  default: () => ({ reason: 'General question', resolution: 'All inquiries addressed', actions: 'Follow up not needed', details: `{first} called with a question about the account. The agent answered it and confirmed there was nothing else.`, codes: ['General question', 'Information provided', 'Requires follow up'] }),
};
function wrapContent(scenario, t, brand, taxYear, overrides) {
  const f = t ? facts(t, brand, taxYear) : { first: '' }; const topic = t ? topicFor(t, scenario) : 'default';
  const base = (WRAP[topic] || WRAP.default)(f); const o = (overrides && overrides[topic]) || {};
  const v = { first: f.first || 'The caller', full: f.full || '', notice: f.notice?.short || '', noticeAmount: f.notice?.amount || '', noticeYear: f.notice?.year || '', refund: f.refund?.amount || '', refundYear: f.refund?.year || '', refundStatus: f.refund?.statusText || '', payment: f.payment?.method || '' };
  const pick = (k, d) => fillText(o[k] != null ? o[k] : d, v);
  return { topic, reason: pick('reason', base.reason), resolution: pick('resolution', base.resolution), actions: pick('actions', base.actions), details: pick('details', base.details), codes: o.codes || base.codes };
}

module.exports = { assistScript, topicFor, SCRIPTS, wrapContent };
