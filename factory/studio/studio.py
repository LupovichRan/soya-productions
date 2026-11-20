#!/usr/bin/env python3
"""Soycatory Studio: one short brief in, everything an app needs to go out the door.

  python3 factory/studio/studio.py build brief.json [--list] [--fonts DIR] [--voice FILE --piper "CMD"]
  python3 factory/studio/studio.py check          # what is missing, app by app
  python3 factory/studio/studio.py post brief.json  # print the LinkedIn post

A brief (see brief.example.json) names the app, says what it is in English and Hebrew, what works today, one honest limit,
the road map and one question for people. `build` checks the brief against the rules below, then writes:
  - the LinkedIn post             factory/posts/<date>-<slug>.md
  - the one-pager road map        roadmaps.js  (the entry for the app)
  - the front-page list entry     apps.js      (only with --list, and only if the app is not there yet)
  - the 7-second intro video      assets/intros/<slug>.mp4      (with --fonts; needs ffmpeg, numpy, Pillow)
  - the share card                assets/brand/<slug>.png       (with --fonts)
  - an explainer video            assets/videos/<slug>.*        (if the brief names a script, with --voice and --piper)
Standard library only. Each picture or video step is a script that already exists next to this one."""
import argparse, json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SITE = 'https://lupovichran.github.io/soya-productions/'
PHRASE = 'ONE APP A DAY UNTIL SOMETHING WILL CATCH ...'
MASCOTS = ('cat', 'fox', 'owl', 'bear', 'rabbit', 'frog')
KINDS = {'app': '', 'alpha': ' (alpha)', 'parody': ' (parody)'}
POST_LIMIT = 1300
BANNED = re.compile(r'\b(film|films|movie|movies)\b', re.I)           # Soycatory is a software factory
HYPE = re.compile(r'\b(guarantee[sd]?|proven demand|viral|#1|best in the world|revolutionary)\b', re.I)
SECRET = re.compile(r'[\w.+-]+@[\w-]+\.[\w.]+|sk-[A-Za-z0-9]{8,}|eyJ[A-Za-z0-9_-]{10,}|sb_(?:publishable|secret)_\w+')


def key_of(b):
    return b.get('key') or b.get('folder') or b['slug']


def validate(b, root=None):
    """Return a list of plain-words problems; an empty list means the brief is good to build."""
    p = []
    def need(cond, msg):
        if not cond: p.append(msg)
    need(re.fullmatch(r'[a-z0-9-]{3,60}', str(b.get('slug', ''))), 'slug: 3 to 60 lowercase letters, digits or dashes')
    need(re.fullmatch(r'\d{4}-\d{2}-\d{2}', str(b.get('date', ''))), 'date: YYYY-MM-DD (the day the app was built)')
    need(not b.get('post_date') or re.fullmatch(r'\d{4}-\d{2}-\d{2}', str(b['post_date'])), 'post_date: YYYY-MM-DD (the day the post goes out; defaults to date)')
    need(isinstance(b.get('number'), int) and b['number'] >= 1, 'number: the app number, 1 or more')
    need(isinstance(b.get('day'), int) and b['day'] >= 1, 'day: which day of "one app a day" this is')
    need(b.get('mascot') in MASCOTS, 'mascot: one of ' + ', '.join(MASCOTS))
    need(b.get('kind') in KINDS, 'kind: app, alpha or parody')
    need(bool(b.get('folder')) != bool(b.get('open')), 'give either folder (an app in this repository) or open (a link to where it lives)')
    for f in ('title', 'line'):
        for l in ('en', 'he'):
            need(isinstance(b.get(f), dict) and str(b[f].get(l, '')).strip(), '%s.%s is missing' % (f, l))
    need(str(b.get('limit', '')).strip(), 'limit: one honest sentence about what it cannot do yet')
    for l in ('en', 'he'):
        r = (b.get('roadmap') or {}).get(l) or {}
        need(2 <= len(r.get('works', [])) <= 4, 'roadmap.%s.works: two to four lines' % l)
        need(len(r.get('next', [])) >= 2, 'roadmap.%s.next: at least two lines' % l)
        need(len(r.get('later', [])) >= 1, 'roadmap.%s.later: at least one line' % l)
        need(str(r.get('ask', '')).strip(), 'roadmap.%s.ask: one question for people' % l)
    if p: return p
    need(len(b['line']['en']) <= 220, 'line.en is too long (220 characters at most)')
    if root and b.get('folder'): need(os.path.isfile(os.path.join(root, 'apps', b['folder'], 'index.html')), 'apps/%s/index.html does not exist' % b['folder'])
    texts = json.dumps({k: b[k] for k in ('title', 'line', 'limit', 'roadmap')}, ensure_ascii=False)
    for m in BANNED.findall(texts): p.append('never call Soycatory or an app a film or movie (found "%s")' % m)
    for m in HYPE.findall(texts): p.append('no hype: "%s" claims something we did not measure' % m)
    for m in SECRET.findall(texts): p.append('looks like an email, key or token in the text: "%s"' % m[:20])
    text = post_text(b)
    need(len(text) <= POST_LIMIT, 'the post is %d characters; keep it under %d' % (len(text), POST_LIMIT))
    return p


