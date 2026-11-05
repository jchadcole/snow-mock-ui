'use strict';
// Agent Assist scripts for the v3 interaction screen: what the caller and agent say on a live call, and which knowledge
// article Agent Assist suggests for each line (with the phrase to highlight). Configurable demo data, not real AI.
// Keys: a Pilot scenario id (used when the call came from that bot session), a taxpayer id, or 'default'.
// {agent} and {first} are replaced with the agent's and caller's first names.

const ASSIST = {
  'notice-paid': [
    { who: 'agent', text: "Thank you for calling, this is {agent}. I see Pilot passed along notice 1234 and the check you mailed on July 1st. How else can I help you today?" },
    { who: 'cust', text: 'Yeah, I was wondering if you actually got my check, because the notice says I still owe $2,200.', kb: 'KB0020426', hl: 'check unapplied (suspense) payments first' },
    { who: 'agent', text: "That's a great question. Checks mailed without the payment voucher can post to suspense, so I'm checking that now. I found it, we received it on July 8th." },
    { who: 'cust', text: 'Do I still need to send you the canceled check?', kb: 'KB0020427', hl: 'no response or canceled check image is needed' },
    { who: 'agent', text: "No. Once I apply it to your balance the notice is resolved, so there's nothing to send." },
    { who: 'cust', text: 'And how long does it take to show on my account?', kb: 'KB0020428', hl: 'post to the account immediately' },
    { who: 'agent', text: "It posts right away, and you'll see the updated balance online by the next business day." },
  ],
  'tp-1001': [
    { who: 'agent', text: 'Thank you for calling, this is {agent}. How can I help you today?' },
    { who: 'cust', text: "Hi, I'm calling about my state refund. It's been on hold for weeks.", kb: 'KB0020416', hl: 'usually processed within 15 business days' },
    { who: 'cust', text: 'I was told a letter was coming so I could verify my identity, but it never arrived.', kb: 'KB0020415', hl: 'an agent can verify identity by phone' },
    { who: 'agent', text: 'I can verify your identity with you right now and release the refund.' },
    { who: 'cust', text: 'How long after that until I get my refund?', kb: 'KB0020415', hl: 'released within 4 business days' },
    { who: 'cust', text: 'Can you send it by direct deposit instead of a check?', kb: 'KB0020416', hl: 'Direct deposit arrives 5-7 business days sooner' },
  ],
  'tp-1002': [
    { who: 'agent', text: 'Thank you for calling, this is {agent}. How can I help you today?' },
    { who: 'cust', text: 'I got a bill saying I owe over two thousand dollars and I can’t pay it all at once.', kb: 'KB0020418', hl: 'set up a payment plan' },
    { who: 'cust', text: 'Can I pay it off monthly?', kb: 'KB0020417', hl: 'payment plan of up to 24 months' },
  ],
  'tp-1005': [
    { who: 'agent', text: 'Thank you for calling, this is {agent}. How can I help you today?' },
    { who: 'cust', text: 'I got a letter asking for my W-2s and I need more time to find them.', kb: 'KB0020419', hl: 'A one-time 30-day extension can be granted' },
  ],
  default: [
    { who: 'agent', text: 'Thank you for calling, this is {agent}. How can I help you today?' },
    { who: 'cust', text: 'I have a question about my refund.', kb: 'KB0020416', hl: 'usually processed within 15 business days' },
  ],
};

function assistScript(key, taxpayerId) {
  return ASSIST[key] || ASSIST[taxpayerId] || ASSIST.default;
}

module.exports = { assistScript, ASSIST };
