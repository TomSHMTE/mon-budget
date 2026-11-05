/* Mon Budget — logique pure (calculs, données de départ, passage au mois suivant).
   Aucun accès au DOM ici, pour pouvoir tester les calculs. */
(function (root) {
  'use strict';

  var KEY = 'monbudget:v1';
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

  var uid = (function () {
    var n = 0;
    return function () { n += 1; return Date.now().toString(36) + n.toString(36) + Math.random().toString(36).slice(2, 6); };
  })();

  function round2(x) { return Math.round((x + Number.EPSILON) * 100) / 100; }
  function sum(list) { return round2(list.reduce(function (t, x) { return t + (Number(x.amount) || 0); }, 0)); }

  /* « 1 485,91 », « −92,15 € », « 12.5 » -> nombre, ou null si illisible */
  function parseAmount(str) {
    if (typeof str === 'number') return isFinite(str) ? round2(str) : null;
    var s = String(str == null ? '' : str)
      .replace(/[−–—]/g, '-')
      .replace(/[\s  €]/g, '')
      .replace(',', '.');
    if (s === '' || s === '-' || s === '.') return null;
    var v = Number(s);
    return isFinite(v) ? round2(v) : null;
  }

  var nf = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
  function fmt(n) {
    var v = Math.abs(n) < 0.005 ? 0 : n;
    return nf.format(v).replace('-', '−');
  }
  function fmtSigned(n, sign) {
    var v = Math.abs(n);
    return (sign || (n < 0 ? '-' : '+')).replace('-', '−') + nf.format(v);
  }

  function monthLabel(key) {
    var p = key.split('-');
    return MOIS[Number(p[1]) - 1] + ' ' + p[0];
  }
  function monthName(key) { return MOIS[Number(key.split('-')[1]) - 1]; }
  function nextKey(key) {
    var p = key.split('-').map(Number);
    var y = p[0], m = p[1] + 1;
    if (m > 12) { m = 1; y += 1; }
    return y + '-' + (m < 10 ? '0' + m : m);
  }
  function prevKey(key) {
    var p = key.split('-').map(Number);
    var y = p[0], m = p[1] - 1;
    if (m < 1) { m = 12; y -= 1; }
    return y + '-' + (m < 10 ? '0' + m : m);
  }

  /* ---- Totaux d'un mois ----
     État théorique = solde initial + tous les revenus − toutes les fixes − toutes les courantes (à venir comprises) − courses
     État à jour    = solde initial + revenus reçus − fixes cochées OK − courantes passées − passages courses cochés OK
     (c'est exactement la règle de ton tableur : Netflix sans « x » et Uber en « à venir »
      expliquent l'écart de 35,44 € entre 61,07 € et 96,51 €) */
  function totals(m) {
    if (m.imported) {
      var i = m.imported;
      return {
        imported: true, initial: i.initial, rev: i.rev, revIn: i.rev,
        fix: i.fix, fixOk: i.fix, cur: i.cur, curDone: i.cur, courses: i.courses, coursesOk: i.courses,
        theo: i.theo, jour: i.jour, spent: round2(i.fix + i.cur + i.courses)
      };
    }
    var rev = sum(m.revenus);
    var revIn = sum(m.revenus.filter(function (r) { return r.received; }));
    var fix = sum(m.fixes);
    var fixOk = sum(m.fixes.filter(function (f) { return f.ok; }));
    var cur = sum(m.courantes);
    var curDone = sum(m.courantes.filter(function (c) { return !c.pending; }));
    var budget = Number(m.courses.budget) || 0;
    var items = m.courses.items || [];
    var coursesSpent = sum(items);
    var coursesOk = sum(items.filter(function (it) { return it.ok; }));
    var courses = Math.max(budget, coursesSpent); /* le budget compte au théorique ; seuls les passages OK comptent à jour */
    var init = Number(m.initial) || 0;
    return {
      imported: false, initial: init, rev: rev, revIn: revIn, fix: fix, fixOk: fixOk,
      cur: cur, curDone: curDone, curPending: round2(cur - curDone),
      courses: courses, coursesOk: coursesOk,
      theo: round2(init + rev - fix - cur - courses),
      jour: round2(init + revIn - fixOk - curDone - coursesOk),
      spent: round2(fix + cur + courses)
    };
  }

  function coursesLeft(m) {
    return round2((Number(m.courses.budget) || 0) - sum(m.courses.items || []));
  }

  function owedTotal(state) { return sum(state.dettes.owed); }

  /* ---- Passage au mois suivant ---- */
  function openNextMonth(state, opts) {
    var curKey = state.current;
    var cur = state.months[curKey];
    var t = totals(cur);
    cur.closedAt = new Date().toISOString();
    var key = nextKey(curKey);
    var carried = opts.carryPending ? cur.courantes.filter(function (c) { return c.pending; }) : [];
    var nm = {
      initial: opts.initialFromJour ? t.jour : 0,
      revenus: opts.revenus ? cur.revenus.map(function (r) {
        return { id: uid(), label: r.label, amount: (r.base != null ? r.base : r.amount), received: false };
      }) : [],
      fixes: opts.fixes ? cur.fixes.map(function (f) {
        return { id: uid(), label: f.label, amount: (f.base != null ? f.base : f.amount), ok: false };
      }) : [],
      courantes: carried.map(function (c) {
        return { id: uid(), label: c.label, amount: c.amount, pending: true, note: c.note || '' };
      }),
      courses: { budget: cur.courses.budget, items: [] }
    };
    if (!state.months[key]) state.months[key] = nm;
    state.current = key;
    state.view = { month: key };
    return key;
  }

  /* ---- Données de départ : état de l'appli au 5 novembre 2026 ---- */
  function seed() {
    var rows = function (arr, make) { return arr.map(function (x) { var o = make(x); o.id = uid(); return o; }); };
    return {
      v: 1,
      current: '2026-11',
      view: { month: '2026-11' },
      months: {
        '2026-07': { imported: { initial: -216.60, rev: 3515.91, fix: 926.17, cur: 2295.88, courses: 150, theo: -288.34, jour: -108.37 } },
        '2026-08': { imported: { initial: -317.26, rev: 2053.07, fix: 904.88, cur: 940.04, courses: 150, theo: -259.11, jour: -254.12 } },
        '2026-09': { imported: { initial: -263.71, rev: 5053.28, fix: 962.44, cur: 3774.27, courses: 150, theo: -97.14, jour: -92.15 } },
        '2026-10': { imported: { initial: -92.15, rev: 2930.12, fix: 899.37, cur: 1727.53, courses: 150, theo: 61.07, jour: 46.16 } },
        '2026-11': {
          initial: 46.16,
          revenus: rows([
            ['Salaire', 1485.91], ['CAF', 152.21], ['Kevin Mcdo', 72], ['Edf trop perçu', 15.38]
          ], function (x) { return { label: x[0], amount: x[1], received: true }; }),
          fixes: rows([
            ['Loyer', 514.71, 0], ['Électricité', 87.89, 1], ['Internet / Box', 28.74, 1], ['Téléphone', 31.99, 1],
            ['Assurance habitation', 42.27, 0], ['Assurance auto', 36, 1], ['BCPE Vie', 3.78, 0], ['Prêt', 147.86, 0],
            ['Cotisation bancaire', 2, 0], ['Canal +', 24.99, 1], ['Spotify', 7.07, 1], ['Netflix', 21.98, 0],
            ['Pokemon Pocket', 9.99, 0], ['Pokecardex', 3.99, 1], ['Snapchat +', 3.99, 1], ['Google One', 4.99, 1],
            ['Claude', 21.6, 0], ['x10 Tortinnette', 59.4, 0], ['PS5', 9.99, 0], ['SPB (assurance Citya)', 3.99, 1],
            ['Wikimaster Pro', 6.66, 1]
          ], function (x) { return { label: x[0], amount: x[1], ok: !!x[2] }; }),
          courantes: rows([
            ['McDo avec Nico', 51.15], ['McDo Kevin', 52.53], ['Compte revolut', 50], ['Achat entretoise', 40], ['Switch', 50]
          ], function (x) { return { label: x[0], amount: x[1], pending: false, note: '' }; }),
          courses: { budget: 150, items: rows([['Carrefour City', 14.86], ['Compte bouffe', 100]], function (x) { return { label: x[0], amount: x[1], ok: false }; }) }
        }
      },
      epargne: { balance: 400, goal: null, moves: [] },
      dettes: {
        owed: [
          { id: uid(), name: 'Nicolas G', note: '', amount: 20 },
          { id: uid(), name: 'Nico', note: '', amount: 60 },
          { id: uid(), name: 'Chat ❤️', note: 'Électricité', amount: 44 }
        ],
        owe: []
      }
    };
  }

  var api = {
    KEY: KEY, uid: uid, round2: round2, sum: sum, parseAmount: parseAmount, fmt: fmt, fmtSigned: fmtSigned,
    monthLabel: monthLabel, monthName: monthName, nextKey: nextKey, prevKey: prevKey,
    totals: totals, coursesLeft: coursesLeft, owedTotal: owedTotal, openNextMonth: openNextMonth, seed: seed
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Budget = api;
})(typeof window !== 'undefined' ? window : this);
