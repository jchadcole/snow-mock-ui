'use strict';
// Sample Pilot virtual agent (Genesys AVA) sessions for the tax demo, built from the customer's call scripts.
// The bot itself runs in Genesys Cloud. In a live setup Genesys posts each session with genesys/log-bot-session.json:
//   contained   -> logged on the taxpayer record as a contained virtual agent interaction (no agent)
//   transferred -> logged, then the screen pop (same conversationId) shows Pilot's context and transcript to the agent.
// These samples let you exercise the workspace without Genesys (Genesys page, or /pop?scenario=notice-paid&taxpayerId=).
// Every line is worded from the chosen taxpayer's record (lib/facts.js), so names, numbers and dates always match.

const { facts } = require('./facts');

function scenarios(brand, taxYear, t) {
  const f = facts(t, brand, taxYear);
  const A = brand.agency; const P = brand.portal; const bot = 'Pilot';
  const noticeUrl = brand.noticeResponseUrl || 'https://tax.ohio.gov/home/online-notice-response-service';
  const rf = f.refund; const nt = f.notice || { id: 'not on file', short: 'not on file', year: taxYear - 1, amount: '$0.00', amountSpoken: '$0' }; const pm = f.payment || { method: 'Check', isCheck: true, mailedShort: '', mailedSpoken: 'last month', mailedFull: 'last month' };
  const greet = { who: 'bot', text: `Thank you for calling the ${A}. My name is ${bot}. Before we get started, may I ask who I'm speaking with today?` };
  const auth = [
    { who: 'bot', text: 'Please enter the nine-digit Social Security number of the primary taxpayer shown first on your return.' },
    { who: 'event', kind: 'dtmf', text: `Caller entered SSN on keypad: ${f.ssnMasked}` },
    { who: 'bot', text: "Thank you. Now please enter the primary taxpayer's date of birth using two digits for the month, two digits for the day, and four digits for the year." },
    { who: 'event', kind: 'dtmf', text: `Caller entered date of birth on keypad: ${f.dobKeypad || 'on file'}` },
    { who: 'event', kind: 'verified', text: 'Identity verified ✓ (SSN and date of birth matched)' },
  ];
  // What Pilot says about the refund, from the record.
  let refundLines; let refundSummary; let refundSlots = {};
  if (!rf) {
    refundLines = [{ who: 'event', kind: 'data', text: `No ${taxYear} refund on file` }, { who: 'bot', text: `I don't see a refund on your ${taxYear} return. If you filed recently, it can take a few weeks to show in ${brand.refundTool}.` }];
    refundSummary = `Pilot verified ${f.full} by SSN and date of birth and found no ${taxYear} refund on file.`;
  } else {
    refundSlots = { 'Tax year': String(rf.year), 'Return received': rf.filed, 'Refund amount': rf.amount, 'Refund method': rf.method, 'Processing status': rf.returnStatus, ...(rf.doc ? { 'Documentation status': rf.doc } : {}) };
    const doc = rf.doc && /received/i.test(rf.doc);
    const statusLine = rf.hold ? `Your refund of ${rf.amount} is currently being held for ${rf.hold.toLowerCase()}.` : /issued/i.test(rf.status) ? `Your refund of ${rf.amount} was issued${rf.issued ? ` on ${rf.issued}` : ''} by ${rf.method.toLowerCase()}.` : `Your refund of ${rf.amount} is ${String(rf.status).toLowerCase()}.`;
    refundLines = [
      { who: 'event', kind: 'data', text: `${rf.year} return received ${rf.filed} · Refund ${rf.amount} by ${rf.method.toLowerCase()} · ${rf.returnStatus}${rf.doc ? ` · Documentation ${rf.doc.toLowerCase()}` : ''}` },
      { who: 'bot', text: `I found your return. ${statusLine}` },
      ...(doc ? [
        { who: 'cust', text: 'I already sent everything in. Do I need to send it again?' },
        { who: 'bot', text: 'No. I can see that your supporting documentation has been received, so you do not need to submit it again. It is currently awaiting review before your refund can continue processing.' },
        { who: 'cust', text: "Okay. So there's nothing else I need to do?" },
        { who: 'bot', text: "That's correct. No additional action is required from you at this time." },
      ] : [{ who: 'cust', text: 'Okay. Is there anything I need to do?' }, { who: 'bot', text: `You can check the latest status any time in ${brand.refundTool}. If anything else is needed, we'll send you a letter.` }]),
    ];
    refundSummary = `Pilot verified ${f.full} by SSN and date of birth and explained that the ${rf.year} refund of ${rf.amount} is ${rf.statusText}.${doc ? ' The documentation has been received, so no resubmission is needed.' : ''} Contained in the virtual agent, no transfer.`;
  }
  return [
    {
      id: 'refund-status', title: 'Refund status (contained by the virtual agent)', taxpayerId: t.id, caller: f.first, botName: bot,
      intent: 'Refund status', taxType: f.taxType, confidence: 97, outcome: 'Contained', queue: f.taxType,
      authenticated: true, authMethod: 'SSN and date of birth (keypad)', slots: refundSlots, summary: refundSummary,
      transcript: [
        greet, { who: 'cust', text: `I'm ${f.first}.` },
        { who: 'cust', text: "I'm trying to find out what's going on with my state tax refund. It's been several weeks." },
        { who: 'event', kind: 'intent', text: `Intent: Refund Status · Tax type: ${f.taxType} · Confidence: 97%` },
        { who: 'bot', text: `I can help you check the status of your ${brand.state} refund. Before I access your return, I'll need to verify your identity.` },
        ...auth,
        { who: 'bot', text: `Thank you, ${f.first}. I've verified your identity. Let me check your ${rf ? rf.year : taxYear} return.` },
        { who: 'event', kind: 'lookup', text: 'Checking refund status… (data action: Lookup taxpayer, refund status)' },
        ...refundLines,
        { who: 'cust', text: 'Okay, thank you.' },
        { who: 'bot', text: "You're welcome. Is there anything else I can do for you today?" },
        { who: 'event', kind: 'end', text: 'Contained by virtual agent · interaction logged to ServiceNow' },
      ],
    },
    {
      id: 'notice-paid', title: 'Notice for a payment already made (transfers to a live agent)', taxpayerId: t.id, caller: f.first, botName: bot,
      intent: 'Notice question: payment already made', taxType: f.taxType, confidence: 94, outcome: 'Transferred', queue: 'Taxpayer Services - Notices',
      authenticated: false, authMethod: '',
      slots: { 'Notice number': nt.short, 'Notice tax year': String(nt.year), 'Amount on notice': nt.amount, 'Caller says paid': 'Yes', 'Payment method': pm.isCheck ? 'Mailed check' : pm.method, 'Date mailed': pm.mailedShort, 'Canceled check image': "Caller doesn't know", 'Link shared': 'Respond to a Letter or Notice', 'Transfer reason': 'Caller asked for a live agent' },
      linksShared: [{ title: `${A}: Respond to a Letter or Notice`, url: noticeUrl }],
      summary: `${f.first}${t.type === 'Business' ? ` (${f.full})` : ''} received notice ${nt.short} for ${nt.year} showing ${nt.amount} owed. ${f.first} says it was paid by check mailed ${pm.mailedShort}, and isn't sure the canceled check image is available. Pilot explained how to respond online (${P}: Respond to a Letter or Notice > Submit Response) and texted the link. ${f.first} declined a walkthrough and asked for a live agent. Not yet identity verified.`,
      transcript: [
        greet, { who: 'cust', text: `I'm ${f.first}.` },
        { who: 'bot', text: `Nice to meet you, ${f.first}. How can I help you today?` },
        { who: 'cust', text: 'I received a notice in the mail saying I owe you money, but I already paid it.' },
        { who: 'event', kind: 'intent', text: `Intent: Notice question, payment already made · Tax type: ${f.taxType} · Confidence: 94%` },
        { who: 'bot', text: "Okay, let's get to the bottom of this. Which notice did you receive? There should be a notice number near the top right corner." },
        { who: 'cust', text: `It's ${nt.short.split('').join(', ')}.` },
        { who: 'bot', text: 'Thank you. And what tax year does the notice reference?' },
        { who: 'cust', text: `${nt.year}.` },
        { who: 'bot', text: 'And what is the exact amount the notice says you owe?' },
        { who: 'cust', text: `${nt.amountSpoken}.` },
        { who: 'bot', text: `Okay, thank you. You said you already paid the ${nt.amountSpoken}, correct?` },
        { who: 'cust', text: 'Yes.' },
        { who: 'bot', text: 'How did you make the payment? Was it online, by check, or another method?' },
        { who: 'cust', text: 'I mailed a check.' },
        { who: 'bot', text: 'Do you remember when you mailed the check?' },
        { who: 'cust', text: `${pm.mailedFull}.` },
        { who: 'bot', text: `Okay, ${pm.mailedSpoken}. Do you have an image of the canceled check from your bank showing that the payment cleared?` },
        { who: 'cust', text: "I don't know." },
        { who: 'bot', text: "No problem. To document that the payment was made and cleared, you'll want to obtain the front and back image of the canceled check from your bank. You should also have the notice you received and the full notice or letter ID available." },
        { who: 'cust', text: "Okay. Once I have that, what's the next step?" },
        { who: 'bot', text: `Once you have everything together, you can submit your response electronically through the ${A}'s online service. Go to "Respond to a Letter or Notice" and select "Submit Response." You'll want to have your full letter or notice ID, ${nt.id}, a copy of the notice, the front and back images of the canceled check, and any other supporting documentation.` },
        { who: 'cust', text: 'Okay. Can you send me a link to that website?' },
        { who: 'bot', text: `Absolutely. I can send you the ${A} link for responding to a letter or notice.` },
        { who: 'event', kind: 'link', text: `Link shared: Respond to a Letter or Notice · ${noticeUrl}` },
        { who: 'event', kind: 'link', text: `Written follow-up: For ${P}, choose "Respond to a Letter or Notice" → "Submit Response." Have your full letter ID and supporting documents ready.` },
        { who: 'bot', text: 'I can also walk you through the submission process one screen at a time. Would you like me to do that?' },
        { who: 'cust', text: 'Not right now, but thank you. Can you transfer me to a live agent?' },
        { who: 'bot', text: `Absolutely, ${f.first}. I'll transfer you to a live agent who can assist you further. I'll also pass along the information we've already discussed so you won't have to start over. Please hold while I connect you.` },
        { who: 'event', kind: 'end', text: 'Transferred to a live agent · context and transcript sent with the screen pop' },
      ],
    },
  ];
}

module.exports = { scenarios };
