'use strict';
// Sample Pilot virtual agent (Genesys AVA) sessions for the Ohio tax demo, built from the customer's call scripts.
// The bot itself runs in Genesys Cloud. In a live setup Genesys posts each session with genesys/log-bot-session.json:
//   contained   -> logged on the taxpayer record as a contained virtual agent interaction (no agent)
//   transferred -> logged, then the screen pop (same conversationId) shows Pilot's context and transcript to the agent.
// These samples let you exercise the workspace without Genesys (Genesys page, or /pop?scenario=notice-paid).

function scenarios(brand, taxYear) {
  const A = brand.agency; const P = brand.portal; const TY = taxYear; const R = TY + 1;
  const bot = 'Pilot';
  return [
    {
      id: 'refund-status', title: 'Refund status (contained by the virtual agent)', taxpayerId: 'tp-1010', caller: 'Tom', botName: bot,
      intent: 'Refund status', taxType: 'Individual Income Tax', confidence: 97, outcome: 'Contained', queue: 'Individual Income Tax',
      authenticated: true, authMethod: 'SSN and date of birth (keypad)',
      slots: { 'Tax year': String(TY), 'Return received': `Apr 14, ${R}`, 'Refund amount': '$842.17', 'Refund method': 'Direct deposit', 'Processing status': 'Additional information required', Notice: 'Supporting documentation required', 'Documentation status': 'Received - awaiting review' },
      summary: `Pilot verified Tom Harper by SSN and date of birth and explained that the ${TY} refund of $842.17 is held while supporting documentation is reviewed. The documentation has been received, so no resubmission or other action is needed. Contained in the virtual agent, no transfer.`,
      transcript: [
        { who: 'bot', text: `Thank you for calling the ${A}. My name is ${bot}. Before we get started, may I ask who I'm speaking with today?` },
        { who: 'cust', text: "I'm Tom." },
        { who: 'cust', text: "I'm trying to find out what's going on with my state tax refund. It's been several weeks." },
        { who: 'event', kind: 'intent', text: 'Intent: Refund Status · Tax type: Individual Income Tax · Confidence: 97%' },
        { who: 'bot', text: `I can help you check the status of your ${brand.state} individual income tax refund. Before I access your return, I'll need to verify your identity.` },
        { who: 'bot', text: 'Please enter the nine-digit Social Security number of the primary taxpayer shown first on your return.' },
        { who: 'event', kind: 'dtmf', text: 'Caller entered SSN on keypad: ***-**-6789' },
        { who: 'bot', text: "Thank you. Now please enter the primary taxpayer's date of birth using two digits for the month, two digits for the day, and four digits for the year." },
        { who: 'event', kind: 'dtmf', text: 'Caller entered date of birth on keypad: 03/22/1978' },
        { who: 'event', kind: 'verified', text: 'Identity verified ✓ (SSN and date of birth matched)' },
        { who: 'bot', text: `Thank you. I've verified your identity. Let me check your ${TY} ${brand.state} individual income tax return.` },
        { who: 'event', kind: 'lookup', text: 'Checking refund status… (data action: Lookup taxpayer, refund status)' },
        { who: 'event', kind: 'data', text: `${TY} return received Apr 14, ${R} · Refund $842.17 by direct deposit · Additional information required · Documentation received, awaiting review` },
        { who: 'bot', text: 'I found your return. Your refund is currently being held while supporting documentation is reviewed.' },
        { who: 'cust', text: 'I already sent everything in. Do I need to send it again?' },
        { who: 'bot', text: 'No. I can see that your supporting documentation has been received, so you do not need to submit it again. It is currently awaiting review before your refund can continue processing.' },
        { who: 'cust', text: "Okay. So there's nothing else I need to do?" },
        { who: 'bot', text: "That's correct. No additional action is required from you at this time. Your documentation has been received and your return will continue processing once the review is complete." },
        { who: 'cust', text: 'Okay, thank you.' },
        { who: 'bot', text: "You're welcome. Is there anything else I can do for you today?" },
        { who: 'event', kind: 'end', text: 'Contained by virtual agent · interaction logged to ServiceNow' },
      ],
    },
    {
      id: 'notice-paid', title: 'Notice for a payment already made (transfers to a live agent)', taxpayerId: 'tp-1010', caller: 'Tom', botName: bot,
      intent: 'Notice question: payment already made', taxType: 'Individual Income Tax', confidence: 94, outcome: 'Transferred', queue: 'Taxpayer Services - Notices',
      authenticated: false, authMethod: '',
      slots: { 'Notice number': '1234', 'Notice tax year': String(TY - 1), 'Amount on notice': '$2,200.00', 'Caller says paid': 'Yes', 'Payment method': 'Mailed check', 'Date mailed': `Jul 1, ${R}`, 'Canceled check image': "Caller doesn't know", 'Link shared': 'Respond to a Letter or Notice', 'Transfer reason': 'Caller asked for a live agent' },
      linksShared: [{ title: `${A}: Respond to a Letter or Notice`, url: 'https://tax.ohio.gov/home/online-notice-response-service' }],
      summary: `Tom received notice 1234 for ${TY - 1} saying he owes $2,200.00. He says he paid it by check mailed Jul 1, ${R}, and doesn't know if he has the canceled check image. Pilot explained how to respond online (${P}: Respond to a Letter or Notice > Submit Response) and texted the link. Tom declined a walkthrough and asked for a live agent. Not yet identity verified.`,
      transcript: [
        { who: 'bot', text: `Thank you for calling the ${A}. My name is ${bot}. Before we get started, may I ask who I'm speaking with today?` },
        { who: 'cust', text: "I'm Tom." },
        { who: 'bot', text: 'Nice to meet you, Tom. How can I help you today?' },
        { who: 'cust', text: 'I received a notice in the mail saying I owe you money, but I already paid it.' },
        { who: 'event', kind: 'intent', text: 'Intent: Notice question, payment already made · Tax type: Individual Income Tax · Confidence: 94%' },
        { who: 'bot', text: "Okay, let's get to the bottom of this. Which notice did you receive? There should be a notice number near the top right corner." },
        { who: 'cust', text: 'One, two, three, four.' },
        { who: 'bot', text: 'Thank you. And what tax year does the notice reference?' },
        { who: 'cust', text: String(TY - 1) + '.' },
        { who: 'bot', text: 'And what is the exact amount the notice says you owe?' },
        { who: 'cust', text: '$2,200.' },
        { who: 'bot', text: 'Okay, thank you. You said you already paid the $2,200, correct?' },
        { who: 'cust', text: 'Yes.' },
        { who: 'bot', text: 'How did you make the payment? Was it online, by check, or another method?' },
        { who: 'cust', text: 'I mailed a check.' },
        { who: 'bot', text: 'Do you remember when you mailed the check?' },
        { who: 'cust', text: `July 1st, ${R}.` },
        { who: 'bot', text: 'Okay, July 1st. Do you have an image of the canceled check from your bank showing that the payment cleared?' },
        { who: 'cust', text: "I don't know." },
        { who: 'bot', text: "No problem. To document that the payment was made and cleared, you'll want to obtain the front and back image of the canceled check from your bank. You should also have the notice you received and the full notice or letter ID available." },
        { who: 'cust', text: "Okay. Once I have that, what's the next step?" },
        { who: 'bot', text: `Once you have everything together, you can submit your response electronically through the ${A}'s online service. Go to "Respond to a Letter or Notice" and select "Submit Response." You'll want to have your full letter or notice ID, a copy of the notice, the front and back images of the canceled check, and any other supporting documentation. You can upload those documents with your response and include the payment date and amount.` },
        { who: 'cust', text: 'Okay. Can you send me a link to that website?' },
        { who: 'bot', text: `Absolutely. I can send you the ${A} link for responding to a letter or notice.` },
        { who: 'event', kind: 'link', text: 'Link shared: Respond to a Letter or Notice · https://tax.ohio.gov/home/online-notice-response-service' },
        { who: 'event', kind: 'link', text: `Written follow-up: For ${P}, choose "Respond to a Letter or Notice" → "Submit Response." Have your full letter ID and supporting documents ready.` },
        { who: 'bot', text: 'I can also walk you through the submission process one screen at a time. Would you like me to do that?' },
        { who: 'cust', text: 'Not right now, but thank you. Can you transfer me to a live agent?' },
        { who: 'bot', text: "Absolutely, Tom. I'll transfer you to a live agent who can assist you further. I'll also pass along the information we've already discussed so you won't have to start over. Please hold while I connect you." },
        { who: 'event', kind: 'end', text: 'Transferred to a live agent · context and transcript sent with the screen pop' },
      ],
    },
  ];
}

module.exports = { scenarios };