def urls(b):
    app = SITE + 'apps/' + b['folder'] + '/' if b.get('folder') else b['open']
    return app, SITE + 'one-pager.html?app=' + key_of(b)


def post_text(b):
    app, one = urls(b); r = b['roadmap']['en']
    works = '; '.join(x.rstrip('.').lower() if i else x.rstrip('.') for i, x in enumerate(r['works'][:2]))
    return '\n'.join([PHRASE, '', 'Day %d: %s%s.' % (b['day'], b['title']['en'], KINDS[b['kind']]), '', b['line']['en'].strip(), '',
                      'What works today: %s.' % works, 'What it cannot do yet: %s' % b['limit'].strip(), '',
                      'Try it: ' + app, 'The road map, and a question for you: ' + one, '', r['ask'].strip(), '',
                      'Made by Soycatory, a small software factory. No accounts, no ads, no tracking.', ''])


def read_roadmaps(root):
    path = os.path.join(root, 'roadmaps.js'); s = open(path, encoding='utf-8').read()
    m = re.search(r'/\*JSON-START\*/(.*)/\*JSON-END\*/', s, re.S)
    if not m: sys.exit('roadmaps.js has no JSON-START / JSON-END markers')
    return path, s, m, json.loads(m.group(1))


def write_roadmap(b, root):
    path, s, m, data = read_roadmaps(root)
    entry = {'slug': b['slug']}
    if b.get('open'): entry['open'] = b['open']
    entry['en'] = b['roadmap']['en']; entry['he'] = b['roadmap']['he']
    data[key_of(b)] = entry
    open(path, 'w', encoding='utf-8').write(s[:m.start(1)] + json.dumps(data, ensure_ascii=False, indent=2) + s[m.end(1):])


def write_apps_entry(b, root):
    path = os.path.join(root, 'apps.js'); s = open(path, encoding='utf-8').read()
    marker = (b['folder'] if b.get('folder') else b['open'])
    if marker in s: return False
    def q(x): return "'" + x.replace('\\', '\\\\').replace("'", "\\'") + "'"
    where = ("folder: %s" % q(b['folder'])) if b.get('folder') else ("url: %s" % q(b['open']))
    entry = ("  {\n    number: %d,\n    date: %s,\n    %s,\n    mascot: %s,\n    en: {\n      title: %s,\n      line: %s\n    },\n    he: {\n      title: %s,\n      line: %s\n    }\n  },\n"
             % (b['number'], q(b['date']), where, q(b['mascot']), q(b['title']['en']), q(b['line']['en']), q(b['title']['he']), q(b['line']['he'])))
    i = s.index('window.SOYA_APPS = [') + len('window.SOYA_APPS = [\n')
    open(path, 'w', encoding='utf-8').write(s[:i] + entry + s[i:]); return True


