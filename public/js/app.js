/* Mock ServiceNow-style CSM workspace for a state tax agency (vanilla JS SPA, no build step). Fictional data only. */
(function () {
  'use strict';

  // ---------------------------------------------------------------- utils
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem('snowmock.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('snowmock.' + k, JSON.stringify(v)); } catch { /* storage blocked */ } },
  };
  const fmtD = (s) => s ? new Date(s.length === 10 ? s + 'T12:00:00' : s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const fmtT = (s) => new Date(s).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const fmtDT = (s) => s ? `${fmtD(s)} ${s.length > 10 ? fmtT(s) : ''}` : '';
  const money = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const digits = (s) => String(s || '').replace(/\D/g, '');
  const fmtPhone = (s) => { const d = digits(s).slice(-10); return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : (s || ''); };
  const clean = (v) => { v = (v ?? '').toString().trim(); return /\{\{.*\}\}|^\$\{.*\}$|^undefined$|^null$/i.test(v) ? '' : v; };
  const initials = (name) => String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase();
  const COLORS = ['#b2367a', '#2a5db0', '#a86a00', '#2e8540', '#6b52c8', '#1a7c8c', '#c3243a'];
  const colorFor = (s) => COLORS[[...String(s)].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];
  const avatar = (name, cls = '', seed) => `<span class="avatar ${cls}" style="background:${colorFor(seed || name)}">${esc(initials(name))}</span>`;
  const daysUntil = (d) => Math.round((new Date(d + 'T12:00:00') - new Date(S.today + 'T12:00:00')) / 864e5);

  const IC = {
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>', list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    inbox: '<path d="M4 4h16v12H4z"/><path d="M4 13h5l1.5 2h3L15 13h5"/><path d="M9 20h6"/>', search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    bell: '<path d="M6 8a6 6 0 1112 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 004 0"/>', help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 015 .5c0 1.5-2.5 2-2.5 3.5M12 17h.01"/>',
    chat: '<path d="M21 12a8 8 0 01-11.5 7.2L4 20l1-4.5A8 8 0 1121 12z"/>', phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2"/>',
    hang: '<path d="M3 15c5-5 13-5 18 0l-2.5 2.5-3-1.5v-2.5a10 10 0 00-7 0V16l-3 1.5z"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/>', hold: '<path d="M9 5v14M15 5v14"/>',
    xfer: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2"/><path d="M15 3h6v6M21 3l-6 6"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" fill="currentColor" stroke="none"/>',
    pencil: '<path d="M4 20h4L19 9l-4-4L4 16z"/>', dots: '<circle cx="12" cy="5" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="19" r="1.3" fill="currentColor"/>',
    dotsh: '<circle cx="5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="19" cy="12" r="1.3" fill="currentColor"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>', plus: '<path d="M12 5v14M5 12h14"/>', down: '<path d="M6 9l6 6 6-6"/>', left: '<path d="M15 6l-6 6 6 6"/>', right: '<path d="M9 6l6 6-6 6"/>',
    check: '<path d="M5 12l5 5 9-10"/>', spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" fill="currentColor" stroke="none"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" fill="currentColor" stroke="none"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>', doc: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
    cash: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>', shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>', people: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2A5 5 0 0121.5 19"/>',
    book: '<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 19V5"/>', refresh: '<path d="M20 11a8 8 0 10-2.3 5.7M20 4v7h-7"/>', send: '<path d="M4 12l16-8-6 16-3-7z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>', tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>', route: '<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H16a3 3 0 000-6H8a3 3 0 010-6h7.5"/>',
    wrench: '<path d="M14.5 5.5a4 4 0 005 5L13 17l-4 4-3-3 4-4 6.5-6.5"/>', home2: '<path d="M4 10l8-6 8 6v10H4z"/><path d="M10 20v-6h4v6"/>', bank: '<path d="M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>',
    case: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2"/>', globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/>',
    up: '<path d="M7 11v9H4v-9zM7 11l4-8a2 2 0 012 2v4h6a2 2 0 012 2l-2 7a2 2 0 01-2 2H7"/>', dn: '<path d="M7 13V4H4v9zM7 13l4 8a2 2 0 002-2v-4h6a2 2 0 002-2l-2-7a2 2 0 00-2-2H7"/>', copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/>',
  };
  const ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24">${IC[n] || ''}</svg>`;

  // ---------------------------------------------------------------- state
  const S = {
    user: store.get('user', null),
    settings: Object.assign({ autoPop: true, ringInbox: true, agentEmail: '', presence: 'On Queue', popView: 'interaction', palette: '' }, store.get('settings', {})),
    config: {}, brand: {}, users: [], today: new Date().toISOString().slice(0, 10), records: {}, tabs: store.get('tabs', []),
    interaction: null, inbox: [], inboxOpen: false, popResult: null, assistOpen: false, aiLog: [], sse: null, sseOn: false, embed: false, expanded: {}, menu: null,
  };
  const saveSettings = () => store.set('settings', S.settings);
  const saveTabs = () => store.set('tabs', S.tabs);

  async function api(path, opts = {}) {
    const r = await fetch(path, { method: opts.method || 'GET', headers: { 'Content-Type': 'application/json' }, body: opts.body ? JSON.stringify(opts.body) : undefined });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || `Request failed (${r.status})`);
    return j;
  }
  async function loadTp(id, force) { if (!S.records[id] || force) S.records[id] = await api(`/api/taxpayers/${id}`); return S.records[id]; }

  // ---------------------------------------------------------------- toast & modal
  function toast(html, opts = {}) {
    let wrap = $('.toasts'); if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toasts'; document.body.appendChild(wrap); }
    const t = document.createElement('div'); t.className = 'toast ' + (opts.cls || ''); t.innerHTML = `${opts.cls === 'genesys' ? ic('phone') : ic('check')}<div>${html}</div><span class="x">${ic('x', 'sm')}</span>`; wrap.appendChild(t);
    const close = () => t.remove();
    t.addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); if (b) { opts.on && opts.on(b.dataset.act); close(); } else if (e.target.closest('.x')) close(); });
    if (!opts.sticky) setTimeout(close, opts.ms || 4000);
  }
  function modal(title, body, foot, opts = {}) {
    closeModal();
    const back = document.createElement('div'); back.className = 'modal-back'; back.id = 'modal';
    back.innerHTML = `<div class="modal ${opts.wide ? 'wide' : ''}" role="dialog" aria-label="${esc(title)}"><div class="modal-h"><h2>${title}</h2><button class="iconbtn" data-close>${ic('x')}</button></div><div class="modal-b">${body}</div>${foot ? `<div class="modal-f">${foot}</div>` : ''}</div>`;
    back.addEventListener('click', (e) => { if (e.target === back || e.target.closest('[data-close]')) closeModal(); });
    document.body.appendChild(back);
    const f = $('input:not([readonly]),select,textarea', back); if (f && !opts.nofocus) f.focus();
    return back;
  }
  const closeModal = () => $('#modal')?.remove();
  const fieldVal = (id) => ($('#' + id)?.value || '').trim();
  async function act(fn, okMsg) {
    try { const r = await fn(); if (okMsg) toast(okMsg); return r; } catch (e) { toast(esc(e.message), { cls: 'genesys' }); throw e; }
  }

  // ---------------------------------------------------------------- routing
  function go(hash) { S.menu = null; if (location.hash === hash) render(); else location.hash = hash; }
  function parseRoute() {
    const h = location.hash.replace(/^#\/?/, '') || 'home';
    const [p, qs] = h.split('?'); const parts = p.split('/');
    return { name: parts[0], parts, q: new URLSearchParams(qs || '') };
  }
  function openTab(kind, id) { if (!S.tabs.some((t) => t.kind === kind && t.id === id)) { S.tabs.push({ kind, id }); saveTabs(); } }
  async function openTaxpayer(id, tab = 'overview') { await loadTp(id, true); openTab('tp', id); go(`#/taxpayer/${id}/${tab}`); }

  // ---------------------------------------------------------------- shell
  function brandMark() {
    const L = S.brand.logo || {};
    const fb = `<span class="wordmark"><b>${esc(L.wordTop || '')}</b><span>${esc(L.wordBottom || '')}</span></span>`;
    return L.image && !window.__logoFail ? `<img src="${esc(L.image)}" alt="${esc(S.brand.agency)}" onerror="window.__logoFail=1;this.outerHTML=this.dataset.fb" data-fb="${esc(fb)}">` : fb;
  }
  function shell() {
    const r = parseRoute(); const ix = S.interaction;
    document.body.classList.toggle('embed', S.embed);
    const pc = presColor(S.settings.presence);
    const activeKey = r.name === 'taxpayer' ? `tp:${r.parts[1]}` : r.name === 'case' ? `case:${r.parts[1]}` : r.name === 'ims' ? `ims:${r.parts[1]}` : r.name === 'home' ? 'home' : '';
    $('#root').innerHTML = `
    <div id="app">
      <div class="topbar">
        <div class="brandmark wide" title="${esc(S.brand.agency)}" data-go="#/home" style="cursor:pointer">${brandMark()}</div>
        <div class="topnav"><span data-go="#/list/cases" title="All lists">All</span><span data-go="#/kb" title="Knowledge">Favorites</span><span data-go="#/list/interactions" title="Recent interactions">History</span><span data-go="#/home" title="Workspace home">Workspaces</span></div>
        <div class="ws-pill">${esc(S.brand.workspaceName || 'CSM/FSM Configurable Workspace')} <span class="star">${ic('star', 'sm')}</span></div>
        <div class="top-right">
          <form class="searchbox v3" id="gsearch">${ic('search', 'sm')}<input id="gq" placeholder="Search" autocomplete="off"><span class="sdrop" data-menu="scope">${ic('down', 'sm')}</span>${S.menu === 'scope' ? `<div class="menu" style="top:30px;right:0">${[['all', 'Taxpayers, cases and returns'], ['kb', 'Knowledge articles']].map(([k, l]) => `<div data-scope="${k}">${(S.scope || 'all') === k ? ic('check', 'sm') : '<span style="width:13px"></span>'}${l}</div>`).join('')}</div>` : ''}</form>
          <button class="iconbtn badged" data-assist title="Now Assist">${ic('chat')}${ix ? '<span class="tb">1</span>' : ''}</button>
          <button class="iconbtn" data-go="#/kb" title="Help and knowledge">${ic('help')}</button>
          <button class="iconbtn badged" data-go="#/genesys" title="Genesys Cloud ${S.sseOn ? '(connected)' : '(not connected)'}">${ic('phone')}${S.inbox.length || ix ? `<span class="tb">${S.inbox.length || 1}</span>` : ''}<i class="sse ${S.sseOn ? 'on' : ''}" id="sseDot"></i></button>
          <div style="position:relative"><button class="iconbtn" data-menu="bell" title="Notifications">${ic('bell')}</button>${S.menu === 'bell' ? `<div class="menu" style="top:32px;right:-6px;min-width:260px">${(S.notes || []).slice(0, 6).map((n) => `<div data-go="${esc(n.go)}">${ic('phone', 'sm')}<span>${esc(n.text)}<br><small class="muted">${esc(n.when)}</small></span></div>`).join('') || '<div class="muted">No notifications</div>'}</div>` : ''}</div>
          <span style="position:relative;cursor:pointer" data-usermenu title="${esc(S.user.name)} - ${esc(S.user.role)}"><span class="avatar me">${esc(initials(S.user.name))}</span><i class="presence-dot" style="background:${pc}"></i></span>
        </div>
      </div>
      <div class="body">
        <div class="rail">
          <button data-go="#/home" class="${r.name === 'home' ? 'on' : ''}" title="Home">${ic('home')}</button>
          <button data-go="#/list/cases" class="${r.name === 'list' && r.parts[1] !== 'interactions' ? 'on' : ''}" title="Lists">${ic('list')}</button>
          <button data-inbox class="${S.inboxOpen ? 'on' : ''} ${S.inbox.length ? 'ring' : ''}" title="Inbox">${ic('inbox')}${S.inbox.length ? `<span class="badge">${S.inbox.length}</span>` : ''}</button>
          <button data-go="#/list/interactions" class="${r.name === 'list' && r.parts[1] === 'interactions' ? 'on' : ''}" title="History">${ic('clock')}</button>
        </div>
        <div class="main">
          <div class="tabbar">
            <div class="tab ${activeKey === 'home' ? 'on' : ''}" data-go="#/home">${ic('home', 'sm')}<div class="t-lbl"><span>Home</span></div></div>
            ${S.tabs.map((t) => tabHtml(t, activeKey)).join('')}
            <div class="plus" data-go="#/list/taxpayers" title="Open a record">${ic('plus', 'sm')}</div><div class="more">${ic('dotsh', 'sm')}</div>
          </div>
          <div class="view">${S.inboxOpen ? inboxHtml() : ''}<div id="surface" style="flex:1;display:flex;min-width:0;min-height:0"></div></div>
        </div>
      </div>
    </div>
    ${S.assistOpen ? assistHtml() : ''}
    <div class="demo-flag">Demo environment: fictional taxpayers · v${esc(S.config.version || '')}</div>`;
    bindShell();
  }
  function tabHtml(t, activeKey) {
    const key = `${t.kind}:${t.id}`;
    let label = '', sub = '', icon = ic('user', 'sm chan');
    if (t.kind === 'tp') { const c = S.records[t.id]; if (!c) return ''; label = c.fullName; const ix = S.interaction; if (ix && ix.taxpayerId === t.id) { icon = ix.mediaType === 'voice' ? ic('phone', 'sm chan') : ic('chat', 'sm chan'); sub = `${ic('clock', 'sm')} <span class="tabTimer">${timer(ix)}</span>`; } else sub = c.type === 'Business' ? 'Business' : 'Taxpayer'; }
    if (t.kind === 'case') { icon = ic('case', 'sm chan'); label = t.label || t.id; sub = 'Case'; }
    if (t.kind === 'ims') {
      const c = S.calls[t.id]; const live = c && ['connecting', 'active', 'wrapup'].includes(c.phase);
      icon = ic('phone', `sm chan ${live ? 'solid' : ''}`); label = c && c.tabStage === 'loading' ? 'Loading…' : c && c.tabStage === 'record' ? 'Record' : (S.ims[t.id]?.contact || t.label || t.id);
      sub = c && c.phase === 'wrapup' ? 'Call is in wrap-up' : '';
    }
    return `<div class="tab ${activeKey === key ? 'on' : ''}" data-go="${t.kind === 'tp' ? `#/taxpayer/${t.id}/overview` : t.kind === 'ims' ? `#/ims/${t.id}` : `#/case/${t.id}`}">${icon}<div class="t-lbl"><span>${esc(label)}</span><small>${sub}</small></div><span class="x" data-closetab="${key}">${ic('x', 'sm')}</span></div>`;
  }
  function presColor(p) { return { 'On Queue': '#2e9e4f', Available: '#2e9e4f', Away: '#f0a400', Break: '#f0a400', Meal: '#f0a400', Busy: '#c3243a', Offline: '#9aa6ad' }[p] || '#6b7c86'; }
  function timer(ix) { const s = Math.max(0, Math.floor((Date.now() - ix.startedAt) / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
  setInterval(() => {
    const ix = S.interaction; if (ix) { const t = timer(ix); const el = $('#ixTimer'); if (el) el.textContent = `${ix.mediaType === 'voice' ? 'On call' : 'Chat'} ${t}`; $$('.tabTimer, .calltime').forEach((x) => { x.textContent = t; }); }
    S.inbox.forEach((it) => { if (it.remaining > 0) it.remaining--; const el = $(`.wt[data-id="${it.id}"]`); if (el) el.textContent = `${Math.floor(it.remaining / 60)}:${String(it.remaining % 60).padStart(2, '0')}`; });
  }, 1000);

  function inboxHtml() {
    const P = (S.brand.ui && S.brand.ui.presence) || ['On Queue', 'Available', 'Away', 'Busy', 'Offline'];
    const menu = S.menu === 'presence' ? `<div class="menu" style="top:24px;left:0">${P.map((p) => `<div data-presence="${esc(p)}"><i class="dot" style="background:${presColor(p)}"></i>${esc(p)}</div>`).join('')}</div>` : '';
    const items = S.inbox.map((it) => `<div class="witem v3 ${it.mediaType === 'voice' ? 'call' : ''}">
      <div class="w-top">${it.mediaType === 'voice' ? ic('phone', 'sm') : ic('chat', 'sm')} <b>${it.mediaType === 'voice' ? 'Phone' : 'Chat'}</b><span class="w-num">${esc(it.imsNumber || '')}</span></div>
      <div class="w-name">${esc(it.name)}</div><div class="w-sub">${esc(it.phone)}${it.queue ? ` · ${esc(it.queue)}` : ''}</div>
      <div class="w-timer">Time to accept: <b class="wt" data-id="${it.id}">${Math.floor(it.remaining / 60)}:${String(it.remaining % 60).padStart(2, '0')}</b></div>
      <div class="w-actions"><button class="decline" data-decline="${it.id}">Reject</button><button class="accept" data-accept="${it.id}">Accept</button></div></div>`).join('');
    return `<div class="inbox"><div class="inbox-head"><small>Status</small><div class="ih-row"><div style="position:relative"><button class="status-btn" data-menu="presence"><i class="dot" style="background:${presColor(S.settings.presence)}"></i>${esc(S.settings.presence)} ${ic('down', 'sm')}</button>${menu}</div><span class="gear" data-usermenu title="Inbox settings">${ic('gear', 'sm')}</span></div></div>
      <div class="inbox-list">${items || `<div class="inbox-empty">${ic('clock')}<b>No inbox items</b>As work items are assigned, they will appear in this panel.<br><br><a href="#/genesys">Simulate an interaction</a></div>`}</div></div>`;
  }

  function bindShell() {
    $('#root').onclick = (e) => {
      const close = e.target.closest('[data-closetab]');
      if (close) { e.stopPropagation(); const [kind, id] = close.dataset.closetab.split(':'); S.tabs = S.tabs.filter((t) => !(t.kind === kind && t.id === id)); saveTabs(); const r = parseRoute(); if ((kind === 'tp' && r.name === 'taxpayer' && r.parts[1] === id) || (kind === 'case' && r.name === 'case' && r.parts[1] === id) || (kind === 'ims' && r.name === 'ims' && r.parts[1] === id)) go('#/home'); else render(); return; }
      const m = e.target.closest('[data-menu]'); if (m) { e.stopPropagation(); S.menu = S.menu === m.dataset.menu ? null : m.dataset.menu; render(); return; }
      const pr = e.target.closest('[data-presence]'); if (pr) { S.settings.presence = pr.dataset.presence; saveSettings(); S.menu = null; render(); return; }
      const sc = e.target.closest('[data-scope]'); if (sc) { e.stopPropagation(); S.scope = sc.dataset.scope; S.menu = null; render(); return; }
      const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); go(g.dataset.go); return; }
      if (e.target.closest('[data-inbox]')) { S.inboxOpen = !S.inboxOpen; render(); return; }
      const acc = e.target.closest('[data-accept]'); if (acc) { acc.classList.add('pressed'); const it = S.inbox.find((x) => x.id === acc.dataset.accept); setTimeout(() => { S.inbox = S.inbox.filter((x) => x !== it); S.inboxOpen = false; if (it) handlePop(it.params, 'inbox'); }, 250); return; }
      const dec = e.target.closest('[data-decline]'); if (dec) { const it = S.inbox.find((x) => x.id === dec.dataset.decline); if (it?.params?.imsId) api(`/api/ims/${it.params.imsId}`, { method: 'PATCH', body: { state: 'Rejected' } }).catch(() => {}); S.inbox = S.inbox.filter((x) => x !== it); render(); return; }
      if (e.target.closest('[data-usermenu]')) return userMenu();
      if (e.target.closest('[data-assist]')) { S.assistOpen = !S.assistOpen; render(); return; }
      if (S.menu && !e.target.closest('.menu')) { S.menu = null; render(); }
    };
    $('#gsearch').onsubmit = (e) => { e.preventDefault(); const q = $('#gq').value.trim(); if (q) go(S.scope === 'kb' ? `#/kb?q=${encodeURIComponent(q)}` : `#/search?q=${encodeURIComponent(q)}`); };
    if (S.assistOpen) bindAssist();
  }

  // ---------------------------------------------------------------- Now Assist panel
  function currentTp() { const r = parseRoute(); return r.name === 'taxpayer' ? S.records[r.parts[1]] : null; }
  function assistHtml() {
    const t = currentTp(); const log = S.aiLog.filter((x) => x.tid === (t?.id || null));
    return `<div class="assist" id="assist"><div class="ah">${ic('spark')} Now Assist <span class="muted small" style="font-weight:400">${t ? esc(t.fullName) : 'Workspace'}</span><button class="iconbtn" data-assist>${ic('x')}</button></div>
      <div class="ab" id="assistBody">${!log.length ? `<div class="muted small">Ask about ${t ? 'this taxpayer' : 'your work'}. Answers come from the record and the knowledge base (demo, rule-based).</div>` : ''}
      ${log.map((x) => `<div class="q">${esc(x.q)}</div><div class="a">${x.a ? x.a.html + (x.a.sources?.length ? `<div class="small muted" style="margin-top:6px">Sources: ${x.a.sources.map((s) => `<a href="#/kb/${s}">${s}</a>`).join(', ')}</div>` : '') + `<div class="fb" style="display:flex;gap:10px;color:var(--muted);margin-top:6px">${ic('up', 'sm')}${ic('dn', 'sm')}${ic('copy', 'sm')}</div>` : '<span class="gen">Thinking…</span>'}</div>`).join('')}
      <div class="sugg">${MockAI.suggestions(t).map((s) => `<button data-sugg="${esc(s)}">${esc(s)}</button>`).join('')}</div></div>
      <form class="ai-in" id="aiForm"><input id="aiQ" placeholder="Ask Now Assist" autocomplete="off"><button class="btn primary sm">${ic('send', 'sm')}</button></form></div>`;
  }
  function bindAssist() {
    const b = $('#assistBody'); if (b) b.scrollTop = b.scrollHeight;
    $('#assist').onclick = (e) => { const s = e.target.closest('[data-sugg]'); if (s) { e.stopPropagation(); askAI(s.dataset.sugg); } };
    $('#aiForm').onsubmit = (e) => { e.preventDefault(); const q = $('#aiQ').value.trim(); if (q) askAI(q); };
  }
  async function askAI(q) {
    const t = currentTp(); const entry = { q, tid: t?.id || null, a: null }; S.aiLog.push(entry); S.assistOpen = true; render();
    const ctx = { brand: S.brand };
    if (!t) ctx.cases = await api(`/api/cases?assignedTo=${encodeURIComponent(S.user.name)}&state=open`).catch(() => []);
    setTimeout(() => { entry.a = MockAI.answer(q, t, ctx); render(); }, 600);
  }

  // ---------------------------------------------------------------- settings
  function userMenu() {
    const u = S.user;
    modal('Settings', `
      <p style="margin-top:0"><b>${esc(u.name)}</b><br><span class="muted">${esc(u.role)} · ${esc(u.email)}</span></p>
      <div class="f"><label>Genesys Cloud agent email (screen pops addressed to this agent open here)</label><input id="sAgent" value="${esc(S.settings.agentEmail || u.email)}"></div>
      <label class="f" style="flex-direction:row;gap:8px;align-items:center"><input type="checkbox" id="sRing" ${S.settings.ringInbox ? 'checked' : ''}> Ring pushed calls and chats in the inbox (Accept / Decline) instead of opening them straight away</label>
      <label class="f" style="flex-direction:row;gap:8px;align-items:center"><input type="checkbox" id="sAuto" ${S.settings.autoPop ? 'checked' : ''}> Open the taxpayer record automatically when a screen pop arrives</label>
      <div class="frow"><div class="f"><label>Screen pops open</label><select id="sView"><option value="interaction" ${S.settings.popView !== 'taxpayer' ? 'selected' : ''}>The interaction record (v3 workspace)</option><option value="taxpayer" ${S.settings.popView === 'taxpayer' ? 'selected' : ''}>The taxpayer record (v2 layout)</option></select></div>
      <div class="f"><label>Color scheme</label><select id="sPal"><option value="" ${!S.settings.palette ? 'selected' : ''}>Brand default (${esc((S.brand.ui && S.brand.ui.palette) || 'workspace')})</option><option value="workspace" ${S.settings.palette === 'workspace' ? 'selected' : ''}>Workspace template colors</option><option value="brand" ${S.settings.palette === 'brand' ? 'selected' : ''}>Brand colors</option></select></div></div>
      <div class="f"><label>Brand (switching reloads the demo data with that agency's names)</label><select id="sBrand">${(S.config.brands || []).map((b) => `<option value="${b.id}" ${b.id === S.brand.id ? 'selected' : ''}>${esc(b.agency)}</option>`).join('')}</select></div>
      <p class="small muted">Version <b>${esc(S.config.version || '')}</b> (build ${esc(S.config.commit || '')}) · <a href="#" id="sNotes">Release notes</a></p>
      <p class="small muted">Retail version of the demo (Haven &amp; Hill guided story): <a href="/retail/" target="_blank">/retail/</a> · <a href="/api-docs.html" target="_blank">API reference</a></p>`,
      `<button class="btn danger left" id="sReset">Reset demo data</button><button class="btn" id="sOut">Switch user</button><button class="btn primary" id="sSave">Save</button>`);
    $('#sSave').onclick = async () => {
      S.settings.agentEmail = fieldVal('sAgent'); S.settings.ringInbox = $('#sRing').checked; S.settings.autoPop = $('#sAuto').checked; S.settings.popView = fieldVal('sView'); S.settings.palette = $('#sPal').value; saveSettings(); applyTheme(S.brand);
      if ($('#sBrand').value !== S.brand.id) { await api('/api/admin/reset', { method: 'POST', body: { brand: $('#sBrand').value } }); location.hash = '#/home'; location.reload(); return; }
      connectSSE(); closeModal(); render();
    };
    $('#sNotes').onclick = (e) => { e.preventDefault(); releaseNotes(); };
    $('#sOut').onclick = () => { S.user = null; store.set('user', null); closeModal(); render(); };
    $('#sReset').onclick = async () => { await api('/api/admin/reset', { method: 'POST' }); S.records = {}; S.tabs = []; saveTabs(); S.interaction = null; S.aiLog = []; S.calls = {}; S.ims = {}; S.call = null; S.imsHist = {}; closeModal(); toast('Demo data reset'); go('#/home'); };
  }

  async function releaseNotes() {
    const { markdown } = await api('/api/changelog');
    const inline = (x) => esc(x).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    let html = ''; let inList = false;
    markdown.split('\n').forEach((line) => {
      const li = line.match(/^\s*[-*] (.*)/);
      if (li) { if (!inList) { html += '<ul>'; inList = true; } html += `<li style="${/^\s{2,}/.test(line) ? 'margin-left:18px;list-style:circle' : ''}">${inline(li[1])}</li>`; return; }
      if (inList) { html += '</ul>'; inList = false; }
      const h = line.match(/^(#{1,3}) (.*)/);
      if (h) html += h[1].length === 1 ? '' : `<h${h[1].length + 1} style="margin:14px 0 4px">${inline(h[2])}</h${h[1].length + 1}>`;
      else if (line.trim()) html += `<p style="margin:4px 0">${inline(line)}</p>`;
    });
    if (inList) html += '</ul>';
    modal(`Release notes · v${esc(S.config.version)}`, `<div class="notes">${html}</div>`, '<button class="btn primary" data-close>Close</button>', { wide: true });
  }

  // ---------------------------------------------------------------- login
  function renderLogin() {
    document.body.className = '';
    $('#root').innerHTML = `<div class="login"><div class="brandside"><div class="brandmark wide" style="padding:0">${brandMark()}</div>
      <h1>${esc(S.brand.agency)}<br>Taxpayer Services Workspace</h1><p style="max-width:460px;opacity:.85;margin:0">Demonstration environment for Genesys Cloud and ServiceNow-style customer service. All taxpayers, cases and data are fictional.</p><p class="small" style="opacity:.7;margin:10px 0 0">Version ${esc(S.config.version || '')} · build ${esc(S.config.commit || '')}</p></div>
      <div class="panel"><h2 style="font-size:22px;margin:0 0 4px">Sign in</h2><p class="muted" style="margin:0 0 10px">Choose a demo persona. No password needed.</p>
      ${S.users.map((u) => `<button class="persona" data-user="${u.id}">${avatar(u.name, 'lg', u.id)}<div><b>${esc(u.name)}</b><br><span class="muted small">${esc(u.role)} · ${esc(u.group)}</span></div></button>`).join('')}</div></div>`;
    $$('[data-user]').forEach((b) => { b.onclick = () => { S.user = S.users.find((u) => u.id === b.dataset.user); store.set('user', S.user); connectSSE(); go('#/home'); }; });
  }

  // ---------------------------------------------------------------- render
  async function render() {
    if (!S.user) return renderLogin();
    const keep = {}; $$('.c-body, .colR, .page, .lscroll, .ims-hist, .ims-form').forEach((el, i) => { keep[el.className + i] = el.scrollTop; });
    shell();
    await renderPage();
    $$('.c-body, .colR, .page, .lscroll, .ims-hist, .ims-form').forEach((el, i) => { const k = el.className + i; if (keep[k] != null) el.scrollTop = keep[k]; });
    const tr = $('#transcript'); if (tr) tr.parentElement.scrollTop = tr.parentElement.scrollHeight;
  }
  async function renderPage() {
    const r = parseRoute(); const el = $('#surface');
    try {
      switch (r.name) {
        case 'home': return await pageHome(el);
        case 'list': return await pageList(el, r);
        case 'search': return await pageSearch(el, r);
        case 'taxpayer': return await pageTaxpayer(el, r);
        case 'case': return await pageCase(el, r);
        case 'ims': return await pageIms(el, r);
        case 'kb': return await pageKb(el, r);
        case 'genesys': return await pageGenesys(el);
        case 'pop-results': return pagePopResults(el);
        case 'register': return pageRegister(el, r);
        default: return await pageHome(el);
      }
    } catch (e) { el.innerHTML = `<div class="page"><div class="callout warn">${esc(e.message)}</div></div>`; }
  }

  // ---------------------------------------------------------------- home
  async function pageHome(el) {
    const cases = await api(`/api/cases?assignedTo=${encodeURIComponent(S.user.name)}&state=open`);
    const recent = (await api('/api/interactions')).slice(0, 5);
    const ht = S.homeTab || 'Overview';
    const tabs = ['Overview', 'Insights', 'Scorecard', 'Schedule'];
    const sched = [['On Queue', '8:00 am', '(2h)', true], ['Break', '10:00 am', '(15m)'], ['On Queue', '10:15 am', '(1h 45m)'], ['Meal', '12:00 pm', '(30m)'], ['On Queue', '12:30 pm', '(2h)'], ['Training', '2:30 pm', '(30m)'], ['On Queue', '3:00 pm', '(2h)'], ['Shift End', '5:00 pm', '']];
    let content;
    if (ht === 'Insights') content = `<div class="card"><div class="card-h">Performance insights · this week</div><table class="tbl"><tr><th>Agent</th><th>First contact resolution</th><th>Avg handle time</th><th>After-call work</th><th>Adherence</th><th>CSAT</th></tr>
      ${[[S.user.name, '86%', '6:42', '0:48', '94%', '4.7'], ['Allen Robinson', '81%', '7:15', '1:05', '91%', '4.5'], ['Gabriela Duran', '79%', '7:58', '1:12', '96%', '4.4'], ['Daniel Navarro', '74%', '8:21', '1:31', '88%', '4.2']].map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table></div>`;
    else if (ht === 'Scorecard') content = `<div class="hgrid" style="grid-template-columns:2fr 1fr"><div class="card"><div class="card-h">Leaderboard · total points this month</div>${[[S.user.name, 1204], ['Allen Robinson', 1102], ['Gabriela Duran', 987], ['Daniel Navarro', 912]].map((r, i) => `<div class="lb"><b style="width:18px">${i + 1}</b>${avatar(r[0], 'sm')}<span style="${i === 0 ? 'font-weight:700' : ''}">${esc(r[0])}</span><span style="margin-left:auto">${r[1].toLocaleString()}</span></div>`).join('')}</div><div class="card"><div class="card-h">Your rank</div><div class="big">1st</div><div class="muted">Top of the leaderboard this month</div></div></div>`;
    else if (ht === 'Schedule') content = `<div class="card"><div class="card-h">This week</div><div class="hgrid" style="grid-template-columns:repeat(5,1fr)">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d) => `<div><b>${d}</b><div class="sched" style="margin-top:6px">${sched.slice(0, 6).map((r) => `<div><span>${r[0]}</span><span>${r[1]}</span></div>`).join('')}</div></div>`).join('')}</div></div>`;
    else content = `<div class="hgrid">
      <div class="card"><div class="card-h">My open cases <span class="r"><a href="#/list/cases">View all</a></span></div><div class="big">${cases.length}</div>
        ${cases.slice(0, 5).map((c) => `<div class="lb" style="cursor:pointer" data-opencase="${c.id}"><span class="tag2 ${/High|Critical/.test(c.priority) ? 'red' : 'blue'}">${esc(c.priority.split(' - ')[1] || c.priority)}</span><div style="min-width:0"><div class="link" style="font-size:12.5px">${esc(c.number)}</div><div class="small muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.shortDescription)} · ${esc(c.taxpayerName)}</div></div><span class="small muted" style="margin-left:auto">${esc(c.state)}</span></div>`).join('') || '<div class="empty">Nothing assigned</div>'}</div>
      <div class="card"><div class="card-h">Today's schedule</div><div class="sched">
        <div class="now"><div style="display:flex;justify-content:space-between"><b>On Queue</b><span>(2h) 8:00 am</span></div><div class="green small" style="margin-top:3px">In adherence</div><div class="bar" style="margin:6px 0 0"><i style="width:62%"></i></div></div>
        ${sched.slice(1).map((r) => `<div><span><i class="dot ${r[0] === 'On Queue' ? 'Available' : r[0] === 'Shift End' ? 'Offline' : 'Away'}"></i> ${r[0]}</span><span>${r[2]} ${r[1]}</span></div>`).join('')}</div></div>
      <div class="card"><div class="card-h">Queue activity <span class="r small">Genesys Cloud</span></div>
        <div class="grid2"><div><div class="muted small">Waiting</div><div class="stat">4</div></div><div><div class="muted small">Longest wait</div><div class="stat">2:18</div></div><div><div class="muted small">Agents available</div><div class="stat">11</div></div><div><div class="muted small">Service level</div><div class="stat">87%</div></div></div>
        <div class="card-h" style="margin-top:12px">Evaluation summary</div><div class="muted small">This month</div><div class="stat">92%</div><div class="bar"><i style="width:92%"></i></div>
        <div class="small">Coaching: Verifying identity before disclosure (30 min)</div></div>
      <div class="card" style="grid-column:1/-1"><div class="card-h">My recent interactions</div>
        ${recent.length ? `<table class="tbl"><tr><th>When</th><th>Taxpayer</th><th>Channel</th><th>Summary</th><th>Wrap-up</th></tr>${recent.map((x) => `<tr class="click" data-opentp="${x.taxpayerId}"><td class="nowrap">${fmtDT(x.date)}</td><td>${esc(S.records[x.taxpayerId]?.fullName || x.taxpayerId)}</td><td>${esc(x.type)}</td><td>${esc(x.text.slice(0, 110))}${x.text.length > 110 ? '…' : ''}</td><td>${esc(x.wrapCode)}</td></tr>`).join('')}</table>` : '<div class="empty">No interactions yet today. Use the Genesys page or the inbox to take a call.</div>'}</div>
    </div>`;
    el.innerHTML = `<div class="home"><div class="hero"><div><h1>Hello, ${esc(S.user.name.split(' ')[0])}</h1><p>${esc(S.user.role)} · ${esc(S.user.group)} · ${esc(S.brand.agency)}</p></div><div class="art"></div></div>
      <div class="htabs">${tabs.map((x) => `<div class="${ht === x ? 'on' : ''}" data-htab="${x}">${x}</div>`).join('')}</div>${content}</div>`;
    el.onclick = (e) => {
      const h = e.target.closest('[data-htab]'); if (h) { S.homeTab = h.dataset.htab; return render(); }
      const c = e.target.closest('[data-opencase]'); if (c) return openCase(c.dataset.opencase);
      const t = e.target.closest('[data-opentp]'); if (t) return openTaxpayer(t.dataset.opentp);
    };
  }
  async function openCase(id) { const c = await api(`/api/cases/${id}`); const t = S.tabs.find((x) => x.kind === 'case' && x.id === c.id); if (!t) { S.tabs.push({ kind: 'case', id: c.id, label: c.number }); saveTabs(); } go(`#/case/${c.id}`); }

  // ---------------------------------------------------------------- lists & search
  const stateTag = (s) => `<span class="tag2 ${s === 'New' ? 'blue' : /Resolved|Closed/.test(s) ? 'green' : /Awaiting/.test(s) ? 'amber' : ''}">${esc(s)}</span>`;
  function casesTable(rows) {
    return `<table class="tbl"><tr><th>Number</th><th>Short description</th><th>Taxpayer</th><th>Category</th><th>State</th><th>Priority</th><th>Assignment group</th><th>Assigned to</th><th>Updated</th></tr>
      ${rows.map((c) => `<tr class="click" data-opencase="${c.id}"><td class="link">${esc(c.number)}</td><td>${esc(c.shortDescription)}</td><td>${esc(c.taxpayerName)}</td><td>${esc(c.category)}</td><td>${stateTag(c.state)}</td><td>${esc(c.priority)}</td><td>${esc(c.group)}</td><td>${esc(c.assignedTo || '(empty)')}</td><td class="nowrap">${fmtDT(c.updated)}</td></tr>`).join('') || '<tr><td colspan="9" class="empty">No records</td></tr>'}</table>`;
  }
  function tpTable(rows) {
    return `<table class="tbl"><tr><th>Name</th><th>Type</th><th>TIN</th><th>Phone</th><th>City</th><th>Refund</th><th>Balance due</th><th>Flags</th></tr>
      ${rows.map((t) => `<tr class="click" data-opentp="${t.id}"><td>${avatar(t.fullName, 'xs', t.id)} <span class="link">${esc(t.fullName)}</span></td><td>${esc(t.type)}</td><td>${esc(t.tin)}</td><td class="nowrap">${esc(t.phone)}</td><td>${esc(t.city)}</td><td>${t.refund ? `${money(t.refund.amount)} <span class="small muted">${esc(t.refund.status)}</span>` : '<span class="muted">-</span>'}</td><td class="num">${t.balance ? money(t.balance) : '-'}</td><td><div class="flags">${t.flags.slice(0, 2).map((f) => `<span class="tag2 ${/hold|due|delinquent|required/i.test(f) ? 'amber' : 'blue'}">${esc(f)}</span>`).join('')}</div></td></tr>`).join('') || '<tr><td colspan="8" class="empty">No taxpayers found</td></tr>'}</table>`;
  }
  async function pageList(el, r) {
    const what = r.parts[1] || 'cases';
    const filter = r.q.get('filter') || (what === 'cases' ? 'mine' : 'all');
    let body;
    if (what === 'cases') {
      const qs = filter === 'mine' ? `assignedTo=${encodeURIComponent(S.user.name)}&state=open` : filter === 'open' ? 'state=open' : '';
      const rows = await api(`/api/cases?${qs}`);
      body = `<div class="filters">${[['mine', 'My open cases'], ['open', 'All open'], ['all', 'All cases']].map(([k, l]) => `<button class="btn sm ${filter === k ? 'on' : ''}" data-go="#/list/cases?filter=${k}">${l}</button>`).join('')}</div><div class="card" style="padding:0">${casesTable(rows)}</div>`;
    } else if (what === 'interactions') {
      const rows = await api(`/api/ims${filter === 'mine' ? `?assignedTo=${encodeURIComponent(S.user.name)}` : ''}`);
      body = `<div class="filters">${[['all', 'All interactions'], ['mine', 'Assigned to me']].map(([k, l]) => `<button class="btn sm ${filter === k ? 'on' : ''}" data-go="#/list/interactions?filter=${k}">${l}</button>`).join('')}</div><div class="card" style="padding:0"><table class="tbl"><tr><th>Number</th><th>Opened</th><th>Contact</th><th>Short description</th><th>Type</th><th>State</th><th>Assigned to</th></tr>${rows.map((x) => `<tr class="click" data-go="#/ims/${x.id}"><td class="link">${esc(x.number)}</td><td class="nowrap">${fmtDT(x.opened)}</td><td>${esc(x.contact)}</td><td>${esc(x.shortDescription)}</td><td>${esc(x.type)}</td><td>${esc(x.state)}</td><td>${esc(x.assignedTo)}</td></tr>`).join('') || '<tr><td colspan="7" class="empty">No interactions</td></tr>'}</table></div>`;
    } else {
      const rows = await api('/api/taxpayers?all=1');
      body = `<div class="card" style="padding:0">${tpTable(rows)}</div>`;
    }
    el.innerHTML = `<div class="page"><div class="page-h"><h2>${what === 'cases' ? 'Cases' : what === 'interactions' ? 'Interactions' : 'Taxpayers'}</h2>
      <div class="filters" style="margin:0 0 0 14px"><button class="btn sm ${what === 'cases' ? 'on' : ''}" data-go="#/list/cases">Cases</button><button class="btn sm ${what === 'taxpayers' ? 'on' : ''}" data-go="#/list/taxpayers">Taxpayers</button><button class="btn sm ${what === 'interactions' ? 'on' : ''}" data-go="#/list/interactions">Interactions</button></div>
      <div class="r">${what === 'cases' ? '<button class="btn primary" data-newcase>New</button>' : `<button class="btn primary" data-go="#/register">New contact</button>`}</div></div>${body}</div>`;
    el.onclick = listClicks;
  }
  function listClicks(e) {
    const c = e.target.closest('[data-opencase]'); if (c) return openCase(c.dataset.opencase);
    const t = e.target.closest('[data-opentp]'); if (t) return openTaxpayer(t.dataset.opentp);
    if (e.target.closest('[data-newcase]')) return caseModal(null);
    const k = e.target.closest('[data-kb]'); if (k) return go(`#/kb/${k.dataset.kb}`);
  }
  async function pageSearch(el, r) {
    const q = r.q.get('q') || '';
    const [tps, cases, kb] = await Promise.all([api(`/api/taxpayers?q=${encodeURIComponent(q)}`), api('/api/cases'), api(`/api/kb?q=${encodeURIComponent(q)}`)]);
    const ql = q.toLowerCase(); const cs = cases.filter((c) => `${c.number} ${c.shortDescription} ${c.taxpayerName}`.toLowerCase().includes(ql));
    el.innerHTML = `<div class="page"><div class="page-h"><h2>Search results for "${esc(q)}"</h2></div>
      <h3 class="card-h">Taxpayers (${tps.length})</h3><div class="card" style="padding:0;margin-bottom:14px">${tpTable(tps)}</div>
      <h3 class="card-h">Cases (${cs.length})</h3><div class="card" style="padding:0;margin-bottom:14px">${casesTable(cs)}</div>
      <h3 class="card-h">Knowledge (${kb.length})</h3><div class="card">${kb.map((k) => `<div class="kbitem" data-kb="${k.id}"><h4>${esc(k.title)}</h4><div class="small muted">${esc(k.id)} · ${esc(k.category)}</div><div class="small">${esc(k.summary)}</div></div>`).join('') || '<div class="empty">No articles</div>'}</div></div>`;
    el.onclick = listClicks;
  }

  // ---------------------------------------------------------------- taxpayer record
  const TABS = [['overview', 'Overview'], ['returns', 'Returns'], ['refunds', 'Refunds'], ['balances', 'Balances & payments'], ['notices', 'Notices'], ['cases', 'Cases'], ['identity', 'Identity'], ['activity', 'Activity'], ['profile', 'Profile']];
  async function pageTaxpayer(el, r) {
    const id = r.parts[1]; const tab = r.parts[2] || 'overview';
    const t = await loadTp(id); openTab('tp', id);
    const ix = S.interaction && S.interaction.taxpayerId === id && !S.interaction.imsId ? S.interaction : null;
    if (!$$('.tab').some((x) => x.dataset.go === `#/taxpayer/${id}/overview`)) shell();
    const counts = { returns: t.returns.length, notices: t.notices.length, cases: t.cases.length };
    el.innerHTML = `<div class="rec ${ix ? 'with-ix' : ''}">
      ${ix ? ixColumn(t, ix) : ''}
      <div class="colC">
        <div class="rec-head">${avatar(t.fullName, 'lg', t.id)}<div><h2>${esc(t.fullName)}</h2><div class="meta">${esc(t.type)} · TIN ${esc(t.tin)}${t.dba ? ` · DBA ${esc(t.dba)}` : ''} · ${esc(t.id.toUpperCase())}</div></div>
          <div class="acts"><button class="btn" data-a="newcase">New case</button><div style="position:relative"><button class="btn" data-menu="compose">${ic('down', 'sm')} Compose</button>${S.menu === 'compose' ? `<div class="menu" style="top:30px;right:0"><div data-a="email">${ic('mail', 'sm')} Email</div><div data-a="note">${ic('pencil', 'sm')} Log a contact</div></div>` : ''}</div>
          <button class="btn primary" data-a="save">Save</button></div></div>
        <div style="padding:8px 14px 0" class="flags">${t.flags.map((f) => `<span class="tag2 ${/hold|due|delinquent|required|undeliverable|assessment/i.test(f) ? 'amber' : /released|plan/i.test(f) ? 'green' : 'blue'}">${esc(f)}</span>`).join('')}${t.identity.status === 'Verified' ? '<span class="tag2 green">Identity verified</span>' : '<span class="tag2 red">Identity not verified</span>'}</div>
        <div class="subtabs">${TABS.map(([k, l]) => `<div class="${tab === k ? 'on' : ''}" data-go="#/taxpayer/${id}/${k}">${l}${counts[k] ? `<span class="cnt">${counts[k]}</span>` : ''}</div>`).join('')}</div>
        <div class="c-body">${tpTab(t, tab)}</div>
      </div>
      <div class="colR">${recommendations(t)}</div>
      <div class="colX"><span class="on" data-assist style="cursor:pointer">${ic('spark', 'sm')}</span>${ic('book', 'sm')}${ic('doc', 'sm')}</div>
    </div>`;
    el.onclick = (e) => tpClicks(e, t);
    const wc = $('#wrapCode'); if (wc) wc.onchange = () => { S.interaction.wrapCode = wc.value; };
  }

  const script = (t, ix) => MockAI.transcript(t, S.brand, S.user.name.split(' ')[0], ix);
  function botLines(bot, upto) {
    return (upto == null ? bot.transcript : bot.transcript.slice(0, upto)).map((l) => l.who === 'event'
      ? `<div class="tline event ${esc(l.kind || '')}">${ic(l.kind === 'verified' ? 'shield' : l.kind === 'link' ? 'globe' : l.kind === 'end' ? 'route' : 'spark', 'sm')}<span>${esc(l.text)}</span></div>`
      : `<div class="tline ${l.who === 'bot' ? 'bot' : 'cust'}"><div class="tw">${l.who === 'bot' ? `${esc(bot.botName)} <small>virtual agent</small>` : esc(bot.caller || 'Caller')}</div>${esc(l.text)}</div>`).join('');
  }
  function botCard(bot) {
    return `<div class="botcard"><div class="bh">${ic('spark', 'sm')} <b>${esc(bot.botName)}</b> virtual agent handoff<span class="tag2 ${bot.outcome === 'Contained' ? 'green' : 'blue'}">${esc(bot.outcome)}</span></div>
      <div class="bi">${esc(bot.intent)} · ${esc(bot.taxType || '')}${bot.confidence ? ` · ${bot.confidence}% confidence` : ''}</div>
      <div class="bslots">${Object.entries(bot.slots || {}).map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}<div><span>Authenticated by bot</span><b>${bot.authenticated ? esc(bot.authMethod || 'Yes') : 'No'}</b></div></div>
      ${(bot.linksShared || []).map((l) => `<div class="small">${ic('globe', 'sm')} Link shared: <a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.title)}</a></div>`).join('')}</div>`;
  }
  function ixColumn(t, ix) {
    const voice = ix.mediaType === 'voice';
    const tr = script(t, ix);
    const lines = tr ? tr.slice(0, ix.tIdx || 0) : [];
    const live = tr ? `${lines.map((l) => `<div class="tline ${l.who}"><div class="tw">${l.who === 'agent' ? esc(S.user.name) : esc(t.fullName)}</div>${esc(l.text)}</div>`).join('')}${ix.tIdx < tr.length ? '<div class="tline va"><span class="live">Listening</span></div>' : ''}` : '';
    const botPart = ix.bot ? `${botLines({ ...ix.bot, caller: t.firstName })}<div class="handoff"><span>Transferred to ${esc(S.user.name)}</span></div>` : '';
    const ltab = ix.ltab || 'interaction';
    const body = ltab === 'transcript'
      ? (tr || ix.bot ? `<div class="transcript" id="transcript">${botPart}${live}</div>` : '<div class="empty">Live transcript is scripted for the demo stories (Charlotte Gong, and Tom Harper after a Pilot transfer). Other calls show interaction details only.</div>')
      : `${ix.bot ? botCard(ix.bot) : ''}<div class="ixmeta">
          <div><span>Phone</span><b>${esc(ix.phone || '-')}</b></div><div><span>Queue</span><span>${esc(ix.queue || '-')}</span></div>
          <div><span>Intent (virtual agent)</span><span>${esc(ix.intent || '-')}</span></div><div><span>Matched on</span><span>${esc(ix.matchedOn || '-')}</span></div>
          <div><span>Routing</span><span>Predictive routing</span></div><div><span>Conversation</span><span class="small" style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(ix.conversationId || '-')}</span></div></div>
        <div class="card-h" style="padding:6px 12px 0;margin:0">Outcomes</div>
        <div class="outcomes">${ix.outcomes.length ? ix.outcomes.map((o) => `<div>${ic('check', 'sm')}<span>${esc(o.text)}</span></div>`).join('') : '<span class="muted">Actions you take on the record are listed here and added to the wrap-up.</span>'}</div>`;
    return `<div class="ixcol"><div class="hd"><h3>${voice ? 'Active call' : 'Active chat'}</h3><span class="live">LIVE</span></div>
      <div class="callcard"><div class="ctl-top"><span class="on">${voice ? ic('phone', 'sm') : ic('chat', 'sm')}</span>${ic('clock', 'sm')}<span class="small muted" style="margin-left:auto">Genesys Cloud</span></div>
        <div class="who"><div><b>${esc(t.fullName)}</b><small>${esc(ix.phone || '')} | External</small></div><span class="calltime" style="color:var(--muted)">${timer(ix)}</span></div>
        <div class="ctl-bot"><span class="ctl" title="Transfer" data-a="transfer">${ic('xfer', 'sm')}</span><span class="ctl ${ix.held ? 'active' : ''}" data-a="hold" title="Hold">${ic('hold', 'sm')}</span><span class="ctl ${ix.muted ? 'active' : ''}" data-a="mute" title="Mute">${ic('mic', 'sm')}</span><button class="hangup" data-a="wrap" title="End and wrap up">${ic('hang', 'sm')}</button></div></div>
      <div class="idbadge ${ix.verified || t.identity.status === 'Verified' ? 'yes' : 'no'}">${ic('shield', 'sm')}<span>${ix.verified || t.identity.status === 'Verified' ? 'Identity verified' : 'Verify identity before disclosing details'}</span>${ix.verified || t.identity.status === 'Verified' ? '' : '<button class="btn sm" data-a="verify">Verify</button>'}</div>
      <div class="ltabs"><div class="${ltab === 'interaction' ? 'on' : ''}" data-ltab="interaction">Interaction</div><div class="${ltab === 'transcript' ? 'on' : ''}" data-ltab="transcript">Transcript</div></div>
      <div class="lscroll">${body}</div>
      <div class="ixfoot"><button class="btn primary" data-a="wrap">Log call &amp; wrap up</button></div></div>`;
  }

  function tpTab(t, tab) {
    const B = S.brand;
    if (tab === 'returns') {
      return `<div class="card" style="padding:0"><table class="tbl"><tr><th>Return</th><th>Tax year</th><th>Form</th><th>Tax type</th><th>Filed</th><th>Method</th><th>Status</th><th class="num">Refund</th><th class="num">Balance</th></tr>
        ${t.returns.map((r) => `<tr class="click" data-expand="${r.id}"><td class="link">${esc(r.id)}</td><td>${r.taxYear}${r.period ? ` <span class="small muted">${esc(r.period)}</span>` : ''}</td><td>${esc(r.form)}</td><td>${esc(r.taxType)}</td><td>${r.filed ? fmtD(r.filed) : '<span class="red">Not filed</span>'}</td><td>${esc(r.method || '-')}</td><td>${esc(r.status)}</td><td class="num">${r.refund ? money(r.refund.amount) : '-'}</td><td class="num">${r.balanceDue ? money(r.balanceDue) : '-'}</td></tr>
        ${S.expanded[r.id] ? `<tr class="expand"><td colspan="9"><div class="grid2"><div><b>Processing status</b>${stepsHtml(r.steps)}</div><div>${r.refund ? `<b>Refund</b><div class="kv c3" style="margin-top:6px"><div><label>Amount</label><div class="v">${money(r.refund.amount)}</div></div><div><label>Status</label><div class="v">${esc(r.refund.status)}</div></div><div><label>Method</label><div class="v">${esc(r.refund.method)}</div></div>${r.refund.hold ? `<div><label>Hold</label><div class="v">${esc(r.refund.hold)}</div></div>` : ''}${r.refund.expected ? `<div><label>Expected</label><div class="v">${fmtD(r.refund.expected)}</div></div>` : ''}</div>` : ''}
          ${!r.filed ? `<div class="callout warn" style="margin-top:8px">This return has not been filed. An estimated assessment was issued.</div><button class="btn sm" data-a="newcase" data-cat="Business tax|Delinquent return">Open delinquency case</button>` : ''}</div></div></td></tr>` : ''}`).join('') || '<tr><td colspan="9" class="empty">No returns on file</td></tr>'}</table></div><p class="small muted">Click a return to see its processing status.</p>`;
    }
    if (tab === 'refunds') {
      const rs = t.returns.filter((r) => r.refund);
      return rs.map((r) => {
        const held = /hold/i.test(r.refund.status);
        return `<div class="card"><div class="card-h">${ic('cash', 'sm')} ${r.taxYear} ${esc(r.form)} refund <span class="tag2 ${held ? 'amber' : /Released|Issued/.test(r.refund.status) ? 'green' : 'blue'}">${esc(r.refund.status)}</span><span class="r">${esc(r.id)}</span></div>
          <div class="kv c4"><div><label>Refund amount</label><div class="v stat sm">${money(r.refund.amount)}</div></div><div><label>Method</label><div class="v">${esc(r.refund.method)}${r.refund.method === 'Direct deposit' && t.bank ? ` ••••${esc(t.bank.last4)}` : ''}</div></div>
          <div><label>${r.refund.issued ? 'Issued' : 'Expected'}</label><div class="v">${fmtD(r.refund.issued || r.refund.expected) || '-'}</div></div><div><label>Hold reason</label><div class="v">${esc(r.refund.hold || 'None')}</div></div>
          ${r.refund.offset ? `<div style="grid-column:span 2"><label>Offset</label><div class="v">${money(r.refund.offset.amount)} to ${esc(r.refund.offset.agency)} · paid ${money(r.refund.adjusted)}</div></div>` : ''}
          ${r.documentation ? `<div><label>Processing status</label><div class="v">${esc(r.status)}</div></div><div><label>Return received</label><div class="v">${fmtD(r.filed)}</div></div><div style="grid-column:span 2"><label>Supporting documentation</label><div class="v green">${esc(r.documentation.status)} <span class="small muted">(received ${fmtD(r.documentation.received)}, notice ${esc(r.documentation.noticeId)})</span></div></div>` : ''}
          ${r.refund.releaseId ? `<div><label>Release</label><div class="v link">${esc(r.refund.releaseId)}</div></div>` : ''}</div>
          <div style="display:flex;gap:6px;margin-top:10px">${held ? `<button class="btn primary sm" data-a="release" data-rid="${r.id}">Release refund</button>` : ''}${r.refund.method !== 'Direct deposit' && !/Issued/.test(r.refund.status) ? `<button class="btn sm" data-a="dd" data-rid="${r.id}">Switch to direct deposit</button>` : ''}${/Issued/.test(r.refund.status) ? `<button class="btn sm" data-a="trace" data-rid="${r.id}">Trace refund</button>` : ''}</div></div>`;
      }).join('') || '<div class="empty">No refunds on file</div>';
    }
    if (tab === 'balances') {
      return `<div class="grid3" style="margin-bottom:10px"><div class="card"><div class="muted small">Balance due</div><div class="stat ${t.balance ? 'red' : 'green'}">${money(t.balance)}</div></div>
        <div class="card"><div class="muted small">Payment plan</div><div class="stat sm">${t.paymentPlan ? `${esc(t.paymentPlan.id)} · ${t.paymentPlan.months} × ${money(t.paymentPlan.monthly)}` : 'None'}</div>${t.paymentPlan ? `<div class="small muted">First due ${fmtD(t.paymentPlan.firstDue)}${t.paymentPlan.autopay ? ' · automatic debit' : ''}</div>` : ''}</div>
        <div class="card"><div class="muted small">Bank on file</div><div class="stat sm">${t.bank ? `${esc(t.bank.bank)} ${esc(t.bank.type)} ••••${esc(t.bank.last4)}` : 'None'}</div></div></div>
        <div class="card" style="padding:0;margin-bottom:10px"><div class="card-h" style="padding:10px 12px 0">Assessments <span class="r">${t.balance > 0 ? `<button class="btn sm primary" data-a="pay">Take payment</button>${t.paymentPlan ? '' : '<button class="btn sm" data-a="plan">Set up payment plan</button>'}` : ''}</span></div>
          <table class="tbl"><tr><th>ID</th><th>Tax type</th><th>Period</th><th class="num">Tax</th><th class="num">Penalty</th><th class="num">Interest</th><th class="num">Paid</th><th class="num">Balance</th><th>Status</th><th>Due</th></tr>
          ${t.assessments.map((a) => `<tr><td>${esc(a.id)}</td><td>${esc(a.taxType)}</td><td>${esc(a.period)}</td><td class="num">${money(a.assessed)}</td><td class="num">${money(a.penalty)}</td><td class="num">${money(a.interest)}</td><td class="num">${money(a.paid)}</td><td class="num"><b>${money(a.balance)}</b></td><td>${esc(a.status)}</td><td>${fmtD(a.due)}</td></tr>`).join('') || '<tr><td colspan="10" class="empty">No assessments</td></tr>'}</table></div>
        <div class="card" style="padding:0"><div class="card-h" style="padding:10px 12px 0">Payments</div><table class="tbl"><tr><th>Date</th><th>Confirmation</th><th class="num">Amount</th><th>Method</th><th>Applied to</th><th>Status</th></tr>
          ${t.payments.map((p) => `<tr><td>${fmtD(p.date)}</td><td>${esc(p.confirmation)}</td><td class="num">${money(p.amount)}</td><td>${esc(p.method)}</td><td>${esc(p.appliedTo)}</td><td>${esc(p.status || 'Posted')}</td></tr>`).join('') || '<tr><td colspan="6" class="empty">No payments</td></tr>'}</table></div>
        ${(t.unapplied || []).length ? `<div class="card" style="padding:0;margin-top:10px"><div class="card-h" style="padding:10px 12px 0">Unapplied payments (suspense)</div><table class="tbl"><tr><th>ID</th><th>Payment</th><th class="num">Amount</th><th>Mailed</th><th>Received</th><th>Reason</th><th>Status</th><th></th></tr>
          ${t.unapplied.map((u) => `<tr><td>${esc(u.id)}</td><td>${esc(u.method)}<div class="small muted">${esc(u.bank || '')}</div></td><td class="num">${money(u.amount)}</td><td>${fmtD(u.mailed)}</td><td>${fmtD(u.received)}</td><td class="small">${esc(u.reason)}</td><td><span class="tag2 ${/unapplied/i.test(u.status) ? 'amber' : 'green'}">${esc(u.status)}</span></td><td>${/unapplied/i.test(u.status) ? `<button class="btn sm primary" data-a="apply" data-arg="${u.id}">Apply to balance</button>` : ''}</td></tr>`).join('')}</table></div>` : ''}`;
    }
    if (tab === 'notices') {
      return `<div class="card" style="padding:0"><table class="tbl"><tr><th>Notice</th><th>Letter</th><th>Type</th><th>Mailed</th><th>Status</th><th>Response due</th><th></th></tr>
        ${t.notices.map((n) => `<tr><td>${esc(n.id)}</td><td>${esc(n.letter)}</td><td>${esc(n.type)}${n.amount ? ` · ${money(n.amount)}` : ''}</td><td>${fmtD(n.date)}</td><td><span class="tag2 ${/undeliverable/i.test(n.status) ? 'red' : /re-sent|extended|resolved|paid/i.test(n.status) ? 'green' : 'blue'}">${esc(n.status)}</span></td><td>${n.due ? `${fmtD(n.due)} <span class="small ${daysUntil(n.due) < 7 ? 'red' : 'muted'}">(${daysUntil(n.due)} days)</span>` : '-'}</td>
          <td class="nowrap"><button class="btn sm" data-a="letter" data-nid="${n.id}">View</button> <button class="btn sm" data-a="resend" data-nid="${n.id}">Re-send</button>${n.due ? ` <button class="btn sm" data-a="extend" data-nid="${n.id}">Extend</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="7" class="empty">No notices</td></tr>'}</table></div>`;
    }
    if (tab === 'cases') return `<div class="page-h" style="margin:0 0 8px"><b>Cases</b><div class="r"><button class="btn sm primary" data-a="newcase">New case</button></div></div><div class="card" style="padding:0">${casesTable(t.cases.map((c) => ({ ...c, taxpayerName: t.fullName })))}</div>`;
    if (tab === 'identity') {
      const v = t.identity.status === 'Verified';
      return `<div class="card"><div class="card-h">${ic('shield', 'sm')} Identity status <span class="tag2 ${v ? 'green' : 'red'}">${esc(t.identity.status)}</span><span class="r">${v ? '' : '<button class="btn sm primary" data-a="verify">Verify identity</button>'}</span></div>
        <div class="kv c3"><div><label>Method</label><div class="v">${esc(t.identity.method || '-')}</div></div><div><label>Date</label><div class="v">${fmtD(t.identity.date) || '-'}</div></div><div><label>Reason</label><div class="v">${esc(t.identity.reason || '-')}</div></div><div><label>Quiz letter</label><div class="v">${esc(t.identity.quiz || '-')}</div></div><div><label>Representative</label><div class="v">${esc(t.representative?.name || 'None')}</div></div></div></div>
        ${t.representative ? `<div class="card"><div class="card-h">${ic('people', 'sm')} Authorized representative</div><div class="kv c3"><div><label>Name</label><div class="v">${esc(t.representative.name)}</div></div><div><label>Firm</label><div class="v">${esc(t.representative.firm)}</div></div><div><label>Phone</label><div class="v">${esc(t.representative.phone)}</div></div><div><label>Form</label><div class="v">${esc(t.representative.form)}</div></div><div><label>Scope</label><div class="v">${esc(t.representative.scope)}</div></div><div><label>Expires</label><div class="v">${fmtD(t.representative.expires)}</div></div></div></div>` : ''}
        <div class="callout">${ic('book', 'sm')} <b>KB0020415</b>: agent-assisted verification checks date of birth, the last 4 of the TIN, prior-year ${esc(B.state)} AGI and the address on the return.</div>`;
    }
    if (tab === 'activity') return `<div class="page-h" style="margin:0 0 8px"><b>Activity</b><div class="r"><button class="btn sm" data-a="note">Log a contact</button><button class="btn sm" data-a="email">Email</button></div></div>${historyHtml(t.activities)}`;
    if (tab === 'profile') {
      const a = t.address;
      return `<div class="grid2"><div class="card"><div class="card-h">Contact <span class="r"><button class="btn sm" data-a="address">${ic('pencil', 'sm')} Edit address</button></span></div><div class="kv c3">
        <div style="grid-column:span 3"><label>Mailing address</label><div class="v">${esc(a.line)}, ${esc(a.city)}, ${esc(a.state)} ${esc(a.zip)}</div></div>
        ${t.previousAddress ? `<div style="grid-column:span 3"><label>Previous address</label><div class="v muted">${esc(t.previousAddress.line)}, ${esc(t.previousAddress.city)}</div></div>` : ''}
        <div><label>County</label><div class="v">${esc(a.county || '-')}</div></div><div><label>Email</label><div class="v link">${esc(t.email || '-')}</div></div><div><label>Preferred contact</label><div class="v">${esc(t.preferredContact)}</div></div>
        ${t.phones.map((p) => `<div><label>${esc(p.type)} phone</label><div class="v link">${esc(p.number)}</div></div>`).join('')}<div><label>Language</label><div class="v">${esc(t.language)}</div></div></div></div>
        <div class="card"><div class="card-h">Tax profile</div><div class="kv c3">
        ${t.type === 'Business' ? `<div><label>Contact</label><div class="v">${esc(t.contact)}</div></div>` : `<div><label>Date of birth</label><div class="v">${fmtD(t.dob)}</div></div><div><label>Filing status</label><div class="v">${esc(t.filingStatus)}</div></div>`}
        <div><label>School district</label><div class="v">${esc(t.schoolDistrict || '-')}</div></div><div><label>${esc(B.portal)}</label><div class="v">${t.portalEnrolled ? 'Enrolled' : 'Not enrolled'}</div></div><div><label>Bank on file</label><div class="v">${t.bank ? `${esc(t.bank.type)} ••••${esc(t.bank.last4)}` : 'None'}</div></div></div>
        ${t.accounts.length ? `<table class="tbl" style="margin-top:8px"><tr><th>Account</th><th>Number</th><th>Frequency</th><th>Status</th></tr>${t.accounts.map((x) => `<tr><td>${esc(x.label)} · ${esc(x.type)}</td><td>${esc(x.number)}</td><td>${esc(x.frequency)}</td><td>${esc(x.status)}</td></tr>`).join('')}</table>` : ''}</div></div>`;
    }
    // overview
    const lr = t.refundSummary;
    return `<div class="grid2">
      <div class="card"><div class="card-h">${t.type === 'Business' ? 'Business' : 'Taxpayer'}<span class="r">${ic('pencil', 'sm')}${ic('dots', 'sm')}</span></div>
        <div class="person">${avatar(t.fullName, 'lg', t.id)}<span class="link" style="font-size:14px">${esc(t.fullName)}</span></div>
        <div class="kv c3"><div><label>${t.type === 'Business' ? 'FEIN' : 'SSN'}</label><div class="v">${esc(t.tin)}</div></div><div><label>Phone</label><div class="v link">${esc(t.phones[0]?.number || '-')}</div></div><div><label>Email</label><div class="v link">${esc(t.email || '-')}</div></div>
        <div><label>Street</label><div class="v link">${esc(t.address.line)}</div></div><div><label>City, State</label><div class="v link">${esc(t.address.city)}, ${esc(t.address.state)}</div></div><div><label>Language</label><div class="v">${esc(t.language)}</div></div></div></div>
      <div class="card"><div class="card-h">Account summary ${ic('info', 'sm')}</div><div class="kv c3">
        <div><label>Refund</label><div class="v link" data-go="#/taxpayer/${t.id}/refunds">${lr ? money(lr.amount) : '-'}</div></div><div><label>Refund status</label><div class="v">${lr ? esc(lr.status) : '-'}</div></div><div><label>Refund method</label><div class="v">${lr ? esc(lr.method) : '-'}</div></div>
        <div><label>Balance due</label><div class="v ${t.balance ? 'red' : ''}" >${money(t.balance)}</div></div><div><label>Identity</label><div class="v">${esc(t.identity.status)}</div></div><div><label>Open cases</label><div class="v">${t.cases.filter((c) => !['Resolved', 'Closed'].includes(c.state)).length}</div></div></div></div></div>
      <div class="aisum" style="background:#fff;margin-top:10px"><div class="t">${ic('spark', 'sm')} Summarized by Now Assist ${ic('info', 'sm')}</div>${MockAI.summary(t)}<div class="fb" style="display:flex;gap:10px;color:var(--muted);margin-top:6px">${ic('up', 'sm')}${ic('dn', 'sm')}${ic('copy', 'sm')}${ic('refresh', 'sm')}</div></div>
      <div style="margin-top:12px">${histHeader('Taxpayer history')}${historyHtml(t.activities.slice(0, 8))}</div>`;
  }
  const histHeader = (title) => `<div class="card-h" style="margin:4px 0 0">${title}<span class="r">${ic('search', 'sm')}${ic('cal', 'sm')}</span></div>`;
  function historyHtml(list) {
    const icon = { 'Virtual agent': 'spark', Chat: 'chat', Phone: 'phone', Email: 'mail', Notice: 'doc', Web: 'globe', Payment: 'cash', 'Payment plan': 'cash', Refund: 'cash', Identity: 'shield', Case: 'case', 'Account update': 'home2' };
    const cls = { Chat: '', Phone: 'phone', Email: 'mail', Notice: 'box', Web: 'eye', Payment: 'gift', Refund: 'gift', Identity: 'eye', Case: 'cart' };
    let out = '', last = null;
    list.forEach((a) => {
      const d = fmtD(a.date); if (d !== last) { out += `<div class="day"><span>${d}</span></div>`; last = d; }
      out += `<div class="hrow ${a.date.slice(0, 10) === S.today ? 'new' : ''}"><span class="hi ${cls[a.type] ?? ''}">${ic(icon[a.type] || 'info')}</span><div><div class="hw"><b>${esc(a.subject)}</b></div><div class="ref">${esc(a.type)} · ${esc(a.direction || '')}${a.by ? ` · ${esc(a.by)}` : ''}${a.wrapCode ? ` · ${esc(a.wrapCode)}` : ''}</div>${a.text ? `<div class="ht" style="white-space:pre-wrap">${esc(a.text)}</div>` : ''}${a.botSessionId ? `<div style="margin-top:4px"><button class="btn sm" data-a="botview" data-arg="${a.botSessionId}">${ic('spark', 'sm')} View ${esc(a.by || 'virtual agent')} transcript</button></div>` : a.ai ? `<div class="ai">${ic('spark', 'sm')}<span>Summary generated by Now Assist</span></div>` : ''}</div><span class="ago">${a.date.length > 10 ? fmtT(a.date) : ''}</span></div>`;
    });
    return `<div class="hist">${out || '<div class="empty">No activity</div>'}</div>`;
  }
  function stepsHtml(steps) {
    return `<div class="steps" style="margin-top:6px">${steps.map((s) => `<div class="step"><span class="sd ${/complete|verified|scheduled|superseded/i.test(s.status) ? 'ok' : /undeliverable|missed/i.test(s.status) ? 'bad' : /pending|hold|progress|requested/i.test(s.status) ? 'warn' : ''}"></span><span>${esc(s.name)}<br><span class="small muted">${esc(s.status)}</span></span><span class="small muted">${s.date ? fmtD(s.date) : ''}</span></div>`).join('')}</div>`;
  }

  // ---------------------------------------------------------------- recommendations (guided actions)
  function recommendations(t) {
    const cards = []; const ix = S.interaction && S.interaction.taxpayerId === t.id ? S.interaction : null;
    const held = t.returns.find((r) => r.refund && /hold/i.test(r.refund.status) && /identity/i.test(r.refund.hold || ''));
    const verified = t.identity.status === 'Verified';
    const undeliv = t.notices.find((n) => /undeliverable/i.test(n.status));
    if (t.representative) cards.push(rcard('blue', 'people', 'Authorization', `Representative on file: ${t.representative.name}`, `${t.representative.form} for ${t.representative.scope.toLowerCase()}, expires ${fmtD(t.representative.expires)}. Confirm the caller's name and firm before disclosing details.`, [['Confirmed', 'poaok', true]]));
    if (held && !verified) cards.push(rcard('', 'wrench', 'Troubleshoot', 'Verify identity and release refund', `${held.taxYear} refund of ${money(held.refund.amount)} is on hold for identity verification.${undeliv ? ' The quiz letter was returned undeliverable.' : ''}`, [['Verify identity', 'verify', true], ['Resend letter', 'resend', false, undeliv?.id]]));
    if (held && verified) cards.push(rcard('', 'wrench', 'Troubleshoot', 'Release held refund', `Identity verified. Release the ${held.taxYear} refund of ${money(held.refund.amount)}.`, [['Release refund', 'release', true, held.id]]));
    if (undeliv && t.previousAddress == null) cards.push(rcard('amber', 'home2', 'Returned mail', 'Update mailing address', `${undeliv.letter} came back from ${undeliv.sentTo || 'the address on file'}. Confirm the current address and re-send.`, [['Update address', 'address', true]]));
    const rel = t.returns.find((r) => r.refund && r.refund.status === 'Released');
    if (rel && rel.refund.method !== 'Direct deposit') cards.push(rcard('purple', 'spark', 'Next best action', 'Switch refund to direct deposit', 'The refund is set to a paper check. Direct deposit typically arrives 5-7 days sooner.', [['Switch to direct deposit', 'dd', true, rel.id]]));
    if (rel && rel.refund.method === 'Direct deposit') cards.push(rcard('ok', 'check', 'Completed', `Refund released (${rel.refund.releaseId})`, `${money(rel.refund.amount)} by direct deposit ••••${t.bank?.last4 || ''}, expected ${fmtD(rel.refund.expected)}.`, [['Email confirmation', 'email', true]]));
    if (t.balance > 0 && !t.paymentPlan) cards.push(rcard('', 'cash', 'Collections', `Resolve balance of ${money(t.balance)}`, 'Take a payment now, or set up a payment plan of up to 24 months.', [['Take payment', 'pay', false], ['Payment plan', 'plan', true]]));
    if (t.paymentPlan) cards.push(rcard('ok', 'check', 'Completed', `Payment plan ${t.paymentPlan.id}`, `${t.paymentPlan.months} × ${money(t.paymentPlan.monthly)}, first due ${fmtD(t.paymentPlan.firstDue)}.`, [['Email confirmation', 'email', true]]));
    const rfi = t.notices.find((n) => /information/i.test(n.type) && n.status === 'Mailed');
    if (rfi) cards.push(rcard('amber', 'doc', 'Correspondence', 'Response due soon', `${rfi.type} is due ${fmtD(rfi.due)} (${daysUntil(rfi.due)} days). A one-time 30-day extension can be granted.`, [['Extend 30 days', 'extend', true, rfi.id], ['Email upload link', 'email', false]]));
    if (t.returns.some((r) => !r.filed)) cards.push(rcard('amber', 'case', 'Business tax', 'Delinquent return', 'An estimated assessment was issued. Filing the actual return within 60 days replaces the estimate.', [['Open case', 'newcase', true, 'Business tax|Delinquent return']]));
    const off = t.returns.find((r) => r.refund?.offset);
    if (off) cards.push(rcard('blue', 'info', 'Explain', 'Refund was partially offset', `${money(off.refund.offset.amount)} went to ${off.refund.offset.agency}. The taxpayer must contact that agency.`, [['Email explanation', 'email', true]]));
    if (t.language !== 'English') cards.push(rcard('blue', 'globe', 'Accessibility', `Interpreter: ${t.language}`, 'Conference in the language line from Genesys Cloud, or transfer to a bilingual agent.', [['Add interpreter', 'interp', true]]));
    const unp = (t.unapplied || []).find((u) => /unapplied/i.test(u.status));
    if (unp && t.balance > 0) cards.unshift(rcard('', 'cash', 'Payment found', `Apply ${unp.method} for ${money(unp.amount)}`, `Received ${fmtD(unp.received)} and held in suspense (${unp.reason.toLowerCase()}). Applying it clears the balance and resolves the notice.`, [['Apply payment', 'apply', true, unp.id]]));
    const appliedU = (t.unapplied || []).find((u) => /^applied/i.test(u.status));
    if (appliedU) cards.unshift(rcard('ok', 'check', 'Completed', `${appliedU.method} applied`, `${money(appliedU.amount)} applied ${fmtD(appliedU.appliedOn)}. Balance ${money(t.balance)}.`, [['Email confirmation', 'email', true]]));
    if (unp && !appliedU) cards.push(rcard('blue', 'globe', 'Self-service', 'Respond to a Letter or Notice', `If the payment can't be found, the taxpayer can respond online in ${S.brand.portal} with the notice ID and canceled check images.`, [['Email the link', 'email', false]]));
    const docR = t.returns.find((r) => r.documentation && r.refund && /hold/i.test(r.refund.status));
    if (docR) cards.push(rcard('blue', 'doc', 'Explain', 'Documentation received, under review', `${docR.taxYear} refund of ${money(docR.refund.amount)} is held for review. Documents were received ${fmtD(docR.documentation.received)}; nothing to resend.`, [['Email status', 'email', false]]));
    const oc = t.cases.find((c) => !['Resolved', 'Closed'].includes(c.state));
    if (oc) cards.push(rcard('blue', 'case', 'Open case', oc.number, `${oc.shortDescription} · ${oc.state}`, [['Open case', 'opencase', true, oc.id]]));
    const kb = pickKb(t);
    return `<div class="rec-h"><h4>Recommendations</h4>${ic('refresh', 'sm')}</div><div class="rec-tabs"><span class="on">Suggested actions (${cards.length})</span><span>Search</span></div>${cards.join('')}
      ${kb ? `<div class="rcard"><span class="pill purple">${ic('spark', 'sm')} Now Assist Q&amp;A</span><h5>${esc(kb.title)}</h5><div class="kv c3"><div><label>Number</label><div class="v link">${esc(kb.id)}</div></div><div><label>Category</label><div class="v">${esc(kb.category)}</div></div></div><div class="aisum"><div class="t">${ic('spark', 'sm')} Summarized by Now Assist</div>${esc(kb.summary)}</div><div class="rbtns"><button class="btn" data-go="#/kb/${kb.id}">Open article</button><button class="btn" data-a="email" data-kb="${kb.id}">Send to taxpayer</button></div></div>` : ''}`;
  }
  function rcard(pill, icon, label, title, text, buttons) {
    return `<div class="rcard"><span class="pill ${pill}">${ic(icon, 'sm')} ${esc(label)}</span><h5>${esc(title)}</h5><p>${esc(text)}</p><div class="rbtns">${buttons.map(([l, a, primary, arg]) => `<button class="btn ${primary ? 'primary' : ''}" data-a="${a}"${arg ? ` data-arg="${esc(arg)}"` : ''}>${esc(l)}</button>`).join('')}</div></div>`;
  }
  function pickKb(t) {
    const kb = S.kbCache || []; const id = (t.unapplied || []).some((u) => /unapplied/i.test(u.status)) ? 'KB0020426' : t.returns.some((r) => r.documentation && /hold/i.test(r.refund?.status || '')) ? 'KB0020425' : t.returns.some((r) => r.refund && /hold/i.test(r.refund.status)) ? 'KB0020415' : t.balance > 0 ? 'KB0020417' : t.notices.some((n) => /information/i.test(n.type)) ? 'KB0020419' : t.returns.some((r) => r.refund?.offset) ? 'KB0020420' : t.representative ? 'KB0020421' : t.payments.some((p) => p.status === 'Posting') ? 'KB0020423' : 'KB0020416';
    return kb.find((k) => k.id === id);
  }

  // ---------------------------------------------------------------- record actions
  function outcome(t, text, gate) {
    const ix = S.interaction; if (!ix || ix.taxpayerId !== t.id) return;
    ix.outcomes.push({ text }); if (gate) { ix.gates[gate] = true; advanceTranscript(t); }
  }
  async function refresh(t) { await loadTp(t.id, true); render(); }
  function tpClicks(e, t) {
    const lt = e.target.closest('[data-ltab]'); if (lt) { S.interaction.ltab = lt.dataset.ltab; return render(); }
    const ex = e.target.closest('[data-expand]'); if (ex) { S.expanded[ex.dataset.expand] = !S.expanded[ex.dataset.expand]; return render(); }
    const oc = e.target.closest('[data-opencase]'); if (oc) return openCase(oc.dataset.opencase);
    const b = e.target.closest('[data-a]'); if (!b) return;
    e.stopPropagation();
    const a = b.dataset.a; const arg = b.dataset.arg || b.dataset.rid || b.dataset.nid || b.dataset.cat;
    S.menu = null;
    const held = t.returns.find((r) => r.refund && /hold/i.test(r.refund.status));
    const actions = {
      verify: () => verifyModal(t), release: () => releaseModal(t, t.returns.find((r) => r.id === arg) || held), dd: () => ddModal(t, t.returns.find((r) => r.id === arg) || t.returns.find((r) => r.refund && r.refund.method !== 'Direct deposit')),
      address: () => addressModal(t), resend: () => resendModal(t, t.notices.find((n) => n.id === arg) || t.notices[0]), extend: () => extendModal(t, t.notices.find((n) => n.id === arg)), letter: () => letterModal(t, t.notices.find((n) => n.id === arg)),
      pay: () => payModal(t), plan: () => planModal(t), email: () => composeModal(t, b.dataset.kb), note: () => noteModal(t), newcase: () => caseModal(t, arg), opencase: () => openCase(arg),
      trace: () => { const r = t.returns.find((x) => x.id === arg); modal(`${ic('cash')} Refund trace`, `<div class="kv c3"><div><label>Amount</label><div class="v">${money(r.refund.adjusted || r.refund.amount)}</div></div><div><label>Issued</label><div class="v">${fmtD(r.refund.issued)}</div></div><div><label>Method</label><div class="v">${esc(r.refund.method)}</div></div><div><label>Trace number</label><div class="v">${esc(r.refund.trace || 'DD-' + digits(r.id).slice(-6))}</div></div><div><label>Account</label><div class="v">${t.bank ? `••••${esc(t.bank.last4)}` : 'Paper check'}</div></div></div>`, '<button class="btn primary" data-close>Close</button>'); outcome(t, 'Provided refund trace'); },
      save: () => toast('Record saved'), poaok: () => { outcome(t, `Confirmed representative ${t.representative.name}`); toast('Representative authorization confirmed'); render(); },
      apply: () => applyModal(t, (t.unapplied || []).find((u) => u.id === arg) || (t.unapplied || [])[0]),
      botview: async () => { const bs = (t.botSessions || []).find((x) => x.id === arg) || (await api(`/api/bot-sessions?taxpayerId=${t.id}`)).find((x) => x.id === arg); if (!bs) return toast('Transcript not found'); modal(`${ic('spark')} ${esc(bs.botName)} virtual agent · ${esc(bs.outcome)}`, `${botCard(bs)}<div class="small muted" style="margin:8px 0">${fmtDT(bs.date)} · ${esc(bs.phone)} · conversation ${esc(bs.conversationId)}</div><div class="transcript" style="padding:0">${botLines({ ...bs, caller: t.firstName })}</div>`, '<button class="btn primary" data-close>Close</button>', { wide: true }); },
      interp: () => { outcome(t, `Added ${t.language} interpreter`); toast(`${t.language} interpreter conferenced in (Genesys Cloud)`); render(); },
      hold: () => { S.interaction.held = !S.interaction.held; render(); }, mute: () => { S.interaction.muted = !S.interaction.muted; render(); },
      transfer: () => toast('Transfer is handled in Genesys Cloud (demo)'), wrap: () => wrapUpModal(t),
    };
    (actions[a] || (() => {}))();
  }

  function verifyModal(t) {
    const r = t.returns.find((x) => x.taxType && x.form) || {};
    const qs = [['dob', 'Date of birth', fmtD(t.dob) || 'n/a'], ['tin', 'Last 4 of TIN', t.tin.slice(-4)], ['agi', `Prior-year ${S.brand.state} AGI`, t.type === 'Business' ? 'n/a' : '$' + (41200 + digits(t.tin).slice(-3) * 7).toLocaleString()], ['addr', 'Address on the return', (t.previousAddress || t.address).line]];
    const ans = {};
    modal(`${ic('shield')} Verify identity`, `<div class="callout">Ask the caller each question. Mark whether the answer matches. Expected answers are shown for the demo.</div>
      ${qs.map(([k, l, exp]) => `<div class="kbaq"><div>${esc(l)}<small>Expected: <span class="exp">${esc(exp)}</span></small></div><div class="switch" data-q="${k}"><button data-v="y">Matched</button><button data-v="n">No match</button></div></div>`).join('')}
      <div class="f" style="margin-top:8px"><label>Method</label><select id="vMethod"><option>Agent-assisted (phone, knowledge-based)</option><option>Identity Confirmation Quiz code</option><option>In person at a service center</option></select></div>`,
      `<button class="btn left" id="vAll">Mark all matched</button><button class="btn" data-close>Cancel</button><button class="btn primary" id="vOk">Verify</button>`);
    $$('.switch').forEach((sw) => sw.onclick = (e) => { const bt = e.target.closest('button'); if (!bt) return; ans[sw.dataset.q] = bt.dataset.v === 'y'; $$('button', sw).forEach((x) => { x.className = x === bt ? `on ${x.dataset.v}` : ''; }); });
    $('#vAll').onclick = () => $$('.switch').forEach((sw) => $('button[data-v="y"]', sw).click());
    $('#vOk').onclick = async () => {
      const checks = {}; qs.forEach(([k, l]) => { checks[l] = ans[k]; });
      if (qs.some(([k]) => ans[k] === undefined)) return toast('Mark each answer first', { cls: 'genesys' });
      await act(() => api(`/api/taxpayers/${t.id}/identity`, { method: 'POST', body: { checks, method: fieldVal('vMethod'), by: S.user.name } }), 'Identity verified');
      if (S.interaction && S.interaction.taxpayerId === t.id) S.interaction.verified = true;
      outcome(t, 'Verified identity by phone', 'identity'); closeModal(); refresh(t);
    };
  }
  function releaseModal(t, r) {
    if (!r) return toast('No held refund');
    if (t.identity.status !== 'Verified') return verifyModal(t);
    modal(`${ic('cash')} Release refund`, `<div class="kv c3"><div><label>Return</label><div class="v">${esc(r.id)}</div></div><div><label>Tax year</label><div class="v">${r.taxYear} ${esc(r.form)}</div></div><div><label>Amount</label><div class="v stat sm">${money(r.refund.amount)}</div></div><div><label>Hold</label><div class="v">${esc(r.refund.hold)}</div></div><div><label>Identity</label><div class="v green">Verified</div></div><div><label>Method</label><div class="v">${esc(r.refund.method)}</div></div></div>
      ${t.notices.some((n) => /undeliverable/i.test(n.status)) && !t.previousAddress ? '<div class="callout warn" style="margin-top:10px">Mail to this taxpayer was returned. Update the address before a paper check is sent.</div>' : ''}`,
      `<button class="btn" data-close>Cancel</button><button class="btn primary" id="rOk">Release refund</button>`);
    $('#rOk').onclick = async () => {
      const res = await act(() => api(`/api/taxpayers/${t.id}/returns/${r.id}/release`, { method: 'POST', body: { by: S.user.name } }));
      toast(`Refund release ${esc(res.refund.releaseId)} created`); outcome(t, `Released ${money(r.refund.amount)} refund (${res.refund.releaseId})`, 'release'); closeModal(); refresh(t);
    };
  }
  function ddModal(t, r) {
    if (!r) return toast('No refund to update');
    modal(`${ic('bank')} Switch refund to direct deposit`, `<div class="callout">Refund ${esc(r.id)} · ${money(r.refund.amount)} · currently ${esc(r.refund.method.toLowerCase())}</div>
      <div class="frow"><div class="f"><label>Routing number</label><input id="dRt" value="041000124"></div><div class="f"><label>Account number</label><input id="dAc" value="000123454417"></div></div>
      <div class="frow"><div class="f"><label>Account type</label><select id="dTy"><option>Checking</option><option>Savings</option></select></div><div class="f"><label>Bank</label><input id="dBk" value="${esc(t.bank?.bank || 'Huntington National Bank')}"></div></div>`,
      `<button class="btn" data-close>Cancel</button><button class="btn primary" id="dOk">Save</button>`);
    $('#dOk').onclick = async () => {
      await act(() => api(`/api/taxpayers/${t.id}/returns/${r.id}/refund`, { method: 'PATCH', body: { method: 'Direct deposit', routing: fieldVal('dRt'), account: fieldVal('dAc'), accountType: fieldVal('dTy'), bank: fieldVal('dBk'), by: S.user.name } }), 'Refund method changed to direct deposit');
      outcome(t, `Switched refund to direct deposit ••••${digits(fieldVal('dAc')).slice(-4)}`, 'dd'); closeModal(); refresh(t);
    };
  }
  function addressModal(t) {
    const a = t.address; const returned = t.notices.filter((n) => /undeliverable/i.test(n.status));
    modal(`${ic('home2')} Update mailing address`, `<div class="f"><label>Street</label><input id="aL" value="${esc(a.line)}"></div><div class="frow3"><div class="f"><label>City</label><input id="aC" value="${esc(a.city)}"></div><div class="f"><label>State</label><input id="aS" value="${esc(a.state)}"></div><div class="f"><label>ZIP</label><input id="aZ" value="${esc(a.zip)}"></div></div>
      ${returned.length ? `<label class="f" style="flex-direction:row;gap:8px;align-items:center"><input type="checkbox" id="aRe" checked> Re-send returned notices to this address (${returned.map((n) => esc(n.letter)).join(', ')})</label>` : ''}`,
      `<button class="btn" data-close>Cancel</button><button class="btn primary" id="aOk">Save</button>`);
    $('#aOk').onclick = async () => {
      await act(() => api(`/api/taxpayers/${t.id}`, { method: 'PATCH', body: { address: { line: fieldVal('aL'), city: fieldVal('aC'), state: fieldVal('aS'), zip: fieldVal('aZ') }, by: S.user.name } }), 'Address updated');
      outcome(t, 'Updated mailing address');
      if ($('#aRe')?.checked) for (const n of returned) await api(`/api/taxpayers/${t.id}/notices/${n.id}/resend`, { method: 'POST', body: { method: 'Mail', by: S.user.name } });
      closeModal(); refresh(t);
    };
  }
  function resendModal(t, n) {
    if (!n) return toast('No notice on file');
    modal(`${ic('doc')} Re-send ${esc(n.letter)}`, `<div class="callout">${esc(n.type)} · mailed ${fmtD(n.date)} · ${esc(n.status)}</div><div class="f"><label>Send by</label><select id="nM"><option>Mail</option><option>Email</option><option>${esc(S.brand.portal)} message</option></select></div>
      ${n.due ? '<label class="f" style="flex-direction:row;gap:8px;align-items:center"><input type="checkbox" id="nX" checked> Give a new 30-day response window</label>' : ''}`, `<button class="btn" data-close>Cancel</button><button class="btn primary" id="nOk">Re-send</button>`);
    $('#nOk').onclick = async () => { await act(() => api(`/api/taxpayers/${t.id}/notices/${n.id}/resend`, { method: 'POST', body: { method: fieldVal('nM'), extendDays: $('#nX')?.checked ? 30 : 0, by: S.user.name } }), `${esc(n.letter)} re-sent`); outcome(t, `Re-sent ${n.letter} by ${fieldVal('nM').toLowerCase()}`); closeModal(); refresh(t); };
  }
  function extendModal(t, n) {
    modal(`${ic('cal')} Extend response due date`, `<div class="callout">${esc(n.type)} is due ${fmtD(n.due)}.</div><div class="f"><label>Extend by</label><select id="xD"><option value="30">30 days</option><option value="15">15 days</option><option value="60">60 days (supervisor approval)</option></select></div>`, `<button class="btn" data-close>Cancel</button><button class="btn primary" id="xOk">Extend</button>`);
    $('#xOk').onclick = async () => { await act(() => api(`/api/taxpayers/${t.id}/notices/${n.id}`, { method: 'PATCH', body: { extendDays: Number(fieldVal('xD')), by: S.user.name } }), 'Due date extended'); outcome(t, `Extended ${n.letter} due date by ${fieldVal('xD')} days`); closeModal(); refresh(t); };
  }
  function letterModal(t, n) {
    const B = S.brand; const a = t.address;
    const body = /identity/i.test(n.type) ? `We received a ${t.returns[0]?.taxYear || ''} income tax return in your name. To protect you from identity theft, we need to confirm your identity before we process the refund.\n\nComplete the Identity Confirmation Quiz online within 30 days, or call us at ${B.supportLine}.`
      : /billing|assessment/i.test(n.type) ? `Our records show a balance due of ${money(n.amount)}. Please pay by ${fmtD(n.due)} to avoid additional interest. You may also set up a payment plan or file a petition for reassessment within 60 days.`
        : /information/i.test(n.type) ? `We need more information to process your return. Please send copies of all W-2 forms and your final pay stub by ${fmtD(n.due)}. You can upload documents in ${B.portal}.`
          : /offset/i.test(n.type) ? 'All or part of your refund was applied to a debt certified by another state agency. Contact that agency with questions about the debt.' : `This notice concerns your ${B.agency} account.`;
    modal(`${ic('doc')} ${esc(n.letter)} · ${esc(n.type)}`, `<div class="letter"><b>${esc(B.agency)}</b>\n${esc(fmtD(n.date))}\n\n${esc(t.fullName)}\n${esc((n.sentTo && /undeliverable/i.test(n.status) ? n.sentTo : a.line))}\n${esc(a.city)}, ${esc(a.state)} ${esc(a.zip)}\n\nNotice ${esc(n.id)}\n\nDear ${esc(t.type === 'Business' ? t.contact || t.fullName : t.firstName)},\n\n${esc(body)}\n\nSincerely,\nTaxpayer Services</div>`, `<button class="btn" data-close>Close</button>`, { wide: true });
  }
  function applyModal(t, u) {
    if (!u) return toast('No unapplied payment');
    const a = t.assessments.find((x) => x.noticeId && x.balance > 0) || t.assessments.find((x) => x.balance > 0);
    if (!a) return toast('No balance to apply it to');
    const n = t.notices.find((x) => x.id === a.noticeId);
    modal(`${ic('cash')} Apply suspense payment`, `<div class="kv c3"><div><label>Payment</label><div class="v">${esc(u.method)}</div></div><div><label>Amount</label><div class="v stat sm">${money(u.amount)}</div></div><div><label>Received</label><div class="v">${fmtD(u.received)}</div></div><div><label>Apply to</label><div class="v">${esc(a.id)} · ${esc(a.taxType)} ${esc(a.period)}</div></div><div><label>Balance</label><div class="v">${money(a.balance)}</div></div><div><label>Notice</label><div class="v">${n ? esc(n.id) : '-'}</div></div></div>
      <div class="callout" style="margin-top:10px">${esc(u.reason)}. Applying the payment clears the balance${n ? ` and resolves notice ${esc(n.id)}` : ''}.</div>`, `<button class="btn" data-close>Cancel</button><button class="btn primary" id="uOk">Apply payment</button>`);
    $('#uOk').onclick = async () => {
      const res = await act(() => api(`/api/taxpayers/${t.id}/unapplied/${u.id}/apply`, { method: 'POST', body: { assessmentId: a.id, by: S.user.name } }));
      toast(`${esc(u.method)} applied · balance ${money(res.balance)}`); outcome(t, `Applied suspense payment ${u.method} (${money(u.amount)}) to ${a.id}${n ? `; notice ${n.id} resolved` : ''}`, 'apply'); closeModal(); refresh(t);
    };
  }
  function payModal(t) {
    const a = t.assessments.find((x) => x.balance > 0);
    modal(`${ic('cash')} Take a payment`, `<div class="frow"><div class="f"><label>Apply to</label><select id="pA">${t.assessments.filter((x) => x.balance > 0).map((x) => `<option value="${x.id}">${esc(x.id)} · ${esc(x.period)} · ${money(x.balance)}</option>`).join('')}</select></div><div class="f"><label>Amount</label><input id="pAmt" value="${a ? a.balance.toFixed(2) : ''}"></div></div>
      <div class="frow"><div class="f"><label>Method</label><select id="pM"><option>Electronic check</option><option>Credit card</option><option>Debit card</option></select></div><div class="f"><label>Account / card</label><input id="pAc" value="${t.bank ? `${t.bank.bank} ••••${t.bank.last4}` : 'Visa ••••1881'}"></div></div>
      <p class="small muted">Card payments are processed by a third-party vendor and may include a convenience fee.</p>`, `<button class="btn" data-close>Cancel</button><button class="btn primary" id="pOk">Submit payment</button>`);
    $('#pOk').onclick = async () => {
      const res = await act(() => api(`/api/taxpayers/${t.id}/payments`, { method: 'POST', body: { amount: fieldVal('pAmt'), method: fieldVal('pM'), assessmentId: fieldVal('pA'), by: S.user.name } }));
      toast(`Payment ${esc(res.payment.confirmation)} accepted · balance ${money(res.balance)}`); outcome(t, `Took payment of ${money(res.payment.amount)} (${res.payment.confirmation})`, 'pay'); closeModal(); refresh(t);
    };
  }
  function planModal(t) {
    const calc = () => { const m = Number(fieldVal('ppM')); const d = Number(fieldVal('ppD') || 0); $('#ppOut').textContent = `${m} payments of ${money((t.balance - d) / m)}`; };
    modal(`${ic('cal')} Set up a payment plan`, `<div class="callout">Balance due ${money(t.balance)}. Interest continues to accrue while the plan is active.</div>
      <div class="frow3"><div class="f"><label>Term</label><select id="ppM"><option value="6">6 months</option><option value="12" selected>12 months</option><option value="24">24 months</option></select></div><div class="f"><label>Down payment</label><input id="ppD" value="0.00"></div><div class="f"><label>Monthly</label><div class="stat sm" id="ppOut"></div></div></div>
      <label class="f" style="flex-direction:row;gap:8px;align-items:center"><input type="checkbox" id="ppA" ${t.bank ? 'checked' : ''}> Automatic debit${t.bank ? ` from ${esc(t.bank.bank)} ••••${esc(t.bank.last4)}` : ''}</label>`, `<button class="btn" data-close>Cancel</button><button class="btn primary" id="ppOk">Create plan</button>`);
    calc(); $('#ppM').onchange = calc; $('#ppD').oninput = calc;
    $('#ppOk').onclick = async () => {
      const res = await act(() => api(`/api/taxpayers/${t.id}/payment-plans`, { method: 'POST', body: { months: Number(fieldVal('ppM')), downPayment: fieldVal('ppD'), autopay: $('#ppA').checked, by: S.user.name } }));
      toast(`Payment plan ${esc(res.plan.id)} created`); outcome(t, `Set up payment plan ${res.plan.id}: ${res.plan.months} × ${money(res.plan.monthly)}`, 'plan'); closeModal(); refresh(t);
    };
  }
  function composeModal(t, kbId) {
    const kb = kbId && (S.kbCache || []).find((k) => k.id === kbId);
    const d = kb ? { subject: `${S.brand.agency}: ${kb.title}`, body: `Hi ${t.firstName}, this is ${S.user.name} from the ${S.brand.agency}.\n\nHere is the information we discussed about ${kb.title.toLowerCase()}:\n\n${kb.summary}\n\nThank you, and have a great day!` } : MockAI.draftEmail(t, { agent: S.user.name }, S.brand);
    modal(`${ic('mail')} Compose email`, `<div class="frow"><div class="f"><label>To</label><input value="${esc(t.fullName)} <${esc(t.email || 'no email on file')}>" readonly></div><div class="f"><label>From</label><input value="${esc(S.brand.agency)} Taxpayer Services" readonly></div></div>
      <div class="f"><label>Subject</label><input id="eS" value="${esc(d.subject)}"></div><div class="f"><label>Message <span class="ai-chip">${ic('spark', 'sm')} Drafted by Now Assist</span></label><textarea id="eB" style="min-height:220px"></textarea></div>`,
      `<button class="btn" data-close>Cancel</button><button class="btn primary" id="eOk">${ic('send', 'sm')} Send</button>`, { wide: true, nofocus: true });
    const ta = $('#eB'); let i = 0; const full = d.body;
    const tick = () => { if (!$('#eB')) return; i = Math.min(full.length, i + 6); ta.value = full.slice(0, i); if (i < full.length) setTimeout(tick, 12); };
    tick();
    $('#eOk').onclick = async () => {
      if (!t.email) return toast('No email address on file', { cls: 'genesys' });
      await act(() => api(`/api/taxpayers/${t.id}/emails`, { method: 'POST', body: { subject: fieldVal('eS'), body: ta.value, by: S.user.name } }), `Email sent to ${esc(t.email)}`);
      outcome(t, `Emailed "${fieldVal('eS')}"`, 'email'); closeModal(); refresh(t);
    };
  }
  function noteModal(t) {
    modal(`${ic('pencil')} Log a contact`, `<div class="frow"><div class="f"><label>Type</label><select id="lT"><option>Phone</option><option>Chat</option><option>Email</option><option>Walk-in</option><option>Note</option></select></div><div class="f"><label>Direction</label><select id="lD"><option>Inbound</option><option>Outbound</option><option>Internal</option></select></div></div>
      <div class="f"><label>Subject</label><input id="lS" value=""></div><div class="f"><label>Notes</label><textarea id="lX"></textarea></div>`, `<button class="btn" data-close>Cancel</button><button class="btn primary" id="lOk">Save</button>`);
    $('#lOk').onclick = async () => { await act(() => api(`/api/taxpayers/${t.id}/activities`, { method: 'POST', body: { type: fieldVal('lT'), direction: fieldVal('lD'), subject: fieldVal('lS') || 'Contact', text: fieldVal('lX'), by: S.user.name } }), 'Contact logged'); closeModal(); refresh(t); };
  }
  const CATS = { 'Refund inquiry': ['Refund status', 'Identity verification', 'Refund offset', 'Refund issued'], Billing: ['Payment', 'Payment plan', 'Assessment dispute'], Correspondence: ['Request for information', 'Returned mail'], 'Return status': ['Original return', 'Amended return'], 'Business tax': ['Delinquent return', 'Registration', 'Estimated assessment'], 'Identity theft': ['Suspected fraud'], 'General inquiry': ['Forms', 'Other'] };
  async function caseModal(t, preset) {
    const [cat, sub] = (preset || '').split('|');
    const tps = t ? [t] : await api('/api/taxpayers?all=1');
    modal(`${ic('case')} New case`, `<div class="f"><label>Taxpayer</label><select id="cT">${tps.map((x) => `<option value="${x.id}">${esc(x.fullName)} (${esc(x.tin)})</option>`).join('')}</select></div>
      <div class="f"><label>Short description</label><input id="cSd" value="${esc(sub || (S.interaction?.intent) || '')}"></div>
      <div class="frow"><div class="f"><label>Category</label><select id="cCat">${Object.keys(CATS).map((c) => `<option ${c === cat ? 'selected' : ''}>${c}</option>`).join('')}</select></div><div class="f"><label>Subcategory</label><select id="cSub"></select></div></div>
      <div class="frow"><div class="f"><label>Priority</label><select id="cP"><option>2 - High</option><option>3 - Moderate</option><option selected>4 - Low</option></select></div><div class="f"><label>Assignment group</label><select id="cG">${(S.config.groups || []).map((g) => `<option ${g === S.user.group ? 'selected' : ''}>${esc(g)}</option>`).join('')}</select></div></div>
      <div class="f"><label>Work note</label><textarea id="cN"></textarea></div>`, `<button class="btn" data-close>Cancel</button><button class="btn primary" id="cOk">Submit</button>`);
    const fill = () => { $('#cSub').innerHTML = CATS[fieldVal('cCat')].map((s) => `<option ${s === sub ? 'selected' : ''}>${s}</option>`).join(''); }; fill(); $('#cCat').onchange = fill;
    $('#cOk').onclick = async () => {
      const c = await act(() => api('/api/cases', { method: 'POST', body: { taxpayerId: fieldVal('cT'), shortDescription: fieldVal('cSd') || fieldVal('cSub'), category: fieldVal('cCat'), subcategory: fieldVal('cSub'), priority: fieldVal('cP'), group: fieldVal('cG'), assignedTo: S.user.name, channel: S.interaction ? (S.interaction.mediaType === 'voice' ? 'Phone' : 'Chat') : 'Phone', note: fieldVal('cN'), by: S.user.name } }));
      toast(`Case ${esc(c.number)} created`); const tt = S.records[c.taxpayerId]; if (tt) { outcome(tt, `Opened case ${c.number}`); await loadTp(tt.id, true); } closeModal(); openCase(c.id);
    };
  }
  async function wrapUpModal(t) {
    const ix = S.interaction;
    if (!ix || ix.taxpayerId !== t.id) return noteModal(t);
    const summary = MockAI.wrapSummary(t, ix, S.brand);
    const open = t.cases.filter((c) => !['Resolved', 'Closed'].includes(c.state));
    modal(`${ic('phone')} Log call &amp; wrap up`, `<div class="frow"><div class="f"><label>Wrap-up code</label><select id="wC">${['Resolved - first contact', 'Refund released', 'Payment arranged', 'Information provided', 'Follow-up required', 'Transferred'].map((w) => `<option>${w}</option>`).join('')}</select></div>
      <div class="f"><label>Link to case</label><select id="wK"><option value="">(none)</option>${open.map((c) => `<option value="${c.id}" ${c === open[0] ? 'selected' : ''}>${esc(c.number)} · ${esc(c.shortDescription)}</option>`).join('')}</select></div></div>
      ${open.length ? `<label class="f" style="flex-direction:row;gap:8px;align-items:center"><input type="checkbox" id="wR" ${ix.outcomes.length ? 'checked' : ''}> Resolve the linked case</label>` : ''}
      <div class="f"><label>Notes <span class="ai-chip">${ic('spark', 'sm')} Generated by Agent Copilot</span></label><textarea id="wN" style="min-height:120px">${esc(summary)}</textarea></div>
      <div class="small muted">Duration ${timer(ix)} · ${esc(ix.queue || '')} · conversation ${esc(ix.conversationId || '-')}</div>`,
      `<button class="btn" data-close>Cancel</button><button class="btn primary" id="wOk">Save and end interaction</button>`, { wide: true });
    $('#wOk').onclick = async () => {
      const caseId = fieldVal('wK');
      await act(() => api(`/api/taxpayers/${t.id}/activities`, { method: 'POST', body: { type: ix.mediaType === 'voice' ? 'Phone' : 'Chat', direction: ix.direction || 'Inbound', subject: ix.intent || 'Inbound contact', text: fieldVal('wN'), wrapCode: fieldVal('wC'), conversationId: ix.conversationId || `demo-${Date.now()}`, queue: ix.queue, durationSec: Math.floor((Date.now() - ix.startedAt) / 1000), by: S.user.name, caseId, ai: true } }));
      if (caseId && $('#wR')?.checked) await api(`/api/cases/${caseId}`, { method: 'PATCH', body: { state: 'Resolved', resolution: fieldVal('wN'), resolutionCode: fieldVal('wC'), by: S.user.name } });
      S.interaction = null; closeModal(); toast('Interaction logged. Summary saved to the record.'); refresh(t);
    };
  }

  // scripted transcript for the main demo caller
  function advanceTranscript(t) {
    const ix = S.interaction; if (!ix || ix.taxpayerId !== t.id) return;
    const tr = script(t, ix); if (!tr) return;
    clearTimeout(ix.tTimer);
    const step = () => {
      if (S.interaction !== ix || ix.tIdx >= tr.length) return;
      const line = tr[ix.tIdx];
      if (line.gate && !ix.gates[line.gate] && !(line.gate === 'identity' && (ix.verified || S.records[t.id]?.identity.status === 'Verified'))) return;
      ix.tIdx++; if (parseRoute().name === 'taxpayer') render();
      ix.tTimer = setTimeout(step, 1500 + line.text.length * 30);
    };
    ix.tTimer = setTimeout(step, ix.tIdx ? 900 : 1500);
  }

  // ---------------------------------------------------------------- case form
  async function pageCase(el, r) {
    const c = await api(`/api/cases/${r.parts[1]}`);
    if (!S.tabs.some((x) => x.kind === 'case' && x.id === c.id)) { S.tabs.push({ kind: 'case', id: c.id, label: c.number }); saveTabs(); shell(); return renderPage(); }
    const t = await loadTp(c.taxpayerId);
    const sel = (id, opts, v) => `<select id="${id}">${opts.map((o) => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
    const states = ['New', 'Work in progress', 'Awaiting info', 'Resolved', 'Closed', 'Cancelled'];
    el.innerHTML = `<div class="page"><div class="page-h">${ic('case', 'lg')}<div><h2>${esc(c.number)} · ${esc(c.shortDescription)}</h2><div class="small muted">Opened ${fmtDT(c.opened)} · ${esc(c.channel)}</div></div>
      <div class="r"><button class="btn" data-go="#/taxpayer/${t.id}/overview">Open taxpayer</button>${!/Resolved|Closed/.test(c.state) ? '<button class="btn" id="kRes">Resolve</button>' : ''}<button class="btn primary" id="kSave">Update</button></div></div>
      <div class="grid2" style="grid-template-columns:2fr 1fr;align-items:start">
        <div><div class="card"><div class="form-grid">
          <div class="f"><label>Number</label><input value="${esc(c.number)}" readonly></div><div class="f"><label>State</label>${sel('kSt', states, c.state)}</div>
          <div class="f"><label>Taxpayer</label><input value="${esc(c.taxpayerName)}" readonly></div><div class="f"><label>Priority</label>${sel('kPr', ['1 - Critical', '2 - High', '3 - Moderate', '4 - Low', '5 - Planning'], c.priority)}</div>
          <div class="f"><label>Category</label>${sel('kCat', Object.keys(CATS), c.category)}</div><div class="f"><label>Assignment group</label>${sel('kG', S.config.groups || [], c.group)}</div>
          <div class="f"><label>Subcategory</label><input id="kSub" value="${esc(c.subcategory)}"></div><div class="f"><label>Assigned to</label>${sel('kA', ['', ...S.users.map((u) => u.name)], c.assignedTo)}</div>
          <div class="f" style="grid-column:1/-1"><label>Short description</label><input id="kSd" value="${esc(c.shortDescription)}"></div>
          ${c.resolution ? `<div class="f" style="grid-column:1/-1"><label>Resolution notes</label><textarea readonly>${esc(c.resolution)}</textarea></div>` : ''}
        </div></div>
        <div class="card"><div class="card-h">Activity</div><div class="f"><label>Work notes (internal)</label><textarea id="kN" style="min-height:60px" placeholder="Add a work note"></textarea></div><div style="display:flex;justify-content:flex-end;margin-bottom:10px"><button class="btn sm primary" id="kPost">Post</button></div>
          <div class="stream">${c.notes.map((n) => `<div class="note wn"><div class="nh"><b>${esc(n.author)}</b><span>${fmtDT(n.date)}</span><span>${esc(n.type || 'Work note')}</span></div><div style="white-space:pre-wrap">${esc(n.text)}</div></div>`).join('') || '<div class="empty">No notes yet</div>'}</div></div></div>
        <div><div class="card"><div class="card-h">Taxpayer</div><div class="person">${avatar(t.fullName, 'lg', t.id)}<a href="#/taxpayer/${t.id}/overview">${esc(t.fullName)}</a></div>
          <div class="kv"><div><label>TIN</label><div class="v">${esc(t.tin)}</div></div><div><label>Phone</label><div class="v">${esc(t.phones[0]?.number || '')}</div></div><div><label>Refund</label><div class="v">${t.refundSummary ? `${money(t.refundSummary.amount)} · ${esc(t.refundSummary.status)}` : '-'}</div></div><div><label>Balance due</label><div class="v">${money(t.balance)}</div></div></div></div>
          <div class="aisum" style="background:#fff;margin-top:10px"><div class="t">${ic('spark', 'sm')} Case summary by Now Assist</div>${esc(c.shortDescription)} for ${esc(c.taxpayerName)}, ${esc(c.state.toLowerCase())}. ${c.notes[0] ? `Latest note: ${esc(c.notes[0].text)}` : 'No work notes yet.'}</div></div></div></div>`;
    const save = async (extra = {}) => { await act(() => api(`/api/cases/${c.id}`, { method: 'PATCH', body: { state: fieldVal('kSt'), priority: fieldVal('kPr'), category: fieldVal('kCat'), subcategory: fieldVal('kSub'), group: fieldVal('kG'), assignedTo: fieldVal('kA'), shortDescription: fieldVal('kSd'), by: S.user.name, ...extra } }), `${esc(c.number)} updated`); await loadTp(t.id, true); render(); };
    $('#kSave').onclick = () => save();
    $('#kPost').onclick = async () => { const text = fieldVal('kN'); if (!text) return; await act(() => api(`/api/cases/${c.id}/notes`, { method: 'POST', body: { text, by: S.user.name } }), 'Work note added'); render(); };
    const rs = $('#kRes'); if (rs) rs.onclick = () => {
      modal('Resolve case', `<div class="f"><label>Resolution code</label><select id="rsC"><option>Solved (permanently)</option><option>Solved (workaround)</option><option>Information provided</option><option>Duplicate</option></select></div><div class="f"><label>Resolution notes</label><textarea id="rsN">${esc(c.notes[0]?.text || '')}</textarea></div>`, `<button class="btn" data-close>Cancel</button><button class="btn primary" id="rsOk">Resolve</button>`);
      $('#rsOk').onclick = async () => { const n = fieldVal('rsN'); const code = fieldVal('rsC'); closeModal(); $('#kSt').value = 'Resolved'; await save({ state: 'Resolved', resolution: n, resolutionCode: code }); };
    };
  }

  // ---------------------------------------------------------------- knowledge
  async function pageKb(el, r) {
    const id = r.parts[1];
    if (id) {
      const k = await api(`/api/kb/${id}`);
      el.innerHTML = `<div class="page narrow"><div class="page-h"><a href="#/kb">${ic('left', 'sm')} Knowledge</a></div><div class="card"><div class="small muted">${esc(k.id)} · ${esc(k.category)}</div><h2 style="margin:4px 0 10px">${esc(k.title)}</h2>
        <div class="aisum"><div class="t">${ic('spark', 'sm')} Summarized by Now Assist</div>${esc(k.summary)}</div><p style="line-height:1.55">${esc(k.summary)}</p>${k.body ? `<p style="line-height:1.55">${esc(k.body)}</p>` : ''}<div class="small muted">Was this helpful? ${ic('up', 'sm')} ${ic('dn', 'sm')}</div></div></div>`;
      return;
    }
    const q = r.q.get('q') || ''; const list = await api(`/api/kb?q=${encodeURIComponent(q)}`);
    el.innerHTML = `<div class="page narrow"><div class="page-h"><h2>Knowledge</h2></div><form id="kbF" style="display:flex;gap:6px;margin-bottom:10px"><input id="kbQ" class="in" style="flex:1;border:1px solid #b8c4ca;border-radius:5px;padding:7px 9px;font:inherit" placeholder="Search articles" value="${esc(q)}"><button class="btn primary">Search</button></form>
      <div class="card">${list.map((k) => `<div class="kbitem" data-kb="${k.id}"><h4>${esc(k.title)}</h4><div class="small muted">${esc(k.id)} · ${esc(k.category)}</div><div class="small">${esc(k.summary)}</div></div>`).join('') || '<div class="empty">No articles</div>'}</div></div>`;
    $('#kbF').onsubmit = (e) => { e.preventDefault(); go(`#/kb?q=${encodeURIComponent(fieldVal('kbQ'))}`); };
    el.onclick = listClicks;
  }

  // ---------------------------------------------------------------- new contact
  function pageRegister(el, r) {
    el.innerHTML = `<div class="page narrow sm"><div class="page-h"><h2>New taxpayer contact</h2></div><div class="card">
      <div class="callout">Use this when a caller is not found. The contact can be linked to a filed return later.</div>
      <div class="frow"><div class="f"><label>First name</label><input id="nF"></div><div class="f"><label>Last name</label><input id="nL"></div></div>
      <div class="frow3"><div class="f"><label>Date of birth</label><input id="nD" type="date"></div><div class="f"><label>Last 4 of SSN</label><input id="nS" maxlength="4"></div><div class="f"><label>Phone</label><input id="nP" value="${esc(r.q.get('phone') || '')}"></div></div>
      <div class="frow"><div class="f"><label>Email</label><input id="nE"></div><div class="f"><label>Language</label><select id="nLg"><option>English</option><option>Spanish</option><option>Somali</option><option>Arabic</option></select></div></div>
      <div class="frow3"><div class="f"><label>Street</label><input id="nA"></div><div class="f"><label>City</label><input id="nC"></div><div class="f"><label>ZIP</label><input id="nZ"></div></div>
      <div style="display:flex;justify-content:flex-end;gap:6px"><button class="btn" data-go="#/home">Cancel</button><button class="btn primary" id="nOk">Create</button></div></div></div>`;
    $('#nOk').onclick = async () => {
      const t = await act(() => api('/api/taxpayers', { method: 'POST', body: { firstName: fieldVal('nF'), lastName: fieldVal('nL'), dob: fieldVal('nD'), last4: fieldVal('nS'), phone: fieldVal('nP'), email: fieldVal('nE'), language: fieldVal('nLg'), addressLine: fieldVal('nA'), city: fieldVal('nC'), zip: fieldVal('nZ') } }), 'Contact created');
      if (S.interaction && !S.interaction.taxpayerId) S.interaction.taxpayerId = t.id;
      openTaxpayer(t.id);
    };
  }

  // ---------------------------------------------------------------- Genesys integration page
  async function pageGenesys(el) {
    const base = S.config.baseUrl || location.origin;
    const recent = await api('/api/screenpop/recent').catch(() => []);
    const scen = await api('/api/bot-scenarios').catch(() => []);
    const bots = await api('/api/bot-sessions').catch(() => []);
    const all = await api('/api/taxpayers?all=1');
    const samples = all.map((t) => [t.phone, `${t.fullName}${t.flags[0] ? ` · ${t.flags[0]}` : ''}`]);
    const seen = new Set(); const uniq = samples.filter(([n]) => !seen.has(n) && seen.add(n));
    const rep = all.find((t) => t.representative); if (rep) uniq.push([rep.phones.find((p) => p.type === 'Representative')?.number, `Representative calling for ${rep.fullName}`]);
    uniq.push([`(${S.brand.areaCodes?.[0] || '614'}) 555-0999`, 'Unknown caller · new contact']);
    el.innerHTML = `<div class="page"><div class="page-h"><h2>Genesys Cloud integration</h2><div class="r"><span class="tag2 ${S.sseOn ? 'green' : 'amber'}">${S.sseOn ? 'Listening for screen pops' : 'Not connected'}</span></div></div>
      <div class="grid2">
        <div class="card"><div class="card-h">Simulate an interaction</div>
          <div class="f"><label>Caller (ANI)</label><select id="gPhone">${uniq.filter(([n]) => n).map(([n, l]) => `<option value="${esc(n)}">${esc(n)} · ${esc(l)}</option>`).join('')}</select></div>
          <div class="frow"><div class="f"><label>Queue</label><input id="gQueue" value="Individual Income Tax"></div><div class="f"><label>Media</label><select id="gMedia"><option value="voice">Voice</option><option value="chat">Web chat</option><option value="message">Messaging</option></select></div></div>
          <div class="frow"><div class="f"><label>Intent (from virtual agent / IVR)</label><select id="gIntent"><option value="">(none)</option><option selected>Refund status</option><option>Make a payment</option><option>Payment plan</option><option>Notice question</option><option>Business tax</option></select></div><div class="f"><label>Target agent</label><input id="gAgent" value="${esc(S.settings.agentEmail || S.user.email)}"></div></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" id="gPush">${ic('phone', 'sm')} Push screen pop (API)</button><button class="btn" id="gUrl">Open pop URL</button></div>
          <p class="small muted">Push calls <code>POST /api/screenpop</code>, which is what a Genesys Script data action, Architect flow or Process Automation trigger would do. ${S.settings.ringInbox ? 'Pushed interactions ring in the inbox.' : 'Pushed interactions open the record straight away.'} Open pop URL navigates like a Script web page or Interaction Widget.</p></div>
        <div class="card"><div class="card-h">This agent</div>
          <div class="kv c3"><div><label>Agent email</label><div class="v">${esc(S.settings.agentEmail || S.user.email)}</div></div><div><label>Inbox ringing</label><div class="v">${S.settings.ringInbox ? 'On' : 'Off'}</div></div><div><label>Server-side lookup</label><div class="v">${S.config.genesysLookup ? 'Configured' : 'Not configured'}</div></div></div>
          <p class="small"><a href="#" id="gSet">Change settings</a> · <a href="/api-docs.html" target="_blank">API reference</a></p>
          <div class="card-h" style="margin-top:6px">URL templates</div>
          <div class="mono"><b>Script web page</b><br>${esc(base)}/pop?phone={{Customer phone variable}}&amp;conversationId={{Scripter.Interaction ID}}&amp;queue={{Scripter.Queue Name}}&amp;agent={{Scripter.Agent Email}}&amp;embed=1<br><br>
            <b>Interaction Widget</b><br>${esc(base)}/pop?conversationId={{gcConversationId}}&amp;embed=1<br><br>
            <b>By return ID or SSN last 4 (collected by the bot)</b><br>${esc(base)}/pop?returnId={{ReturnId}}&amp;conversationId={{Scripter.Interaction ID}}</div></div></div>
      ${scen.length ? `<div class="card" style="margin-top:14px"><div class="card-h">${ic('spark', 'sm')} Pilot virtual agent handoffs <span class="small muted" style="font-weight:400">· the bot runs in Genesys Cloud; these buttons send the sample data it would post</span> <span class="r small muted">Caller: Tom Harper ${esc(S.records['tp-1010']?.phones[0]?.number || '(419) 555-0124')} · demo SSN 900-55-6789 · DOB 03/22/1978</span></div>
        <div class="grid2">${scen.map((x) => `<div class="scen"><b>${esc(x.title)}</b><div class="small muted">${esc(x.intent)} · ${x.outcome === 'Contained' ? 'Genesys posts the finished Pilot session; ServiceNow logs a contained virtual agent interaction on the record.' : 'Genesys posts Pilot\'s session, then transfers. The screen pop carries Pilot\'s context and transcript.'}</div>
          <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap"><button class="btn primary sm" data-scen="${x.id}">${x.outcome === 'Contained' ? 'Send contained session' : `${ic('phone', 'sm')} Send transfer + screen pop`}</button>${x.outcome === 'Transferred' ? `<a class="btn sm" href="/pop?scenario=${x.id}">Open as pop URL</a>` : ''}</div></div>`).join('')}</div>
        ${bots.length ? `<table class="tbl" style="margin-top:10px"><tr><th>When</th><th>Caller</th><th>Intent</th><th>Outcome</th><th>Authenticated</th><th>Conversation</th></tr>${bots.slice(0, 8).map((b) => `<tr class="click" data-opentp="${b.taxpayerId}"><td class="nowrap">${fmtDT(b.date)}</td><td>${esc(b.phone)}</td><td>${esc(b.intent)}</td><td><span class="tag2 ${b.outcome === 'Contained' ? 'green' : 'blue'}">${esc(b.outcome)}</span></td><td>${b.authenticated ? 'Yes' : 'No'}</td><td class="small">${esc(b.conversationId)}</td></tr>`).join('')}</table>` : ''}</div>` : ''}
      <h3 class="card-h" style="margin-top:14px">Recent screen pops (${recent.length})</h3>
      <div class="card" style="padding:0"><table class="tbl"><tr><th>Received</th><th>Phone</th><th>Agent</th><th>Queue</th><th>Intent</th><th>Matches</th><th>Conversation</th></tr>${recent.map((x) => `<tr><td class="nowrap">${fmtDT(x.receivedAt)}</td><td>${esc(x.phone)}</td><td>${esc(x.agent)}</td><td>${esc(x.queue)}</td><td>${esc(x.intent)}</td><td>${x.taxpayerIds.length}</td><td class="small">${esc(x.conversationId)}</td></tr>`).join('') || '<tr><td colspan="7" class="empty">None yet</td></tr>'}</table></div></div>`;
    const conv = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
    $('#gPush').onclick = async () => { const r = await fetch('/api/screenpop', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: fieldVal('gPhone'), agent: fieldVal('gAgent'), queue: fieldVal('gQueue'), mediaType: fieldVal('gMedia'), intent: fieldVal('gIntent'), conversationId: conv() }) }).then((x) => x.json()); if (r.error) toast(esc(r.error), { cls: 'genesys' }); else if (!r.deliveredTo) toast('Screen pop sent, but no open workspace is listening for that agent', { cls: 'genesys' }); };
    $('#gUrl').onclick = () => { location.href = `/pop?${new URLSearchParams({ phone: fieldVal('gPhone'), conversationId: conv(), queue: fieldVal('gQueue'), mediaType: fieldVal('gMedia'), intent: fieldVal('gIntent') })}`; };
    $('#gSet').onclick = (e) => { e.preventDefault(); userMenu(); };
    el.onclick = (e) => { const b = e.target.closest('[data-scen]'); if (b) return runScenario(scen.find((x) => x.id === b.dataset.scen)); const t = e.target.closest('[data-opentp]'); if (t && t.dataset.opentp) openTaxpayer(t.dataset.opentp); };
  }

  // Test without Genesys: sends the same sample Pilot session a Genesys data action would post (no bot is simulated here).
  async function runScenario(sc) {
    if (!sc) return;
    const r = await act(() => api(`/api/bot-scenarios/${sc.id}/run`, { method: 'POST', body: { agent: S.settings.agentEmail || S.user.email, conversationId: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) } }));
    const t = await loadTp(sc.taxpayerId, true);
    if (sc.outcome === 'Contained') toast(`Contained ${esc(sc.botName)} session logged on ${esc(t.fullName)}'s record`, { ms: 6000 });
    else if (!r.deliveredTo) toast('Handoff sent, but no workspace is listening for this agent', { cls: 'genesys' });
    if (sc.outcome === 'Contained') openTaxpayer(sc.taxpayerId, 'activity'); else render();
  }

  // ---------------------------------------------------------------- v3 interaction workspace (IMS record)
  // Layout and click behavior follow the workspace template: call card + Customer History on the left, the Interaction
  // form in the middle, Agent Assist on the right, a utility rail, a Wrap up dock and an adherence toast. Text comes from data.
  const UI = () => Object.assign({ recordTitle: 'Agent Needed', acceptSeconds: 55, adherenceToast: true, adherenceText: 'Out of Adherence: You are not scheduled for this time. Please select the correct status.', wrapCodes: ['Payment / Billing Inquiry', 'Claims Concern'], assistIntervalMs: 7000, reasonContacted: 'Escalation to human agent', resolution: 'Customer escalated before resolution', presence: ['On Queue', 'Available', 'Away', 'Busy', 'Offline'] }, S.brand.ui || {});
  S.calls = {}; S.ims = {}; S.call = null; S.imsUi = { side: 'assist', collapsed: false };
  const tzName = () => { try { return new Intl.DateTimeFormat('en-US', { timeZone: S.brand.timeZone || 'America/New_York', timeZoneName: 'short' }).formatToParts(new Date()).find((p) => p.type === 'timeZoneName').value; } catch { return ''; } };
  const hhmm = (ms) => new Intl.DateTimeFormat('en-GB', { timeZone: S.brand.timeZone || 'America/New_York', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(ms));
  const nowNaive = () => { const p = new Intl.DateTimeFormat('en-CA', { timeZone: S.brand.timeZone || 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()); const g = (t) => p.find((x) => x.type === t).value; return `${g('year')}-${g('month')}-${g('day')}T${g('hour')}:${g('minute')}:${g('second')}`; };
  function ago(d) {
    const m = Math.round((Date.parse(nowNaive()) - Date.parse(d.length === 10 ? d + 'T12:00:00' : d)) / 60000);
    if (m < 1) return 'just now'; if (m < 45) return `${m} minute${m === 1 ? '' : 's'} ago`; if (m < 90) return 'about an hour ago';
    if (m < 1440) return `${Math.round(m / 60)} hours ago`; const dd = Math.round(m / 1440); if (dd < 30) return `${dd} day${dd === 1 ? '' : 's'} ago`;
    const mo = Math.round(dd / 30); return mo < 12 ? `${mo} month${mo === 1 ? '' : 's'} ago` : `${Math.round(mo / 12)} year${mo < 18 ? '' : 's'} ago`;
  }
  const clock = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map((n) => String(n).padStart(2, '0')).join(':'); };
  const fill = (text, c) => String(text || '').replace(/\{agent\}/g, S.user.name.split(' ')[0]).replace(/\{first\}/g, (c && c.first) || '');
  const IC3 = {
    keypad: '<circle cx="6" cy="5" r="1.2"/><circle cx="12" cy="5" r="1.2"/><circle cx="18" cy="5" r="1.2"/><circle cx="6" cy="11" r="1.2"/><circle cx="12" cy="11" r="1.2"/><circle cx="18" cy="11" r="1.2"/><circle cx="6" cy="17" r="1.2"/><circle cx="12" cy="17" r="1.2"/><circle cx="18" cy="17" r="1.2"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>', arrow: '<path d="M4 12h15M13 6l6 6-6 6"/>', micoff: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3M4 4l16 16"/>',
    holdph: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2"/><path d="M16 3v5M19 3v5"/>', phoneoff: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2"/><path d="M3 3l18 18"/>',
    cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5M22 9v6"/>', clip: '<path d="M20 12l-8 8a5 5 0 01-7-7l9-9a3.5 3.5 0 015 5l-9 9a2 2 0 01-3-3l8-8"/>',
    script: '<path d="M8 3h11v15a3 3 0 01-3 3H6a3 3 0 01-3-3v-2h11v2a3 3 0 003 3"/><path d="M8 3a3 3 0 00-3 3v10M11 8h5M11 12h5"/>', image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
    filter: '<path d="M4 5h16l-6 7v6l-4 2v-8z"/>', cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>', chevup: '<path d="M6 15l6-6 6 6"/>', expand: '<path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>',
    plus2: '<path d="M12 4v16M4 12h16" stroke-width="3"/>', kbdoc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>', gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  };
  Object.assign(IC, IC3);
  const spinner = (label) => `<div class="spin-wrap"><span class="spin"></span>${label ? `<div>${esc(label)}</div>` : ''}</div>`;

  // Create (or reuse) the interaction record and open it as the active call.
  async function openCall(ix, imsId) {
    const t = ix.taxpayerId ? await loadTp(ix.taxpayerId) : null;
    let rec = imsId ? await api(`/api/ims/${imsId}`).catch(() => null) : null;
    if (!rec) rec = await api('/api/ims', { method: 'POST', body: { taxpayerId: ix.taxpayerId || '', phone: ix.phone, conversationId: ix.conversationId, queue: ix.queue, intent: ix.intent, mediaType: ix.mediaType, botSessionId: ix.bot?.id || '', customerName: ix.customerName, assignedTo: S.user.name } });
    rec = await api(`/api/ims/${rec.id}`, { method: 'PATCH', body: { state: 'Work in Progress', assignedTo: S.user.name } });
    S.ims[rec.id] = rec; S.interaction = ix; ix.imsId = rec.id;
    const c = { id: rec.id, phase: 'connecting', tabStage: 'loading', accepted: Date.now(), first: t?.firstName || '', toast: false, histLoading: false, assist: 'related', script: [], shown: [], votes: {}, fb: {}, pill: 0, summaryOpen: true, muted: false, held: false, rec: true, flagged: false, keypad: '', wrap: null, events: [] };
    S.calls[rec.id] = c; S.call = rec.id;
    if (!S.tabs.some((x) => x.kind === 'ims' && x.id === rec.id)) { S.tabs.push({ kind: 'ims', id: rec.id, label: rec.contact || rec.phone || rec.id }); saveTabs(); }
    go(`#/ims/${rec.id}`);
    c.script = await api(`/api/assist?${new URLSearchParams({ scenario: rec.scenario || '', taxpayerId: rec.taxpayerId || '' })}`).catch(() => []);
    const step = (ms, fn) => new Promise((res) => setTimeout(() => { fn(); res(); }, ms));
    await step(600, () => { c.tabStage = 'record'; paintTabs(); });
    await step(600, () => { c.tabStage = 'name'; paintTabs(); });
    await step(1600, () => { c.phase = 'active'; c.connectedAt = Date.now(); c.toast = !!UI().adherenceToast; c.histLoading = true; c.events.push({ at: Date.now(), who: 'system', text: 'Agent has joined.' }); imsPaint(); });
    await step(900, () => { c.histLoading = false; c.assist = 'loading'; imsPaint(); });
    await step(1200, () => { c.assist = 'live'; imsPaint(); scheduleAssist(c); });
  }
  function scheduleAssist(c) {
    clearTimeout(c.aTimer);
    if (c.phase !== 'active' || c.shown.length >= c.script.length) return;
    c.aTimer = setTimeout(() => nextUtterance(c), c.shown.length ? UI().assistIntervalMs : Math.max(2500, UI().assistIntervalMs / 2));
  }
  function nextUtterance(c) {
    if (c.phase !== 'active' || c.shown.length >= c.script.length) return;
    const line = c.script[c.shown.length];
    c.shown.push({ ...line, at: Date.now() }); c.events.push({ at: Date.now(), who: line.who, text: fill(line.text, c) });
    if (line.article) c.pill++;
    if (parseRoute().name === 'ims' && parseRoute().parts[1] === c.id) paintAssist();
    scheduleAssist(c);
  }
  document.addEventListener('keydown', (e) => {
    if (e.key !== ']' || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) return;
    const c = S.calls[S.call]; if (c && c.phase === 'active') { clearTimeout(c.aTimer); nextUtterance(c); }
  });
  setInterval(() => {
    Object.values(S.calls).forEach((c) => {
      if (c.phase === 'active') $$(`.ims-clock[data-c="${c.id}"]`).forEach((x) => { x.textContent = clock(Date.now() - c.connectedAt); });
      if (c.wrap) $$(`.wrap-clock[data-c="${c.id}"]`).forEach((x) => { x.textContent = clock(Date.now() - c.wrap.startedAt); });
    });
  }, 1000);

  function paintTabs() { const tb = $('.tabbar'); if (!tb) return; shell(); renderPage(); }
  function imsCtx() { const r = parseRoute(); const id = r.parts[1]; const rec = S.ims[id]; return { id, rec, c: S.calls[id] || null, t: rec && rec.taxpayerId ? S.records[rec.taxpayerId] : null }; }
  function imsPaint() { if (parseRoute().name !== 'ims') return; const { rec } = imsCtx(); if (!rec) return; paintCard(); paintHist(); paintHead(); paintAssist(); paintToast(); }

  async function pageIms(el, r) {
    const id = r.parts[1];
    S.ims[id] = S.ims[id] && S.calls[id] ? S.ims[id] : await api(`/api/ims/${id}`);
    const rec = S.ims[id];
    if (!S.tabs.some((x) => x.kind === 'ims' && x.id === id)) { S.tabs.push({ kind: 'ims', id, label: rec.contact || rec.id }); saveTabs(); shell(); }
    if (rec.taxpayerId) await loadTp(rec.taxpayerId);
    if (rec.taxpayerId) S.imsHist = S.imsHist || {};
    if (rec.taxpayerId && (!S.imsHist[rec.taxpayerId] || S.imsHist[rec.taxpayerId].at < Date.now() - 2000)) S.imsHist[rec.taxpayerId] = { at: Date.now(), list: await api(`/api/ims?taxpayerId=${rec.taxpayerId}`) };
    el.innerHTML = `<div class="ims ${S.imsUi.side === 'none' ? 'no-assist' : ''}" id="ims">
      <div class="ims-side"><div id="imsCard"></div><div class="ctx-tabs"><span class="on">Customer</span></div><div class="ims-hist" id="imsHist"></div></div>
      <div class="ims-main"><div class="ims-head" id="imsHead"></div><div class="ims-form" id="imsForm"></div></div>
      <div class="ims-assist" id="imsAssist"></div>
      <div class="ims-rail">${[['cap', 'learn', 'Learning'], ['clip', 'attach', 'Attachments'], ['doc', 'details', 'Record details'], ['plus2', 'assist', 'Agent Assist'], ['script', 'script', 'Script'], ['image', 'images', 'Images']].map(([i, k, l]) => `<button data-side="${k}" class="${S.imsUi.side === k ? 'on' : ''} ${k === 'assist' ? 'aa' : ''}" title="${l}">${ic(i)}</button>`).join('')}</div>
      <div id="imsWrap"></div><div id="imsToast"></div></div>`;
    paintCard(); paintHist(); paintHead(); paintForm(); paintAssist(); paintWrap(); paintToast();
    el.onclick = (e) => imsClicks(e);
  }

  function paintCard() {
    const box = $('#imsCard'); if (!box) return; const { rec, c } = imsCtx();
    const phase = c ? c.phase : 'closed';
    const loc = `<div class="loc"><b>${esc(rec.location || '')}</b><small>${esc(rec.phone || '')}</small></div>`;
    let html;
    if (phase === 'connecting') html = `<div class="cc-h">${ic('phone', 'sm')} <b>Connecting…</b></div>${loc}`;
    else if (phase === 'active') html = `<div class="cc-h"><b>${c.held ? 'On hold' : 'Active call'}</b> <span class="ims-clock" data-c="${c.id}">${clock(Date.now() - c.connectedAt)}</span></div>${loc}
      <div class="cc-ctl"><div style="position:relative"><button class="rec ${c.rec ? 'on' : ''}" data-c="recmenu" title="Recording">${c.rec ? '<i class="recdot"></i>' : ''}REC ${ic('down', 'sm')}</button>${S.menu === 'rec' ? `<div class="menu" style="top:26px;left:0"><div data-c="rec">${c.rec ? 'Pause recording' : 'Resume recording'}</div></div>` : ''}</div>
        <button class="${c.muted ? 'muted' : ''}" data-c="mute" title="${c.muted ? 'Unmute yourself' : 'Mute yourself'}">${ic(c.muted ? 'micoff' : 'mic')}</button>
        <button class="${c.held ? 'on' : ''}" data-c="hold" title="${c.held ? 'Take off hold' : 'Hold'}">${ic('holdph')}</button>
        <div style="position:relative"><button class="${S.menu === 'keypad' ? 'on' : ''}" data-c="keypadmenu" title="Keypad">${ic('keypad')}</button>${S.menu === 'keypad' ? `<div class="menu keypad" style="top:30px;left:-40px"><div class="kd">${esc(c.keypad) || '&nbsp;'}</div><div class="kg">${'123456789*0#'.split('').map((d) => `<span data-dtmf="${d}">${d}</span>`).join('')}</div></div>` : ''}</div>
        <button data-c="transfer" title="Transfer">${ic('arrow')}</button>
        <button class="${c.flagged ? 'on' : ''}" data-c="flag" title="${c.flagged ? 'Remove flag' : 'Flag interaction'}">${ic('flag')}</button>
        <button class="hang" data-c="hangup" title="Disconnect">${ic('hang')}</button></div>`;
    else if (phase === 'wrapup') html = `<div class="cc-h"><b>Call ended</b> <span>${clock(c.endedAt - c.connectedAt)}</span></div>${loc}`;
    else if (phase === 'unavailable') html = `<div class="cc-h ended">${ic('phoneoff', 'sm')} <b>Phone is not available</b></div>`;
    else html = `<div class="cc-h ended">${ic('hang', 'sm')} <b>The call has ended</b></div>`;
    box.className = `callbox ${phase}`; box.innerHTML = html;
  }

  function histItems(rec, t) {
    if (!t) return [];
    const items = [];
    (S.imsHist?.[t.id]?.list || []).filter((x) => x.state === 'Closed Complete').forEach((x) => items.push({ d: x.closed || x.opened, icon: 'phone', cls: 'call', title: `${x.contact} called ${x.assignedTo}`, ref: x.number, sub: x.shortDescription, go: `ims:${x.id}` }));
    (t.cases || []).forEach((cs) => items.push({ d: cs.opened, icon: 'case', cls: 'case', title: `${t.type === 'Business' ? t.fullName : t.fullName} created case`, ref: cs.number, meta: [cs.assignedTo, t.fullName, cs.state].filter(Boolean).join(' • '), sub: cs.shortDescription, go: `case:${cs.id}` }));
    (t.botSessions || []).forEach((b) => items.push({ d: b.date, icon: 'spark', cls: 'bot', title: `${t.fullName} talked to ${b.botName}`, ref: b.outcome, sub: b.intent, go: `bot:${b.id}` }));
    (t.notices || []).forEach((n) => items.push({ d: n.date, icon: 'doc', cls: 'notice', title: `${n.letter} ${n.type} mailed`, ref: n.id, sub: n.status, go: `notice:${n.id}` }));
    return items.filter((x) => x.d).sort((a, b) => b.d.localeCompare(a.d));
  }
  function paintHist() {
    const box = $('#imsHist'); if (!box) return; const { rec, c, t } = imsCtx();
    const hs = S.imsUi; const q = (hs.hq || '').toLowerCase();
    let items = histItems(rec, t).filter((x) => (!q || `${x.title} ${x.ref} ${x.sub}`.toLowerCase().includes(q)) && (!hs.hf || x.cls === hs.hf) && (!hs.h30 || Date.parse(nowNaive()) - Date.parse(x.d) < 30 * 864e5));
    let last = ''; const today = nowNaive().slice(0, 10);
    const rows = items.map((x) => { const day = x.d.slice(0, 10); const chip = day !== last ? `<div class="daychip"><span>${day === today ? 'Today' : fmtD(day)}</span></div>` : ''; last = day;
      return `${chip}<div class="hitem" data-hgo="${esc(x.go)}"><span class="hic ${x.cls}">${ic(x.icon, 'sm')}</span><div class="hb"><div class="ht2"><b>${esc(x.title)}</b><span>${esc(ago(x.d))}</span></div><a class="ref">${esc(x.ref)}</a>${x.meta ? `<small> • ${esc(x.meta)}</small>` : ''}<div class="hs">${esc(x.sub || '')}</div></div></div>`; }).join('');
    box.innerHTML = `<div class="hh"><h3>Customer History</h3><span data-h="search" class="${hs.hsearch ? 'on' : ''}" title="Search">${ic('search')}</span><span data-h="filter" class="${hs.hf ? 'on' : ''}" title="Filter" style="position:relative">${ic('filter')}${S.menu === 'hfilter' ? `<div class="menu" style="top:24px;right:0">${[['', 'All activity'], ['call', 'Calls'], ['case', 'Cases'], ['bot', 'Virtual agent'], ['notice', 'Notices']].map(([k, l]) => `<div data-hf="${k}">${hs.hf === k ? ic('check', 'sm') : '<span style="width:13px"></span>'}${l}</div>`).join('')}</div>` : ''}</span><span data-h="cal" class="${hs.h30 ? 'on' : ''}" title="${hs.h30 ? 'Showing the last 30 days' : 'Last 30 days'}">${ic('cal')}</span></div>
      ${hs.hsearch ? `<form id="hForm" class="hsearch"><input id="hQ" placeholder="Search history" value="${esc(hs.hq || '')}"></form>` : ''}
      <div class="hlist">${c && c.histLoading ? spinner() : !t ? '<div class="empty">No customer on this interaction</div>' : rows || '<div class="empty">No history</div>'}</div>`;
    const f = $('#hForm'); if (f) { f.onsubmit = (e) => { e.preventDefault(); hs.hq = $('#hQ').value; paintHist(); }; $('#hQ').oninput = (e) => { hs.hq = e.target.value; clearTimeout(hs.hT); hs.hT = setTimeout(() => { paintHist(); const i = $('#hQ'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 250); }; }
  }

  function paintHead() {
    const box = $('#imsHead'); if (!box) return; const { rec, c } = imsCtx();
    const live = c && ['connecting', 'active', 'wrapup'].includes(c.phase) && rec.state !== 'Closed Complete';
    const btns = live ? [['callback', 'Genesys Schedule Callback'], ['incident', 'Create Incident'], ['close', 'Close'], ['case', 'Create Case']] : [['incident', 'Create Incident'], ['case', 'Create Case'], ['save', 'Save']];
    const t = rec.taxpayerId ? S.records[rec.taxpayerId] : null;
    const un = t && (t.unapplied || []).find((u) => /unapplied/i.test(u.status)); const held = t && t.returns.find((x) => x.refund && /hold/i.test(x.refund.status));
    const more = S.menu === 'imsmore' ? `<div class="menu" style="top:34px;right:0;min-width:220px">${t ? `<div data-c="opentp">${ic('user', 'sm')} Open taxpayer record</div>${t.identity.status !== 'Verified' ? `<div data-a="verify">${ic('shield', 'sm')} Verify identity</div>` : ''}${un ? `<div data-a="apply" data-arg="${un.id}">${ic('cash', 'sm')} Apply suspense payment</div>` : ''}${held ? `<div data-c="refunds">${ic('cash', 'sm')} Refund details</div>` : ''}<div data-a="email">${ic('mail', 'sm')} Email the taxpayer</div>` : ''}${rec.botSessionId ? `<div data-a="botview" data-arg="${rec.botSessionId}">${ic('spark', 'sm')} View ${esc(rec.bot?.botName || 'virtual agent')} transcript</div>` : ''}<div data-c="copy">${ic('copy', 'sm')} Copy ${esc(rec.number)}</div></div>` : '';
    box.innerHTML = `<h2>${esc(rec.shortDescription || UI().recordTitle)} <span class="tagic" title="Tags">${ic('tag')}</span></h2>
      <div class="acts">${btns.map(([k, l]) => `<button class="btn" data-c="${k}">${esc(l)}</button>`).join('')}<div style="position:relative"><button class="btn icon" data-c="more" title="More actions">${ic('dotsh')}</button>${more}</div></div>`;
  }

  function paintForm() {
    const box = $('#imsForm'); if (!box) return; const { rec, t } = imsCtx();
    const verified = rec.verified || (t && t.identity.status === 'Verified');
    const ro = (l, v, extra = '', cls = '') => `<div class="f3 ${cls}"><label>${l}</label><div class="fv ro">${esc(v || '')}${extra}</div></div>`;
    const lk = (l, v, k) => `<div class="f3"><label>${l}</label><div class="fv lk"><span>${esc(v || '')}</span><span class="fi"><span data-c="info-${k}" title="Preview">${ic('info', 'sm')}</span><span data-c="find-${k}" title="Look up">${ic('search', 'sm')}</span></span></div></div>`;
    const mod = rec.modifiedBy ? `<div class="modchip">${ic('info', 'sm')} ${esc(rec.modifiedBy)} has modified this field value</div>` : '';
    const tz = tzName();
    box.innerHTML = `<div class="sec-h"><span class="dots">${ic('dots')}</span><h3>Interaction</h3><span class="chev ${S.imsUi.collapsed ? 'down' : ''}" data-c="collapse">${ic('chevup')}</span></div>
      ${S.imsUi.collapsed ? '' : `<div class="fgrid">
        ${ro('Number', rec.number)}<div class="f3"><label>State</label><div class="fv ro ${rec.modifiedBy ? 'mod' : ''}">${esc(rec.state)}</div>${mod}</div>
        ${ro('Type', rec.type)}${lk('Assigned to', rec.assignedTo, 'user')}
        ${lk('Account', rec.account, 'account')}<div></div>
        ${lk('Contact', rec.contact, 'contact')}<div></div>
        <div class="f3 chk"><label class="cb"><input type="checkbox" id="imsVer" ${verified ? 'checked' : ''}><span>Verified</span></label></div><div></div>
        <div class="f3 wide"><label>Short description</label><input id="imsSd" class="fv ${rec.modifiedBy ? 'mod' : ''}" value="${esc(rec.shortDescription)}"></div>
        ${rec.transcript && rec.transcript.length ? `<div class="f3 wide"><label>Internal Transcript</label><div class="fv ro transcript3">${rec.transcript.map((l) => `<div>[${esc(l.time)} ${esc(tz)}] ${esc(l.who)}: ${esc(l.text)}</div>`).join('')}</div></div>` : ''}
        ${rec.wrapCode ? ro('Wrap up code', rec.wrapCode) : ''}${rec.notes && rec.state === 'Closed Complete' ? `<div class="f3 wide"><label>Wrap up notes</label><div class="fv ro">${esc(rec.notes)}</div></div>` : ''}
        ${rec.cases && rec.cases.length ? ro('Related cases', rec.cases.join(', ')) : ''}
      </div>`}`;
    const v = $('#imsVer'); if (v) v.onchange = () => { if (!t) { v.checked = false; return toast('No taxpayer on this interaction'); } if (t.identity.status !== 'Verified' && v.checked) { v.checked = false; return verifyModal(t); } rec.verified = v.checked; api(`/api/ims/${rec.id}`, { method: 'PATCH', body: { verified: v.checked } }); };
    const sd = $('#imsSd'); if (sd) sd.onchange = () => { rec.shortDescription = sd.value; paintHead(); };
  }

  function hl(text, phrase) {
    const e = esc(text); if (!phrase) return e; const p = esc(phrase); const i = e.toLowerCase().indexOf(p.toLowerCase());
    return i < 0 ? e : `${e.slice(0, i)}<mark>${e.slice(i, i + p.length)}</mark>${e.slice(i + p.length)}`;
  }
  const thumbs = (c, id) => `<span class="thumbs"><span data-vote="up" data-kb="${id}" class="${c.votes[id] === 'up' ? 'sel' : ''}" title="Relevant">${ic('up')}</span><span data-vote="down" data-kb="${id}" class="${c.votes[id] === 'down' ? 'sel' : ''}" title="Irrelevant">${ic('dn')}</span></span>`;
  function transferSummary(rec, c) {
    const bot = rec.bot; if (!bot) return '';
    const U = UI();
    return `<div class="tsum ${c.shown.some((x) => x.article) ? 'old' : ''}" title="AI generated this summary. It is recommended to review for accuracy."><div class="tsh">${ic('spark', 'sm')} <b>Transfer Summary</b></div>
      ${c.summaryOpen ? `<div class="tsl"><b>Reason contacted</b><p>${esc(bot.outcome === 'Transferred' ? U.reasonContacted : bot.intent)}</p></div><div class="tsl"><b>Summary</b><p>${esc(bot.summary || '')}</p></div><div class="tsl"><b>Resolution</b><p>${esc(bot.outcome === 'Transferred' ? U.resolution : 'Resolved by the virtual agent')}</p></div>` : `<p class="small">${esc((bot.summary || '').slice(0, 90))}…</p>`}
      <a class="showless" data-c="summary">${c.summaryOpen ? `${ic('chevup', 'sm')} Show less` : `${ic('down', 'sm')} Show more`}</a></div>`;
  }
  function paintAssist() {
    const box = $('#imsAssist'); if (!box) return; const { rec, c, t } = imsCtx();
    const side = S.imsUi.side;
    if (side !== 'assist') { box.innerHTML = sidePanel(side, rec, t); return; }
    const mode = c ? c.assist : 'awaiting';
    const search = (ph, val, focus) => `<form class="ksearch ${focus ? 'focus' : ''}" id="kForm">${ic('search')}<input id="kQ" placeholder="${ph}" value="${esc(val || '')}" autocomplete="off">${val ? `<span data-c="kclear">${ic('x', 'sm')}</span>` : ''}</form>`;
    const results = (list) => list.length ? list.map((k) => `<div class="kcard"><div class="kt"><span>${ic('kbdoc', 'sm')}</span><a data-kbopen="${k.id}">${esc(k.title)}</a></div><p>${esc(k.summary)}</p></div>`).join('') : `<div class="nomatch"><b>No Matches Found</b><div>Try modifying your search text or filter to find what you are looking for.</div></div>`;
    let html = '';
    if (mode === 'awaiting' || !c) html = `<div class="await">${spinner()}<b>Awaiting Conversation</b></div>`;
    else if (mode === 'loading') html = `<div class="await">${spinner('Loading')}</div>`;
    else if (mode === 'related') { const q = c.kq ?? rec.shortDescription; html = `${search('Search knowledge', q)}<div class="rs-h">Related Search Results</div>${results(c.kres || [])}`; if (!c.kres) kbSearch(c, q); }
    else if (mode === 'live') {
      const items = [...c.shown].reverse();
      html = `${c.pill ? `<div class="newpill" data-c="pill">${c.pill} New Suggestion${c.pill > 1 ? 's' : ''} ${ic('chevup', 'sm')}</div>` : ''}${search('Search knowledge', c.kq, true)}
        ${c.kq && c.kres ? `<div class="rs-h">Search results <a data-c="kclear">Clear</a></div>${results(c.kres)}<hr>` : ''}
        <div class="sugg3">${items.map((x, i) => `<div class="utt ${i > 0 ? 'old' : ''}"><q>${esc(fill(x.text, c))}</q>${x.article ? `<div class="kcard"><div class="kt"><span>${ic('kbdoc', 'sm')}</span><a data-kbopen="${x.article.id}">${esc(x.article.title)}</a>${thumbs(c, x.article.id)}</div><p>${hl(x.article.text, x.hl)}</p></div>` : ''}</div>`).join('')}
        ${transferSummary(rec, c)}${!items.length && !rec.bot ? '<div class="nomatch"><b>Listening</b><div>Suggestions appear here as the caller speaks.</div></div>' : ''}</div>`;
    } else if (mode === 'feedback') {
      const arts = []; c.shown.forEach((x) => { if (x.article && !arts.some((a) => a.id === x.article.id)) arts.push({ ...x.article, hl: x.hl }); });
      const left = arts.filter((a) => !c.fb[a.id]);
      html = `<div class="fb-h">Would you like to provide feedback for the articles below?</div>${left.map((a) => `<div class="kcard fbc ${c.fbSel === a.id ? 'sel' : ''}" data-fbsel="${a.id}"><div class="kt"><span>${ic('kbdoc', 'sm')}</span><a data-kbopen="${a.id}">${esc(a.title)}</a>${thumbs(c, a.id)}</div><p>${hl(a.text, a.hl)}</p><div class="fbb"><button class="btn navy" data-fb="send" data-kb="${a.id}">Provide Feedback</button><button class="btn" data-fb="dismiss" data-kb="${a.id}">Dismiss</button></div></div>`).join('') || `<div class="nomatch"><b>${arts.length ? 'Thanks for your feedback' : 'No articles were suggested'}</b></div>`}`;
    }
    const sc = box.scrollTop; box.innerHTML = html; box.scrollTop = mode === 'live' ? 0 : sc;
    const kf = $('#kForm'); if (kf) kf.onsubmit = (e) => { e.preventDefault(); c.kq = $('#kQ').value.trim(); c.kres = null; if (c.kq) kbSearch(c, c.kq); else paintAssist(); };
    if (mode === 'live' && c.pill && !c.pillT) c.pillT = setTimeout(() => { c.pill = 0; c.pillT = null; paintAssist(); }, 3500);
  }
  async function kbSearch(c, q) { const words = String(q || '').toLowerCase(); const all = S.kbCache || []; c.kres = all.filter((k) => words && `${k.title} ${k.summary} ${k.category}`.toLowerCase().includes(words)); paintAssist(); }
  function sidePanel(side, rec, t) {
    const head = (title) => `<div class="side-h">${esc(title)}</div>`;
    if (side === 'learn') return `${head('Learning')}${(S.kbCache || []).slice(0, 6).map((k) => `<div class="kcard"><div class="kt"><span>${ic('kbdoc', 'sm')}</span><a data-kbopen="${k.id}">${esc(k.title)}</a></div><p>${esc(k.category)}</p></div>`).join('')}`;
    if (side === 'attach') return `${head('Attachments')}<div class="nomatch"><b>No attachments</b><div>Files added to this interaction appear here.</div></div>`;
    if (side === 'details') return `${head('Record details')}<div class="ixmeta">${[['Opened', fmtDT(rec.opened)], ['Phone', rec.phone], ['Queue', rec.queue], ['Intent', rec.intent], ['Conversation', rec.conversationId]].map(([k, v]) => `<div><span>${k}</span><b>${esc(v || '-')}</b></div>`).join('')}</div>${t ? `<button class="btn" data-c="opentp" style="margin-top:10px">Open taxpayer record</button>` : ''}`;
    if (side === 'script') return `${head('Script')}${rec.bot ? botCard(rec.bot) + `<div class="transcript" style="padding:8px 0">${botLines({ ...rec.bot, caller: t?.firstName })}</div>` : '<div class="nomatch"><b>No script</b><div>The Genesys Cloud script for this queue appears here.</div></div>'}`;
    return `${head('Images')}<div class="nomatch"><b>No images</b></div>`;
  }

  function paintWrap() {
    const box = $('#imsWrap'); if (!box) return; const { c } = imsCtx();
    if (!c || !c.wrap) { box.innerHTML = ''; return; }
    const w = c.wrap;
    box.innerHTML = `<div class="wrapdock ${w.big ? 'big' : ''}"><div class="wd-h"><b>Wrap up</b><span data-c="wbig" title="${w.big ? 'Collapse' : 'Expand'}">${ic('expand', 'sm')}</span></div>
      <div class="wd-b"><label>Wrap up timer</label><div><span class="wtimer wrap-clock" data-c="${c.id}">${clock(Date.now() - w.startedAt)}</span></div>
      <label>Wrap up code <span class="req">*</span></label><select id="wdCode" class="${w.code ? 'ok' : ''}"><option value="">-- None --</option>${UI().wrapCodes.map((x) => `<option ${w.code === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>
      <label>Notes</label><textarea id="wdNotes" title="Enter a label" placeholder="">${esc(w.notes)}</textarea></div>
      <div class="wd-f"><button class="btn teal" id="wdOk" ${w.code ? '' : 'disabled'}>Submit &amp; close</button></div></div>`;
    $('#wdCode').onchange = (e) => { w.code = e.target.value; e.target.classList.toggle('ok', !!w.code); $('#wdOk').disabled = !w.code; };
    $('#wdNotes').oninput = (e) => { w.notes = e.target.value; };
    $('#wdOk').onclick = () => submitWrap(c);
  }
  function paintToast() {
    const box = $('#imsToast'); if (!box) return; const { c } = imsCtx();
    box.innerHTML = c && c.toast ? `<div class="adh">${ic('info', 'sm')}<span>${esc(UI().adherenceText)}</span><span class="x" data-c="toastx" title="Close">${ic('x', 'sm')}</span><i class="adhbar"></i></div>` : '';
  }

  function hangUp(c) {
    if (!c || c.phase !== 'active') return;
    clearTimeout(c.aTimer); c.phase = 'wrapup'; c.endedAt = Date.now(); c.assist = 'feedback'; c.events.push({ at: Date.now(), who: 'system', text: 'Agent has left.' });
    const t = S.ims[c.id]?.taxpayerId ? S.records[S.ims[c.id].taxpayerId] : null;
    c.wrap = { startedAt: Date.now(), code: '', notes: t && S.interaction?.outcomes?.length ? S.interaction.outcomes.map((o) => o.text).join('. ') + '.' : '', big: false };
    S.menu = null; shell(); renderPage();
  }
  async function submitWrap(c) {
    const rec = S.ims[c.id]; const t = rec.taxpayerId ? S.records[rec.taxpayerId] : null;
    const contact = rec.contact || 'Caller'; const agent = S.user.name;
    const lines = [];
    if (rec.bot) rec.bot.transcript.filter((l) => l.who !== 'event').forEach((l) => lines.push({ time: hhmm(Date.parse(rec.bot.date + 'Z') ? c.accepted - 60000 : c.accepted), who: l.who === 'bot' ? rec.bot.botName : contact, text: l.text }));
    c.events.forEach((e) => lines.push({ time: hhmm(e.at), who: e.who === 'system' ? 'system' : e.who === 'agent' ? agent : contact, text: e.text }));
    const wrap = c.wrap; c.wrap = null; c.phase = 'unavailable'; c.assist = 'awaiting'; paintWrap(); paintCard(); paintAssist();
    const feedback = Object.entries(c.votes).map(([kb, vote]) => ({ kb, vote, sent: c.fb[kb] === 'sent' }));
    const out = await act(() => api(`/api/ims/${c.id}/close`, { method: 'POST', body: { wrapCode: wrap.code, notes: wrap.notes, transcript: lines, feedback, assignedTo: agent, durationSec: Math.floor((c.endedAt - c.connectedAt) / 1000), verified: rec.verified } }));
    S.ims[c.id] = out; if (S.call === c.id) S.call = null; S.interaction = null;
    if (t) { await loadTp(t.id, true); S.imsHist && (S.imsHist[t.id] = null); }
    setTimeout(() => { c.phase = 'closed'; shell(); renderPage(); }, 1300);
  }

  async function imsClicks(e) {
    const { rec, c, t } = imsCtx();
    const dt = e.target.closest('[data-dtmf]'); if (dt) { e.stopPropagation(); c.keypad += dt.dataset.dtmf; $('.keypad .kd').textContent = c.keypad; return; }
    const side = e.target.closest('[data-side]'); if (side) { S.imsUi.side = S.imsUi.side === side.dataset.side && side.dataset.side !== 'assist' ? 'assist' : side.dataset.side; $$('.ims-rail button').forEach((b) => b.classList.toggle('on', b.dataset.side === S.imsUi.side)); return paintAssist(); }
    const v = e.target.closest('[data-vote]'); if (v) { e.stopPropagation(); const k = v.dataset.kb; c.votes[k] = c.votes[k] === v.dataset.vote ? undefined : v.dataset.vote; return paintAssist(); }
    const fb = e.target.closest('[data-fb]'); if (fb) { e.stopPropagation(); c.fb[fb.dataset.kb] = fb.dataset.fb === 'send' ? 'sent' : 'dismissed'; if (fb.dataset.fb === 'send') toast('Feedback sent. Thank you.'); return paintAssist(); }
    const fs = e.target.closest('[data-fbsel]'); if (fs && !e.target.closest('a')) { c.fbSel = fs.dataset.fbsel; return paintAssist(); }
    const ko = e.target.closest('[data-kbopen]'); if (ko) { const k = (S.kbCache || []).find((x) => x.id === ko.dataset.kbopen) || await api(`/api/kb/${ko.dataset.kbopen}`); return modal(`${ic('book')} ${esc(k.title)}`, `<div class="small muted">${esc(k.id)} · ${esc(k.category)}</div><p style="line-height:1.55">${esc(k.summary)}</p>${k.body ? `<p style="line-height:1.55">${esc(k.body)}</p>` : ''}${k.url ? `<p><a href="${esc(k.url)}" target="_blank" rel="noopener">${esc(k.url)}</a></p>` : ''}`, `${t ? `<button class="btn" id="kSend">Send to taxpayer</button>` : ''}<button class="btn primary" data-close>Close</button>`, { wide: true }) && t && ($('#kSend').onclick = () => composeModal(t, k.id)); }
    const hgo = e.target.closest('[data-hgo]'); if (hgo) { const [kind, id] = hgo.dataset.hgo.split(':'); if (kind === 'ims') return go(`#/ims/${id}`); if (kind === 'case') return openCase(id); if (kind === 'notice') return openTaxpayer(t.id, 'notices'); if (kind === 'bot') return tpClicks({ target: Object.assign(document.createElement('span'), { dataset: { a: 'botview', arg: id } }), stopPropagation() {} }, t); }
    const hf = e.target.closest('[data-hf]'); if (hf) { e.stopPropagation(); S.imsUi.hf = hf.dataset.hf; S.menu = null; return paintHist(); }
    const h = e.target.closest('[data-h]');
    if (h) { e.stopPropagation(); const k = h.dataset.h; if (k === 'search') { S.imsUi.hsearch = !S.imsUi.hsearch; if (!S.imsUi.hsearch) S.imsUi.hq = ''; paintHist(); $('#hQ')?.focus(); } if (k === 'filter') { S.menu = S.menu === 'hfilter' ? null : 'hfilter'; paintHist(); } if (k === 'cal') { S.imsUi.h30 = !S.imsUi.h30; paintHist(); } return; }
    if (e.target.closest('[data-a]')) { if (t) { S.menu = null; tpClicks(e, t); paintHead(); } return; }
    const b = e.target.closest('[data-c]'); if (!b) { if (S.menu) { S.menu = null; paintCard(); paintHead(); paintHist(); } return; }
    e.stopPropagation();
    const k = b.dataset.c;
    const menuToggle = (m, paint) => { S.menu = S.menu === m ? null : m; paint(); };
    const acts = {
      recmenu: () => menuToggle('rec', paintCard), rec: () => { c.rec = !c.rec; S.menu = null; paintCard(); toast(c.rec ? 'Recording resumed' : 'Recording paused'); },
      mute: () => { c.muted = !c.muted; paintCard(); }, hold: () => { c.held = !c.held; paintCard(); }, keypadmenu: () => menuToggle('keypad', paintCard), flag: () => { c.flagged = !c.flagged; paintCard(); if (c.flagged) toast('Interaction flagged for your supervisor'); },
      transfer: () => transferModal(c), hangup: () => hangUp(c),
      toastx: () => { c.toast = false; paintToast(); },
      summary: () => { c.summaryOpen = !c.summaryOpen; paintAssist(); }, pill: () => { c.pill = 0; $('#imsAssist').scrollTop = 0; paintAssist(); },
      kclear: () => { c.kq = ''; c.kres = c.assist === 'related' ? [] : null; paintAssist(); },
      wbig: () => { c.wrap.big = !c.wrap.big; paintWrap(); },
      collapse: () => { S.imsUi.collapsed = !S.imsUi.collapsed; paintForm(); },
      more: () => menuToggle('imsmore', paintHead), opentp: () => t && openTaxpayer(t.id), refunds: () => t && openTaxpayer(t.id, 'refunds'),
      copy: () => { navigator.clipboard?.writeText(rec.number).catch(() => {}); S.menu = null; paintHead(); toast(`${esc(rec.number)} copied`); },
      save: async () => { await act(() => api(`/api/ims/${rec.id}`, { method: 'PATCH', body: { shortDescription: fieldVal('imsSd') || rec.shortDescription } }), 'Record saved'); rec.shortDescription = fieldVal('imsSd') || rec.shortDescription; paintHead(); },
      close: () => { if (c && c.phase === 'active') return hangUp(c); if (c && c.wrap) return $('#wdCode')?.focus(); },
      case: () => t ? caseModalIms(t, rec) : toast('Add a contact first'), incident: () => incidentModal(rec, t), callback: () => callbackModal(rec, t),
      'info-user': () => { const u = S.users.find((x) => x.name === rec.assignedTo); toast(u ? `${esc(u.name)} · ${esc(u.role)} · ${esc(u.group)}` : esc(rec.assignedTo || 'Unassigned')); },
      'find-user': () => toast('Assignment is set by Genesys Cloud routing'),
      'info-account': () => t && previewTp(t), 'info-contact': () => t && previewTp(t),
      'find-account': () => go('#/list/taxpayers'), 'find-contact': () => go('#/list/taxpayers'),
    };
    (acts[k] || (() => {}))();
  }
  function previewTp(t) {
    modal(`${ic('user')} ${esc(t.fullName)}`, `<div class="kv c3"><div><label>TIN</label><div class="v">${esc(t.tin)}</div></div><div><label>Phone</label><div class="v">${esc(t.phones[0]?.number || '')}</div></div><div><label>Email</label><div class="v">${esc(t.email || '-')}</div></div><div><label>Address</label><div class="v">${esc(t.address.line)}, ${esc(t.address.city)}</div></div><div><label>Identity</label><div class="v">${esc(t.identity.status)}</div></div><div><label>Balance</label><div class="v">${money(t.balance)}</div></div></div><div class="flags" style="margin-top:10px">${t.flags.map((f) => `<span class="tag2 blue">${esc(f)}</span>`).join('')}</div>`, `<button class="btn" data-close>Close</button><button class="btn primary" id="pvOpen">Open record</button>`);
    $('#pvOpen').onclick = () => { closeModal(); openTaxpayer(t.id); };
  }
  function transferModal(c) {
    modal(`${ic('arrow')} Transfer`, `<div class="f"><label>Transfer to</label><select id="xT">${['Taxpayer Services - Notices', 'Individual Income Tax', 'Business Tax', 'Identity Protection', 'Collections', ...S.users.filter((u) => u.id !== S.user.id).map((u) => u.name)].map((x) => `<option>${esc(x)}</option>`).join('')}</select></div><div class="f"><label>Type</label><select id="xK"><option>Blind transfer</option><option>Consult transfer</option></select></div>`, `<button class="btn" data-close>Cancel</button><button class="btn primary" id="xOk">Transfer</button>`);
    $('#xOk').onclick = () => { const to = fieldVal('xT'); const kind = fieldVal('xK'); closeModal(); if (kind === 'Consult transfer') return toast(`Consulting ${esc(to)}…`); c.events.push({ at: Date.now(), who: 'system', text: `Transferred to ${to}.` }); toast(`Transferred to ${esc(to)}`); hangUp(c); };
  }
  function callbackModal(rec, t) {
    const d = new Date(Date.now() + 864e5); const def = `${d.toISOString().slice(0, 10)}T10:00`;
    modal(`${ic('phone')} Genesys Schedule Callback`, `<div class="frow"><div class="f"><label>Callback number</label><input id="cbN" value="${esc(rec.phone)}"></div><div class="f"><label>Date and time</label><input id="cbD" type="datetime-local" value="${def}"></div></div><div class="f"><label>Queue</label><input id="cbQ" value="${esc(rec.queue || 'Individual Income Tax')}"></div><div class="f"><label>Notes</label><textarea id="cbX"></textarea></div>`, `<button class="btn" data-close>Cancel</button><button class="btn primary" id="cbOk">Schedule</button>`);
    $('#cbOk').onclick = async () => { if (t) await api(`/api/taxpayers/${t.id}/activities`, { method: 'POST', body: { type: 'Callback', direction: 'Outbound', subject: `Callback scheduled for ${fmtDT(fieldVal('cbD'))}`, text: `${fieldVal('cbN')} · ${fieldVal('cbQ')}. ${fieldVal('cbX')}`, by: S.user.name } }); closeModal(); toast(`Callback scheduled in Genesys Cloud for ${esc(fmtDT(fieldVal('cbD')))}`); if (t) outcome(t, `Scheduled a callback for ${fmtDT(fieldVal('cbD'))}`); };
  }
  function incidentModal(rec, t) {
    modal(`${ic('wrench')} Create Incident`, `<div class="f"><label>Short description</label><input id="inS" value="${esc(rec.shortDescription)}"></div><div class="frow"><div class="f"><label>Category</label><select id="inC"><option>Inquiry / Help</option><option>Online services</option><option>Payment processing</option><option>Correspondence</option></select></div><div class="f"><label>Priority</label><select id="inP"><option>2 - High</option><option>3 - Moderate</option><option selected>4 - Low</option></select></div></div><div class="f"><label>Description</label><textarea id="inD"></textarea></div>`, `<button class="btn" data-close>Cancel</button><button class="btn primary" id="inOk">Submit</button>`);
    $('#inOk').onclick = async () => { const inc = await act(() => api('/api/incidents', { method: 'POST', body: { taxpayerId: t?.id || '', shortDescription: fieldVal('inS'), category: fieldVal('inC'), priority: fieldVal('inP'), by: S.user.name, ims: rec.number } })); closeModal(); toast(`Incident ${esc(inc.id)} created`); if (t) outcome(t, `Created incident ${inc.id}`); };
  }
  async function caseModalIms(t, rec) {
    await caseModal(t, `General inquiry|${rec.shortDescription}`);
    const ok = $('#cOk'); if (!ok) return; const orig = ok.onclick;
    ok.onclick = async () => {
      const c = await act(() => api('/api/cases', { method: 'POST', body: { taxpayerId: t.id, shortDescription: fieldVal('cSd') || fieldVal('cSub'), category: fieldVal('cCat'), subcategory: fieldVal('cSub'), priority: fieldVal('cP'), group: fieldVal('cG'), assignedTo: S.user.name, channel: rec.type, note: fieldVal('cN'), by: S.user.name } }));
      S.ims[rec.id] = await api(`/api/ims/${rec.id}`, { method: 'PATCH', body: { caseNumber: c.number } });
      outcome(t, `Opened case ${c.number}`); closeModal(); toast(`Case ${esc(c.number)} created`); await loadTp(t.id, true); paintForm(); paintHist();
      void orig;
    };
  }

  // ---------------------------------------------------------------- screen pop handling
  async function handlePop(params, source = 'url') {
    const g = (k) => clean(params.get ? params.get(k) : params[k]);
    let phone = (g('phone') || g('ani') || g('callerId') || '').replace(/^tel:|^sip:/i, '').replace(/@.*/, '');
    let conversationId = g('conversationId') || g('gcConversationId') || g('interactionId');
    if (g('scenario')) {
      try { const r = await api(`/api/bot-scenarios/${encodeURIComponent(g('scenario'))}/run`, { method: 'POST', body: { push: false, phone, conversationId } }); conversationId = r.session.conversationId; phone = phone || r.session.phone; } catch (e) { toast(`Scenario: ${esc(e.message)}`, { cls: 'genesys' }); }
    }
    let customerName = g('customerName'); let lookedUpQueue = '';
    if (!phone && !g('taxpayerId') && !g('returnId') && !g('last4') && conversationId && S.config.genesysLookup) {
      try { const c = await api(`/api/genesys/conversations/${encodeURIComponent(conversationId)}`); phone = c.phone; customerName = customerName || c.customerName; lookedUpQueue = c.queue; } catch (e) { toast(`Genesys lookup failed: ${esc(e.message)}`, { cls: 'genesys' }); }
    }
    const ix = { startedAt: Date.now(), phone: fmtPhone(phone), conversationId, direction: g('direction') || 'Inbound', queue: g('queue') || lookedUpQueue, mediaType: g('mediaType') || 'voice', intent: g('intent'), customerName, verified: false, source, outcomes: [], gates: {}, tIdx: 0, ltab: 'interaction' };
    if (conversationId) {
      const bs = await api(`/api/bot-sessions?conversationId=${encodeURIComponent(conversationId)}`).catch(() => []);
      if (bs[0]) { ix.bot = bs[0]; ix.intent = ix.intent || bs[0].intent; ix.queue = ix.queue || bs[0].queue; ix.ltab = 'transcript'; }
    }
    let matches = []; let matchedOn = '';
    if (!g('taxpayerId') && !phone && ix.bot?.taxpayerId) { matches = [await api(`/api/taxpayers/${ix.bot.taxpayerId}`)]; matchedOn = `${ix.bot.botName} virtual agent`; }
    else if (g('taxpayerId')) { matches = [await api(`/api/taxpayers/${g('taxpayerId')}`).catch(() => null)].filter(Boolean); matchedOn = phone ? `phone ${fmtPhone(phone)}` : 'taxpayer ID'; }
    else if (g('returnId')) { matches = await api(`/api/taxpayers?returnId=${encodeURIComponent(g('returnId'))}`); matchedOn = `return ${g('returnId')}`; }
    else if (phone) { matches = await api(`/api/taxpayers?phone=${encodeURIComponent(phone)}${g('last4') ? `&last4=${g('last4')}` : ''}`); matchedOn = `phone ${fmtPhone(phone)}`; }
    else if (g('last4') || g('lastName')) { matches = await api(`/api/taxpayers?${new URLSearchParams({ last4: g('last4'), lastName: g('lastName') })}`); matchedOn = 'name / SSN'; }
    ix.matchedOn = matchedOn;
    const tab = g('tab') || (/pay|plan|balance|bill/i.test(ix.intent) ? 'balances' : /refund/i.test(ix.intent) ? 'overview' : /notice|letter/i.test(ix.intent) ? 'notices' : 'overview');
    if (phone || conversationId || matches.length) S.interaction = ix;
    const v3 = (g('view') || S.settings.popView || 'interaction') !== 'taxpayer' && ix.mediaType === 'voice';
    if (matches.length === 1) {
      ix.taxpayerId = matches[0].id; const t = await loadTp(matches[0].id, true);
      if (v3) { note(ix, t.fullName); return openCall(ix, g('imsId')); }
      if (script(t, ix)) ix.ltab = 'transcript'; advanceTranscript(t); return openTaxpayer(t.id, tab);
    }
    S.popResult = { matches, ix, tab, v3, imsId: g('imsId') }; go('#/pop-results');
  }
  function note(ix, name) { S.notes = S.notes || []; S.notes.unshift({ text: `${ix.mediaType === 'voice' ? 'Call' : 'Chat'} from ${name || ix.phone || 'caller'}${ix.queue ? ` · ${ix.queue}` : ''}`, when: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }), go: ix.imsId ? `#/ims/${ix.imsId}` : '#/genesys' }); }
  function pagePopResults(el) {
    const r = S.popResult; if (!r) return go('#/home');
    const ix = r.ix;
    el.innerHTML = `<div class="page narrow"><div class="callout">${ic('phone', 'sm')} Genesys Cloud ${esc(ix.direction.toLowerCase())} ${ix.mediaType === 'voice' ? 'call' : esc(ix.mediaType)} · <b>${esc(ix.phone || 'No caller ID')}</b>${ix.queue ? ` · ${esc(ix.queue)}` : ''}${ix.intent ? ` · intent: ${esc(ix.intent)}` : ''}</div>
      ${r.matches.length > 1 ? `<h2 style="margin:6px 0">${r.matches.length} taxpayers match ${esc(ix.matchedOn)}</h2><p class="muted" style="margin-top:0">Ask which taxpayer the caller is calling about, then verify identity.</p>
        ${r.matches.map((p) => `<div class="match-card" data-pick="${p.id}">${avatar(p.fullName, 'lg', p.id)}<div style="flex:1"><b>${esc(p.fullName)}</b><div class="small">${esc(p.type)} · TIN ${esc(p.tin)} · ${esc(p.city)}</div>${p.flags?.length ? `<div class="small amber">${esc(p.flags.join(' · '))}</div>` : ''}</div><button class="btn primary">Select</button></div>`).join('')}`
      : `<h2 style="margin:6px 0">No taxpayer found for ${esc(ix.matchedOn || 'this interaction')}</h2><p class="muted" style="margin-top:0">Search by name, SSN last 4 or return ID, or create a new contact.</p>
        <div style="display:flex;gap:8px"><button class="btn primary" data-go="#/register${ix.phone ? `?phone=${encodeURIComponent(ix.phone)}` : ''}">New contact</button><button class="btn" data-go="#/list/taxpayers">Browse taxpayers</button></div>`}</div>`;
    el.onclick = async (e) => { const p = e.target.closest('[data-pick]'); if (p) { S.interaction && (S.interaction.taxpayerId = p.dataset.pick); const t = await loadTp(p.dataset.pick, true); if (r.v3 && S.interaction) { if (r.imsId) await api(`/api/ims/${r.imsId}`, { method: 'PATCH', body: { taxpayerId: t.id, account: t.businessName || t.fullName, contact: t.fullName } }); return openCall(S.interaction, r.imsId); } advanceTranscript(t); return openTaxpayer(p.dataset.pick, r.tab); } };
  }

  function connectSSE() {
    if (S.sse) S.sse.close();
    if (!S.user || !window.EventSource) return;
    const agent = (S.settings.agentEmail || S.user.email || '').toLowerCase();
    S.sse = new EventSource(`/api/screenpop/events?${new URLSearchParams({ agent, userId: S.user.id })}`);
    S.sse.addEventListener('hello', () => { S.sseOn = true; const d = $('#sseDot'); if (d) d.classList.add('on'); });
    S.sse.onerror = () => { S.sseOn = false; const d = $('#sseDot'); if (d) d.classList.remove('on'); };
    S.sse.addEventListener('screenpop', async (ev) => {
      const pop = JSON.parse(ev.data);
      const params = { phone: pop.phone, conversationId: pop.conversationId, direction: pop.direction, queue: pop.queue, mediaType: pop.mediaType, intent: pop.intent, customerName: pop.customerName, tab: pop.tab, ...(pop.taxpayerIds.length === 1 ? { taxpayerId: pop.taxpayerIds[0] } : {}) };
      const names = await Promise.all(pop.taxpayerIds.slice(0, 3).map((id) => loadTp(id).then((c) => c.fullName).catch(() => id)));
      if (S.settings.ringInbox && !S.embed) {
        const ims = await api('/api/ims', { method: 'POST', body: { taxpayerId: params.taxpayerId || '', phone: pop.phone, conversationId: pop.conversationId, queue: pop.queue, intent: pop.intent, mediaType: pop.mediaType, botSessionId: pop.botSessionId || '', customerName: pop.customerName, assignedTo: S.user.name } }).catch(() => null);
        if (ims) params.imsId = ims.id;
        S.inbox.push({ id: pop.id, imsNumber: ims ? ims.number : '', name: names.length === 1 ? names[0] : names.length ? `${names.length} possible matches` : (pop.customerName || 'Unknown caller'), phone: pop.phone, queue: pop.queue, intent: pop.intent, mediaType: pop.mediaType, remaining: (S.brand.ui && S.brand.ui.acceptSeconds) || 55, params });
        S.inboxOpen = true; render();
      } else if (S.settings.autoPop) { toast(`<b>Screen pop: ${esc(pop.phone || 'interaction')}</b><div class="small">${names.length ? esc(names.join(', ')) : 'No matching taxpayer'}${pop.queue ? ` · ${esc(pop.queue)}` : ''}</div>`, { cls: 'genesys', ms: 5000 }); handlePop(params, 'push'); }
      else toast(`<b>Incoming ${pop.mediaType === 'voice' ? 'call' : esc(pop.mediaType)}: ${esc(pop.phone)}</b><div class="small">${names.length ? esc(names.join(', ')) : 'No matching taxpayer'}</div><div class="actions"><button class="btn sm primary" data-act="open">Open</button><button class="btn sm" data-act="dismiss">Dismiss</button></div>`, { cls: 'genesys', sticky: true, on: (a) => { if (a === 'open') handlePop(params, 'push'); } });
    });
  }

  // ---------------------------------------------------------------- boot
  function applyTheme(b) {
    const pal = S.settings.palette || (b.ui && b.ui.palette) || 'workspace';
    document.body.classList.toggle('brand-palette', pal === 'brand');
    const t = pal === 'brand' ? (b.theme || {}) : {}; const r = document.documentElement.style;
    [['--nav', t.nav], ['--nav-text', t.navText], ['--accent', t.accent], ['--accent-soft', t.accentSoft], ['--hl', t.highlight], ['--rail-top', t.railTop], ['--rail-mid', t.railTop], ['--rail-bottom', t.railBottom]].forEach(([k, v]) => (v ? r.setProperty(k, v) : r.removeProperty(k)));
    document.title = `${b.shortName || b.agency} | ${b.workspaceName || 'Workspace'}`;
  }
  async function boot() {
    const qp = new URLSearchParams(location.search);
    S.embed = qp.get('embed') === '1' || (window.self !== window.top && qp.get('embed') !== '0');
    if (qp.get('agent')) { S.settings.agentEmail = clean(qp.get('agent')); saveSettings(); }
    try {
      if (qp.get('brand')) await api('/api/admin/reset', { method: 'POST', body: { brand: qp.get('brand') } }).catch(() => {});
      const [config, users, kb] = await Promise.all([api('/api/config'), api('/api/users'), api('/api/kb')]);
      Object.assign(S, { config, brand: config.brand, users, today: config.today, kbCache: kb }); window.MOCK_TODAY = config.today;
      applyTheme(config.brand);
      if (S.user && !users.some((u) => u.id === S.user.id && u.email === S.user.email)) { S.user = users.find((u) => u.id === S.user.id) || null; store.set('user', S.user); }
    } catch (e) { $('#root').innerHTML = `<div style="padding:40px">Cannot reach the workspace server: ${esc(e.message)}</div>`; return; }
    await Promise.all(S.tabs.filter((t) => t.kind === 'tp').map((t) => loadTp(t.id).catch(() => { S.tabs = S.tabs.filter((x) => x !== t); })));
    const isPop = location.pathname.replace(/\/$/, '') === '/pop' || ['phone', 'ani', 'taxpayerId', 'returnId', 'conversationId', 'gcConversationId'].some((k) => clean(qp.get(k)));
    if (isPop && !S.user) { S.user = S.users.find((u) => u.persona === (qp.get('persona') || 'agent')) || S.users[0]; store.set('user', S.user); }
    window.addEventListener('hashchange', render);
    connectSSE();
    if (isPop) {
      const keep = new URLSearchParams(); if (qp.get('embed')) keep.set('embed', qp.get('embed'));
      history.replaceState(null, '', `/${keep.toString() ? '?' + keep : ''}`);
      await handlePop(qp, 'url');
    } else render();
  }
  boot();
})();
