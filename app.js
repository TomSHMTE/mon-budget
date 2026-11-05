/* Mon Budget — interface. Données stockées uniquement sur ce téléphone (localStorage). */
(function () {
  'use strict';
  var B = window.Budget;
  var state = load();
  var ui = { route: 'home', tab: 'courantes', dettes: 'owed' };
  var sheetDanger = null;
  var SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

  /* ---------- stockage ---------- */
  function load() {
    try {
      var raw = localStorage.getItem(B.KEY);
      if (raw) { var s = JSON.parse(raw); if (s && s.v === 1 && s.months) return migrate(s); }
    } catch (e) { /* données illisibles : on repart des données de départ */ }
    var seeded = B.seed();
    try { localStorage.setItem(B.KEY, JSON.stringify(seeded)); } catch (e2) { /* ignoré */ }
    return seeded;
  }
  function migrate(s) {
    Object.keys(s.months).forEach(function (k) {
      var c = s.months[k].courses;
      if (c) { delete c.ok; (c.items || []).forEach(function (it) { if (it.ok === undefined) it.ok = false; }); }
    });
    return s;
  }
  function save() {
    try { localStorage.setItem(B.KEY, JSON.stringify(state)); }
    catch (e) { toast('Enregistrement impossible sur ce téléphone'); }
  }
  function emptyState() {
    var d = new Date();
    var key = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2);
    var s = { v: 1, current: key, view: { month: key }, months: {}, epargne: { balance: 0, goal: null, moves: [] }, dettes: { owed: [], owe: [] } };
    s.months[key] = { initial: 0, revenus: [], fixes: [], courantes: [], courses: { budget: 0, items: [] } };
    return s;
  }

  /* ---------- petits outils ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function cls(n) { return n < 0 ? 'coral' : ''; }
  function toast(msg) {
    var old = document.getElementById('toast');
    if (old) old.remove();
    var t = document.createElement('div');
    t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.remove(); }, 2600);
  }
  function monthKeys() { return Object.keys(state.months).sort(); }
  function curM() { return state.months[state.view.month]; }
  function find(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function remove(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) { list.splice(i, 1); return; } }

  var I = {
    home: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
    budget: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10"/></svg>',
    histo: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 20V10M12 20V4M19 20v-7"/></svg>',
    epargne: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 3v18M7 8c0-2 2-3 5-3s5 1 5 3-2 3-5 4-5 2-5 4 2 3 5 3 5-1 5-3"/></svg>',
    dettes: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6M16 5a3.5 3.5 0 0 1 0 6.5M18 14c2.5.6 4 2.6 4 6"/></svg>',
    plus: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    pen: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
    check: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>',
    clock: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    left: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    right: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
    gear: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>'
  };

  /* ---------- rendu ---------- */
  function render() {
    var main = document.getElementById('main');
    var keep = main ? main.scrollTop : 0;
    var keepKey = ui.route + ':' + ui.tab + ':' + state.view.month;
    var html = headerHtml() + '<main id="main">' + bodyHtml() + '</main>' + (ui.route === 'budget' ? sumbarHtml() : '') + navHtml();
    document.getElementById('app').innerHTML = html;
    var m2 = document.getElementById('main');
    if (m2 && render.lastKey === keepKey) m2.scrollTop = keep;
    render.lastKey = keepKey;
  }

  function headerHtml() {
    var mk = state.view.month;
    var isCur = mk === state.current;
    if (ui.route === 'home') {
      var ks = monthKeys(), i = ks.indexOf(mk);
      return '<header class="top"><div class="top-row">' +
        '<button class="icon-btn" data-act="month-prev" aria-label="Mois précédent"' + (i <= 0 ? ' disabled style="opacity:.3"' : '') + '>' + I.left + '</button>' +
        '<div style="font-size:18px;font-weight:700;text-transform:capitalize">' + esc(B.monthLabel(mk)) + '</div>' +
        '<button class="icon-btn" data-act="month-next" aria-label="Mois suivant"' + (i >= ks.length - 1 ? ' disabled style="opacity:.3"' : '') + '>' + I.right + '</button>' +
        '<div class="grow"></div>' +
        '<button class="icon-btn" data-act="settings" aria-label="Réglages">' + I.gear + '</button>' +
        '<button class="btn plus" data-act="add" aria-label="Ajouter une opération">' + I.plus + '</button></div></header>';
    }
    if (ui.route === 'budget') {
      var tabs = [['courantes', 'Courantes'], ['fixes', 'Fixes'], ['revenus', 'Revenus'], ['courses', 'Courses']];
      return '<header class="top"><div class="top-row"><div class="grow"><div class="eyebrow" style="text-transform:capitalize">' + esc(B.monthLabel(mk)) + '</div><h1>Budget</h1></div>' +
        (isCur ? '<button class="btn" data-act="next-month">Mois suivant ' + I.right.replace('20', '16').replace('20', '16') + '</button>' : '<button class="btn" data-act="go-current">Mois en cours</button>') +
        '<button class="btn plus" data-act="add" aria-label="Ajouter une opération">' + I.plus + '</button></div>' +
        '<div class="seg" role="tablist">' + tabs.map(function (t) {
          return '<button role="tab" aria-selected="' + (ui.tab === t[0]) + '" class="' + (ui.tab === t[0] ? 'on' : '') + '" data-act="tab" data-v="' + t[0] + '">' + t[1] + '</button>';
        }).join('') + '</div></header>';
    }
    var titles = { histo: ['Enregistré à chaque passage au mois suivant', 'Historique'], epargne: ['Mise de côté', 'Épargne'], dettes: ['Qui doit quoi', 'Dettes'] };
    var t = titles[ui.route];
    var extra = ui.route === 'histo' ? '<button class="icon-btn" data-act="settings" aria-label="Réglages">' + I.gear + '</button>' : '<button class="btn plus" data-act="add" aria-label="Ajouter une opération">' + I.plus + '</button>';
    return '<header class="top"><div class="top-row"><div class="grow"><div class="eyebrow">' + t[0] + '</div><h1>' + t[1] + '</h1></div>' + extra + '</div>' +
      (ui.route === 'dettes' ? '<div class="seg"><button class="' + (ui.dettes === 'owed' ? 'on' : '') + '" data-act="dettes-tab" data-v="owed">On me doit</button><button class="' + (ui.dettes === 'owe' ? 'on' : '') + '" data-act="dettes-tab" data-v="owe">Je dois</button></div>' : '') + '</header>';
  }

  function navHtml() {
    var items = [['home', 'Accueil'], ['budget', 'Budget'], ['histo', 'Historique'], ['epargne', 'Épargne'], ['dettes', 'Dettes']];
    return '<nav class="tabs" aria-label="Navigation">' + items.map(function (it) {
      return '<button class="' + (ui.route === it[0] ? 'on' : '') + '" data-act="route" data-v="' + it[0] + '"' + (ui.route === it[0] ? ' aria-current="page"' : '') + '>' + I[it[0]] + it[1] + '</button>';
    }).join('') + '</nav>';
  }

  function sumbarHtml() {
    var t = B.totals(curM());
    return '<div class="sumbar"><div><div class="label-xs">État théorique</div><b class="' + cls(t.theo) + '">' + B.fmt(t.theo) + '</b></div>' +
      '<div><div class="label-xs">État à jour</div><b class="' + (t.jour < 0 ? 'coral' : 'lime') + '">' + B.fmt(t.jour) + '</b></div></div>';
  }

  function bodyHtml() {
    if (ui.route === 'home') return homeHtml();
    if (ui.route === 'budget') return budgetHtml();
    if (ui.route === 'histo') return histoHtml();
    if (ui.route === 'epargne') return epargneHtml();
    return dettesHtml();
  }

  /* ---------- accueil ---------- */
  function chartBars(keys) {
    var data = keys.map(function (k) { var t = B.totals(state.months[k]); return { k: k, rev: t.rev, spent: t.spent }; });
    var max = 1;
    data.forEach(function (d) { max = Math.max(max, d.rev, d.spent); });
    var W = 342, base = 125, h = 110, gw = W / data.length, bw = Math.min(26, gw / 2 - 6);
    var out = '<svg viewBox="0 0 342 150" width="100%" role="img" aria-label="Revenus et dépenses par mois : ' +
      data.map(function (d) { return B.monthName(d.k) + ' ' + Math.round(d.rev) + ' et ' + Math.round(d.spent) + ' euros'; }).join(', ') +
      '" style="margin-top:8px"><line x1="0" y1="' + base + '" x2="342" y2="' + base + '" stroke="#2C3140"/>';
    data.forEach(function (d, i) {
      var cx = gw * i + gw / 2, hr = Math.max(2, d.rev / max * h), hs = Math.max(2, d.spent / max * h);
      out += '<rect x="' + (cx - bw - 2) + '" y="' + (base - hr) + '" width="' + bw + '" height="' + hr + '" rx="5" fill="#C6F24E"/>' +
        '<rect x="' + (cx + 2) + '" y="' + (base - hs) + '" width="' + bw + '" height="' + hs + '" rx="5" fill="#FF8A6B"/>' +
        '<text x="' + cx + '" y="142" text-anchor="middle" font-size="11" font-weight="500" fill="#9AA0AE" font-family="inherit">' + SHORT[Number(d.k.split('-')[1]) - 1] + '</text>';
    });
    return out + '</svg>';
  }

  function homeHtml() {
    var mk = state.view.month, m = curM(), t = B.totals(m);
    var owed = B.owedTotal(state), ks = monthKeys().slice(-6);
    var h = '';
    if (t.imported) h += '<div class="notice">Mois importé de ton tableur : seuls les totaux sont conservés.</div>';
    h += '<div class="grid2">' +
      '<div class="card hl"><div class="label-xs">État à jour</div><div class="big ' + (t.jour < 0 ? 'coral' : 'lime') + '" style="margin-top:6px">' + B.fmt(t.jour) + '</div><div class="small" style="margin-top:4px">Ce qui est déjà passé</div></div>' +
      '<div class="card"><div class="label-xs">État théorique</div><div class="big ' + cls(t.theo) + '" style="margin-top:6px">' + B.fmt(t.theo) + '</div><div class="small" style="margin-top:4px">Avec tout le prévu</div></div></div>';
    h += '<div class="' + (owed > 0 ? 'grid2' : '') + '">' +
      '<button class="card" data-act="route" data-v="epargne" style="text-align:left;width:100%"><div class="label-xs">Épargne</div><div style="font-size:24px;font-weight:700;letter-spacing:-.8px;margin-top:6px">' + B.fmt(state.epargne.balance) + '</div>' +
      (state.epargne.goal && state.epargne.goal.amount > 0 ? '<div class="bar" style="margin-top:10px;height:6px"><i style="width:' + Math.max(0, Math.min(100, state.epargne.balance / state.epargne.goal.amount * 100)) + '%;background:#C6F24E"></i></div><div class="small" style="margin-top:6px">' + Math.round(Math.max(0, state.epargne.balance / state.epargne.goal.amount * 100)) + ' % de ' + esc(state.epargne.goal.label || 'l\'objectif') + '</div>' : '<div class="small" style="margin-top:16px">Ouvrir l\'épargne</div>') + '</button>' +
      (owed > 0 ? '<button class="card" data-act="route" data-v="dettes" style="text-align:left;width:100%"><div class="label-xs">On me doit</div><div class="teal" style="font-size:24px;font-weight:700;letter-spacing:-.8px;margin-top:6px">' + B.fmt(owed) + '</div><div class="small" style="margin-top:16px">' + state.dettes.owed.length + ' personne' + (state.dettes.owed.length > 1 ? 's' : '') + '</div></button>' : '') + '</div>';
    if (ks.length > 0) h += '<div class="card" style="padding:14px 14px 10px"><div style="display:flex;justify-content:space-between;align-items:center"><div style="font-size:14px;font-weight:600">Revenus et dépenses</div><div class="small"><span class="lime">●</span> Revenus &nbsp;<span class="coral">●</span> Dépenses</div></div>' + chartBars(ks) + '</div>';
    if (owed > 0) {
      h += '<div class="card tight"><div class="list-title"><span>QUI ME DOIT</span><button data-act="route" data-v="dettes" style="border:0;background:none;color:var(--lime);font-weight:700;font-size:12px;min-height:32px">Voir tout</button></div>' +
        state.dettes.owed.map(function (p) { return '<div class="row"><div class="name"><b>' + esc(p.name) + '</b>' + (p.note ? '<span>' + esc(p.note) + '</span>' : '') + '</div><div class="amt" style="padding-right:10px">' + B.fmt(p.amount) + '</div></div>'; }).join('') + '</div>';
    }
    h += '<div class="card tight"><div class="list-title"><span>RÉSUMÉ DU MOIS</span></div>' + [
      ['Solde initial', B.fmtSigned(t.initial, t.initial < 0 ? '-' : ''), ''],
      ['Revenus', B.fmtSigned(t.rev, '+'), 'lime'],
      ['Dépenses fixes', B.fmtSigned(t.fix, '-'), ''],
      ['Dépenses courantes', B.fmtSigned(t.cur, '-'), ''],
      ['Courses alimentaires', B.fmtSigned(t.courses, '-'), '']
    ].map(function (r) { return '<div class="row"><div class="name"><b class="mute" style="font-weight:500">' + r[0] + '</b></div><div class="amt ' + r[2] + '" style="padding-right:10px">' + r[1] + '</div></div>'; }).join('') + '</div>';
    return h;
  }

  /* ---------- budget ---------- */
  function budgetHtml() {
    var m = curM();
    if (m.imported) return '<div class="notice">Ce mois vient de ton tableur : seul le résumé est gardé (voir Historique). Les listes détaillées existent à partir du mois en cours.</div>' + homeHtml();
    if (ui.tab === 'courantes') return courantesHtml(m);
    if (ui.tab === 'fixes') return fixesHtml(m);
    if (ui.tab === 'revenus') return revenusHtml(m);
    return coursesHtml(m);
  }
  function pencil(kind, id, label) { return '<button class="icon-btn" data-act="edit" data-kind="' + kind + '" data-id="' + id + '" aria-label="Modifier ' + esc(label) + '">' + I.pen + '</button>'; }

  function courantesHtml(m) {
    var t = B.totals(m);
    var pend = m.courantes.filter(function (c) { return c.pending; });
    var done = m.courantes.filter(function (c) { return !c.pending; });
    function row(c) {
      return '<div class="row"><button class="chk ' + (c.pending ? 'pend' : 'done') + '" data-act="toggle-pending" data-id="' + c.id + '" aria-label="' + esc(c.label) + ' : ' + (c.pending ? 'à venir, marquer comme passée' : 'passée, remettre à venir') + '"><span style="color:' + (c.pending ? '#FF8A6B' : '#5EEAD4') + '">' + (c.pending ? I.clock : I.check) + '</span></button>' +
        '<div class="name"><b>' + esc(c.label) + '</b>' + (c.note ? '<span>' + esc(c.note) + '</span>' : '') + '</div><div class="amt ' + (c.pending ? 'coral' : '') + '">' + B.fmtSigned(c.amount, '-') + '</div>' + pencil('courantes', c.id, c.label) + '</div>';
    }
    var h = '<div class="card"><div class="small">Dépenses courantes</div><div class="big">' + B.fmt(t.cur) + '</div>' +
      '<div class="bar" style="margin-top:12px"><i style="width:' + (t.cur ? t.curDone / t.cur * 100 : 0) + '%;background:#5EEAD4"></i><i style="width:' + (t.cur ? t.curPending / t.cur * 100 : 0) + '%;background:#FF8A6B"></i></div>' +
      '<div style="display:flex;justify-content:space-between;margin-top:8px" class="small"><span><span class="teal">●</span> Passées <b style="color:var(--ink)">' + B.fmt(t.curDone) + '</b></span><span><span class="coral">●</span> À venir <b style="color:var(--ink)">' + B.fmt(t.curPending) + '</b></span></div></div>';
    h += '<form class="card quick" data-form="quick" style="padding:12px"><label class="visually-hidden" for="q-label">Libellé</label><input id="q-label" name="label" type="text" placeholder="Libellé" autocomplete="off"><label class="visually-hidden" for="q-amt">Montant</label><input id="q-amt" class="amt-in" name="amount" type="text" inputmode="decimal" placeholder="0,00" autocomplete="off"><button class="btn plus" type="submit" aria-label="Ajouter la dépense">' + I.plus + '</button></form>';
    if (m.courantes.length === 0) {
      h += '<div class="empty"><div style="font-size:18px;font-weight:700;text-transform:capitalize">' + esc(B.monthName(state.view.month)) + ' est vide</div><div class="small" style="max-width:260px">Ajoute tes dépenses au fil du mois avec la ligne ci-dessus ou avec le bouton +.</div></div>';
    }
    if (pend.length) h += '<div class="card tight"><div class="list-title"><span>À VENIR</span><span class="coral">' + B.fmt(t.curPending) + '</span></div>' + pend.map(row).join('') + '</div>';
    if (done.length) h += '<div class="card tight"><div class="list-title"><span>PASSÉES</span><span class="teal">' + B.fmt(t.curDone) + '</span></div>' + done.slice().reverse().map(row).join('') + '</div>';
    return h;
  }

  function fixesHtml(m) {
    var t = B.totals(m);
    var h = '<div class="card"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><div><div class="small">Dépenses fixes et récurrentes</div><div class="big">' + B.fmt(t.fix) + '</div></div>' +
      '<div class="small" style="text-align:right"><div>OK <b class="lime">' + B.fmt(t.fixOk) + '</b></div><div style="margin-top:4px">Reste <b class="coral">' + B.fmt(B.round2(t.fix - t.fixOk)) + '</b></div></div></div>' +
      '<div class="bar" style="margin-top:12px"><i style="width:' + (t.fix ? t.fixOk / t.fix * 100 : 0) + '%;background:#C6F24E"></i></div>' +
      '<div class="small" style="margin-top:8px">Mets OK quand le prélèvement apparaît sur ton compte.</div></div>';
    if (m.fixes.length === 0) h += '<div class="empty"><div style="font-size:18px;font-weight:700">Aucune dépense fixe</div><button class="btn" data-act="add" data-type="fixe">Ajouter une dépense fixe</button></div>';
    else h += '<div class="card tight">' + m.fixes.map(function (f) {
      return '<div class="row"><button class="okpill ' + (f.ok ? 'on' : '') + '" data-act="toggle-ok" data-id="' + f.id + '" aria-pressed="' + !!f.ok + '" aria-label="' + esc(f.label) + ' : ' + (f.ok ? 'prélevé' : 'pas encore prélevé') + '"><span>OK</span></button>' +
        '<div class="name"><b>' + esc(f.label) + '</b></div><div class="amt">' + B.fmtSigned(f.amount, '-') + '</div>' + pencil('fixes', f.id, f.label) + '</div>';
    }).join('') + '<div class="row"><button class="btn ghost block" style="color:var(--lime)" data-act="add" data-type="fixe">' + I.plus.replace(/22/g, '16') + 'Ajouter une dépense fixe</button></div></div>';
    return h;
  }

  function revenusHtml(m) {
    var t = B.totals(m);
    var h = '<form class="card hl" data-form="initial"><label class="small" for="init" style="font-weight:600">Solde initial du compte</label><div class="quick" style="margin-top:6px"><input id="init" class="amount" name="initial" type="text" inputmode="decimal" value="' + esc(String(m.initial).replace('.', ',')) + '" aria-describedby="init-help"><button class="btn primary" type="submit">OK</button></div><div class="small" id="init-help" style="margin-top:8px">Repris de l\'état à jour du mois précédent, modifiable.</div></form>';
    h += '<div style="display:flex;justify-content:space-between;align-items:baseline;padding:0 4px"><div class="small" style="font-weight:600">Total des revenus</div><div class="lime" style="font-size:26px;font-weight:700;letter-spacing:-.8px">' + B.fmt(t.rev) + '</div></div>';
    h += '<div class="card tight" style="padding-left:4px">' + m.revenus.map(function (r) {
      return '<div class="row"><button class="chk ' + (r.received ? 'on' : '') + '" data-act="toggle-received" data-id="' + r.id + '" aria-pressed="' + !!r.received + '" aria-label="' + esc(r.label) + ' : ' + (r.received ? 'reçu' : 'pas encore reçu') + '"><span style="color:#0E1014">' + (r.received ? I.check : '') + '</span></button>' +
        '<div class="name"><b>' + esc(r.label) + '</b></div><div class="amt lime">' + B.fmtSigned(r.amount, '+') + '</div>' + pencil('revenus', r.id, r.label) + '</div>';
    }).join('') + '<div class="row"><button class="btn ghost block" style="color:var(--lime)" data-act="add" data-type="revenu">' + I.plus.replace(/22/g, '16') + 'Ajouter un revenu</button></div></div>';
    h += '<div class="small" style="padding:0 4px">Coche quand l\'argent est arrivé sur ton compte. Décoché = « à venir » : compté dans le théorique seulement.</div>';
    return h;
  }

  function coursesHtml(m) {
    var left = B.coursesLeft(m), spent = B.round2(m.courses.budget - left), pct = m.courses.budget > 0 ? Math.max(0, Math.min(100, spent / m.courses.budget * 100)) : 0;
    var circ = 276.5, dash = circ * (1 - pct / 100);
    var h = '<div class="card" style="display:flex;align-items:center;gap:18px"><div style="position:relative;width:112px;height:112px;flex:none"><svg viewBox="0 0 112 112" width="112" height="112" role="img" aria-label="' + Math.round(pct) + ' % du budget courses dépensé"><g transform="rotate(-90 56 56)" fill="none" stroke-width="13" stroke-linecap="round"><circle cx="56" cy="56" r="44" stroke="#232733"/><circle cx="56" cy="56" r="44" stroke="#5EEAD4" stroke-dasharray="' + (circ - dash).toFixed(1) + ' ' + circ + '"/></g></svg>' +
      '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center"><div class="small">Restant</div><div style="font-size:20px;font-weight:700;letter-spacing:-.5px">' + B.fmt(left) + '</div></div></div>' +
      '<div class="grow"><div class="small">Courses alimentaires</div><div class="teal big">' + B.fmt(m.courses.budget) + '</div><div class="small" style="margin-top:4px">budget du mois</div></div></div>';
    h += '<div class="card tight"><div class="row"><div class="name"><b>Budget du mois</b><span>Compté dans l\'état théorique</span></div><div class="amt">' + B.fmt(m.courses.budget) + '</div><button class="icon-btn" data-act="edit" data-kind="courses" data-id="budget" aria-label="Modifier le budget courses">' + I.pen + '</button></div></div>';
    h += '<div class="card tight"><div class="list-title"><span>PASSAGES EN MAGASIN</span><span>' + B.fmt(spent) + '</span></div>' +
      ((m.courses.items || []).length ? m.courses.items.map(function (it) {
        return '<div class="row"><button class="okpill ' + (it.ok ? 'on' : '') + '" data-act="toggle-item-ok" data-id="' + it.id + '" aria-pressed="' + !!it.ok + '" aria-label="' + esc(it.label) + ' : ' + (it.ok ? 'passé sur le compte' : 'pas encore passé') + '"><span>OK</span></button><div class="name"><b>' + esc(it.label) + '</b></div><div class="amt">' + B.fmtSigned(it.amount, '-') + '</div>' + pencil('items', it.id, it.label) + '</div>';
      }).join('') + '<div class="small" style="padding:4px 0 12px">Mets OK quand le montant est passé sur ton compte : il est alors retiré de l\'état à jour.</div>' : '<div class="small" style="padding:6px 0 12px">Aucun passage noté. Ajoute-les avec le bouton + (type Courses).</div>') + '</div>';
    return h;
  }

  /* ---------- historique ---------- */
  function histoHtml() {
    var ks = monthKeys(), h = '';
    h += '<div class="card" style="padding:14px 14px 10px"><div style="display:flex;justify-content:space-between;align-items:center"><div style="font-size:14px;font-weight:600">Revenus et dépenses</div><div class="small"><span class="lime">●</span> Revenus &nbsp;<span class="coral">●</span> Dépenses</div></div>' + chartBars(ks.slice(-6)) + '</div>';
    ks.slice().reverse().forEach(function (k) {
      var t = B.totals(state.months[k]), isCur = k === state.current;
      h += '<div class="card"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px"><div><div style="font-size:16px;font-weight:700;text-transform:capitalize">' + esc(B.monthLabel(k)) + (isCur ? '<span class="badge">en cours</span>' : '') + '</div><div class="small" style="margin-top:2px">Solde initial ' + B.fmt(t.initial) + '</div></div>' +
        '<div style="text-align:right"><div class="small">État à jour</div><div style="font-size:22px;font-weight:700;letter-spacing:-.5px" class="' + (t.jour < 0 ? 'coral' : 'lime') + '">' + B.fmt(t.jour) + '</div></div></div>' +
        '<div class="mini-grid" style="margin-top:12px"><div><span>Revenus</span><b>' + B.fmt(t.rev) + '</b></div><div><span>Fixes</span><b>' + B.fmt(t.fix) + '</b></div><div><span>Courantes</span><b>' + B.fmt(t.cur) + '</b></div><div><span>Courses</span><b>' + B.fmt(t.courses) + '</b></div></div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:12px;padding-top:6px;border-top:1px solid var(--line)"><span class="small">État théorique <b class="' + cls(t.theo) + '" style="color:' + (t.theo < 0 ? '' : 'var(--ink)') + '">' + B.fmt(t.theo) + '</b></span>' +
        (t.imported ? '<span class="small">Résumé importé</span>' : '<button class="btn ghost" style="min-height:44px;color:var(--lime)" data-act="open-month" data-v="' + k + '">Voir le détail</button>') + '</div></div>';
    });
    return h;
  }

  /* ---------- épargne ---------- */
  function epargneHtml() {
    var e = state.epargne, g = e.goal, h = '';
    var pct = g && g.amount > 0 ? Math.max(0, Math.min(100, e.balance / g.amount * 100)) : null;
    if (pct != null) {
      var c = 314.2;
      h += '<div class="card" style="display:flex;align-items:center;gap:18px"><div style="position:relative;width:124px;height:124px;flex:none"><svg viewBox="0 0 124 124" width="124" height="124" role="img" aria-label="' + Math.round(pct) + ' % de l\'objectif"><g transform="rotate(-90 62 62)" fill="none" stroke-width="14" stroke-linecap="round"><circle cx="62" cy="62" r="50" stroke="#232733"/><circle cx="62" cy="62" r="50" stroke="#C6F24E" stroke-dasharray="' + (c * pct / 100).toFixed(1) + ' ' + c + '"/></g></svg>' +
        '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center"><div style="font-size:24px;font-weight:700;letter-spacing:-1px">' + Math.round(pct) + ' %</div><div class="small" style="font-size:11px">de l\'objectif</div></div></div>' +
        '<div class="grow"><div class="small">Épargne</div><div class="lime" style="font-size:28px;font-weight:700;letter-spacing:-1px;line-height:1.1">' + B.fmt(e.balance) + '</div><div class="small" style="margin-top:6px">Objectif : ' + esc(g.label || '') + ' ' + B.fmt(g.amount) + '</div></div></div>';
    } else {
      h += '<div class="card"><div class="small">Épargne</div><div class="lime big">' + B.fmt(e.balance) + '</div></div>';
    }
    h += '<div style="display:flex;gap:10px"><button class="btn primary grow" data-act="add" data-type="epargne" data-dir="in">Verser</button><button class="btn grow" data-act="add" data-type="epargne" data-dir="out">Retirer</button></div>';
    h += '<button class="btn block" data-act="edit" data-kind="goal" data-id="goal">' + (g ? 'Modifier l\'objectif' : 'Définir un objectif') + '</button>';
    h += '<div class="card tight"><div class="list-title"><span>MOUVEMENTS</span></div>' + (e.moves.length ? e.moves.slice().reverse().map(function (mv) {
      return '<div class="row"><div class="name"><b>' + esc(mv.label || (mv.amount >= 0 ? 'Versement' : 'Retrait')) + '</b><span>' + esc(mv.date) + '</span></div><div class="amt ' + (mv.amount >= 0 ? 'lime' : 'coral') + '">' + B.fmtSigned(mv.amount) + '</div>' + pencil('moves', mv.id, mv.label || 'mouvement') + '</div>';
    }).join('') : '<div class="small" style="padding:6px 0 12px">Aucun mouvement noté pour l\'instant.</div>') + '</div>';
    return h;
  }

  /* ---------- dettes ---------- */
  function dettesHtml() {
    var key = ui.dettes, list = state.dettes[key], total = B.sum(list);
    var h = '<div class="card"><div class="small">' + (key === 'owed' ? 'Total à récupérer' : 'Total à rembourser') + '</div><div class="big ' + (key === 'owed' ? 'teal' : 'coral') + '">' + B.fmt(total) + '</div><div class="small" style="margin-top:4px">' + list.length + ' personne' + (list.length > 1 ? 's' : '') + '</div></div>';
    if (!list.length) return h + '<div class="empty"><div style="font-size:18px;font-weight:700">' + (key === 'owed' ? 'Personne ne te doit rien' : 'Tu ne dois rien') + '</div><button class="btn" data-act="add" data-type="dette" data-dir="' + key + '">Ajouter une dette</button></div>';
    h += '<div class="card tight">' + list.map(function (p) {
      return '<div class="row"><div class="name"><b>' + esc(p.name) + '</b>' + (p.note ? '<span>' + esc(p.note) + '</span>' : '') + '</div><div class="amt">' + B.fmt(p.amount) + '</div>' +
        '<button class="icon-btn" style="color:var(--lime)" data-act="repay" data-id="' + p.id + '" aria-label="' + (key === 'owed' ? esc(p.name) + ' m\'a remboursé' : 'J\'ai remboursé ' + esc(p.name)) + '">' + I.check.replace(/15/g, '20') + '</button>' + pencil(key, p.id, p.name) + '</div>';
    }).join('') + '</div><div class="small" style="padding:0 4px">La coche enregistre un remboursement, total ou partiel.</div>';
    return h;
  }

  /* ---------- feuilles (formulaires) ---------- */
  function openSheet(o) {
    var root = document.getElementById('sheet-root');
    sheetDanger = o.onDanger || null;
    root.innerHTML = '<div class="scrim" data-act="close-sheet"></div><form class="sheet" role="dialog" aria-modal="true" aria-label="' + esc(o.title) + '" autocomplete="off"><div class="grab"></div><h2>' + esc(o.title) + '</h2><div class="sheet-body">' + o.body + '</div><div class="sheet-actions">' +
      '<button class="btn primary block" type="submit" style="min-height:52px;font-size:16px">' + esc(o.submit || 'Enregistrer') + '</button><div class="two"><button class="btn ghost" type="button" data-act="close-sheet">Annuler</button>' +
      (o.dangerLabel ? '<button class="btn danger" type="button" data-act="sheet-danger">' + esc(o.dangerLabel) + '</button>' : '') + '</div></div></form>';
    var form = root.querySelector('form');
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (o.onSubmit(form) !== false) { closeSheet(); }
    });
    if (o.onChange) form.addEventListener('change', function (ev) { o.onChange(form, ev); });
    var first = form.querySelector('input[type=text]');
    if (first) setTimeout(function () { first.focus(); if (first.select && o.selectFirst) first.select(); }, 60);
  }
  function closeSheet() { document.getElementById('sheet-root').innerHTML = ''; sheetDanger = null; }

  function fText(name, label, val, extra) {
    return '<div class="field"><label for="f-' + name + '">' + label + '</label><input id="f-' + name + '" name="' + name + '" type="text" value="' + esc(val == null ? '' : val) + '" ' + (extra || '') + '></div>';
  }
  function fAmount(name, label, val) {
    return '<div class="field"><label for="f-' + name + '">' + label + '</label><input id="f-' + name + '" class="amount" name="' + name + '" type="text" inputmode="decimal" value="' + esc(val == null || val === '' ? '' : String(val).replace('.', ',')) + '" placeholder="0,00"></div>';
  }
  function fSwitch(name, title, sub, checked) {
    return '<label class="swrow"><div class="grow"><b>' + title + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</div><input type="checkbox" role="switch" name="' + name + '"' + (checked ? ' checked' : '') + '></label>';
  }
  function fRadio(name, val, title, sub, checked) {
    return '<label class="radio"><input type="radio" name="' + name + '" value="' + val + '"' + (checked ? ' checked' : '') + '><span class="dot"></span><span><b>' + title + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</span></label>';
  }
  function readAmount(form, name) { return B.parseAmount(form.elements[name].value); }
  function viewIsEditable() {
    if (curM().imported) { toast('Mois importé : lecture seule'); return false; }
    return true;
  }

  /* Ajout */
  function sheetAdd(type, dir) {
    if (!viewIsEditable()) return;
    var types = [['courante', 'Courante'], ['fixe', 'Fixe'], ['revenu', 'Revenu'], ['course', 'Courses'], ['epargne', 'Épargne'], ['dette', 'Dette']];
    if (!type) type = ui.route === 'budget' ? ({ courantes: 'courante', fixes: 'fixe', revenus: 'revenu', courses: 'course' })[ui.tab] : (ui.route === 'epargne' ? 'epargne' : (ui.route === 'dettes' ? 'dette' : 'courante'));
    if (ui.route === 'dettes' && !dir) dir = ui.dettes;
    function fields(tp) {
      if (tp === 'courante') return fText('label', 'Libellé', '') + fAmount('amount', 'Montant', '') + fText('note', 'Note (facultatif)', '') + fSwitch('pending', 'À venir', 'Pas encore passée sur le compte', false);
      if (tp === 'fixe') return fText('label', 'Libellé', '') + fAmount('amount', 'Montant', '') + fSwitch('ok', 'OK, prélevé', 'Déjà apparu sur le compte', false);
      if (tp === 'revenu') return fText('label', 'Libellé', '') + fAmount('amount', 'Montant', '') + fSwitch('received', 'Reçu', 'Déjà arrivé sur le compte', true);
      if (tp === 'course') return fText('label', 'Magasin', '') + fAmount('amount', 'Montant', '') + fSwitch('ok', 'OK, passé sur le compte', 'Retiré de l\'état à jour', false);
      if (tp === 'epargne') return '<div class="chips c2"><label class="chip"><input type="radio" name="dir" value="in"' + (dir !== 'out' ? ' checked' : '') + '><span>Verser</span></label><label class="chip"><input type="radio" name="dir" value="out"' + (dir === 'out' ? ' checked' : '') + '><span>Retirer</span></label></div>' + fAmount('amount', 'Montant', '') + fText('label', 'Libellé (facultatif)', '');
      return '<div class="chips c2"><label class="chip"><input type="radio" name="dir" value="owed"' + (dir !== 'owe' ? ' checked' : '') + '><span>On me doit</span></label><label class="chip"><input type="radio" name="dir" value="owe"' + (dir === 'owe' ? ' checked' : '') + '><span>Je dois</span></label></div>' + fText('name', 'Personne', '') + fAmount('amount', 'Montant', '') + fText('note', 'Note (facultatif)', '');
    }
    var body = '<div class="chips" role="radiogroup" aria-label="Type d\'opération">' + types.map(function (t) {
      return '<label class="chip"><input type="radio" name="type" value="' + t[0] + '"' + (t[0] === type ? ' checked' : '') + '><span>' + t[1] + '</span></label>';
    }).join('') + '</div><div id="add-fields" style="display:flex;flex-direction:column;gap:14px">' + fields(type) + '</div>';
    openSheet({
      title: 'Nouvelle opération', body: body,
      onChange: function (form, ev) {
        if (ev.target.name === 'type') { document.getElementById('add-fields').innerHTML = fields(ev.target.value); var f = form.querySelector('#add-fields input[type=text]'); if (f) f.focus(); }
      },
      onSubmit: function (form) {
        var tp = form.elements.type.value, m = curM(), amt = readAmount(form, 'amount');
        if (amt == null) { toast('Montant illisible'); return false; }
        var label = form.elements.label ? form.elements.label.value.trim() : '';
        if (tp === 'courante') {
          if (!label) { toast('Ajoute un libellé'); return false; }
          m.courantes.push({ id: B.uid(), label: label, amount: Math.abs(amt), pending: form.elements.pending.checked, note: form.elements.note.value.trim() }); ui.route = 'budget'; ui.tab = 'courantes';
        } else if (tp === 'fixe') {
          if (!label) { toast('Ajoute un libellé'); return false; }
          m.fixes.push({ id: B.uid(), label: label, amount: Math.abs(amt), ok: form.elements.ok.checked }); ui.route = 'budget'; ui.tab = 'fixes';
        } else if (tp === 'revenu') {
          if (!label) { toast('Ajoute un libellé'); return false; }
          m.revenus.push({ id: B.uid(), label: label, amount: Math.abs(amt), received: form.elements.received.checked }); ui.route = 'budget'; ui.tab = 'revenus';
        } else if (tp === 'course') {
          m.courses.items.push({ id: B.uid(), label: label || 'Courses', amount: Math.abs(amt), ok: form.elements.ok.checked }); ui.route = 'budget'; ui.tab = 'courses';
        } else if (tp === 'epargne') {
          var d = form.elements.dir.value === 'out' ? -1 : 1, v = d * Math.abs(amt);
          state.epargne.moves.push({ id: B.uid(), date: new Date().toLocaleDateString('fr-FR'), label: label, amount: v });
          state.epargne.balance = B.round2(state.epargne.balance + v); ui.route = 'epargne';
        } else {
          var name = form.elements.name.value.trim();
          if (!name) { toast('Ajoute une personne'); return false; }
          var k = form.elements.dir.value;
          state.dettes[k].push({ id: B.uid(), name: name, note: form.elements.note.value.trim(), amount: Math.abs(amt) }); ui.route = 'dettes'; ui.dettes = k;
        }
        save(); render(); toast('Enregistré');
      }
    });
  }

  /* Modification */
  function sheetEdit(kind, id) {
    var m = curM();
    var lists = { revenus: m.revenus, fixes: m.fixes, courantes: m.courantes, owed: state.dettes.owed, owe: state.dettes.owe, moves: state.epargne.moves };
    if (kind === 'courses') return sheetCoursesBudget();
    if (kind === 'goal') return sheetGoal();
    if (kind === 'items') lists.items = m.courses.items;
    if (kind !== 'owed' && kind !== 'owe' && kind !== 'moves' && !viewIsEditable()) return;
    var it = find(lists[kind], id);
    if (!it) return;
    var body, title = 'Modifier';
    if (kind === 'revenus') { title = 'Modifier le revenu'; body = fText('label', 'Libellé', it.label) + fAmount('amount', 'Montant', it.amount) + fSwitch('received', 'Reçu', 'Arrivé sur le compte', it.received); }
    else if (kind === 'fixes') {
      title = 'Modifier la dépense fixe';
      body = fText('label', 'Libellé', it.label) + fAmount('amount', 'Montant', it.amount) +
        '<div class="field"><span class="lbl">S\'applique à</span>' + fRadio('scope', 'once', 'Ce mois seulement', esc(B.monthLabel(state.view.month)), true) + fRadio('scope', 'all', 'Tous les mois suivants', 'Repris au prochain passage de mois', false) + '</div>' +
        fSwitch('ok', 'OK, prélevé', 'Apparu sur le compte bancaire', it.ok);
    }
    else if (kind === 'courantes') { title = 'Modifier la dépense'; body = fText('label', 'Libellé', it.label) + fAmount('amount', 'Montant', it.amount) + fText('note', 'Note (facultatif)', it.note || '') + fSwitch('pending', 'À venir', 'Pas encore passée sur le compte', it.pending); }
    else if (kind === 'items') { title = 'Modifier le passage'; body = fText('label', 'Magasin', it.label) + fAmount('amount', 'Montant', it.amount) + fSwitch('ok', 'OK, passé sur le compte', 'Retiré de l\'état à jour', it.ok); }
    else if (kind === 'moves') { title = 'Modifier le mouvement'; body = fText('label', 'Libellé', it.label) + fAmount('amount', 'Montant (négatif = retrait)', it.amount); }
    else { title = 'Modifier la dette'; body = fText('name', 'Personne', it.name) + fAmount('amount', 'Montant', it.amount) + fText('note', 'Note (facultatif)', it.note || ''); }
    openSheet({
      title: title, body: body, dangerLabel: 'Supprimer',
      onDanger: function () {
        if (!confirm('Supprimer cette ligne ?')) return;
        if (kind === 'moves') state.epargne.balance = B.round2(state.epargne.balance - it.amount);
        remove(lists[kind], id); save(); closeSheet(); render(); toast('Supprimé');
      },
      onSubmit: function (form) {
        var amt = readAmount(form, 'amount');
        if (amt == null) { toast('Montant illisible'); return false; }
        var e = form.elements;
        if (kind === 'moves') { state.epargne.balance = B.round2(state.epargne.balance - it.amount + amt); it.amount = amt; it.label = e.label.value.trim(); }
        else if (kind === 'owed' || kind === 'owe') { it.name = e.name.value.trim() || it.name; it.note = e.note.value.trim(); it.amount = Math.abs(amt); }
        else {
          if (!e.label.value.trim()) { toast('Ajoute un libellé'); return false; }
          var old = it.amount; it.label = e.label.value.trim(); it.amount = Math.abs(amt);
          if (kind === 'revenus') it.received = e.received.checked;
          if (kind === 'items') it.ok = e.ok.checked;
          if (kind === 'courantes') { it.note = e.note.value.trim(); it.pending = e.pending.checked; }
          if (kind === 'fixes') {
            it.ok = e.ok.checked;
            if (it.amount !== old) { if (e.scope.value === 'once') { if (it.base == null) it.base = old; } else { delete it.base; } }
          }
        }
        save(); render(); toast('Modifié');
      }
    });
  }
  function sheetCoursesBudget() {
    if (!viewIsEditable()) return;
    var m = curM();
    openSheet({ title: 'Budget courses', body: fAmount('amount', 'Budget du mois', m.courses.budget),
      onSubmit: function (form) { var a = readAmount(form, 'amount'); if (a == null) { toast('Montant illisible'); return false; } m.courses.budget = Math.abs(a); save(); render(); toast('Modifié'); } });
  }
  function sheetGoal() {
    var g = state.epargne.goal;
    openSheet({ title: 'Objectif d\'épargne', body: fText('label', 'Objectif (ex. loyer du 13)', g ? g.label : '') + fAmount('amount', 'Montant à atteindre', g ? g.amount : ''), dangerLabel: g ? 'Supprimer l\'objectif' : '',
      onDanger: function () { state.epargne.goal = null; save(); closeSheet(); render(); },
      onSubmit: function (form) { var a = readAmount(form, 'amount'); if (a == null || a <= 0) { toast('Montant illisible'); return false; } state.epargne.goal = { label: form.elements.label.value.trim(), amount: a }; save(); render(); } });
  }
  function sheetRepay(id) {
    var key = ui.dettes, p = find(state.dettes[key], id);
    if (!p) return;
    openSheet({ title: key === 'owed' ? p.name + ' me rembourse' : 'Je rembourse ' + p.name, submit: 'Valider', body: '<div class="small">Reste dû : <b style="color:var(--ink)">' + B.fmt(p.amount) + '</b></div>' + fAmount('amount', 'Montant remboursé', p.amount),
      onSubmit: function (form) {
        var a = readAmount(form, 'amount');
        if (a == null || a <= 0) { toast('Montant illisible'); return false; }
        p.amount = B.round2(p.amount - a);
        if (p.amount <= 0.004) remove(state.dettes[key], id);
        save(); render(); toast(p.amount <= 0.004 ? 'Dette soldée' : 'Remboursement noté');
      } });
  }

  function sheetNextMonth() {
    var m = curM(), t = B.totals(m), nk = B.nextKey(state.current), pend = m.courantes.filter(function (c) { return c.pending; }).length;
    var body = '<div class="card" style="background:var(--bg)"><div class="small" style="margin-bottom:8px">' + esc(B.monthLabel(state.current)) + ' sera enregistré dans l\'historique.</div><div class="mini-grid"><div><span>Théorique</span><b>' + B.fmt(t.theo) + '</b></div><div><span>À jour</span><b class="' + (t.jour < 0 ? 'coral' : 'lime') + '">' + B.fmt(t.jour) + '</b></div><div><span>Écart</span><b>' + B.fmtSigned(B.round2(t.jour - t.theo)) + '</b></div></div></div>' +
      fSwitch('initial', 'Solde initial = état à jour', 'Le mois démarre à ' + B.fmt(t.jour), true) +
      fSwitch('fixes', 'Reprendre les dépenses fixes', 'Mêmes lignes, cases OK décochées', true) +
      fSwitch('revenus', 'Reprendre les revenus habituels', 'Salaire, CAF… à ajuster ensuite', false) +
      '<label class="swrow"><div class="grow"><b>Reporter les dépenses à venir</b><small>' + pend + ' ligne' + (pend > 1 ? 's' : '') + ' encore à venir</small></div><input type="checkbox" role="switch" name="pending"' + (pend ? ' checked' : ' disabled') + '></label>' +
      '<div class="small">Dépenses courantes : vides. Épargne et dettes restent telles quelles.</div>';
    openSheet({ title: 'Passer à ' + B.monthName(nk), submit: 'Ouvrir ' + B.monthName(nk), body: body,
      onSubmit: function (form) {
        var e = form.elements;
        var old = state.current;
        B.openNextMonth(state, { initialFromJour: e.initial.checked, fixes: e.fixes.checked, revenus: e.revenus.checked, carryPending: e.pending.checked });
        save(); ui.route = 'budget'; ui.tab = 'courantes'; render();
        toast(B.monthName(old).charAt(0).toUpperCase() + B.monthName(old).slice(1) + ' enregistré dans l\'historique');
      } });
  }

  function sheetSettings() {
    var body = '<div class="notice">Tes données restent uniquement sur ce téléphone. Fais une sauvegarde de temps en temps : si tu effaces les données du navigateur, elles disparaissent.</div>' +
      '<button type="button" class="btn block" data-act="export">Exporter une sauvegarde</button>' +
      '<label class="btn block" style="cursor:pointer">Importer une sauvegarde<input type="file" accept="application/json,.json" data-act="import" class="visually-hidden"></label>' +
      '<button type="button" class="btn block danger" data-act="reset">Repartir de zéro</button>';
    var root = document.getElementById('sheet-root');
    root.innerHTML = '<div class="scrim" data-act="close-sheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Réglages"><div class="grab"></div><h2>Réglages</h2><div class="sheet-body">' + body + '</div><div class="sheet-actions"><button class="btn ghost block" type="button" data-act="close-sheet">Fermer</button></div></div>';
  }

  function doExport() {
    if (window.AndroidBridge && window.AndroidBridge.shareBackup) { window.AndroidBridge.shareBackup(JSON.stringify(state, null, 2)); return; }
    var blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mon-budget-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }
  function doImport(file) {
    var r = new FileReader();
    r.onload = function () {
      try {
        var s = JSON.parse(r.result);
        if (!s || s.v !== 1 || !s.months || !s.current || !s.epargne || !s.dettes) throw new Error('format');
        if (!confirm('Remplacer toutes les données actuelles par cette sauvegarde ?')) return;
        state = s; if (!state.view) state.view = { month: state.current };
        save(); closeSheet(); render(); toast('Sauvegarde importée');
      } catch (e) { toast('Fichier de sauvegarde invalide'); }
    };
    r.readAsText(file);
  }

  /* ---------- événements ---------- */
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-act]');
    if (!el || el.tagName === 'INPUT') return;
    var act = el.getAttribute('data-act'), id = el.getAttribute('data-id'), m;
    if (act === 'route') { ui.route = el.getAttribute('data-v'); render(); }
    else if (act === 'tab') { ui.tab = el.getAttribute('data-v'); render(); }
    else if (act === 'dettes-tab') { ui.dettes = el.getAttribute('data-v'); render(); }
    else if (act === 'month-prev' || act === 'month-next') {
      var ks = monthKeys(), i = ks.indexOf(state.view.month) + (act === 'month-next' ? 1 : -1);
      if (i >= 0 && i < ks.length) { state.view.month = ks[i]; render(); }
    }
    else if (act === 'go-current') { state.view.month = state.current; render(); }
    else if (act === 'open-month') { state.view.month = el.getAttribute('data-v'); ui.route = 'budget'; ui.tab = 'courantes'; render(); }
    else if (act === 'add') sheetAdd(el.getAttribute('data-type'), el.getAttribute('data-dir'));
    else if (act === 'edit') sheetEdit(el.getAttribute('data-kind'), id);
    else if (act === 'repay') sheetRepay(id);
    else if (act === 'next-month') sheetNextMonth();
    else if (act === 'settings') sheetSettings();
    else if (act === 'close-sheet') closeSheet();
    else if (act === 'sheet-danger') { if (sheetDanger) sheetDanger(); }
    else if (act === 'toggle-ok') { m = curM(); var f = find(m.fixes, id); f.ok = !f.ok; save(); render(); }
    else if (act === 'toggle-received') { m = curM(); var r = find(m.revenus, id); r.received = !r.received; save(); render(); }
    else if (act === 'toggle-pending') { m = curM(); var c = find(m.courantes, id); c.pending = !c.pending; save(); render(); }
    else if (act === 'toggle-item-ok') { m = curM(); var ci = find(m.courses.items, id); ci.ok = !ci.ok; save(); render(); }
    else if (act === 'export') doExport();
    else if (act === 'reset') { if (confirm('Effacer toutes les données et repartir d\'un mois vide ?')) { state = emptyState(); save(); closeSheet(); ui.route = 'home'; render(); toast('Données effacées'); } }
  });
  document.addEventListener('change', function (ev) {
    if (ev.target.getAttribute && ev.target.getAttribute('data-act') === 'import' && ev.target.files && ev.target.files[0]) doImport(ev.target.files[0]);
  });
  document.addEventListener('submit', function (ev) {
    var f = ev.target.closest('[data-form]');
    if (!f) return;
    ev.preventDefault();
    if (!viewIsEditable()) return;
    var m = curM();
    if (f.getAttribute('data-form') === 'quick') {
      var label = f.elements.label.value.trim(), amt = B.parseAmount(f.elements.amount.value);
      if (!label || amt == null) { toast('Libellé et montant'); return; }
      m.courantes.push({ id: B.uid(), label: label, amount: Math.abs(amt), pending: false, note: '' });
      save(); render();
      var nl = document.getElementById('q-label'); if (nl) nl.focus();
    } else if (f.getAttribute('data-form') === 'initial') {
      var v = B.parseAmount(f.elements.initial.value);
      if (v == null) { toast('Montant illisible'); return; }
      m.initial = v; save(); render(); toast('Solde initial enregistré');
    }
  });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') closeSheet(); });

  /* ---------- démarrage ---------- */
  if (!state.view || !state.months[state.view.month]) state.view = { month: state.current };
  render();
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
  if ('serviceWorker' in navigator) window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () { /* hors ligne non disponible */ }); });
})();