def run(cmd):
    print('+', ' '.join(cmd)); r = subprocess.run(cmd)
    if r.returncode: sys.exit('step failed: ' + ' '.join(cmd[:3]))


def build(args):
    b = json.load(open(args.brief, encoding='utf-8')); probs = validate(b, ROOT)
    if probs: sys.exit('The brief needs fixing:\n- ' + '\n- '.join(probs))
    post = os.path.join(ROOT, 'factory', 'posts', '%s-%s.md' % (b.get('post_date') or b['date'], b['slug']))
    open(post, 'w', encoding='utf-8').write(post_text(b)); print('post       ', os.path.relpath(post, ROOT))
    write_roadmap(b, ROOT); print('road map   ', 'roadmaps.js ->', key_of(b))
    if args.list: print('front page ', 'added' if write_apps_entry(b, ROOT) else 'already listed')
    if args.fonts:
        if not args.no_intro: run([sys.executable, os.path.join(ROOT, 'factory', 'intro', 'make_intro.py'), '--fonts', args.fonts, '--brief', args.brief])
        run([sys.executable, os.path.join(ROOT, 'factory', 'studio', 'make_brand.py'), '--brief', args.brief, '--fonts', args.fonts])
    if b.get('explainer'):
        if not (args.voice and args.piper and args.fonts): print('explainer   skipped (give --voice, --piper and --fonts)')
        else: run([sys.executable, os.path.join(ROOT, 'factory', 'videos', 'make_video.py'), '--script', os.path.join(ROOT, b['explainer']), '--voice', args.voice, '--piper', args.piper, '--fonts', args.fonts, '--out', os.path.join(ROOT, 'assets', 'videos')])
    print('done. Check the one-pager at one-pager.html?app=%s, then open a pull request.' % key_of(b))


def check(_):
    s = open(os.path.join(ROOT, 'apps.js'), encoding='utf-8').read()
    _, _, _, rm = read_roadmaps(ROOT); gaps = 0
    for blk in re.split(r'\n  \{\n', s)[1:]:
        f = re.search(r"folder: '([^']+)'", blk); pth = re.search(r"path: '([^']+)'", blk); n = re.search(r'number: (\d+)', blk)
        key = f.group(1) if f else 'roundtable'; r = rm.get(key); slug = (r or {}).get('slug', '')
        miss = []
        if not r: miss.append('road map entry')
        else:
            for label, rel in (('intro video', 'assets/intros/%s.mp4' % slug), ('share card', 'assets/brand/%s.png' % slug)):
                if not os.path.isfile(os.path.join(ROOT, rel)): miss.append(label)
            if not [x for x in os.listdir(os.path.join(ROOT, 'factory', 'posts')) if x.endswith('-%s.md' % slug)]: miss.append('post')
        gaps += bool(miss); print('app %s %-30s %s' % (n.group(1) if n else '?', key, 'ok' if not miss else 'missing: ' + ', '.join(miss)))
    print('%d app(s) with gaps' % gaps)


if __name__ == '__main__':
    ap = argparse.ArgumentParser(); sub = ap.add_subparsers(dest='cmd', required=True)
    b = sub.add_parser('build'); b.add_argument('brief'); b.add_argument('--list', action='store_true'); b.add_argument('--fonts'); b.add_argument('--no-intro', action='store_true', help='keep the intro video that is already there'); b.add_argument('--voice'); b.add_argument('--piper'); b.set_defaults(fn=build)
    c = sub.add_parser('check'); c.set_defaults(fn=check)
    pp = sub.add_parser('post'); pp.add_argument('brief'); pp.set_defaults(fn=lambda a: print(post_text(json.load(open(a.brief, encoding='utf-8')))))
    a = ap.parse_args(); a.fn(a)
