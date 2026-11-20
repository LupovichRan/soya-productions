# Run with: python3 -m unittest discover -s factory/studio
import copy, json, os, unittest
import studio

HERE = os.path.dirname(os.path.abspath(__file__))
BRIEF = json.load(open(os.path.join(HERE, 'brief.example.json'), encoding='utf-8'))


class Studio(unittest.TestCase):
    def test_the_example_brief_is_good(self):
        self.assertEqual(studio.validate(BRIEF, studio.ROOT), [])

    def test_the_post_follows_the_rules(self):
        t = studio.post_text(BRIEF)
        self.assertTrue(t.startswith('ONE APP A DAY UNTIL SOMETHING WILL CATCH ...\n'))
        self.assertLessEqual(len(t), 1300)
        for need in ('Day 1: Plain Steps.', 'What works today:', 'What it cannot do yet:', 'Try it: https://', 'one-pager.html?app=2026-11-20-plain-steps', 'What do you do again and again', 'No accounts, no ads, no tracking.'):
            self.assertIn(need, t)
        self.assertNotRegex(t, r'(?i)\b(film|movie)')

    def test_kinds_are_labelled(self):
        b = copy.deepcopy(BRIEF); b['kind'] = 'alpha'; self.assertIn('Day 1: Plain Steps (alpha).', studio.post_text(b))
        b['kind'] = 'parody'; self.assertIn('(parody)', studio.post_text(b))

    def test_missing_pieces_are_named_in_plain_words(self):
        for path, want in ((['limit'], 'limit'), (['title', 'he'], 'title.he'), (['roadmap', 'en', 'ask'], 'roadmap.en.ask'), (['mascot'], 'mascot'), (['number'], 'number')):
            b = copy.deepcopy(BRIEF); d = b
            for k in path[:-1]: d = d[k]
            del d[path[-1]]
            self.assertTrue(any(want in x for x in studio.validate(b, studio.ROOT)), want)
        b = copy.deepcopy(BRIEF); b['roadmap']['en']['works'] = ['only one']; self.assertTrue(any('works' in x for x in studio.validate(b)))

    def test_the_brand_rules_are_enforced(self):
        b = copy.deepcopy(BRIEF); b['line']['en'] = 'A film about routines.'; self.assertTrue(any('film' in x for x in studio.validate(b)))
        b = copy.deepcopy(BRIEF); b['limit'] = 'It has proven demand and will go viral.'; self.assertTrue(any('hype' in x for x in studio.validate(b)))
        b = copy.deepcopy(BRIEF); b['roadmap']['en']['ask'] = 'Write to ran@example.com'; self.assertTrue(any('email' in x for x in studio.validate(b)))
        b = copy.deepcopy(BRIEF); b['line']['en'] = 'x' * 300; self.assertTrue(any('too long' in x for x in studio.validate(b)))
        b = copy.deepcopy(BRIEF); b['roadmap']['en']['works'] = ['y' * 400, 'z' * 400]; self.assertTrue(any('characters' in x for x in studio.validate(b)))

    def test_folder_or_open_not_both_not_neither(self):
        b = copy.deepcopy(BRIEF); b['open'] = 'https://example.org/x/'; self.assertTrue(any('folder' in x for x in studio.validate(b)))
        b = copy.deepcopy(BRIEF); del b['folder']; self.assertTrue(any('folder' in x for x in studio.validate(b)))
        b['open'] = 'https://example.org/x/'; self.assertEqual(studio.validate(b), [])
        self.assertEqual(studio.urls(b)[0], 'https://example.org/x/')

    def test_the_folder_must_exist(self):
        b = copy.deepcopy(BRIEF); b['folder'] = '2099-01-01-nothing'; self.assertTrue(any('does not exist' in x for x in studio.validate(b, studio.ROOT)))

    def test_every_app_already_listed_has_a_roadmap_entry(self):
        _, _, _, rm = studio.read_roadmaps(studio.ROOT)
        self.assertIn('2026-11-20-plain-steps', rm); self.assertIn('roundtable', rm)
        for key, r in rm.items():
            self.assertTrue(r.get('slug'), key); self.assertEqual(len(r['en']['works']) >= 2, True); self.assertEqual(set(r['en']), set(r['he']))


if __name__ == '__main__':
    unittest.main()
