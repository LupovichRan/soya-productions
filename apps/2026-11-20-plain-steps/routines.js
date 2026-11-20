/* Plain Steps: the routine logic. Pure functions with no page, storage or network, so they can be tested alone.
   A routine is a name and a short list of steps. Each step can be ticked. */
(function (root) {
  'use strict';

  var LIMITS = { name: 60, steps: 30, stepText: 120, routines: 20 };

  /* Starting points a person can edit. Written plainly and kept short. */
  var TEMPLATES = {
    en: [
      { name: 'Leaving the house', steps: ['Keys', 'Phone and charger', 'Wallet', 'Windows closed', 'Lights and stove off', 'Lock the door'] },
      { name: 'Morning', steps: ['Drink a glass of water', 'Wash and dress', 'Eat something', 'Look at today\'s plan', 'Take what you need for the day'] },
      { name: 'Close down the kitchen', steps: ['Dishes washed or in the dishwasher', 'Wipe the counters', 'Put the food away', 'Take out the rubbish', 'Switch off the stove and lights'] },
      { name: 'Weekly shop', steps: ['Check what is in the fridge', 'Write the list', 'Bags and cards', 'Shop', 'Put the shopping away'] }
    ],
    he: [
      { name: 'יוצאים מהבית', steps: ['מפתחות', 'טלפון ומטען', 'ארנק', 'חלונות סגורים', 'אורות וכיריים כבויים', 'נועלים את הדלת'] },
      { name: 'בוקר', steps: ['לשתות כוס מים', 'להתרחץ ולהתלבש', 'לאכול משהו', 'להסתכל על התוכנית להיום', 'לקחת את מה שצריך ליום'] },
      { name: 'סוגרים את המטבח', steps: ['הכלים שטופים או במדיח', 'מנגבים את השיש', 'מכניסים את האוכל למקום', 'מוציאים את האשפה', 'מכבים את הכיריים והאורות'] },
      { name: 'קניות שבועיות', steps: ['לבדוק מה יש במקרר', 'לכתוב רשימה', 'שקיות וכרטיסים', 'קונים', 'מסדרים את הקניות בבית'] }
    ]
  };

  function clip(s, n) { s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; }

  /** One step per line. Bullets, numbers and tick marks at the start of a line are dropped. */
  function parseSteps(text) {
    var out = [];
    String(text == null ? '' : text).split(/\r?\n/).forEach(function (line) {
      var s = line.replace(/^\s*(?:[-*•·✓✔☐☑]+|\d+[.)]|[א-ת][.)])\s*/, '');
      s = clip(s, LIMITS.stepText);
      if (s) out.push(s);
    });
    return out.slice(0, LIMITS.steps);
  }

  /** Steps back to one per line, for the edit box. */
  function stepsToText(routine) { return routine.steps.map(function (s) { return s.text; }).join('\n'); }

  /** A new routine, or the reason it cannot be made. */
  function make(name, stepsText, id, now) {
    var n = clip(name, LIMITS.name);
    if (!n) return { ok: false, why: 'name' };
    var steps = parseSteps(stepsText);
    if (!steps.length) return { ok: false, why: 'steps' };
    return { ok: true, routine: { id: id, name: n, steps: steps.map(function (t) { return { text: t, done: false }; }), at: now || 0 } };
  }

  /** The same routine with a new name and steps. A step that kept its words keeps its tick. */
  function edit(routine, name, stepsText) {
    var made = make(name, stepsText, routine.id, routine.at);
    if (!made.ok) return made;
    var ticked = {};
    routine.steps.forEach(function (s) { if (s.done) ticked[s.text] = true; });
    made.routine.steps.forEach(function (s) { if (ticked[s.text]) s.done = true; });
    return made;
  }

  function toggle(routine, index) {
    var steps = routine.steps.map(function (s, i) { return i === index ? { text: s.text, done: !s.done } : { text: s.text, done: s.done }; });
    return { id: routine.id, name: routine.name, steps: steps, at: routine.at };
  }

  function reset(routine) {
    return { id: routine.id, name: routine.name, steps: routine.steps.map(function (s) { return { text: s.text, done: false }; }), at: routine.at };
  }

  function progress(routine) {
    var done = routine.steps.filter(function (s) { return s.done; }).length;
    return { done: done, total: routine.steps.length, complete: routine.steps.length > 0 && done === routine.steps.length };
  }

  /** Whatever came out of storage, made safe: only well-formed routines, within the limits. */
  function sanitize(list) {
    if (!Array.isArray(list)) return [];
    var out = [];
    list.forEach(function (r) {
      if (!r || typeof r !== 'object' || typeof r.name !== 'string' || !Array.isArray(r.steps)) return;
      var steps = r.steps.filter(function (s) { return s && typeof s.text === 'string' && s.text.trim(); })
        .slice(0, LIMITS.steps).map(function (s) { return { text: clip(s.text, LIMITS.stepText), done: s.done === true }; });
      var name = clip(r.name, LIMITS.name);
      if (!name || !steps.length) return;
      out.push({ id: String(r.id == null ? out.length : r.id).slice(0, 40), name: name, steps: steps, at: Number(r.at) || 0 });
    });
    return out.slice(0, LIMITS.routines);
  }

  /** The direction a piece of text reads in, by its first letter: 'rtl', 'ltr', or '' when it has no letters yet. */
  function dirFor(text) {
    var m = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]|[A-Za-z\u00C0-\u024F]/.exec(String(text || ''));
    if (!m) return '';
    return /[A-Za-z\u00C0-\u024F]/.test(m[0]) ? 'ltr' : 'rtl';
  }

  var api = { LIMITS: LIMITS, TEMPLATES: TEMPLATES, parseSteps: parseSteps, stepsToText: stepsToText, make: make, edit: edit, toggle: toggle, reset: reset, progress: progress, sanitize: sanitize, dirFor: dirFor };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SoyaRoutines = api;
})(typeof window !== 'undefined' ? window : globalThis);
