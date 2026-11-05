/*
 * Government tax-agency version of the story (brands with vertical: 'tax').
 * Same click path as the retail demo, re-told as a held income tax refund:
 *   chat: "where is my refund?" -> check refund status -> on hold for identity verification
 *   call: letter never arrived -> agent verifies identity and releases the refund
 *         -> emails confirmation -> next best action: switch refund to direct deposit
 */
window.applyTax = function (S, B, D) {
  const c = B.customer, a = B.agent, o = B.order, co = B.company, s2 = B.secondCustomer, tx = B.tax;
  const amt = tx.refundAmount;

  S.vaChat = [
    { from: 'bot', text: `Hi, I'm the ${co} virtual assistant. How can I help you today?` },
    { from: 'bot', text: 'You can ask about refunds, payments, forms or notices. Or take a look at what I can help with.' },
    { from: 'cust', text: 'Chat with Live Agent' },
    { from: 'bot', text: 'Please standby while I connect you with a live agent.' },
    { from: 'sys', text: `${a.name} joined the chat`, sub: `${D.today} 01:20 pm` }
  ];

  S.chatScript = [
    { from: 'agent', text: `Hi ${c.first}, thank you for contacting the ${co}. I see you filed your ${o.title}. Is this what you need assistance with?` },
    { from: 'cust', text: `Hi ${a.first}, yes. I filed back in ${tx.filedMonth} and I still haven't received my refund.` },
    { from: 'agent', text: `I'm sorry for the wait. Let me check the processing status of your return.` },
    { from: 'cust', text: 'Thanks for checking.' },
    { from: 'agent', gate: 'inventoryChecked', text: `Thank you for your patience. Your return is under identity verification review, and we mailed you an Identity Confirmation Quiz letter. Once you complete it, your refund is typically released within ${o.restockDays} days and arrives 3 to 5 days after that.` },
    { from: 'cust', text: 'Could you make sure it is processed as soon as I complete the quiz?' },
    { from: 'agent', text: `Absolutely. I've added a note to your account to expedite the refund once your identity is verified. Is there anything else I can help you with?` },
    { from: 'cust', text: `No, that's all. Thank you ${a.first}!` }
  ];

  S.chatSummary = `${c.name} contacted the ${co} about a missing refund for the ${o.title}. Agent found the refund on hold for identity verification and explained that an Identity Confirmation Quiz letter was mailed. The account was noted to expedite the refund once verification is complete.`;

  S.anikaChat = [
    { from: 'bot', text: 'Please standby while I connect you with a live agent.' },
    { from: 'sys', text: `${a.name} joined the chat`, sub: `${D.today} 11:20 am` },
    { from: 'agent', text: `Hi ${s2.first}, thank you for contacting the ${co}. How can I help you today?` },
    { from: 'cust', text: `Hi ${a.first}, I made an estimated payment last week but it doesn't show on my account yet. Can you check?` },
    { from: 'agent', text: 'Of course, let me look up that payment for you.' },
    { from: 'cust', text: 'Thanks for checking.' },
    { from: 'agent', text: 'Thank you for your patience. Your payment was received and is posting now. It will show on your OH|TAX eServices account within 48 hours.' },
    { from: 'cust', text: `Great, thank you so much. You may end the chat now.` }
  ];

  S.vaCall = [
    { from: 'va', text: `Hi ${c.first}. Thank you for calling the ${co}. I found your ${o.title} using your phone number. Your refund of ${amt} is on hold pending identity verification. Is there anything else I can help you with?` },
    { from: 'cust', text: 'I never got the letter to verify my identity.' },
    { from: 'va', text: 'Okay. Let me find the best available agent to help you.' }
  ];

  S.callScript = [
    { from: 'agent', text: `Hi, ${c.first}. Thank you for calling the ${co}. My name is ${a.first} and it will be a pleasure to help you today. Are you calling about the refund on your ${o.shortTitle}?` },
    { from: 'cust', text: `Hi, ${a.first}. Yes, ${o.restockDays} days ago I was told a letter was coming so I could verify my identity, but it never arrived and my refund is still on hold.` },
    { from: 'agent', text: `I understand ${c.first}, this is frustrating and I apologize. It was actually me who chatted with you ${o.restockDays} days ago, and I have all the information here. Let me check your return and see how we can verify your identity today.` },
    { from: 'agent', gate: 'storesChecked', text: `${c.first}, I see the letter was returned to us as undeliverable. I can verify your identity with you over the phone right now and release your refund. I can also switch it from a paper check to direct deposit so it arrives sooner. Would that work for you?` },
    { from: 'cust', text: `Yes, ${a.first}. That actually works for me.` },
    { from: 'agent', text: 'Great. Let me confirm a few details with you and release the refund. Would you like me to email you a confirmation?' },
    { from: 'cust', text: 'Yes, please.' },
    { from: 'agent', gate: 'pointsAdded', text: `${c.first}, you should have an email with your confirmation number, and your refund of ${amt} is now set for direct deposit. You can expect it within 5 to 7 business days. Is there anything else I can help you with today?` },
    { from: 'cust', text: `That's awesome, ${a.first}. Thank you very much.` }
  ];

  S.callSummary = `${c.name} called about a refund on hold for the ${o.title}. The Identity Confirmation Quiz letter was returned undeliverable. Agent verified the taxpayer's identity by phone, released the ${amt} refund (${tx.releaseRef}), updated the mailing address, switched the refund to direct deposit and emailed the confirmation.`;

  S.email = {
    subject: `${co}: refund release confirmation ${tx.releaseRef}`,
    body:
`Hi ${c.first}, this is ${a.name} from the ${co}. Thank you for verifying your identity with us today. Your refund has been released.

Return: ${o.title}
Refund amount: ${amt}
Refund method: Direct deposit (checking ••••${tx.acctLast4})
Expected deposit: within 5-7 business days
Confirmation number: ${tx.releaseRef}

You can track your refund any time with "Check a Refund" on our website or in OH|TAX eServices. Thank you for your patience, and have a great day!`
  };

  S.history = [
    { day: D.shippedDay, icon: 'mail', who: `Notice mailed to <b>${c.name}</b>`, ref: 'NTC0004127', text: 'Identity Confirmation Quiz letter (returned undeliverable)', ago: '14 days ago', more: true },
    { day: D.shippedDay, icon: 'eye', who: `<b>${c.name}</b> checked refund status`, ref: 'IMS0000132', text: `Check a Refund · Status: Under review`, ago: '15 days ago' },
    { day: D.olderDay, icon: 'box', who: `<b>${c.name}</b> filed a return`, ref: o.number, text: `${o.title} via OH|TAX eServices`, sub: `Refund requested ${amt}`, ago: '8 mos ago' },
    { day: D.olderDay, icon: 'chat', who: `<b>${c.name}</b> chatted with  Jane Lim`, ref: 'IMS000111876', text: `[11:00] ${c.first}: Hi - which school district tax form do I need?`, ago: '8 mos ago', more: true, ai: 'Taxpayer asked which school district income tax return to file. Agent used The Finder to confirm the district and pointed the taxpayer to form SD 100.' }
  ];
  S.anikaHistory = [
    { day: D.shippedDay, icon: 'cart', who: `<b>${s2.name}</b> made a payment`, ref: s2.orderNumber, text: 'Estimated payment · OH|TAX eServices', ago: '6 days ago' },
    { day: D.olderDay, icon: 'box', who: `<b>${s2.name}</b> filed a return`, ref: 'RTN24005512', text: '2024 Ohio IT 1040', ago: '8 mos ago' }
  ];

  S.ui = {
    consumerTitle: 'Taxpayer',
    metric: { label: 'Refund method', before: 'Paper check', after: `Direct deposit ••••${tx.acctLast4}`, star: false },
    productLabel: 'Tax return', portal: 'OH|TAX eServices', channelLabel: 'Filing method', channel: 'e-File',
    orderPill: 'Tax Return', orderLabels: ['Return ID', 'Taxpayer', 'Status', 'Filed', 'Refund status', 'Refund'],
    statusChat: 'Under review', statusCallBefore: 'Refund on hold', statusCallAfter: 'Refund on hold',
    invPending: 'On hold', invDone: 'On hold · ID verification', viewOrder: 'View Return',
    trChat: { title: 'Check refund status', desc: 'Help the taxpayer find out where their refund is.', b1: 'Check refund status', b2: 'Resend letter' },
    trCall: { title: 'Verify identity and release refund', desc: 'Identity letter was returned undeliverable. Verify the taxpayer by phone to release the held refund.', b1: 'Verify identity', menu: ['Verify identity', 'Check refund status', 'Resend ID letter'] },
    created: { title: 'Verify identity and release refund', refLabel: 'Refund release', ref: tx.releaseRef, toast: `Identity verified. Refund release ${tx.releaseRef} was created` },
    nba: {
      title: 'Switch refund to direct deposit', desc: 'The refund is set to paper check. Direct deposit typically arrives 5-7 days sooner.',
      btn: 'Switch to direct deposit', donePill: 'Refund method updated', toast: 'Refund method changed to direct deposit.',
      histWho: `Refund method changed for <b>${c.name}</b>`, histRef: 'ACC0007781'
    },
    category: 'Refund inquiry', subcategory: 'Identity verification', intent: 'Refund status', queue: 'Individual Income Tax',
    kb2: { title: 'Estimated payment posting', number: 'KB0020871', summary: 'Electronic payments post to the taxpayer account within 2 business days. Paper checks can take up to 3 weeks. Taxpayers can confirm posted payments in OH|TAX eServices.' },
    emailHist: S.email.subject
  };
};
