#!/usr/bin/env node
/* Kafka Check on the command line, for scripts and CI.
     node cli.js producer.properties consumer.properties [--version 4|3|2] [--lang en|he] [--fail-on risk|warn|never] [--json]
   Reads each file (or standard input with "-"), prints what it found, and exits 1 if anything at or above --fail-on
   (default: risk) was found. Values that look like secrets are hidden. Nothing is sent anywhere. */
'use strict';
const fs = require('fs');
const K = require('./rules.js');

const args = process.argv.slice(2), files = [], opt = { version: 4, lang: 'en', failOn: 'risk', json: false };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--version') opt.version = Number(args[++i]); else if (a === '--lang') opt.lang = args[++i] === 'he' ? 'he' : 'en';
  else if (a === '--fail-on') opt.failOn = args[++i]; else if (a === '--json') opt.json = true;
  else if (a === '-h' || a === '--help') { console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace('#!/usr/bin/env node\n', '')); process.exit(0); }
  else files.push(a);
}
if (!files.length) { console.error('Give one or more config files (or - for standard input). Use --help for options.'); process.exit(2); }
if (!['risk', 'warn', 'never'].includes(opt.failOn)) { console.error('--fail-on must be risk, warn or never'); process.exit(2); }

const RANK = { risk: 0, warn: 1, tip: 2 }, LABEL = { risk: 'RISK', warn: 'WARN', tip: 'TIP ' };
let worst = 99, out = [];
for (const f of files) {
  let text;
  try { text = fs.readFileSync(f === '-' ? 0 : f, 'utf8'); } catch (e) { console.error('Cannot read ' + f + ': ' + e.message); process.exit(2); }
  const r = K.analyze(text, { version: opt.version });
  for (const x of r.findings) worst = Math.min(worst, RANK[x.level]);
  if (opt.json) { out.push({ file: f, roles: r.roles, settings: r.settings, hidden: r.hidden, counts: r.counts, findings: r.findings.map((x) => ({ id: x.id, level: x.level, keys: x.keys, title: x[opt.lang].title, why: x[opt.lang].why, fix: x[opt.lang].fix, docs: x.docs })) }); continue; }
  console.log('\n' + (f === '-' ? 'standard input' : f) + ': ' + r.settings + ' settings read' + (r.roles.length ? ' (' + r.roles.join(', ') + ')' : '') + (r.hidden ? ', ' + r.hidden + ' secret-looking values hidden' : '') + '. ' + r.counts.risk + ' risk, ' + r.counts.warn + ' warning, ' + r.counts.tip + ' tip.');
  for (const x of r.findings) {
    console.log('\n[' + LABEL[x.level] + '] ' + x[opt.lang].title + (x.keys.length ? '   (' + x.keys.map((k) => k.key + '=' + k.value).join(', ') + ')' : ''));
    console.log('  Why: ' + x[opt.lang].why); console.log('  Do:  ' + x[opt.lang].fix); console.log('  Docs: ' + x.docs);
  }
}
if (opt.json) console.log(JSON.stringify(out, null, 2));
else console.log('\nA config cannot prove a system is reliable: it cannot show your code, your processing time, or what happens when a broker fails.');
process.exit(opt.failOn === 'never' ? 0 : (worst <= RANK[opt.failOn] ? 1 : 0));
