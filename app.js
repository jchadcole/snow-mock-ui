/* ServiceNow-style agent workspace mock for Genesys + ServiceNow demo videos. */
(function () {
  const params = new URLSearchParams(location.search);
  const BRAND_ID = params.get('brand') || 'haven';
  const AUTO = params.get('auto') !== '0';
  const S = window.buildScenario(BRAND_ID);
  const B = S.brand;
  const C = B.customer, A = B.agent, O = B.order, P = B.product, S2 = B.secondCustomer;

  // ---------- theme ----------
  const root = document.documentElement.style;
  const t = B.theme;
  root.setProperty('--nav', t.nav); root.setProperty('--nav-text', t.navText); root.setProperty('--accent', t.accent);
  root.setProperty('--accent-soft', t.accentSoft); root.setProperty('--hl', t.highlight);
  root.setProperty('--rail-top', t.railTop); root.setProperty('--rail-bottom', t.railBottom);
  document.title = `${B.company} | ${B.workspaceName}`;

  // ---------- icons ----------
  const IC = {
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    inbox: '<path d="M4 4h16v12H4z"/><path d="M4 13h5l1.5 2h3L15 13h5"/><path d="M9 20h6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    bell: '<path d="M6 8a6 6 0 1112 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 004 0"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 015 .5c0 1.5-2.5 2-2.5 3.5M12 17h.01"/>',
    chat: '<path d="M21 12a8 8 0 01-11.5 7.2L4 20l1-4.5A8 8 0 1121 12z"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2"/>',
    hang: '<path d="M3 15c5-5 13-5 18 0l-2.5 2.5-3-1.5v-2.5a10 10 0 00-7 0V16l-3 1.5z"/>',
    grid: '<path d="M5 5h2v2H5zM11 5h2v2h-2zM17 5h2v2h-2zM5 11h2v2H5zM11 11h2v2h-2zM17 11h2v2h-2zM5 17h2v2H5zM11 17h2v2h-2zM17 17h2v2h-2z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/>',
    rec: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5" fill="currentColor"/>',
    xfer: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2"/><path d="M15 3h6v6M21 3l-6 6"/>',
    hold: '<path d="M9 5v14M15 5v14"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" fill="currentColor" stroke="none"/>',
    pencil: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    dots: '<circle cx="12" cy="5" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="19" r="1.3" fill="currentColor"/>',
    dotsh: '<circle cx="5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="19" cy="12" r="1.3" fill="currentColor"/>',
    filter: '<path d="M4 5h16l-6 8v5l-4 2v-7z"/>',
    cal: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    down: '<path d="M6 9l6 6 6-6"/>',
    left: '<path d="M15 6l-6 6 6 6"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" fill="currentColor" stroke="none"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" fill="currentColor" stroke="none"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    sms: '<path d="M21 12a8 8 0 01-11.5 7.2L4 20l1-4.5A8 8 0 1121 12z"/><path d="M8 12h.01M12 12h.01M16 12h.01"/>',
    cart: '<path d="M3 4h2l2.4 11h11L21 7H6.2"/><circle cx="9" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    wrench: '<path d="M14.5 5.5a4 4 0 005 5L13 17l-4 4-3-3 4-4 6.5-6.5"/>',
    box: '<path d="M3 7l9-4 9 4-9 4z"/><path d="M3 7v10l9 4 9-4V7M12 11v10"/>',
    book: '<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 19V5"/>',
    up: '<path d="M7 11v9H4v-9zM7 11l4-8a2 2 0 012 2v4h6a2 2 0 012 2l-2 7a2 2 0 01-2 2H7"/>',
    dn: '<path d="M7 13V4H4v9zM7 13l4 8a2 2 0 002-2v-4h6a2 2 0 002-2l-2-7a2 2 0 00-2-2H7"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/>',
    refresh: '<path d="M20 11a8 8 0 10-2.3 5.7M20 4v7h-7"/>',
    send: '<path d="M4 12l16-8-6 16-3-7z"/>',
    smile: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4 4 0 007 0M9 9.5h.01M15 9.5h.01"/>',
    clip: '<path d="M20 11l-8.5 8.5a5 5 0 01-7-7L13 4a3.3 3.3 0 014.7 4.7l-8.5 8.5a1.7 1.7 0 01-2.4-2.4L15 7"/>',
    people: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2A5 5 0 0121.5 19"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
    gift: '<rect x="3" y="8" width="18" height="5"/><path d="M5 13v8h14v-8M12 8v13M12 8S10 3 7.5 4.5 9 8 12 8zM12 8s2-5 4.5-3.5S15 8 12 8z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>',
    bolt: '<path d="M13 3L5 13h6l-1 8 8-10h-6z"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    route: '<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H16a3 3 0 000-6H8a3 3 0 010-6h7.5"/>',
    max: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    min: '<path d="M5 12h14"/>',
    store: '<path d="M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9h16M9 20v-6h6v6"/>',
    attach: '<path d="M8 4h8l4 4v12H8z"/><path d="M16 4v4h4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>'
  };
  const ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24">${IC[n] || ''}</svg>`;
  const COLORS = ['#b2367a', '#2a5db0', '#a86a00', '#2e8540', '#6b52c8', '#1a7c8c', '#c3243a'];
  const avatar = (ini, cls = '', seed) => { const h = [...(seed || ini)].reduce((a, ch) => a + ch.charCodeAt(0), 0); return `<span class="avatar ${cls}" style="background:${COLORS[h % COLORS.length]}">${ini}</span>`; };
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

  const CUST = {
    c: { ...C, subject: 'Missing item in my recent order', product: P.name, productShort: P.short, orderNumber: O.number },
    s2: { ...S2, language: 'En', device: 'Mobile', timezone: 'USA / Texas' }
  };

  // ---------- state ----------
  let st;
  let timers = [];
  const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };

  function baseState() {
    return {
      scene: 'chat', presence: 'Offline', inboxOpen: true, inbox: [], menu: null,
      tabs: [{ id: 'home', kind: 'home' }], active: 'home', homeTab: 'Overview',
      ix: {}, points: C.points, pointsHistory: C.pointsHistory.slice(), bump: false,
      extraHistory: [], toast: null, compose: null, director: params.get('director') === '1',
      productMode: 'backorder', chat1Done: false, rung: {}
    };
  }

  function newChat(id, who) {
    const isC = who === 'c';
    return {
      id, type: 'chat', who, number: isC ? 'IMS00008768' : 'IMS00008766',
      subject: isC ? CUST.c.subject : S2.subject,
      log: (isC ? S.vaChat : []).map(m => ({ ...m })), idx: 0, typing: false, ended: false,
      draft: '', subtab: 'customer', center: 'record', summary: '', summaryTyping: false,
      gates: {}, saved: false
    };
  }
  function newCall() {
    return {
      id: 'call1', type: 'call', who: 'c', number: 'IMS10801021', subject: CUST.c.subject,
      start: Date.now(), ended: false, endAt: null, ltab: 'customer', subtab: 'customer', center: 'record',
      transcript: [], idx: 0, gates: {}, rec: 'list', pickup: { store: B.pickup.storeIndex, date: S.dates.pickupSlash, time: B.pickup.time, step: 1, created: false, open: false },
      emailSent: false, pointsAdded: false, nbaDismissed: false, refundDismissed: false, muted: false, held: false,
      wrapCode: 'Solved by agent', notes: '', notesTyping: false, saved: false, state: 'Work in progress'
    };
  }

  function setScene(scene) {
    timers.forEach(clearTimeout); timers = [];
    st = baseState();
    st.scene = scene;
    if (scene === 'call' || scene === 'call-live') {
      st.presence = 'Available'; st.chat1Done = true; st.productMode = 'stores'; st.inboxOpen = false;
      const an = newChat('anika', 's2');
      an.log = S.anikaChat.map(m => ({ ...m })); an.idx = 99;
      st.ix.anika = an;
      st.tabs.push({ id: 'anika', kind: 'ix' });
      st.active = 'anika';
      if (scene === 'call-live') { st.inbox = []; acceptItem('call1', true); }
      else if (AUTO) later(() => ring('call1'), 4000);
    } else if (scene === 'home') {
      st.presence = 'Available'; st.inboxOpen = false; st.chat1Done = true; st.productMode = 'stores';
    }
    render();
  }

  // ---------- inbox ----------
  function ring(id) {
    if (st.rung[id] || st.ix[id]) return;
    st.rung[id] = true;
    const item = id === 'call1'
      ? { id, type: 'call', name: C.name, sub: CUST.c.subject, ref: `Phone ${'IMS10801021'}`, org: B.company, remaining: 30 }
      : { id, type: 'chat', name: C.name, sub: CUST.c.subject, ref: `Chat IMS00008768`, org: B.company, remaining: 30 };
    st.inbox.push(item); st.inboxOpen = true; render();
  }
  function acceptItem(id, silent) {
    st.inbox = st.inbox.filter(i => i.id !== id);
    if (id === 'chat1') {
      st.ix.chat1 = newChat('chat1', 'c');
      st.tabs.push({ id: 'chat1', kind: 'ix' });
      st.active = 'chat1';
      later(() => render(), 400);
    } else if (id === 'call1') {
      st.ix.call1 = newCall();
      st.tabs = st.tabs.filter(tb => tb.id !== 'call1');
      st.tabs.push({ id: 'call1', kind: 'ix' });
      st.active = 'call1';
      if (st.ix.anika) st.ix.anika.ended = true;
      later(nextTranscript, 1800);
    }
    st.inboxOpen = false;
    if (!silent) render();
  }

  // ---------- chat engine ----------
  function chatNext(ix) { return S.chatScript[ix.idx]; }
  function sendChat(ixId, textOverride) {
    const ix = st.ix[ixId]; if (!ix || ix.ended) return;
    const text = (textOverride != null ? textOverride : ix.draft).trim();
    if (!text) return;
    ix.log.push({ from: 'agent', text }); ix.draft = '';
    if (ixId === 'chat1') {
      const nx = chatNext(ix);
      if (nx && nx.from === 'agent') ix.idx++;
      queueCustomer(ix);
    }
    render();
  }
  function queueCustomer(ix) {
    const nx = chatNext(ix);
    if (!nx || nx.from !== 'cust' || ix.typing) return;
    ix.typing = true; render();
    later(() => { ix.typing = false; ix.log.push({ from: 'cust', text: nx.text }); ix.idx++; render(); }, 1400 + Math.min(nx.text.length * 18, 1800));
  }
  function endChat(ixId) {
    const ix = st.ix[ixId]; if (!ix || ix.ended) return;
    ix.ended = true; ix.log.push({ from: 'sys', text: `${A.name} ended the chat` });
    if (ixId === 'chat1') {
      ix.subtab = 'details'; ix.summaryTyping = true; st.chat1Done = true;
      typeInto(S.chatSummary, v => { ix.summary = v; }, () => { ix.summaryTyping = false; });
    }
    render();
  }

  function typeInto(full, set, done, speed = 14) {
    let i = 0;
    const step = () => {
      i = Math.min(full.length, i + 3 + Math.floor(Math.random() * 4));
      set(full.slice(0, i)); renderSoft();
      if (i < full.length) later(step, speed + Math.random() * 18); else { done && done(); render(); }
    };
    later(step, 900);
  }

  // ---------- call engine ----------
  function gateOpen(g, ix) {
    if (!g) return true;
    if (g === 'storesChecked') return !!ix.gates.storesChecked;
    if (g === 'pointsAdded') return ix.emailSent && ix.pointsAdded;
    return true;
  }
  function nextTranscript(force) {
    const ix = st.ix.call1; if (!ix || ix.ended) return;
    const line = S.callScript[ix.idx]; if (!line) return;
    if (!force && !gateOpen(line.gate, ix)) { ix.waiting = line.gate; return; }
    ix.waiting = null;
    ix.transcript.push({ ...line, t: elapsed(ix) }); ix.idx++;
    render();
    const nx = S.callScript[ix.idx];
    if (nx) later(() => nextTranscript(), 1200 + line.text.length * 38);
  }
  function maybeResumeTranscript() {
    const ix = st.ix.call1; if (!ix || !ix.waiting) return;
    const line = S.callScript[ix.idx];
    if (line && gateOpen(line.gate, ix)) { ix.waiting = null; later(() => nextTranscript(), 1500); }
  }
  function elapsed(ix) { const end = ix.endAt || Date.now(); const s = Math.floor((end - ix.start) / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
  function endCall() {
    const ix = st.ix.call1; if (!ix || ix.ended) return;
    ix.ended = true; ix.endAt = Date.now(); ix.subtab = 'details'; ix.notesTyping = true;
    typeInto(S.callSummary, v => { ix.notes = v; }, () => { ix.notesTyping = false; });
    render();
  }
  function addHistory(entry) { st.extraHistory.unshift({ ...entry, day: S.dates.today, ago: 'Just now', isNew: true }); }

  // ---------- toast ----------
  function toast(msg) { st.toast = msg; render(); later(() => { if (st.toast === msg) { st.toast = null; render(); } }, 4500); }

  // ---------- render helpers ----------
  function topbar() {
    const logo = B.logo.image ? `<img src="${esc(B.logo.image)}" alt="">` : `<div class="mark">${esc(B.logo.text)}</div>`;
    const dotColor = { Available: '#2e9e4f', Away: '#f0a400', Offline: '#9aa6ad', Busy: '#c3243a' }[st.presence];
    return `<div class="topbar">
      <div class="brandmark" title="${esc(B.logo.wordmark)}">${logo}</div>
      <div class="topnav"><span>All</span><span>Favorites</span><span>History</span><span>Workspaces</span><span>Studio</span><span>${ic('dotsh', 'sm')}</span></div>
      <div class="ws-pill">${esc(B.workspaceName)} <span class="star">${ic('star', 'sm')}</span></div>
      <div class="top-right">
        <div class="searchbox">${ic('search', 'sm')} Search</div>
        ${ic('people')}${ic('chat')}${ic('help')}${ic('bell')}
        <span style="position:relative">${avatar(A.initials, '', A.name)}<i class="presence-dot" style="background:${dotColor}"></i></span>
      </div></div>`;
  }
  function rail() {
    const n = st.inbox.length;
    return `<div class="rail">
      <button data-act="tab" data-id="home" class="${st.active === 'home' ? 'on' : ''}" title="Home">${ic('home')}</button>
      <button title="List">${ic('list')}</button>
      <button data-act="toggleInbox" class="${st.inboxOpen ? 'on' : ''} ${n ? 'ring' : ''}" title="Inbox">${ic('inbox')}${n ? `<span class="badge">${n}</span>` : ''}</button>
    </div>`;
  }
  function tabLabel(tb) {
    if (tb.kind === 'home') return `${ic('home', 'sm')}<div class="t-lbl"><span>Home</span></div>`;
    const ix = st.ix[tb.id]; const cu = CUST[ix.who];
    const icon = ix.type === 'call' ? ic('phone', 'sm chan') : ic('chat', 'sm chan');
    let sub = '';
    if (ix.type === 'call') sub = ix.ended ? 'Call ended' : `${ic('clock', 'sm')} <span class="calltime">${elapsed(ix)}</span>`;
    else if (ix.ended) sub = 'Chat has ended';
    return `${icon}<div class="t-lbl"><span>${esc(cu.name)}</span>${sub ? `<small>${sub}</small>` : ''}</div>`;
  }
  function tabbar() {
    return `<div class="tabbar">${st.tabs.map(tb => `<div class="tab ${st.active === tb.id ? 'on' : ''}" data-act="tab" data-id="${tb.id}">${tabLabel(tb)}${tb.kind !== 'home' ? `<span class="x" data-act="closeTab" data-id="${tb.id}">${ic('x', 'sm')}</span>` : ''}</div>`).join('')}
      <div class="plus">${ic('plus', 'sm')}</div><div class="more">${ic('dotsh', 'sm')}</div></div>`;
  }
  function inboxPanel() {
    if (!st.inboxOpen) return '';
    const items = st.inbox.map(it => `<div class="witem ${it.type}">
      <div class="w-top">${it.type === 'call' ? ic('phone', 'sm') : ic('chat', 'sm')} ${it.ref}</div>
      <div class="w-name">${esc(it.name)}</div>
      <div class="w-sub">${esc(it.sub)}</div>
      <div class="w-sub">${ic('store', 'sm')} ${esc(it.org)}</div>
      <div class="w-timer">${ic('clock', 'sm')} Time to accept <b class="wt" data-id="${it.id}">0:${String(it.remaining).padStart(2, '0')}</b></div>
      <div class="w-actions"><button class="decline" data-act="decline" data-id="${it.id}">Decline</button><button class="accept" data-act="accept" data-id="${it.id}">Accept</button></div>
    </div>`).join('');
    const menu = st.menu === 'presence' ? `<div class="menu" style="top:24px;left:0">${['Available', 'Away', 'Busy', 'Offline'].map(p => `<div data-act="presence" data-id="${p}"><i class="dot ${p}"></i>${p}</div>`).join('')}</div>` : '';
    return `<div class="inbox"><div class="inbox-head"><small>Status</small>
      <div style="position:relative"><button class="status-btn" data-act="menu" data-id="presence"><i class="dot ${st.presence}"></i>${st.presence} ${ic('down', 'sm')}</button>${menu}</div></div>
      <div class="inbox-list">${items || `<div class="inbox-empty">${ic('clock')}<b>No inbox items</b>As work items are assigned, they will appear in this panel.</div>`}</div></div>`;
  }

  // ---------- history ----------
  function historyFor(who) {
    let list = who === 'c' ? S.history.slice() : S.anikaHistory.slice();
    if (who === 'c' && st.chat1Done) list.unshift({ day: S.dates.chatDay, icon: 'chat', who: `<b>${C.name}</b> chatted with  ${A.name.split(' ')[0]} ${A.name.split(' ')[1][0]}.`, ref: 'IMS00008768', text: CUST.c.subject, ago: `${O.restockDays} days ago`, ai: S.chatSummary });
    if (who === 'c') list = st.extraHistory.concat(list);
    let out = '', lastDay = null;
    list.forEach(h => {
      if (h.day !== lastDay) { out += `<div class="day"><span>${h.day}</span></div>`; lastDay = h.day; }
      out += `<div class="hrow ${h.isNew ? 'new' : ''}"><span class="hi ${h.icon}">${ic(h.icon)}</span><div><div class="hw">${h.who}</div><div class="ref">${h.ref}${h.sub ? ` <span style="color:var(--muted)">• ${esc(h.sub)}</span>` : ''}</div>${h.text ? `<div class="ht">${esc(h.text)}</div>` : ''}${h.more ? '<div class="more">See more</div>' : ''}${h.ai ? `<div class="ai">${ic('spark', 'sm')}<span>${esc(h.ai)}</span></div>` : ''}</div><span class="ago">${h.ago}</span></div>`;
    });
    return `<div class="hist">${out}</div>`;
  }
  function histHeader(title) { return `<div class="card-h" style="margin:4px 0 0">${title}<span class="r">${ic('search', 'sm')}${ic('filter', 'sm')}${ic('cal', 'sm')}</span></div>`; }

  // ---------- consumer card ----------
  function consumerCard(who, wide) {
    const cu = CUST[who]; const pts = who === 'c' ? st.points : cu.points;
    return `<div class="card"><div class="card-h">Consumer<span class="r">${ic('pencil', 'sm')}${ic('dots', 'sm')}</span></div>
      <div class="person">${avatar(cu.initials, 'lg', cu.name)}<span class="link" style="font-size:14px">${esc(cu.name)}</span></div>
      <div class="kv ${wide ? 'c3' : 'c3'}">
        <div><label>Points balance</label><div class="v pts ${who === 'c' && st.bump ? 'bump' : ''}">${pts.toLocaleString()} <span class="star">${ic('star', 'sm')}</span></div></div>
        <div><label>Email</label><div class="v link">${esc(cu.email)}</div></div>
        <div><label>Mobile phone</label><div class="v link">${esc(cu.mobile)}</div></div>
        <div><label>Business phone</label><div class="v link">${esc(cu.business)}</div></div>
        <div><label>Street</label><div class="v link">${esc(cu.street)}</div></div>
        <div><label>City, State</label><div class="v link">${esc(cu.city)}</div></div>
      </div></div>`;
  }
  function chatInfoCard(ix) {
    const cu = CUST[ix.who];
    return `<div class="card"><div class="card-h">Interaction information ${ic('info', 'sm')}</div>
      <div class="kv c3">
        <div><label>Product</label><div class="v link" data-act="openProduct" data-id="${ix.id}">${esc(cu.productShort)}</div></div>
        <div><label>Device type</label><div class="v">${cu.device || 'Mobile'}</div></div>
        <div><label>Language</label><div class="v">${cu.language || 'En'}</div></div>
        <div><label>Portal</label><div class="v">customer help</div></div>
        <div><label>Sales channel</label><div class="v">Online</div></div>
        <div><label>Type</label><div class="v">Chat</div></div>
      </div></div>`;
  }

  // ---------- interaction details (form) ----------
  function detailsForm(ix) {
    const cu = CUST[ix.who];
    const isCall = ix.type === 'call';
    const wrap = isCall ? ix.ended : ix.ended;
    const sumText = isCall ? ix.notes : ix.summary;
    const sumTyping = isCall ? ix.notesTyping : ix.summaryTyping;
    const summaryField = wrap ? `
      ${isCall ? `<div class="fld full"><label>Wrap-up code</label><select class="in" data-act-change="wrap">${['Solved by agent', 'Follow-up required', 'Escalated', 'Transferred'].map(o => `<option ${o === ix.wrapCode ? 'selected' : ''}>${o}</option>`).join('')}</select></div>` : ''}
      <div class="fld full"><label>${isCall ? 'Notes' : 'Chat summary'} <span class="ai-chip">${ic('spark', 'sm')} ${isCall ? 'Generated by Agent Copilot' : 'Generated by Now Assist'}</span></label>
      <div class="in ta">${sumText ? esc(sumText) : '<span class="gen">' + ic('spark', 'sm') + ' Generating summary…</span>'}${sumTyping && sumText ? '<span class="caret"></span>' : ''}</div></div>` : '';
    return `<div class="card"><div class="card-h">Interaction information ${ic('info', 'sm')}</div>
      <div class="form">
        <div class="kv c3" style="align-content:start">
          <div><label>Number</label><div class="v link">${ix.number}</div></div>
          <div><label>Device type</label><div class="v">${cu.device || 'Mobile'}</div></div>
          <div><label>Language</label><div class="v">${cu.language || 'En'}</div></div>
          <div><label>Callers time zone</label><div class="v">${cu.timezone || ''}</div></div>
          <div><label>Sales channel</label><div class="v">Online</div></div>
          <div><label>Type</label><div class="v">${isCall ? 'Call' : 'Chat'}</div></div>
          ${isCall ? `<div><label>Call type</label><div class="v">Inbound</div></div><div><label>Call started</label><div class="v wrap">${S.dates.today} ${new Date(ix.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div></div><div></div>` : ''}
          <div class="check" style="grid-column:1/-1;margin-top:4px"><span class="box">${ic('check', 'sm')}</span> Verified</div>
        </div>
        <div style="display:grid;gap:8px">
          <div class="fld"><label>State</label><div class="in">${wrap && ix.saved ? 'Closed complete' : 'Work in progress'} ${ic('attach', 'sm')}</div></div>
          <div class="fld"><label>Category</label><div class="in">${wrap ? 'Order issue' : '-- None --'} ${ic('attach', 'sm')}</div></div>
          <div class="fld"><label>Subcategory</label><div class="in">${wrap ? 'Missing item' : '-- None --'} ${ic('attach', 'sm')}</div></div>
          <div class="fld"><label>Assigned to</label><div class="in">${esc(A.name)} <span style="display:flex;gap:6px;color:var(--muted)">${ic('info', 'sm')}${ic('search', 'sm')}</span></div></div>
        </div>
        <div class="fld full"><label>Short description</label><div class="in">${esc(ix.subject)}</div></div>
        ${summaryField}
      </div></div>`;
  }
  function routingCard(ix) {
    const isCall = ix.type === 'call';
    return `<div class="card"><div class="card-h">${ic('route', 'sm')} Routing &amp; journey <span class="r" style="font-weight:400;font-size:11px">Genesys Cloud</span></div>
      <div class="kv c3">
        <div><label>Routing method</label><div class="v">Predictive routing</div></div>
        <div><label>Queue</label><div class="v">${esc(B.company)} Customer Care</div></div>
        <div><label>Agent match score</label><div class="v">94 / 100</div></div>
        <div><label>Channel</label><div class="v">${isCall ? 'Voice' : 'Web messaging'}</div></div>
        <div><label>Time in queue</label><div class="v">${isCall ? '0:18' : '0:42'}</div></div>
        <div><label>Self-service</label><div class="v">${isCall ? 'Virtual agent · intent: Missing item' : 'Virtual agent · Chat with Live Agent'}</div></div>
      </div></div>`;
  }

  // ---------- recommendations ----------
  function recHeader(n) {
    return `<div class="rec-h"><h4>Recommendations</h4>${ic('refresh', 'sm')}</div><div class="rec-tabs"><span class="on">Suggested actions (${n})</span><span>Search</span></div>`;
  }
  function orderCard(ix, status) {
    return `<div class="rcard"><span class="pill blue">${ic('box', 'sm')} Customer Order</span><span style="float:right">${ic('dots', 'sm')}</span>
      <h5>${esc(O.title)}</h5>
      <div class="kv c3"><div><label>Number</label><div class="v link">${O.number}</div></div><div><label>Customer</label><div class="v link">${esc(C.name)}</div></div><div><label>Status</label><div class="v link">${status}</div></div>
      ${ix.type === 'call' ? `<div style="grid-column:1/-1"><label>Product</label><div class="v link" data-act="openProduct" data-id="${ix.id}">${esc(P.name)}</div></div>` : `<div><label>Order Date</label><div class="v">${O.orderDate.slice(0, 10)}</div></div><div style="grid-column:span 2"><label>Inventory Status</label><div class="v">${ix.gates.inventoryChecked ? `Available on ${S.dates.restockLive}` : 'Backorder'}</div></div>`}</div>
      <div class="rbtns"><button class="btn">Dismiss</button><button class="btn" data-act="openProduct" data-id="${ix.id}">View Order</button></div></div>`;
  }
  function kbCard(sendable, ix) {
    const isC = !ix || ix.who === 'c';
    const title = isC ? B.kb.title : 'Order Shipment policy';
    const sum = isC ? B.kb.summary : 'Once order is received, it will be shipped in 2-4 business days. Confirmation mail with tracking number is sent to customer via Email & SMS. Sometimes deliveries can be delayed due to unavoidable reasons.';
    return `<div class="rcard"><span class="pill purple">${ic('spark', 'sm')} Now Assist Q&amp;A</span><span style="float:right">${ic('dots', 'sm')}</span>
      <h5>${title}</h5>
      <div class="kv c3"><div><label>Number</label><div class="v link">${isC ? B.kb.number : 'KB0012394'}</div></div><div><label>Author</label><div class="v link">Administrator</div></div><div><label>Updated</label><div class="v">2025-08-13</div></div></div>
      <div class="aisum"><div class="t">${ic('spark', 'sm')} Summarized by Now Assist ${ic('info', 'sm')}</div>${esc(sum)}<div class="fb">${ic('up', 'sm')}${ic('dn', 'sm')}${ic('copy', 'sm')}${ic('refresh', 'sm')}</div></div>
      <div class="disclaim">Be sure to check AI-generated summaries for accuracy.</div>
      <div class="rbtns"><button class="btn">Dismiss</button><button class="btn" ${sendable ? `data-act="sendKb" data-id="${ix.id}"` : ''}>Send in Chat</button></div></div>`;
  }
  function chatRecs(ix) {
    const isC = ix.who === 'c';
    const prod = isC ? O.title : S2.product;
    return recHeader(3) + `<div class="rcard"><span class="pill">${ic('wrench', 'sm')} Troubleshoot</span><h5>Check Inventory Status</h5><p>Help the customer with their missing part request.</p>
      <div class="rbtns"><button class="btn" data-act="openProduct" data-id="${ix.id}">Check Inventory</button><button class="btn">Initiate a Refund</button></div></div>`
      + (isC ? orderCard(ix, 'Backorder') : `<div class="rcard"><span class="pill blue">${ic('box', 'sm')} Customer Order</span><h5 class="link">${esc(prod)}</h5><div class="kv c3"><div><label>Number</label><div class="v link">${S2.orderNumber}</div></div><div><label>Customer</label><div class="v link">${esc(S2.name)}</div></div><div><label>Status</label><div class="v link">In-transit</div></div></div><div class="rbtns"><button class="btn">Dismiss</button><button class="btn">View Order</button></div></div>`)
      + kbCard(!ix.ended, ix);
  }
  function callRecs(ix) {
    const pu = ix.pickup; const store = B.stores[pu.store];
    if (ix.rec === 'pickup') {
      const body = pu.step === 1 ? `
        <div class="fld"><label>Customer</label><input class="in" value="${esc(C.name)}" readonly></div>
        <div class="fld"><label>Order number</label><input class="in" value="${O.number}" readonly></div>
        <div class="fld"><label>Store location</label><select class="in" data-act-change="store">${B.stores.map((s, i) => `<option value="${i}" ${i === pu.store ? 'selected' : ''}>${esc(s.address)}</option>`).join('')}</select></div>
        <div class="fld"><label>Date/Time</label><input class="in" data-act-input="pdate" value="${esc(pu.date)} ${esc(pu.time)}"></div>
        <div class="rbtns" style="justify-content:flex-end"><button class="btn primary" data-act="pickupNext" style="flex:0 0 auto">Next</button></div>`
        : `<div class="kv" style="font-size:11.5px">
          <div><label>Customer</label><div class="v">${esc(C.name)}</div></div>
          <div><label>Order number</label><div class="v">${O.number}</div></div>
          <div><label>Store location</label><div class="v" style="white-space:normal">${esc(store.address)}</div></div>
          <div><label>Date/Time</label><div class="v">${esc(pu.date)} ${esc(pu.time)}</div></div>
          <div><label>Pickup PIN</label><div class="v">${B.pickup.pin}</div></div></div>
          <div class="rbtns"><button class="btn" data-act="pickupBack">Back</button><button class="btn primary" data-act="pickupCreate">Create request</button></div>`;
      return `<div class="back" data-act="recBack">${ic('left', 'sm')} Back</div><div class="rcard rform"><h5>Initiate pickup request</h5><p style="margin-bottom:10px">Step ${pu.step} of 2</p>${body}</div>`;
    }
    let out = '';
    let n = 0;
    if (pu.created) {
      out += `<div class="rcard"><span class="pill ok">${ic('check', 'sm')} Request created</span><h5>Initiate pickup request</h5><p>This guidance has been completed with the following outputs</p>
        <div class="kv"><div><label>Pickup Request</label><div class="v link">PREQ0005467</div></div></div>
        <div class="back" data-act="togglePu" style="margin:0">${ic(pu.open ? 'down' : 'arrow', 'sm')} Inputs provided</div>
        ${pu.open ? `<div class="kv" style="margin-top:6px"><div><label>Store</label><div class="v" style="white-space:normal">${esc(store.address)}</div></div><div><label>Date/Time</label><div class="v">${esc(pu.date)} ${esc(pu.time)}</div></div><div><label>PIN</label><div class="v">${B.pickup.pin}</div></div></div>` : ''}</div>`;
    } else {
      n++;
      const menu = st.menu === 'pickup' ? `<div class="menu"><div data-act="startPickup">${ic('store', 'sm')} Initiate pickup</div><div data-act="openProduct" data-id="call1">${ic('search', 'sm')} Check store availability</div><div>${ic('refresh', 'sm')} Initiate refund</div></div>` : '';
      out += `<div class="rcard"><span class="pill">${ic('wrench', 'sm')} Troubleshoot</span><h5>Initiate pickup or refund request</h5><p>Help the customer with their recent order by initiating a pickup or refund request.</p>
        <div class="rbtns"><button class="btn">Dismiss</button><div class="dropdown splitbtn" style="flex:1.4"><button class="btn" data-act="startPickup" style="flex:1">Initiate pickup</button><button class="btn" data-act="menu" data-id="pickup">${ic('down', 'sm')}</button>${menu}</div></div></div>`;
    }
    if (pu.created && !ix.pointsAdded && !ix.nbaDismissed) {
      n++;
      out += `<div class="rcard"><span class="pill purple">${ic('spark', 'sm')} Next best action</span><h5>Add ${B.bonusPoints.toLocaleString()} bonus points</h5><p>Give as a thoughtful gesture for a loyal customer to boost their loyalty after an inconvenient experience.</p>
        <div class="rbtns"><button class="btn" data-act="nbaDismiss">Dismiss</button><button class="btn primary" data-act="addPoints">Add bonus points</button></div></div>`;
    }
    if (ix.pointsAdded) {
      out += `<div class="rcard"><span class="pill ok">${ic('check', 'sm')} Points added</span><h5>Add ${B.bonusPoints.toLocaleString()} bonus points</h5><p>This guidance has been completed with the following updates</p>
        <div class="kv"><div><label>Points added</label><div class="v">${B.bonusPoints.toLocaleString()}</div></div><div><label>Total points balance</label><div class="v">${st.points.toLocaleString()}</div></div></div>
        <div class="ptsh"><b style="font-size:11px">${ic('down', 'sm')} Points history</b>${st.pointsHistory.map(h => `<div><span>${h.date}</span><span>${ic(h.label === 'Reward' ? 'gift' : 'cart', 'sm')} ${h.label}</span><span class="amt">${h.pts}</span></div>`).join('')}</div></div>`;
    }
    if (!pu.created) { n++; out += orderCard(ix, ix.gates.storesChecked ? 'Partially shipped' : 'Backorder'); }
    return recHeader(n) + out;
  }

  // ---------- product (in-stock) view ----------
  function productView(ix) {
    const mode = ix.type === 'call' ? 'stores' : 'backorder';
    const near = B.pickup.storeIndex;
    const total = mode === 'stores' ? B.stores.reduce((a, s) => a + s.qty.reduce((x, y) => x + y, 0), 0) : 0;
    ix.openLoc = ix.openLoc == null ? near : ix.openLoc;
    const rows = B.stores.map((s, i) => {
      const q = mode === 'stores' ? s.qty : s.qty.map(() => 0);
      const sum = q.reduce((a, b) => a + b, 0);
      const open = ix.openLoc === i;
      return `<tr class="loc ${mode === 'stores' && i === near ? 'near' : ''}" data-act="loc" data-id="${i}"><td colspan="6">${ic(open ? 'down' : 'arrow', 'sm')} Location: ${esc(s.address)} (${sum}) <span class="link" style="font-weight:400">Show all</span>${mode === 'stores' && i === near ? '<span class="near-tag">Nearest to customer · 3.2 mi</span>' : ''}</td></tr>`
        + (open ? P.colors.map((col, k) => `<tr><td style="width:30px"><span class="cb"></span></td><td>${col}</td><td>${q[k] ? q[k] : '<span class="bo">0</span>'}</td><td>${P.price}</td><td>${q[k] ? 'True' : 'False'}</td><td>${mode === 'stores' ? 'False' : 'False'}</td></tr>`).join('') : '');
    }).join('');
    const banner = mode === 'stores'
      ? `<div class="banner ok">${ic('check')} In stock for pickup at ${B.stores.length} locations near ${esc(C.city)}. Online shipping inventory has not arrived yet.</div>`
      : `<div class="banner">${ic('info')} Out of stock at all locations. Next inventory arrival: <b>${S.dates.restockLive}</b> (in ${O.restockDays} days). Orders ship on arrival.</div>`;
    return `<div class="prod">
      <div class="ptabs"><div data-act="closeProduct" data-id="${ix.id}" style="cursor:pointer">Details ${ic('x', 'sm')}</div><div>IMS000876351 ${ic('x', 'sm')}</div><div class="on">${esc(P.short)} ${ic('x', 'sm')}</div></div>
      <div class="c-head" style="border-top:1px solid var(--line)"><h2 style="font-size:17px">${esc(P.name)}</h2><span class="tag">${ic('tag', 'sm')}</span>
        <div class="acts"><button class="btn sm">Copy</button><button class="btn sm">Create new version</button><button class="btn sm">Retire</button><button class="btn sm" data-act="closeProduct" data-id="${ix.id}">Save</button><button class="btn sm icon">${ic('dots', 'sm')}</button></div></div>
      <div class="sub2"><div>Details</div><div class="on">In-Stock (${total})</div><div>Catalog hierarchy</div><div>Product offering charac... (2)</div><div>Product visuals</div><div>More ${ic('down', 'sm')}</div></div>
      ${banner}
      <div class="c-body" style="background:#fff">
        <div class="card-h" style="font-size:16px">In-Stock <span class="pill blue" style="margin:0">${total}</span><span class="r">${ic('search', 'sm')}${ic('filter', 'sm')}${ic('refresh', 'sm')}<button class="btn primary sm">Create new ${ic('down', 'sm')}</button></span></div>
        <div style="color:var(--muted);font-size:11px;margin:-4px 0 8px">Last refreshed 1m ago</div>
        <table class="tbl"><thead><tr><th><span class="cb"></span></th><th>Color</th><th>Quantity ${ic('down', 'sm')}</th><th>Price</th><th>Available for pickup</th><th>Available online</th></tr></thead><tbody>${rows}</tbody></table>
        <div style="display:flex;justify-content:space-between;color:var(--muted);margin-top:10px;font-size:12px"><span>Showing 1-${B.stores.length} of ${B.stores.length}</span><span>10 ${ic('down', 'sm')} Records per page</span></div>
      </div></div>`;
  }

  // ---------- views ----------
  function chatColumn(ix) {
    const msgs = ix.log.map(m => {
      if (m.from === 'sys') return `<div class="msg sys">${esc(m.text)}${m.sub ? `<small>${m.sub}</small>` : ''}</div>`;
      const cu = CUST[ix.who];
      const av = m.from === 'cust' ? avatar(cu.initials, 'sm', cu.name) : m.from === 'bot' ? `<span class="avatar sm" style="background:${B.theme.accent}">${esc(B.logo.text)}</span>` : avatar(A.initials, 'sm', A.name);
      const quick = m.text === 'Chat with Live Agent' ? 'quick' : '';
      return `<div class="msg ${m.from} ${quick}">${m.from === 'cust' ? av : ''}<div class="bub">${esc(m.text)}</div>${m.from !== 'cust' ? av : ''}</div>`;
    }).join('') + (ix.typing ? '<div class="typing"><i></i><i></i><i></i></div>' : '');
    let suggest = '';
    if (ix.id === 'chat1' && !ix.ended && !ix.typing) {
      const nx = chatNext(ix);
      if (nx && nx.from === 'agent') {
        if (nx.gate === 'inventoryChecked' && !ix.gates.inventoryChecked) suggest = `<div class="suggest" style="cursor:default">${ic('spark', 'sm')}<div><b>Now Assist</b>Check the inventory status to get a suggested reply.</div></div>`;
        else suggest = `<div class="suggest" data-act="useSuggest" data-id="${ix.id}">${ic('spark', 'sm')}<div><b>Suggested reply · click to use</b>${esc(nx.text.length > 120 ? nx.text.slice(0, 118) + '…' : nx.text)}</div></div>`;
      }
    }
    const composer = ix.ended ? `<div class="chat-ended">This chat has ended</div>` : `${suggest}<div class="composer"><div class="ctabs"><div class="on">${ic('people', 'sm')} Public Chat</div><div>${ic('lock', 'sm')} Private Chat</div></div>
      <textarea id="draft" data-id="${ix.id}" placeholder="Message visible externally">${esc(ix.draft)}</textarea>
      <div class="ctools">${ic('bolt', 'sm')}${ic('people', 'sm')}${ic('arrow', 'sm')}<span style="margin-left:auto;display:flex;gap:10px">${ic('smile', 'sm')}${ic('clip', 'sm')}</span><button class="send" data-act="send" data-id="${ix.id}" style="margin-left:0">${ic('send', 'sm')}</button></div></div>`;
    return `<div class="colL"><div class="hd"><h3>Active chat</h3></div><div class="chatlog">${msgs}</div>${composer}</div>`;
  }

  function callColumn(ix) {
    const card = ix.ended
      ? `<div class="callcard"><div class="wrap">${ic('clock')}<div style="margin-top:6px;color:var(--text);font-weight:700">Call ended · ${elapsed(ix)}</div>Wrap-up in progress. Notes are being generated.</div></div>`
      : `<div class="callcard"><div class="ctl-top"><span class="on">${ic('phone', 'sm')}</span>${ic('grid', 'sm')}${ic('clock', 'sm')}<span class="live" style="margin-left:auto">LIVE</span></div>
        <div class="who"><div><b>${esc(C.name)}</b><small>${esc(C.mobile)} | External</small></div><span class="calltime" style="color:var(--muted)">${elapsed(ix)}</span></div>
        <div class="ctl-bot"><span class="ctl" title="Transfer">${ic('xfer', 'sm')}</span><span class="ctl ${ix.held ? 'active' : ''}" data-act="hold" title="Hold">${ic('hold', 'sm')}</span><span class="ctl ${ix.muted ? 'active' : ''}" data-act="mute" title="Mute">${ic('mic', 'sm')}</span><span class="ctl" title="Record">${ic('rec', 'sm')}</span><button class="hangup" data-act="endCall" title="End call">${ic('hang', 'sm')}</button></div></div>`;
    const lines = S.vaCall.map(l => `<div class="tline va"><div class="tw">${l.from === 'va' ? 'Virtual agent' : esc(C.first)} <small>self-service</small></div>${esc(l.text)}</div>`).join('')
      + `<div class="tdiv">Transferred to ${esc(A.name)} · Genesys Cloud predictive routing</div>`
      + ix.transcript.map(l => `<div class="tline ${l.from}"><div class="tw">${l.from === 'agent' ? esc(A.name) : esc(C.name)} <small>${l.t}</small></div>${esc(l.text)}</div>`).join('')
      + (!ix.ended && ix.idx < S.callScript.length ? `<div class="tline va"><span class="live">Listening</span></div>` : '');
    const body = ix.ltab === 'customer'
      ? `<div style="padding:8px 10px 0">${histHeader('Customer history')}</div>${historyFor('c')}`
      : `<div class="transcript">${lines}</div>`;
    return `<div class="colL"><div class="hd"><h3>Active call</h3></div>${card}
      <div class="ltabs"><div class="${ix.ltab === 'customer' ? 'on' : ''}" data-act="ltab" data-id="customer">Customer</div><div class="${ix.ltab === 'transcript' ? 'on' : ''}" data-act="ltab" data-id="transcript">Call Transcript</div></div>
      <div class="lscroll" id="lscroll">${body}</div></div>`;
  }

  function centerHeader(ix) {
    const isCall = ix.type === 'call';
    const cmenu = st.menu === 'compose' ? `<div class="menu" style="top:30px;left:0"><div data-act="openCompose">${ic('mail', 'sm')} Email</div><div>${ic('sms', 'sm')} SMS</div></div>` : '';
    const end = !isCall && !ix.ended ? `<button class="btn" data-act="endChat" data-id="${ix.id}">End chat</button>` : '';
    const compose = isCall ? `<div style="position:relative"><button class="btn" data-act="menu" data-id="compose">${ic('down', 'sm')} Compose</button>${cmenu}</div>` : '';
    return `<div class="c-head"><h2>${esc(ix.subject)}</h2><span class="tag">${ic('tag', 'sm')}</span>
      <div class="acts">${end}${compose}<button class="btn">Discuss</button><button class="btn primary" data-act="save" data-id="${ix.id}">Save</button><button class="btn icon">${ic('dots', 'sm')}</button></div></div>
      <div class="subtabs"><div class="${ix.subtab === 'customer' ? 'on' : ''}" data-act="subtab" data-id="customer">Customer details</div><div class="${ix.subtab === 'details' ? 'on' : ''}" data-act="subtab" data-id="details">Interaction details</div></div>`;
  }

  function ixView(ix) {
    const isCall = ix.type === 'call';
    const left = isCall ? callColumn(ix) : chatColumn(ix);
    const xcol = `<div class="colX"><span class="on">${ic('spark', 'sm')}</span>${ic('book', 'sm')}${ic('clip', 'sm')}${ic('attach', 'sm')}</div>`;
    if (ix.center === 'product') {
      return `<div class="ix" style="grid-template-columns:268px 1fr 28px">${left}${productView(ix)}${xcol}</div>`;
    }
    let body;
    if (ix.subtab === 'details') body = detailsForm(ix) + routingCard(ix);
    else if (isCall) body = consumerCard('c', true) + detailsForm(ix) + `<div class="card" style="min-height:120px"><div class="card-h">Work notes ${ic('info', 'sm')}</div>${ix.notes && !ix.notesTyping ? `<div style="line-height:1.45">${esc(ix.notes)}</div>` : ''}</div>`;
    else body = `<div class="grid2">${consumerCard(ix.who)}${chatInfoCard(ix)}</div><div style="margin-top:12px">${histHeader('Customer history')}${historyFor(ix.who)}</div>`;
    const recs = isCall ? callRecs(ix) : chatRecs(ix);
    return `<div class="ix">${left}<div class="colC">${centerHeader(ix)}<div class="c-body">${body}</div></div><div class="colR">${recs}</div>${xcol}</div>`;
  }

  function homeView() {
    const tabs = ['Overview', 'Insights', 'Scorecard', 'Leaderboards', 'Schedule', 'Work Plan'];
    let content;
    if (st.homeTab === 'Leaderboards' || st.homeTab === 'Scorecard') {
      content = `<div class="hgrid" style="grid-template-columns:2fr 1fr"><div class="card"><div class="card-h">Total points · This month</div>
        ${[[A.name, 1204, true], ['Allen Robinson', 1102], ['Daniel Navarro', 987], ['Gabriela Duran', 912], ['Francis Ogilvy', 860]].map((r, i) => `<div class="lb"><b style="width:18px">${i + 1}</b>${avatar(r[0].split(' ').map(x => x[0]).join(''), 'sm', r[0])}<span style="${r[2] ? 'font-weight:700' : ''}">${r[0]}</span><span style="margin-left:auto">${r[1].toLocaleString()} <span style="color:var(--danger)">♦</span></span></div>`).join('')}</div>
        <div class="card"><div class="card-h">Your rank</div><div class="big">1st</div><div style="color:var(--muted)">Top of the leaderboard this month</div></div></div>`;
    } else if (st.homeTab === 'Schedule') {
      content = `<div class="card"><div class="card-h">This week</div><div class="hgrid" style="grid-template-columns:repeat(5,1fr)">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(d => `<div><b>${d}</b><div class="sched" style="margin-top:6px">${S.homeSchedule.slice(0, 6).map(r => `<div><span>${r[0]}</span><span>${r[1]}</span></div>`).join('')}</div></div>`).join('')}</div></div>`;
    } else if (st.homeTab === 'Insights') {
      content = `<div class="card"><div class="card-h">Performance insights</div><table class="tbl"><thead><tr><th>Agent</th><th>Overall average</th><th>After call work</th><th>Average hold</th><th>Punctuality</th><th>Handle time</th></tr></thead><tbody>
        ${[[A.name, 92], ['Allen Robinson', 84], ['Daniel Navarro', 79], ['Gabriela Duran', 76]].map(r => `<tr><td>${r[0]}</td><td><div class="bar" style="margin:0;width:120px"><i style="width:${r[1]}%"></i></div></td><td>${r[1] + 4}%</td><td>${r[1] - 3}%</td><td>${r[1] + 1}%</td><td>${r[1] - 6}%</td></tr>`).join('')}</tbody></table></div>`;
    } else {
      content = `<div class="hgrid">
        <div class="card"><div class="card-h">Today's Schedule</div><div class="sched">
          <div class="now"><div style="display:flex;justify-content:space-between"><b>On Queue</b><span>(1h 15m) 7:00 pm</span></div><div style="color:var(--danger);margin-top:3px">${ic('info', 'sm')} Out Of Adherence</div><div class="bar" style="margin:6px 0 0"><i style="width:62%"></i></div></div>
          ${S.homeSchedule.slice(1).map(r => `<div><span><i class="dot ${r[0] === 'On Queue' ? 'Available' : r[0] === 'Shift End' ? 'Offline' : 'Away'}"></i> ${r[0]}</span><span>${r[2]} ${r[1]}</span></div>`).join('')}
        </div></div>
        <div class="card"><div class="card-h">Evaluation Summary</div><div style="color:var(--muted)">This week</div><div class="big">0%</div><div style="color:var(--muted);margin-top:6px">This month</div><div class="big">65%</div><div class="bar"><i style="width:65%"></i></div>
          <div class="card-h" style="margin-top:6px">Evaluations Due for Review</div><div style="font-size:12px">CSM Agent Evaluation Powered by Genesys AI <b style="float:right">65%</b></div></div>
        <div class="card"><div class="card-h">Scorecard Summary</div><div style="color:var(--muted)">All Time Total Points</div><div class="big">3,735 <span style="color:var(--danger);font-size:16px">♦</span></div>
          <div class="card-h" style="margin-top:10px">Coaching Appointments</div><div style="font-size:12px">Coaching on greeting the customer (30min)</div></div>
      </div>`;
    }
    return `<div class="home"><div class="hero"><div><h1>Hello, ${esc(A.first)}</h1><p>Get a little help monitoring your work with your personal home page.</p></div><div class="art"></div></div>
      <div class="htabs">${tabs.map(x => `<div class="${st.homeTab === x ? 'on' : ''}" data-act="homeTab" data-id="${x}">${x}</div>`).join('')}</div>${content}</div>`;
  }

  function composeModal() {
    const cm = st.compose; if (!cm) return '';
    return `<div class="compose"><div class="ch">Compose a message<span class="r"><span data-act="closeCompose">${ic('min', 'sm')}</span>${ic('max', 'sm')}<span data-act="closeCompose" style="cursor:pointer">${ic('x', 'sm')}</span></span></div>
      <div class="cb"><div class="fld"><div class="in">Email ${ic('down', 'sm')}</div></div>
        <div class="row2"><div class="fld"><label>To</label><div class="in">${esc(C.name)} &lt;${esc(C.email)}&gt;</div></div><div class="fld"><label>From</label><div class="in" style="overflow:hidden;white-space:nowrap">${esc(B.supportFrom)}</div></div></div>
        <div class="fld"><label>Subject</label><div class="in">${esc(S.email.subject)}</div></div>
        <div class="ebody" id="emailbody" contenteditable="${cm.typing ? 'false' : 'true'}">${cm.text ? esc(cm.text) : `<span class="gen">${ic('spark', 'sm')} Now Assist is drafting your email…</span>`}${cm.typing && cm.text ? '<span class="caret"></span>' : ''}</div></div>
      <div class="cf"><span class="ai-chip">${ic('spark', 'sm')} Generated by Now Assist</span>${ic('clip', 'sm')}${ic('smile', 'sm')}<button class="btn primary" data-act="sendEmail" ${cm.typing ? 'disabled' : ''}>${ic('send', 'sm')} Send</button></div></div>`;
  }

  function director() {
    if (!st.director) return '<div class="hotspot" data-act="director" title="Presenter controls"></div>';
    return `<div class="director"><h6>Presenter controls <span data-act="director" style="cursor:pointer">${ic('x', 'sm')}</span></h6>
      <select data-act-change="brand">${Object.keys(window.BRANDS).map(k => `<option value="${k}" ${k === BRAND_ID ? 'selected' : ''}>${window.BRANDS[k].company}</option>`).join('')}</select>
      <button data-act="scene" data-id="chat">1 · Chat scenario (start offline) <kbd>1</kbd></button>
      <button data-act="scene" data-id="call">2 · Call scenario (Anika chat, call rings) <kbd>2</kbd></button>
      <button data-act="scene" data-id="call-live">3 · Jump to active call <kbd>3</kbd></button>
      <button data-act="scene" data-id="home">4 · Agent home page <kbd>4</kbd></button>
      <button data-act="ringNow">Ring next work item now <kbd>I</kbd></button>
      <button data-act="advance">Advance customer / transcript <kbd>M</kbd></button>
      <button data-act="scene" data-id="${st.scene}">Reset this scene <kbd>R</kbd></button>
      <p>Toggle this panel with the <b>\`</b> key or the bottom-left corner. Add <b>?auto=0</b> to the URL to stop work items ringing on their own.</p></div>`;
  }

  // ---------- render ----------
  function render() {
    const app = document.getElementById('app');
    const keep = {};
    app.querySelectorAll('.c-body, .colR').forEach((el, i) => { keep[el.className + i] = el.scrollTop; });
    const focused = document.activeElement && document.activeElement.id === 'draft';
    const tab = st.tabs.find(tb => tb.id === st.active) || st.tabs[0];
    let view;
    if (tab.kind === 'home') view = homeView(); else view = ixView(st.ix[tab.id]);
    app.innerHTML = topbar() + `<div class="body">${rail()}<div class="main">${tabbar()}<div class="view">${inboxPanel()}${view}${composeModal()}${st.toast ? `<div class="toast">${ic('check')} ${esc(st.toast)}<span class="x" data-act="closeToast">${ic('x', 'sm')}</span></div>` : ''}</div></div></div>` + director();
    app.querySelectorAll('.c-body, .colR').forEach((el, i) => { const k = el.className + i; if (keep[k] != null) el.scrollTop = keep[k]; });
    app.querySelectorAll('.chatlog, #lscroll').forEach(el => { if (el.id !== 'lscroll' || (tab.kind === 'ix' && st.ix[tab.id].ltab === 'transcript')) el.scrollTop = el.scrollHeight; });
    const d = document.getElementById('draft');
    if (d) { d.addEventListener('input', e => { st.ix[d.dataset.id].draft = d.value; }); if (focused) { d.focus(); d.setSelectionRange(d.value.length, d.value.length); } }
    const eb = document.getElementById('emailbody');
    if (eb && st.compose && !st.compose.typing) eb.addEventListener('input', () => { st.compose.edited = eb.innerText; });
    if (st.bump) st.bump = false;
  }
  let softQueued = false;
  function renderSoft() { if (softQueued) return; softQueued = true; requestAnimationFrame(() => { softQueued = false; render(); }); }

  // ---------- actions ----------
  const ACT = {
    tab: id => { st.active = id; st.menu = null; },
    closeTab: id => { st.tabs = st.tabs.filter(tb => tb.id !== id); if (st.active === id) st.active = st.tabs[st.tabs.length - 1].id; },
    toggleInbox: () => { st.inboxOpen = !st.inboxOpen; },
    menu: id => { st.menu = st.menu === id ? null : id; },
    presence: id => {
      st.presence = id; st.menu = null;
      if (id === 'Available' && st.scene === 'chat' && AUTO && !st.rung.chat1) later(() => ring('chat1'), 2200);
    },
    accept: id => acceptItem(id, true),
    decline: id => { st.inbox = st.inbox.filter(i => i.id !== id); st.rung[id] = false; },
    send: id => sendChat(id),
    useSuggest: id => { const ix = st.ix[id]; const nx = chatNext(ix); if (nx) { sendChat(id, nx.text); return 'norender'; } },
    endChat: id => endChat(id),
    sendKb: id => { const ix = st.ix[id]; ix.log.push({ from: 'agent', text: B.kb.summary }); },
    subtab: id => { curIx().subtab = id; },
    ltab: id => { curIx().ltab = id; },
    openProduct: id => {
      const ix = st.ix[id] || curIx(); st.menu = null; ix.center = 'product'; ix.openLoc = null;
      if (ix.type === 'call') { ix.gates.storesChecked = true; maybeResumeTranscript(); } else ix.gates.inventoryChecked = true;
    },
    closeProduct: id => { (st.ix[id] || curIx()).center = 'record'; },
    loc: id => { const ix = curIx(); ix.openLoc = ix.openLoc === +id ? -1 : +id; },
    startPickup: () => { const ix = curIx(); st.menu = null; ix.rec = 'pickup'; ix.pickup.step = 1; },
    recBack: () => { curIx().rec = 'list'; },
    pickupNext: () => { curIx().pickup.step = 2; },
    pickupBack: () => { curIx().pickup.step = 1; },
    pickupCreate: () => {
      const ix = curIx(); ix.pickup.created = true; ix.rec = 'list';
      addHistory({ icon: 'store', who: `Pickup request created for <b>${C.name}</b>`, ref: 'PREQ0005467', text: `${B.stores[ix.pickup.store].address} · ${ix.pickup.date} ${ix.pickup.time}` });
      toast('Pickup request PREQ0005467 was created'); return 'norender';
    },
    togglePu: () => { const p = curIx().pickup; p.open = !p.open; },
    nbaDismiss: () => { curIx().nbaDismissed = true; },
    addPoints: () => {
      const ix = curIx(); ix.pointsAdded = true; st.points += B.bonusPoints; st.bump = true;
      st.pointsHistory.unshift({ date: S.dates.today.slice(0, 6), label: 'Reward', pts: B.bonusPoints });
      addHistory({ icon: 'gift', who: `${B.bonusPoints.toLocaleString()} bonus points added for <b>${C.name}</b>`, ref: 'LOY0004418', text: `New balance: ${st.points.toLocaleString()} points. Push notification sent.` });
      toast(`${B.bonusPoints.toLocaleString()} bonus points were added to the customer's account.`); maybeResumeTranscript(); return 'norender';
    },
    openCompose: () => {
      st.menu = null; st.compose = { typing: true, text: '' };
      const store = B.stores[(st.ix.call1 && st.ix.call1.pickup.store) || B.pickup.storeIndex];
      const body = S.email.body.replace(B.stores[B.pickup.storeIndex].address, store.address);
      typeInto(body, v => { st.compose.text = v; }, () => { st.compose.typing = false; }, 8);
    },
    closeCompose: () => { st.compose = null; },
    sendEmail: () => {
      const ix = st.ix.call1; st.compose = null; if (ix) ix.emailSent = true;
      addHistory({ icon: 'mail', who: `Email sent to <b>${C.name}</b>`, ref: 'IMS0000188', text: S.email.subject });
      toast(`Email sent to ${C.email}`); maybeResumeTranscript(); return 'norender';
    },
    endCall: () => endCall(),
    mute: () => { const ix = curIx(); ix.muted = !ix.muted; },
    hold: () => { const ix = curIx(); ix.held = !ix.held; },
    save: id => { const ix = st.ix[id]; ix.saved = true; toast(`Interaction ${ix.number} has been saved`); return 'norender'; },
    closeToast: () => { st.toast = null; },
    homeTab: id => { st.homeTab = id; },
    director: () => { st.director = !st.director; },
    scene: id => { setScene(id); return 'norender'; },
    ringNow: () => { ring(st.scene === 'chat' ? 'chat1' : 'call1'); return 'norender'; },
    advance: () => advance()
  };
  function curIx() { return st.ix[st.active]; }
  function advance() {
    const ix = curIx(); if (!ix) return;
    if (ix.type === 'call') { nextTranscript(true); return; }
    if (ix.id === 'chat1') { const nx = chatNext(ix); if (nx && nx.from === 'cust') queueCustomer(ix); else if (nx) sendChat(ix.id, nx.text); }
  }

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]'); if (!el) { if (st.menu) { st.menu = null; render(); } return; }
    if (el.tagName === 'SELECT') return;
    e.stopPropagation();
    const fn = ACT[el.dataset.act]; if (!fn) return;
    if (el.dataset.act === 'closeTab') e.preventDefault();
    const r = fn(el.dataset.id);
    if (r !== 'norender') render();
  });
  document.addEventListener('change', e => {
    const k = e.target.dataset.actChange; if (!k) return;
    if (k === 'brand') { params.set('brand', e.target.value); location.search = params.toString(); }
    if (k === 'store') curIx().pickup.store = +e.target.value;
    if (k === 'wrap') curIx().wrapCode = e.target.value;
  });
  document.addEventListener('input', e => {
    if (e.target.dataset.actInput === 'pdate') { const v = e.target.value.trim().split(' '); const p = curIx().pickup; p.date = v.shift() || p.date; p.time = v.join(' ') || p.time; }
  });
  document.addEventListener('keydown', e => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (e.target.id === 'draft' && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(e.target.dataset.id); return; }
    if (tag === 'textarea' || tag === 'input' || tag === 'select' || e.target.isContentEditable) return;
    const k = e.key.toLowerCase();
    if (k === '`') { st.director = !st.director; render(); }
    else if (k === '1') setScene('chat'); else if (k === '2') setScene('call'); else if (k === '3') setScene('call-live'); else if (k === '4') setScene('home');
    else if (k === 'i') ring(st.scene === 'chat' ? 'chat1' : 'call1');
    else if (k === 'm') { advance(); render(); }
    else if (k === 'r') setScene(st.scene);
  });

  // ticking clocks without full re-render
  setInterval(() => {
    const ix = st && st.ix.call1;
    if (ix && !ix.ended) document.querySelectorAll('.calltime').forEach(el => { el.textContent = elapsed(ix); });
    if (st) st.inbox.forEach(it => { if (it.remaining > 0) it.remaining--; document.querySelectorAll(`.wt[data-id="${it.id}"]`).forEach(el => { el.textContent = `0:${String(it.remaining).padStart(2, '0')}`; }); });
  }, 1000);

  setScene(params.get('scene') || 'chat');
})();
