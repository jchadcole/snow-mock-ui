/*
 * Builds the demo scenario (scripts, history, summaries) from a brand config.
 * Every customer-facing sentence lives here so a rebrand only touches brands.js.
 */
(function () {
  function merge(base, over) {
    if (!over) return JSON.parse(JSON.stringify(base));
    const out = Array.isArray(base) ? [] : {};
    const keys = new Set([...Object.keys(base || {}), ...Object.keys(over || {})]);
    keys.forEach(k => {
      const b = base ? base[k] : undefined, o = over[k];
      if (o === undefined) out[k] = JSON.parse(JSON.stringify(b === undefined ? null : b));
      else if (o && typeof o === 'object' && !Array.isArray(o) && b && typeof b === 'object' && !Array.isArray(b)) out[k] = merge(b, o);
      else out[k] = JSON.parse(JSON.stringify(o));
    });
    return out;
  }

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function fmtShort(d) { return `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`; }
  function fmtSlash(d) { return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`; }
  function fmtIso(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

  window.buildScenario = function (brandId) {
    const B = merge(window.BRANDS.haven, window.BRANDS[brandId] || {});
    const c = B.customer, a = B.agent, o = B.order, p = B.product, co = B.company, s2 = B.secondCustomer;
    const last3 = o.number.slice(-3);
    const today = new Date();
    const chatDay = addDays(today, -o.restockDays);
    const shippedDay = addDays(today, -14);
    const olderDay = addDays(today, -190);
    const restockDay = today;
    const pickupDay = addDays(today, B.pickup.daysFromNow);
    const store = B.stores[B.pickup.storeIndex];

    const D = {
      today: fmtShort(today), chatDay: fmtShort(chatDay), shippedDay: fmtShort(shippedDay),
      olderDay: fmtShort(olderDay), restockDay: fmtShort(restockDay), restockIso: fmtIso(restockDay),
      pickupSlash: fmtSlash(pickupDay), pickupShort: fmtShort(pickupDay), todayIso: fmtIso(today), restockLive: fmtShort(addDays(today, o.restockDays))
    };

    const S = { brand: B, dates: D };

    // ---- Virtual agent pre-chat (website chat) ----
    S.vaChat = [
      { from: 'bot', text: `Hi, I'm your Virtual Agent. Let me know how I can help you today.` },
      { from: 'bot', text: `What's your issue or request? Or take a look at what I can help with.` },
      { from: 'cust', text: 'Chat with Live Agent' },
      { from: 'bot', text: 'Please standby while I connect you with a live agent.' },
      { from: 'sys', text: `${a.name} joined the chat`, sub: `${D.today} 01:20 pm` }
    ];

    // ---- Live chat script: agent turns are offered as AI suggested replies ----
    S.chatScript = [
      { from: 'agent', text: `Hi ${c.first}, Thank you for contacting ${co}. I see you recently placed an order for ${o.shortTitle}, is this what you need assistance with?` },
      { from: 'cust', text: `Hi ${a.first}, Yes, the order has been delivered but the ${o.missingItem} is missing from the delivery.` },
      { from: 'agent', text: `We apologise for the inconvenience. I see that the specific ${o.missingItem} is in backorder. Let me see when it will be available for shipping.` },
      { from: 'cust', text: 'Thanks for checking.' },
      { from: 'agent', text: `Thank you for your patience. I see it will be back in stock in ${o.restockDays} days, which is when it will be shipped to you. It should arrive 3 to 5 days after that.`, gate: 'inventoryChecked' },
      { from: 'cust', text: `Could you please ensure it ships as soon as it's back in stock?` },
      { from: 'agent', text: `Absolutely. I've flagged your order so the ${o.missingItem} ships the day it arrives. Is there anything else I can help you with?` },
      { from: 'cust', text: `No, that's all. Thank you ${a.first}!` }
    ];

    S.chatSummary = `${c.name} contacted ${co} customer support regarding a missing ${o.missingItem} from the ${o.shortTitle} order. Agent checked the order status as backorder and informed ${c.first} that it will be available in ${o.restockDays} days for shipping. ${c.first} requested that it ship as early as possible.`;

    // ---- Second (parallel) chat ----
    S.anikaChat = [
      { from: 'bot', text: 'Please standby while I connect you with a live agent.' },
      { from: 'sys', text: `${a.name} joined the chat`, sub: `${D.today} 11:20 am` },
      { from: 'agent', text: `Hi ${s2.first}, Thank you for contacting ${co}. How can I help you today?` },
      { from: 'cust', text: `Hi ${a.first}, I placed an order for ${s2.productShort.toLowerCase().includes('heater') ? 'home room heater' : s2.productShort}, my order is not yet delivered, can you check when can I get it?` },
      { from: 'agent', text: 'We apologise for the inconvenience, let me check the status of your order.' },
      { from: 'cust', text: 'Thanks for checking.' },
      { from: 'agent', text: 'Thank you for your patience. I see that your order is shipped and currently is in-transit. You can expect the delivery in next 48 hrs.' },
      { from: 'cust', text: `Thank you so much I'll wait for it. You may end the chat now.` }
    ];

    // ---- Virtual agent voice self-service (before transfer) ----
    S.vaCall = [
      { from: 'va', text: `Hi ${c.first}. Thank you for calling ${co}. I pulled your most recent order using your phone number. Your current order, ${o.number}, is on back order. Is there anything else I can help you with?` },
      { from: 'cust', text: 'My order is missing an item.' },
      { from: 'va', text: 'Okay. Let me find the best available agent to help you.' }
    ];

    // ---- Live call transcript. `gate` holds the line until the agent does that step ----
    S.callScript = [
      { from: 'agent', text: `Hi, ${c.first}. Thank you for calling ${co}. My name is ${a.first} and it will be a pleasure to help you today. Are you calling in regards to the order ending with ${last3}?` },
      { from: 'cust', text: `Hi, ${a.first}. Yes, ${o.restockDays} days ago I was told the missing item was going to be back in stock and shipped immediately, but it has been ${o.restockDays} days and I have not received my ${o.missingItem}.` },
      { from: 'agent', text: `I understand ${c.first}, this is frustrating and apologies on behalf of ${co}. It was actually me who chatted with you ${o.restockDays} days ago, but rest assured I have all the information here and I'll find a solution. Let me check all the locations that have the ${o.missingItem} in stock.` },
      { from: 'agent', gate: 'storesChecked', text: `${c.first}, I see there's an ${o.missingItem} available near your home address. I could initiate a pickup request and as a bonus for your customer loyalty, I can give you ${B.bonusPoints.toLocaleString()} bonus points for ${co}. Would that work for you?` },
      { from: 'cust', text: `Yes, ${a.first}. That actually works for me.` },
      { from: 'agent', text: 'Amazing. Let me just confirm the location and the time for the pickup with you. Would you like me to send you the details by email?' },
      { from: 'cust', text: 'Yes, please.' },
      { from: 'agent', gate: 'pointsAdded', text: `${c.first}, you should have received an email with all the details about your pickup request and a notification on your phone that I have added ${B.bonusPoints.toLocaleString()} bonus points to your account. Is there anything else I can help you with today?` },
      { from: 'cust', text: `That's awesome, ${a.first}. Thank you very much.` }
    ];

    S.callSummary = `${c.name} contacted ${co} customer support regarding a missing ${o.missingItem} from the ${o.shortTitle} order. The customer chose to pick it up and received the pick-up PIN and instructions via email. ${B.bonusPoints.toLocaleString()} bonus points were rewarded to the customer to boost the customer's experience.`;

    S.email = {
      subject: `Your ${co} pickup request for order ${o.number}`,
      body:
`Hi ${c.first}! This is ${a.name} from ${co} Customer Support. We apologize for the missing ${o.missingItem} in your recent order. I have arranged the pick-up order for you.

Location: ${store.address}
Date: ${D.pickupSlash}
Time: ${B.pickup.time}
PIN code: ${B.pickup.pin}

Please show this code to the store staff when you arrive. The ${o.missingItem} will be ready for pick-up at the customer service desk. Thank you for your understanding and we hope to see you soon. Have a great day!`
    };

    // ---- Customer history (static part). Newer dynamic entries are added at runtime ----
    S.history = [
      { day: D.shippedDay, icon: 'sms', who: `SMS sent to <b>${c.name}</b>`, ref: 'IMS0000132', text: `Your order ${o.number} for ${o.shortTitle} has been shipped. please click here to track your order.`, ago: '14 days ago', more: true },
      { day: D.shippedDay, icon: 'cart', who: `<b>${c.name}</b> purchased a product`, ref: o.number, text: 'Return Policy For Items Purchased Online', ago: '15 days ago' },
      { day: D.shippedDay, icon: 'mail', who: `<b>${c.name}</b> purchased a product`, ref: o.number, text: 'Re: Order confirmation', ago: '15 days ago' },
      { day: D.shippedDay, icon: 'cart', who: `<b>${c.name}</b> purchased a product`, ref: o.number, sub: o.title, ago: '15 days ago' },
      { day: D.olderDay, icon: 'eye', who: `<b>${c.name}</b> viewed website page`, ref: 'IMS000987421', text: `${co} | Product page | Dining set`, ago: '6 mos ago' },
      { day: D.olderDay, icon: 'chat', who: `<b>${c.name}</b> chatted with  Jane Lim`, ref: 'IMS000111876', text: `[11:00] ${c.first}: Hi - I would like like to purchase a Dining set.`, ago: '6 mos ago', more: true, ai: `Customer needs help with purchasing a product online. Customer enquired for various furniture configurations. Agent helped with the right information and guidance.` }
    ];

    S.anikaHistory = [
      { day: D.shippedDay, icon: 'sms', who: `SMS sent to <b>${s2.name}</b>`, ref: 'IMS0000141', text: `Your order ${s2.orderNumber} for ${s2.product} has been shipped.`, ago: '2 days ago', more: true },
      { day: D.shippedDay, icon: 'cart', who: `<b>${s2.name}</b> purchased a product`, ref: s2.orderNumber, text: 'Return Policy For Items Purchased Online', ago: '5 days ago' },
      { day: D.shippedDay, icon: 'mail', who: `<b>${s2.name}</b> purchased a product`, ref: s2.orderNumber, text: 'Re: Order confirmation', ago: '5 days ago' },
      { day: D.olderDay, icon: 'eye', who: `<b>${s2.name}</b> viewed website page`, ref: 'IMS000987433', text: `${co} | Product page | ${s2.productShort}`, ago: '6 mos ago' }
    ];

    S.homeSchedule = [
      ['On Queue', '7:00 pm', '(1h 15m)', true], ['Break', '8:15 pm', '(15m)'], ['On Queue', '8:30 pm', '(1h 30m)'],
      ['Meal', '10:00 pm', '(1h)'], ['On Queue', '11:00 pm', '(2h 45m)'], ['Break', '1:45 am', '(15m)'],
      ['On Queue', '2:00 am', '(2h)'], ['Shift End', '4:00 am', '']
    ];
    return S;
  };
})();
