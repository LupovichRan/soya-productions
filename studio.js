/* Studio brief builder. Mirrors the rules and the post template in factory/studio/studio.py so a person can see the post
   and the problems before running it. Nothing is stored and nothing is sent. */
(function () {
  'use strict';
  var SITE = 'https://lupovichran.github.io/soya-productions/', PHRASE = 'ONE APP A DAY UNTIL SOMETHING WILL CATCH ...';
  var KINDS = { app: '', alpha: ' (alpha)', parody: ' (parody)' }, LIMIT = 1300;
  var BANNED = /\b(film|films|movie|movies)\b/i, HYPE = /\b(guarantee[sd]?|proven demand|viral|#1|best in the world|revolutionary)\b/i, SECRET = /[\w.+-]+@[\w-]+\.[\w.]+|sk-[A-Za-z0-9]{8,}|eyJ[A-Za-z0-9_-]{10,}|sb_(?:publishable|secret)_\w+/;
  function v(id) { return document.getElementById(id).value.trim(); }
  function lines(id) { return v(id).split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean); }
  function brief() {
    var b = { slug: v('slug'), folder: v('folder'), number: parseInt(v('number'), 10), day: parseInt(v('day'), 10), date: v('date'), post_date: v('post_date'), mascot: v('mascot'), kind: v('kind'),
      title: { en: v('t_en'), he: v('t_he') }, line: { en: v('l_en'), he: v('l_he') }, limit: v('limit'),
      roadmap: { en: { works: lines('w_en'), next: lines('n_en'), later: lines('a_en'), ask: v('q_en') }, he: { works: lines('w_he'), next: lines('n_he'), later: lines('a_he'), ask: v('q_he') } }, explainer: null };
    if (!b.folder) delete b.folder;
    return b;
  }
  function post(b) {
    var r = b.roadmap.en, app = SITE + 'apps/' + b.folder + '/', one = SITE + 'one-pager.html?app=' + (b.folder || b.slug);
    var works = r.works.slice(0, 2).map(function (x, i) { x = x.replace(/\.$/, ''); return i ? x.toLowerCase() : x; }).join('; ');
    return [PHRASE, '', 'Day ' + b.day + ': ' + b.title.en + (KINDS[b.kind] || '') + '.', '', b.line.en, '', 'What works today: ' + works + '.', 'What it cannot do yet: ' + b.limit, '', 'Try it: ' + app,
      'The road map, and a question for you: ' + one, '', r.ask, '', 'Made by Soycatory, a small software factory. No accounts, no ads, no tracking.', ''].join('\n');
  }
  function problems(b) {
    var p = [];
    if (!/^[a-z0-9-]{3,60}$/.test(b.slug)) p.push('slug: 3 to 60 lowercase letters, digits or dashes');
    if (!b.folder) p.push('give the app folder (this builder only handles apps in this repository)');
    if (!(b.number >= 1)) p.push('number: the app number'); if (!(b.day >= 1)) p.push('day: which day of one app a day');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date)) p.push('date: when it was built');
    [['title', 'en'], ['title', 'he'], ['line', 'en'], ['line', 'he']].forEach(function (k) { if (!b[k[0]][k[1]]) p.push(k.join('.') + ' is missing'); });
    if (!b.limit) p.push('limit: one honest sentence about what it cannot do yet');
    ['en', 'he'].forEach(function (l) { var r = b.roadmap[l];
      if (r.works.length < 2 || r.works.length > 4) p.push('roadmap.' + l + '.works: two to four lines'); if (r.next.length < 2) p.push('roadmap.' + l + '.next: at least two lines');
      if (r.later.length < 1) p.push('roadmap.' + l + '.later: at least one line'); if (!r.ask) p.push('roadmap.' + l + '.ask: one question for people'); });
    if (p.length) return p;
    if (b.line.en.length > 220) p.push('line.en is too long (220 characters at most)');
    var all = JSON.stringify({ t: b.title, l: b.line, x: b.limit, r: b.roadmap }), m;
    if ((m = all.match(BANNED))) p.push('never call Soycatory or an app a film or movie (found "' + m[0] + '")');
    if ((m = all.match(HYPE))) p.push('no hype: "' + m[0] + '" claims something we did not measure');
    if ((m = all.match(SECRET))) p.push('looks like an email, key or token in the text');
    if (post(b).length > LIMIT) p.push('the post is ' + post(b).length + ' characters; keep it under ' + LIMIT);
    return p;
  }
  function update() {
    var b = brief(), p = problems(b), ul = document.getElementById('problems');
    ul.innerHTML = p.map(function (x) { return '<li>' + x.replace(/[<&]/g, '') + '</li>'; }).join(''); document.getElementById('ok').hidden = p.length > 0;
    var t = (b.roadmap.en.works.length && b.limit && b.title.en && b.line.en) ? post(b) : '';
    document.getElementById('post').textContent = t; document.getElementById('count').textContent = t ? t.length + ' of ' + LIMIT + ' characters' : '';
  }
  document.getElementById('f').addEventListener('input', update);
  document.getElementById('copy-post').addEventListener('click', function () { var t = document.getElementById('post').textContent; if (navigator.clipboard) navigator.clipboard.writeText(t); });
  document.getElementById('dl').addEventListener('click', function () {
    var b = brief(), blob = new Blob([JSON.stringify(b, null, 2) + '\n'], { type: 'application/json' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = (b.slug || 'brief') + '.json'; document.body.appendChild(a); a.click(); a.remove();
  });
  update();
})();
