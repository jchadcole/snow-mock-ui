'use strict';
// Agent Assist scripts for the v3 interaction screen: what the caller and agent say on a live call, and which knowledge
// article Agent Assist suggests for each line (with the phrase to highlight). Configurable demo data, not real AI.
// Scripts are chosen by topic: the Pilot scenario the call came from, otherwise what the taxpayer's record shows
// (suspense payment, held refund, balance, information request). Each line is worded from the taxpayer's own
// record (lib/facts.js). {agent} is replaced in the browser with the agent's first name.

const { facts } = require('./facts');

const SCRIPTS = {
  'notice-paid': (f) => [
    { who: 'agent', text: `Thank you for calling, this is {agent}. I see Pilot passed along notice ${f.notice?.short || ''} and the check you mailed on ${f.payment?.mailedSpoken || 'the date you gave'}. How else can I help you today, ${f.first}?` },
    { who: 'cust', text: `Yeah, I was wondering if you actually got my check, because the notice says I still owe ${f.notice?.amountSpoken || 'money'}.`, kb: 'KB0020426', hl: 'check unapplied (suspense) payments first' },
    { who: 'agent', text: `That's a great question. Checks mailed without the payment voucher can post to suspense, so I'm checking that now.${f.payment ? ` I found it, we received it on ${f.payment.receivedSpoken}.` : ''}` },
    { who: 'cust', text: 'Do I still need to send you the canceled check?', kb: 'KB0020427', hl: 'no response or canceled check image is needed' },
    { who: 'agent', text: `No. Once I apply it to your ${f.notice?.year || ''} balance, notice ${f.notice?.short || ''} is resolved, so there's nothing to send.` },
    { who: 'cust', text: 'And how long does it take to show on my account?', kb: 'KB0020428', hl: 'post to the account immediately' },
    { who: 'agent', text: "It posts right away, and you'll see the updated balance online by the next business day." },
  ],
  'refund-identity': (f) => [
    { who: 'agent', text: `Thank you for calling, this is {agent}. How can I help you today, ${f.first}?` },
    { who: 'cust', text: `Hi, I'm calling about my ${f.refund?.year || ''} state refund of ${f.refund?.amount || 'my refund'}. It's been on hold for weeks.`, kb: 'KB0020416', hl: 'usually processed within 15 business days' },
    { who: 'cust', text: 'I was told a letter was coming so I could verify my identity, but it never arrived.', kb: 'KB0020415', hl: 'an agent can verify identity by phone' },
    { who: 'agent', text: `I can verify your identity with you right now, ${f.first}, and release the refund.` },
    { who: 'cust', text: 'How long after that until I get my refund?', kb: 'KB0020415', hl: 'released within 4 business days' },
    ...(f.refund && !/direct/i.test(f.refund.method) ? [{ who: 'cust', text: 'Can you send it by direct deposit instead of a check?', kb: 'KB0020416', hl: 'Direct deposit arrives 5-7 business days sooner' }] : []),
  ],
  'refund-docs': (f) => [
    { who: 'agent', text: `Thank you for calling, this is {agent}. How can I help you today, ${f.first}?` },
    { who: 'cust', text: `I'm checking on my ${f.refund?.year || ''} refund of ${f.refund?.amount || ''}. Did you get the documents I sent?`, kb: 'KB0020425', hl: 'the taxpayer does not need to send them again' },
    { who: 'agent', text: `Yes, your documentation shows as ${String(f.refund?.doc || 'received').toLowerCase()}, so you don't need to resend anything.` },
    { who: 'cust', text: 'How much longer will the review take?', kb: 'KB0020425', hl: 'usually completes within 30 days of receipt' },
  ],
  refund: (f) => [
    { who: 'agent', text: `Thank you for calling, this is {agent}. How can I help you today, ${f.first}?` },
    { who: 'cust', text: `I have a question about my ${f.refund?.year || ''} refund${f.refund ? ` of ${f.refund.amount}` : ''}.`, kb: 'KB0020416', hl: 'usually processed within 15 business days' },
    ...(f.refund && /offset|applied|partial/i.test(f.refund.status + f.refund.returnStatus) ? [{ who: 'cust', text: 'Why was my refund smaller than I expected?', kb: 'KB0020420', hl: 'Refunds can be applied to tax balances or certified debts' }] : []),
  ],
  balance: (f) => [
    { who: 'agent', text: `Thank you for calling, this is {agent}. How can I help you today, ${f.first}?` },
    { who: 'cust', text: `I got a bill saying I owe ${f.notice?.amountSpoken || 'a balance'} and I can't pay it all at once.`, kb: 'KB0020418', hl: 'set up a payment plan' },
    { who: 'cust', text: 'Can I pay it off monthly?', kb: 'KB0020417', hl: 'payment plan of up to 24 months' },
  ],
  docs: (f) => [
    { who: 'agent', text: `Thank you for calling, this is {agent}. How can I help you today, ${f.first}?` },
    { who: 'cust', text: 'I got a letter asking for my W-2s and I need more time to find them.', kb: 'KB0020419', hl: 'A one-time 30-day extension can be granted' },
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

module.exports = { assistScript, topicFor, SCRIPTS };
