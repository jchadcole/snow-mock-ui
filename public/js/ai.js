/* Mock "Now Assist": rule-based answers, summaries and drafts generated from the record. No model calls, no network. */
(function () {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtD = (s) => s ? new Date(s.length === 10 ? s + 'T12:00:00' : s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const first = (t) => t.type === 'Business' ? (t.contact || t.businessName).split(' ')[0] : t.firstName;
  const heldRefund = (t) => t.returns.find((r) => r.refund && /hold/i.test(r.refund.status));
  const latestRefund = (t) => t.returns.filter((r) => r.refund).sort((a, b) => b.taxYear - a.taxYear)[0];

  function summary(t) {
    const parts = [];
    const lr = latestRefund(t);
    parts.push(`${esc(t.fullName)} is ${t.type === 'Business' ? 'a business taxpayer' : `an individual filer (${esc(t.filingStatus || 'filing status not set')})`}${t.language !== 'English' ? ` who prefers ${esc(t.language)}` : ''}.`);
    if (lr) parts.push(`The ${lr.taxYear} ${esc(lr.form)} refund of ${money(lr.refund.amount)} is <b>${esc(lr.refund.status.toLowerCase())}</b>${lr.refund.hold ? ` (${esc(lr.refund.hold.toLowerCase())})` : ''}, by ${esc(lr.refund.method.toLowerCase())}.`);
    if (t.balance > 0) parts.push(`Balance due: <b>${money(t.balance)}</b>${t.paymentPlan ? ` on payment plan ${esc(t.paymentPlan.id)}` : ''}.`);
    const ret = t.notices.find((n) => /undeliverable/i.test(n.status));
    if (ret) parts.push(`Notice ${esc(ret.letter)} (${esc(ret.type)}) was returned undeliverable; the address may be out of date.`);
    const due = t.notices.find((n) => n.due && !/resolved|paid|responded/i.test(n.status) && !/undeliverable/i.test(n.status));
    if (due) parts.push(`${esc(due.type)} response due ${fmtD(due.due)}.`);
    const doc = t.returns.find((r) => r.documentation);
    if (doc) parts.push(`Supporting documentation for ${doc.taxYear} was requested ${fmtD(doc.documentation.requested)} and <b>${esc(doc.documentation.status.toLowerCase())}</b> (received ${fmtD(doc.documentation.received)}); the taxpayer does not need to resend it.`);
    const unp = (t.unapplied || []).find((u) => /unapplied/i.test(u.status));
    if (unp) parts.push(`<b>Unapplied payment in suspense:</b> ${esc(unp.method)} for ${money(unp.amount)}, received ${fmtD(unp.received)} (${esc(unp.reason.toLowerCase())}).`);
    const bot = (t.botSessions || [])[0];
    if (bot) parts.push(`Most recent virtual agent contact: ${esc(bot.botName)}, ${esc(bot.intent.toLowerCase())}, ${esc(bot.outcome.toLowerCase())}.`);
    if (t.identity.status !== 'Verified') parts.push(`Identity is <b>not verified</b>; verify before discussing return details.`);
    if (t.representative) parts.push(`${esc(t.representative.name)} (${esc(t.representative.firm)}) holds a ${esc(t.representative.form)} power of attorney.`);
    const oc = t.cases.filter((c) => !['Resolved', 'Closed'].includes(c.state));
    if (oc.length) parts.push(`Open case${oc.length > 1 ? 's' : ''}: ${oc.map((c) => `${esc(c.number)} (${esc(c.shortDescription)})`).join(', ')}.`);
    const lastContact = t.activities.find((a) => ['Chat', 'Phone', 'Email'].includes(a.type));
    if (lastContact) parts.push(`Last contact: ${esc(lastContact.type.toLowerCase())} on ${fmtD(lastContact.date)}, "${esc(lastContact.subject)}".`);
    return parts.join(' ');
  }

  function suggestions(t) {
    if (!t) return ['What should I work on next?', 'Summarize my open cases', 'How long do refunds take?'];
    const s = ['Summarize this taxpayer'];
    if (latestRefund(t)) s.push('Where is the refund?');
    if (t.balance > 0) s.push('What do they owe?');
    if (t.notices.length) s.push('What notices were sent?');
    if ((t.unapplied || []).length) s.push('Did we receive the check?');
    s.push('Draft an email to the taxpayer');
    return s;
  }

  function answer(q, t, ctx = {}) {
    const ql = q.toLowerCase();
    if (!t) {
      if (/refund/.test(ql)) return { html: '<p>E-filed returns with direct deposit are usually processed within 15 business days; paper returns take 8-10 weeks. Returns selected for identity or wage review take longer.</p>', sources: ['KB0020416'] };
      if (/case|work|next/.test(ql)) { const c = ctx.cases || []; return { html: c.length ? `<p>You have ${c.length} open case${c.length > 1 ? 's' : ''}. Highest priority first:</p><ul>${c.slice().sort((a, b) => a.priority.localeCompare(b.priority)).map((x) => `<li><b>${esc(x.number)}</b> ${esc(x.shortDescription)} (${esc(x.taxpayerName)}, ${esc(x.state.toLowerCase())})</li>`).join('')}</ul>` : '<p>No open cases are assigned to you.</p>' }; }
      return { html: '<p>Open a taxpayer record and I can summarize it, explain refunds, balances and notices, or draft an email.</p>' };
    }
    if (/summar|overview|tell me/.test(ql)) return { html: `<p>${summary(t)}</p>` };
    if (/refund|where/.test(ql)) {
      const r = latestRefund(t); if (!r) return { html: `<p>${esc(t.fullName)} has no refund on recent returns.</p>` };
      const steps = r.steps.map((s) => `<li>${esc(s.name)}: ${esc(s.status)}${s.date ? ` (${fmtD(s.date)})` : ''}</li>`).join('');
      let next = '';
      if (/hold/i.test(r.refund.status)) next = t.identity.status !== 'Verified' ? '<p><b>Next step:</b> verify identity by phone (Identity tab or the recommendation), then release the refund.</p>' : '<p><b>Next step:</b> identity is verified, so you can release the refund now.</p>';
      if (r.refund.offset) next = `<p>${money(r.refund.offset.amount)} was offset to ${esc(r.refund.offset.agency)}; the taxpayer must contact that agency about the offset.</p>`;
      return { html: `<p>The ${r.taxYear} ${esc(r.form)} refund of ${money(r.refund.amount)} is <b>${esc(r.refund.status.toLowerCase())}</b>.</p><ul>${steps}</ul>${next}`, sources: ['KB0020416', /hold/i.test(r.refund.status) ? 'KB0020415' : null].filter(Boolean) };
    }
    if (/owe|balance|bill|pay/.test(ql)) {
      if (!(t.balance > 0)) return { html: `<p>${esc(t.fullName)} has no balance due.</p>` };
      return { html: `<p>Balance due: <b>${money(t.balance)}</b>.</p><ul>${t.assessments.filter((a) => a.balance > 0).map((a) => `<li>${esc(a.taxType)} ${esc(a.period)}: tax ${money(a.assessed)}, penalty ${money(a.penalty)}, interest ${money(a.interest)}, paid ${money(a.paid)}, due ${fmtD(a.due)}</li>`).join('')}</ul><p>Options: pay in full, or a payment plan of up to 24 months (about ${money(t.balance / 12)} a month over 12 months).</p>`, sources: ['KB0020417', 'KB0020418'] };
    }
    if (/suspense|unapplied|already paid|check/.test(ql)) { const u = (t.unapplied || [])[0]; return { html: u ? `<p>${esc(u.method)} for ${money(u.amount)} was mailed ${fmtD(u.mailed)} and received ${fmtD(u.received)}. Status: <b>${esc(u.status)}</b>. ${/unapplied/i.test(u.status) ? 'Apply it from Balances & payments to clear the balance and resolve the notice.' : ''}</p>` : '<p>No unapplied payments found.</p>', sources: ['KB0020426'] }; }
    if (/notice|letter/.test(ql)) return { html: t.notices.length ? `<ul>${t.notices.map((n) => `<li><b>${esc(n.letter)}</b> ${esc(n.type)}, ${fmtD(n.date)}: ${esc(n.status)}${n.due ? `, due ${fmtD(n.due)}` : ''}</li>`).join('')}</ul>` : '<p>No notices on file.</p>' };
    if (/email|draft|reply/.test(ql)) { const d = draftEmail(t, [], ctx.brand || {}); return { html: `<p><b>${esc(d.subject)}</b></p><p style="white-space:pre-wrap">${esc(d.body)}</p><p class="small">Use Compose > Email to send it.</p>` }; }
    if (/poa|represent|attorney/.test(ql)) return { html: t.representative ? `<p>${esc(t.representative.name)} of ${esc(t.representative.firm)} holds a ${esc(t.representative.form)} for ${esc(t.representative.scope.toLowerCase())}, expiring ${fmtD(t.representative.expires)}.</p>` : '<p>No representative on file.</p>', sources: ['KB0020421'] };
    return { html: `<p>${summary(t)}</p>` };
  }

  function draftEmail(t, outcomes, brand) {
    const name = first(t); const agency = brand.agency || 'the Department';
    const lines = [];
    const rel = t.returns.find((r) => r.refund && r.refund.status === 'Released');
    if (rel) lines.push(`Thank you for verifying your identity with us today. Your ${rel.taxYear} refund has been released.\n\nReturn: ${rel.id} (${rel.form})\nRefund amount: ${money(rel.refund.amount)}\nRefund method: ${rel.refund.method}${t.bank && rel.refund.method === 'Direct deposit' ? ` (${t.bank.type} ••••${t.bank.last4})` : ''}\nExpected by: ${fmtD(rel.refund.expected)}\nConfirmation number: ${rel.refund.releaseId}`);
    if (t.paymentPlan) lines.push(`Your payment plan ${t.paymentPlan.id} is set up: ${t.paymentPlan.months} monthly payments of ${money(t.paymentPlan.monthly)}, first due ${fmtD(t.paymentPlan.firstDue)}${t.paymentPlan.autopay ? ', paid automatically from your bank account' : ''}.`);
    const pay = t.payments.find((p) => p.date === (window.MOCK_TODAY || ''));
    if (pay) lines.push(`We received your payment of ${money(pay.amount)} (confirmation ${pay.confirmation}).${t.balance > 0 ? ` Your remaining balance is ${money(t.balance)}.` : ' Your balance is now paid in full.'}`);
    const applied = (t.unapplied || []).find((u) => /^applied/i.test(u.status));
    if (applied) { const n = t.notices.find((x) => /payment applied/i.test(x.status)); lines.push(`Thank you for your patience. We located your ${applied.method.replace(/^Check/, 'check')} for ${money(applied.amount)}, received ${fmtD(applied.received)}. It has now been applied to your ${n ? n.taxYear + ' ' : ''}balance${n ? `, and notice ${n.id} is resolved` : ''}. Your balance is ${t.balance > 0 ? money(t.balance) : 'now $0.00'}, and you do not need to send a response or a copy of the canceled check.`); }
    const paidNotice = !applied && (t.unapplied || []).some((u) => /unapplied/i.test(u.status)) && t.notices.find((n) => n.amount && /mailed/i.test(n.status));
    if (paidNotice) lines.push(`To respond to notice ${paidNotice.id}, go to ${brand.portal || 'our online services'}, choose "Respond to a Letter or Notice" and then "Submit Response." Have your full notice ID, a copy of the notice and front-and-back images of the canceled check ready.\n\nRespond to a Letter or Notice: https://tax.ohio.gov/home/online-notice-response-service`);
    const resent = t.notices.find((n) => /re-sent/i.test(n.status));
    if (resent && !rel) lines.push(`We have re-sent your ${resent.type} (${resent.letter}).${resent.due ? ` Please respond by ${fmtD(resent.due)}.` : ''}`);
    const ext = t.notices.find((n) => n.status === 'Extended');
    if (ext) lines.push(`We extended the due date for your ${ext.type} to ${fmtD(ext.due)}. You can upload documents in ${brand.portal || 'our online portal'}.`);
    if (!lines.length) {
      const lr = latestRefund(t);
      lines.push(lr ? `Here is an update on your ${lr.taxYear} return. Your refund of ${money(lr.refund.amount)} is ${lr.refund.status.toLowerCase()}.` : 'Thank you for contacting us today. Here is a summary of our conversation.');
    }
    return {
      subject: rel ? `${agency}: refund release confirmation ${rel.refund.releaseId}` : applied ? `${agency}: your payment has been applied` : `${agency}: follow-up on your account`,
      body: `Hi ${name}, this is ${outcomes.agent || 'your agent'} from the ${agency}.\n\n${lines.join('\n\n')}\n\nYou can check your account any time in ${brand.portal || 'our online portal'}${brand.refundTool ? ` or with ${brand.refundTool} on our website` : ''}. Thank you, and have a great day!`,
    };
  }

  function wrapSummary(t, ix, brand) {
    const o = (ix.outcomes || []).map((x) => x.text);
    const why = ix.intent ? `about ${ix.intent.toLowerCase()}` : 'with a question about their account';
    const verified = ix.verified ? ' Identity was verified by phone.' : '';
    const done = o.length ? ` Agent actions: ${o.join('; ')}.` : ' No account changes were made.';
    const bot = ix.bot ? ` Transferred from ${ix.bot.botName} (virtual agent) with context: ${Object.entries(ix.bot.slots || {}).map(([k, v]) => `${k.toLowerCase()} ${v}`).join(', ')}.` : '';
    return `${t.fullName} contacted the ${brand.agency || 'Department'} by ${ix.mediaType === 'voice' ? 'phone' : ix.mediaType || 'phone'} ${why}.${bot}${verified}${done}`;
  }

  // Scripted live transcript for the main demo caller. Lines with `gate` wait until that outcome happens.
  function transcript(t, brand, agentFirst, ix) {
    if (t.id === 'tp-1010' && ix && ix.bot && ix.bot.scenario === 'notice-paid') {
      const n = t.notices.find((x) => x.id === 'NTC0001234') || {}; const u = (t.unapplied || [])[0] || {};
      return [
        { who: 'agent', text: `Hi Tom, this is ${agentFirst} with the ${brand.agency}. Pilot passed along everything you discussed: notice 1234 for ${n.taxYear || ''}, the $2,200 balance, and the check you mailed on July 1st. You won't need to repeat any of that. Before I look at your account, can you confirm your date of birth and the last four of your Social Security number?` },
        { who: 'cust', text: "Sure. It's March 22nd, 1978, and the last four are 6789." },
        { who: 'agent', gate: 'identity', text: `Thank you, Tom, you're verified. Good news: I found your check. We received it on ${fmtD(u.received)}, but there was no payment voucher or notice number with it, so it was held in suspense instead of being applied to your ${n.taxYear || ''} balance. I'm applying it now.` },
        { who: 'agent', gate: 'apply', text: "Done. Your $2,200 check is applied, your balance is now zero and notice 1234 is resolved. You don't need to get the canceled check from your bank or submit a response online. Would you like an email confirming that?" },
        { who: 'cust', text: "Yes, please. That's a relief." },
        { who: 'agent', gate: 'email', text: "I've sent it to the email on file. Is there anything else I can help you with today?" },
        { who: 'cust', text: "No, that's everything. Thank you." },
      ];
    }
    if (t.id !== 'tp-1001') return null;
    const r = t.returns[0]; const amt = money(r.refund ? r.refund.amount : 0);
    return [
      { who: 'agent', text: `Hi, ${t.firstName}. Thank you for calling the ${brand.agency}. My name is ${agentFirst} and it will be a pleasure to help you today. Are you calling about the refund on your ${r.taxYear} ${r.form}?` },
      { who: 'cust', text: `Hi, ${agentFirst}. Yes, four days ago I was told a letter was coming so I could verify my identity, but it never arrived and my refund is still on hold.` },
      { who: 'agent', text: `I understand, ${t.firstName}, this is frustrating and I apologize. It was actually me who chatted with you four days ago, and I have all the information here. I can verify your identity with you right now. Can you confirm your date of birth and the last four of your Social Security number?` },
      { who: 'cust', text: `Sure, it's April 12th, 1989, and the last four are 4471.` },
      { who: 'agent', gate: 'identity', text: `Thank you, you're verified. I see the letter went to your old address on Old Mill Road, which is why it never reached you. Your current address on Neil Avenue is on file, and I'm releasing your refund of ${amt} now.` },
      { who: 'agent', gate: 'release', text: `Your refund is released. It's set to a paper check, but I can switch it to direct deposit so it arrives about a week sooner. Would that work for you?` },
      { who: 'cust', text: `Yes, ${agentFirst}. That actually works for me.` },
      { who: 'agent', gate: 'dd', text: `Done. Would you like me to email you a confirmation?` },
      { who: 'cust', text: 'Yes, please.' },
      { who: 'agent', gate: 'email', text: `${t.firstName}, you should have an email with your confirmation number, and your refund of ${amt} is now going by direct deposit within 5 to 7 business days. Is there anything else I can help you with today?` },
      { who: 'cust', text: `That's awesome, ${agentFirst}. Thank you very much.` },
    ];
  }

  window.MockAI = { summary, suggestions, answer, draftEmail, wrapSummary, transcript };
})();
