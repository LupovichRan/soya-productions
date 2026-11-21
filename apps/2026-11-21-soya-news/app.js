/* Soya News: a weekly AI newspaper for curious kids, read by Soya the cat reporter.
   The reader picks an age from 6 to 26 and the same story is told at that level, in English, Hebrew or French.
   Stored on this device only: language, age, Soya's mood, a nickname, the last issue seen, quiz answers.
   Nothing is counted and nothing is sent, except a topic idea a reader chooses to send (no name, no email). */
(function () {
  'use strict';

  var K = { lang: 'soya-news-lang', age: 'soya-news-age', mood: 'soya-news-mood', nick: 'soya-news-nick', seen: 'soya-news-seen', quiz: 'soya-news-quiz' };
  var LANGS = ['en', 'he', 'fr'];
  var BANDS = [{ id: 'cub', from: 6, to: 8 }, { id: 'explorer', from: 9, to: 12 }, { id: 'teen', from: 13, to: 17 }, { id: 'grown', from: 18, to: 26 }];

  var I18N = {
    en: {
      name: 'Soya News', tagline: 'AI news for curious kids, by Soya the cat reporter', week: 'This week',
      ageQ: 'How old is the reader?', ageYears: function (n) { return n + ' years'; },
      bands: { cub: 'Kitten', explorer: 'Explorer', teen: 'Teen', grown: 'Big kid' },
      bandNote: { cub: 'Short and simple, with pictures in words.', explorer: 'How it works, with real numbers.', teen: 'The why behind it, and a question to think about.', grown: 'The full picture, with the details.' },
      word: 'Word of the week', quiz: 'Quick quiz', right: 'Yes!', wrong: 'Not quite. The answer is:', source: 'Where this came from',
      mood: "Soya's mood", moods: { curious: 'Curious', silly: 'Silly', calm: 'Calm' },
      nick: 'What should Soya call you?', nickHint: 'A nickname only. It stays on this device.',
      lang: 'Language', settings: 'Make it yours',
      notifyTitle: 'Tell me when the next issue is out', notifyBtn: 'Tell me when it is out',
      notifyAsk: 'Ask a grown-up before you turn this on.',
      notifyOn: 'Done. On this device, Soya will let you know when a new issue is out, if your browser allows it.',
      notifyOpen: 'This browser can only show the news when you open the app. Add it to your home screen to keep it close.',
      notifyBlocked: 'Notifications are switched off for this site in your browser settings.',
      notifyNone: 'This browser cannot show notifications. Open the app each week to see the new issue.',
      install: 'Add Soya News to your home screen from your browser menu, and it opens like an app.',
      newIssue: 'A new issue is out!',
      ideaTitle: 'What should Soya report on next?', ideaLabel: 'Your idea', ideaSend: 'Send my idea',
      ideaSafe: "Don't write your name, your school or where you live.", ideaShort: 'Write a few more words.', ideaThanks: 'Thank you! Soya reads every idea.', ideaFailed: 'That did not send. Please try again later.',
      ideaClosed: "Soya's idea box opens soon.",
      older: 'Earlier issues', synthetic: 'Soya is a cartoon cat. The stories are written by the Soycatory team from real news, with a link to each source.',
      privacy: 'No ads. Nothing is counted. Your choices stay on this device.',
      credit: 'Made by Soycatory', home: 'All apps', of: function (a, b) { return a + ' of ' + b; }
    },
    he: {
      name: 'החדשות של סויה', tagline: 'חדשות בינה מלאכותית לילדים סקרנים, מאת סויה הכתב החתול', week: 'השבוע',
      ageQ: 'בן או בת כמה הקורא?', ageYears: function (n) { return 'בן ' + n; },
      bands: { cub: 'גור', explorer: 'חוקר', teen: 'נוער', grown: 'ילד גדול' },
      bandNote: { cub: 'קצר ופשוט, עם תמונות במילים.', explorer: 'איך זה עובד, עם מספרים אמיתיים.', teen: 'הלמה שמאחורי, ושאלה לחשוב עליה.', grown: 'התמונה המלאה, עם הפרטים.' },
      word: 'המילה של השבוע', quiz: 'חידון קצר', right: 'נכון!', wrong: 'כמעט. התשובה היא:', source: 'מאיפה זה הגיע',
      mood: 'מצב הרוח של סויה', moods: { curious: 'סקרן', silly: 'מצחיק', calm: 'רגוע' },
      nick: 'איך סויה יקרא לכם?', nickHint: 'רק כינוי. הוא נשאר במכשיר הזה.',
      lang: 'שפה', settings: 'עושים את זה שלכם',
      notifyTitle: 'תגידו לי כשהגיליון הבא יוצא', notifyBtn: 'תגידו לי כשהוא יוצא',
      notifyAsk: 'שאלו מבוגר לפני שמפעילים את זה.',
      notifyOn: 'סיימנו. במכשיר הזה סויה יודיע לכם כשיוצא גיליון חדש, אם הדפדפן מאפשר.',
      notifyOpen: 'הדפדפן הזה יכול להראות את החדשות רק כשפותחים את האפליקציה. הוסיפו אותה למסך הבית כדי שתהיה קרובה.',
      notifyBlocked: 'ההתראות כבויות לאתר הזה בהגדרות הדפדפן.',
      notifyNone: 'הדפדפן הזה לא יכול להראות התראות. פתחו את האפליקציה כל שבוע כדי לראות את הגיליון החדש.',
      install: 'הוסיפו את החדשות של סויה למסך הבית מתפריט הדפדפן, והן ייפתחו כמו אפליקציה.',
      newIssue: 'יצא גיליון חדש!',
      ideaTitle: 'על מה סויה ידווח בפעם הבאה?', ideaLabel: 'הרעיון שלכם', ideaSend: 'שולחים את הרעיון',
      ideaSafe: 'אל תכתבו את השם שלכם, את בית הספר או איפה אתם גרים.', ideaShort: 'כתבו עוד כמה מילים.', ideaThanks: 'תודה! סויה קורא כל רעיון.', ideaFailed: 'זה לא נשלח. נסו שוב מאוחר יותר.',
      ideaClosed: 'תיבת הרעיונות של סויה נפתחת בקרוב.',
      older: 'גיליונות קודמים', synthetic: 'סויה הוא חתול מצויר. הכתבות נכתבות על ידי צוות Soycatory מחדשות אמיתיות, עם קישור לכל מקור.',
      privacy: 'בלי פרסומות. שום דבר לא נספר. הבחירות שלכם נשארות במכשיר.',
      credit: 'נוצר על ידי Soycatory', home: 'כל האפליקציות', of: function (a, b) { return a + ' מתוך ' + b; }
    },
    fr: {
      name: 'Les Nouvelles de Soya', tagline: "L'actu de l'IA pour enfants curieux, par Soya le chat reporter", week: 'Cette semaine',
      ageQ: 'Quel âge a le lecteur ?', ageYears: function (n) { return n + ' ans'; },
      bands: { cub: 'Chaton', explorer: 'Explorateur', teen: 'Ado', grown: 'Grand enfant' },
      bandNote: { cub: 'Court et simple, avec des images en mots.', explorer: 'Comment ça marche, avec de vrais chiffres.', teen: 'Le pourquoi, et une question pour réfléchir.', grown: "L'image complète, avec les détails." },
      word: 'Le mot de la semaine', quiz: 'Petit quiz', right: 'Oui !', wrong: 'Presque. La réponse est :', source: "D'où ça vient",
      mood: "L'humeur de Soya", moods: { curious: 'Curieux', silly: 'Rigolo', calm: 'Calme' },
      nick: "Comment Soya doit-il t'appeler ?", nickHint: 'Juste un surnom. Il reste sur cet appareil.',
      lang: 'Langue', settings: 'À ta façon',
      notifyTitle: 'Préviens-moi pour le prochain numéro', notifyBtn: 'Préviens-moi',
      notifyAsk: "Demande à un adulte avant d'activer ça.",
      notifyOn: "C'est fait. Sur cet appareil, Soya te préviendra quand un nouveau numéro sort, si ton navigateur le permet.",
      notifyOpen: "Ce navigateur ne peut montrer les nouvelles que quand tu ouvres l'appli. Ajoute-la à ton écran d'accueil pour l'avoir sous la main.",
      notifyBlocked: 'Les notifications sont désactivées pour ce site dans les réglages du navigateur.',
      notifyNone: "Ce navigateur ne peut pas afficher de notifications. Ouvre l'appli chaque semaine pour voir le nouveau numéro.",
      install: "Ajoute Les Nouvelles de Soya à ton écran d'accueil depuis le menu du navigateur : elle s'ouvrira comme une appli.",
      newIssue: 'Un nouveau numéro est sorti !',
      ideaTitle: 'De quoi Soya doit-il parler la prochaine fois ?', ideaLabel: 'Ton idée', ideaSend: 'Envoyer mon idée',
      ideaSafe: "N'écris pas ton nom, ton école ni où tu habites.", ideaShort: 'Écris encore quelques mots.', ideaThanks: 'Merci ! Soya lit toutes les idées.', ideaFailed: "Ça n'est pas parti. Réessaie plus tard.",
      ideaClosed: "La boîte à idées de Soya ouvre bientôt.",
      older: 'Anciens numéros', synthetic: "Soya est un chat de dessin animé. Les articles sont écrits par l'équipe Soycatory à partir de vraies nouvelles, avec un lien vers chaque source.",
      privacy: 'Pas de pub. Rien n\'est compté. Tes choix restent sur cet appareil.',
      credit: 'Fait par Soycatory', home: 'Toutes les applis', of: function (a, b) { return a + ' sur ' + b; }
    }
  };

  /* Soya's personality: how he greets, reacts and signs off. Facts never change with the mood. */
  var MOODS = {
    curious: {
      en: { hi: function (n) { return 'Hello' + (n ? ' ' + n : '') + "! Soya here, ears up. I sniffed out five big stories this week."; }, react: ['Ooh, how does that work?', 'I have so many questions!', 'Wait, really? Let me look closer.', 'Hmm, who decides that?', "Now that's interesting!"], bye: 'Keep asking questions. See you next week!' },
      he: { hi: function (n) { return 'שלום' + (n ? ' ' + n : '') + '! כאן סויה, עם אוזניים זקופות. רחרחתי השבוע חמש כתבות גדולות.'; }, react: ['אוו, איך זה עובד?', 'יש לי כל כך הרבה שאלות!', 'רגע, באמת? בואו נסתכל מקרוב.', 'הממ, מי מחליט את זה?', 'זה ממש מעניין!'], bye: 'תמשיכו לשאול שאלות. נתראה בשבוע הבא!' },
      fr: { hi: function (n) { return 'Bonjour' + (n ? ' ' + n : '') + ' ! Ici Soya, les oreilles dressées. Cette semaine, j\'ai flairé cinq grandes histoires.'; }, react: ['Oh, comment ça marche ?', "J'ai plein de questions !", 'Attends, vraiment ? Regardons de plus près.', 'Hmm, qui décide ça ?', 'Ça, c\'est intéressant !'], bye: 'Continue à poser des questions. À la semaine prochaine !' }
    },
    silly: {
      en: { hi: function (n) { return 'Meow-llo' + (n ? ' ' + n : '') + '! Soya, star reporter and part-time sock thief, with the news!'; }, react: ['Purr-fectly bonkers!', 'I would trade my favourite box for one of those.', 'This news made my whiskers wiggle!', "Hold my fish, there's more!", 'Paws up if you saw that coming!'], bye: 'That\'s all, folks! Time for my 14th nap.' },
      he: { hi: function (n) { return 'מיאו־לום' + (n ? ' ' + n : '') + '! סויה, כתב כוכב וגנב גרביים במשרה חלקית, עם החדשות!'; }, react: ['משוגע לגמרי, מיאו!', 'הייתי מחליף את הקופסה האהובה שלי באחד כזה.', 'החדשות האלה הזיזו לי את השפם!', 'תחזיקו לי את הדג, יש עוד!', 'מי שניחש את זה, להרים כפה!'], bye: 'זה הכול, חברים! הגיע הזמן לתנומה ה־14 שלי.' },
      fr: { hi: function (n) { return 'Miaou-jour' + (n ? ' ' + n : '') + ' ! Soya, reporter vedette et voleur de chaussettes à mi-temps, avec les nouvelles !'; }, react: ['Com-plè-te-ment ronron-dingue !', "J'échangerais mon carton préféré contre ça.", 'Cette nouvelle m\'a fait frétiller les moustaches !', "Tiens mon poisson, il y a encore mieux !", 'Patte en l\'air si tu l\'avais deviné !'], bye: 'C\'est tout pour aujourd\'hui ! L\'heure de ma 14e sieste.' }
    },
    calm: {
      en: { hi: function (n) { return 'Hi' + (n ? ' ' + n : '') + '. Soya here. Get comfy; here is what happened in AI this week, one story at a time.'; }, react: ['Take a breath. It is simpler than it sounds.', 'Big news, small steps.', 'Let us think about this slowly.', 'No rush. Read it twice if you like.', 'Good to know, nothing to worry about.'], bye: 'Thank you for reading with me. Rest well.' },
      he: { hi: function (n) { return 'היי' + (n ? ' ' + n : '') + '. כאן סויה. תתרווחו; הנה מה שקרה השבוע בבינה מלאכותית, כתבה אחת בכל פעם.'; }, react: ['נושמים. זה פשוט יותר ממה שזה נשמע.', 'חדשות גדולות, צעדים קטנים.', 'בואו נחשוב על זה לאט.', 'אין לחץ. אפשר לקרוא פעמיים.', 'טוב לדעת, אין מה לדאוג.'], bye: 'תודה שקראתם איתי. מנוחה נעימה.' },
      fr: { hi: function (n) { return 'Coucou' + (n ? ' ' + n : '') + '. Ici Soya. Installe-toi ; voici ce qui s\'est passé dans l\'IA cette semaine, une histoire à la fois.'; }, react: ['Respire. C\'est plus simple que ça en a l\'air.', 'Grandes nouvelles, petits pas.', 'Réfléchissons-y doucement.', 'Rien ne presse. Relis si tu veux.', 'Bon à savoir, rien d\'inquiétant.'], bye: 'Merci d\'avoir lu avec moi. Repose-toi bien.' }
    }
  };

  function get(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
  function put(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* blocked: fine */ } }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var lang = get(K.lang, null);
  if (LANGS.indexOf(lang) < 0) { var nl = (navigator.language || '').toLowerCase(); lang = /^(he|iw)/.test(nl) ? 'he' : /^fr/.test(nl) ? 'fr' : 'en'; }
  var age = Math.min(26, Math.max(6, parseInt(get(K.age, '9'), 10) || 9));
  var mood = MOODS[get(K.mood, 'curious')] ? get(K.mood, 'curious') : 'curious';
  var nick = String(get(K.nick, '')).slice(0, 20);
  var quiz = {}; try { quiz = JSON.parse(get(K.quiz, '{}')) || {}; } catch (e) { quiz = {}; }
  var data = null, issueId = null, notice = '';

  function t(k) { return I18N[lang][k]; }
  function L(o) { return (o && (o[lang] || o.en)) || ''; }
  function band() { for (var i = 0; i < BANDS.length; i++) if (age <= BANDS[i].to) return BANDS[i].id; return 'grown'; }
  function boxDir() { return lang === 'he' ? 'rtl' : 'ltr'; }

  /* Drawings: simple shapes, so they stay crisp on any screen. */
  function soya(size, extra) {
    return '<svg class="soya' + (extra || '') + '" width="' + size + '" height="' + size + '" viewBox="0 0 120 120" aria-hidden="true">' +
      '<ellipse cx="60" cy="112" rx="34" ry="5" fill="#000" opacity=".25"/>' +
      '<path d="M26 44 L30 12 L52 32 Z M94 44 L90 12 L68 32 Z" fill="#2A2F3D" stroke="#7C86A2" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M33 38 L34 22 L45 33 Z M87 38 L86 22 L75 33 Z" fill="#FF8FB1"/>' +
      '<ellipse cx="60" cy="62" rx="40" ry="36" fill="#2A2F3D" stroke="#7C86A2" stroke-width="2.5"/>' +
      '<path d="M22 34 Q60 6 98 34 L96 40 Q60 22 24 40 Z" fill="#FFC94D"/><rect x="40" y="18" width="40" height="13" rx="3" fill="#FFF3D1"/>' +
      '<text x="60" y="28.5" text-anchor="middle" font-size="9" font-weight="700" fill="#1B2032" font-family="Rubik,Arial,sans-serif">PRESS</text>' +
      '<ellipse cx="45" cy="58" rx="9" ry="11" fill="#E8F86A"/><ellipse cx="75" cy="58" rx="9" ry="11" fill="#E8F86A"/>' +
      '<ellipse cx="46" cy="60" rx="4" ry="7" fill="#11131A"/><ellipse cx="76" cy="60" rx="4" ry="7" fill="#11131A"/>' +
      '<circle cx="43.5" cy="55" r="2.2" fill="#fff"/><circle cx="73.5" cy="55" r="2.2" fill="#fff"/>' +
      '<path d="M56 72 L64 72 L60 77 Z" fill="#FF8FB1"/><path d="M60 77 Q55 83 50 80 M60 77 Q65 83 70 80" stroke="#7C86A2" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '<path d="M20 68 L6 66 M20 74 L7 77 M100 68 L114 66 M100 74 L113 77" stroke="#7C86A2" stroke-width="2" stroke-linecap="round"/>' +
      '<rect x="88" y="78" width="8" height="26" rx="4" fill="#9AA3B8" transform="rotate(-25 92 91)"/><circle cx="99" cy="76" r="9" fill="#5EE0C1" stroke="#1B2032" stroke-width="2"/>' +
      '</svg>';
  }
  var ART = {
    stock: '<rect x="10" y="62" width="14" height="22" rx="3" fill="#5EE0C1"/><rect x="30" y="48" width="14" height="36" rx="3" fill="#5EE0C1"/><rect x="50" y="34" width="14" height="50" rx="3" fill="#5EE0C1"/><path d="M78 26 L112 40 L86 76 Z" fill="#FFC94D" stroke="#1B2032" stroke-width="2"/><circle cx="92" cy="44" r="4" fill="#FF6B6B"/><circle cx="88" cy="58" r="3.5" fill="#FF6B6B"/><path d="M8 40 L28 30 L44 36 L66 18" stroke="#FF8FB1" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    chip: '<rect x="34" y="20" width="52" height="52" rx="8" fill="#3B4466" stroke="#5EE0C1" stroke-width="3"/><rect x="46" y="32" width="28" height="28" rx="4" fill="#5EE0C1"/>' + [0, 1, 2, 3].map(function (i) { var p = 30 + i * 12; return '<path d="M' + p + ' 20 V10 M' + p + ' 72 V82 M34 ' + p + ' H24 M86 ' + p + ' H96" stroke="#9AA3B8" stroke-width="3" stroke-linecap="round"/>'; }).join('') + '<circle cx="60" cy="46" r="5" fill="#1B2032"/>',
    border: '<circle cx="60" cy="46" r="34" fill="#3B6FD9"/><path d="M38 30 Q48 24 54 34 Q50 46 40 44 Z M64 52 Q78 46 84 58 Q76 72 66 66 Z M66 22 Q76 20 80 30 Q72 32 66 28 Z" fill="#5EE0C1"/><rect x="2" y="70" width="26" height="18" rx="4" fill="#3B4466" stroke="#FFC94D" stroke-width="2"/><rect x="92" y="70" width="26" height="18" rx="4" fill="#3B4466" stroke="#FFC94D" stroke-width="2"/><path d="M30 79 H90" stroke="#FF8FB1" stroke-width="3" stroke-dasharray="6 5"/>',
    helper: '<rect x="36" y="8" width="48" height="80" rx="9" fill="#3B4466" stroke="#9AA3B8" stroke-width="3"/><rect x="42" y="18" width="36" height="56" rx="4" fill="#1B2032"/><rect x="47" y="24" width="12" height="12" rx="3" fill="#FFC94D"/><rect x="62" y="24" width="12" height="12" rx="3" fill="#5EE0C1"/><rect x="47" y="40" width="12" height="12" rx="3" fill="#FF8FB1"/><rect x="62" y="40" width="12" height="12" rx="3" fill="#3B6FD9"/><ellipse cx="88" cy="62" rx="14" ry="12" fill="#2A2F3D" stroke="#7C86A2" stroke-width="2"/><circle cx="81" cy="52" r="4" fill="#2A2F3D" stroke="#7C86A2" stroke-width="2"/><circle cx="90" cy="49" r="4" fill="#2A2F3D" stroke="#7C86A2" stroke-width="2"/><circle cx="98" cy="54" r="4" fill="#2A2F3D" stroke="#7C86A2" stroke-width="2"/>',
    label: '<rect x="12" y="14" width="70" height="60" rx="6" fill="#FFF3D1" stroke="#9AA3B8" stroke-width="3"/><path d="M18 66 L38 42 L52 56 L62 46 L76 66 Z" fill="#5EE0C1"/><circle cx="64" cy="28" r="7" fill="#FFC94D"/><path d="M80 52 L104 52 L112 64 L104 76 L80 76 Z" fill="#FF8FB1" stroke="#1B2032" stroke-width="2"/><circle cx="104" cy="64" r="3" fill="#1B2032"/><text x="92" y="68" text-anchor="middle" font-size="11" font-weight="700" fill="#1B2032" font-family="Rubik,Arial,sans-serif">AI</text>'
  };
  function art(id) { return '<svg class="art" viewBox="0 0 120 92" aria-hidden="true">' + (ART[id] || ART.chip) + '</svg>'; }

  function story(s, i, n) {
    var b = band(), m = MOODS[mood][lang] || MOODS[mood].en, picked = quiz[issueId + '|' + s.id];
    var opts = s.quiz.options.map(function (o, j) {
      var cls = picked == null ? '' : (j === s.quiz.answer ? ' right' : (j === picked ? ' wrong' : ''));
      return '<button type="button" class="opt' + cls + '" data-q="' + esc(s.id) + '" data-o="' + j + '"' + (picked != null ? ' disabled' : '') + '>' + esc(L(o)) + '</button>';
    }).join('');
    var verdict = picked == null ? '' : (picked === s.quiz.answer ? t('right') : t('wrong') + ' ' + L(s.quiz.options[s.quiz.answer]));
    return '<article class="story" id="s-' + esc(s.id) + '">' +
      '<div class="story-head">' + art(s.art) + '<p class="count">' + esc(t('of')(i + 1, n)) + '</p></div>' +
      '<h2>' + esc(L(s.title)) + '</h2>' +
      '<p class="body">' + esc(L(s.levels[b])) + '</p>' +
      '<p class="say"><span class="mini">' + soya(36) + '</span><span>' + esc(m.react[i % m.react.length]) + '</span></p>' +
      '<div class="word"><b>' + esc(t('word')) + ': ' + esc(L(s.word.term)) + '</b><span>' + esc(L(s.word.means)) + '</span></div>' +
      '<div class="quiz" role="group" aria-label="' + esc(t('quiz')) + '"><p class="label">' + esc(t('quiz')) + '</p><p class="q">' + esc(L(s.quiz.q)) + '</p><div class="opts">' + opts + '</div><p class="verdict" role="status">' + esc(verdict) + '</p></div>' +
      '<p class="src"><a href="' + esc(s.source) + '" target="_blank" rel="noopener">' + esc(t('source')) + '</a></p></article>';
  }

  function canSend() { return !!(window.SOYA_WAITLIST && window.SOYA_WAITLIST.url); }
  function ideaBox() {
    if (!canSend()) return '<section class="panel"><h2>' + esc(t('ideaTitle')) + '</h2><p class="mute">' + esc(t('ideaClosed')) + '</p></section>';
    return '<form class="panel" id="idea" novalidate><h2>' + esc(t('ideaTitle')) + '</h2>' +
      '<label for="idea-text">' + esc(t('ideaLabel')) + '</label><textarea id="idea-text" maxlength="300" autocomplete="off" dir="' + boxDir() + '"></textarea>' +
      '<p class="mute small">' + esc(t('ideaSafe')) + '</p>' +
      '<div class="hp" aria-hidden="true"><label>Leave this empty <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>' +
      '<p class="note" role="status" hidden></p><button type="submit" class="ghost">' + esc(t('ideaSend')) + '</button></form>';
  }

  function render() {
    var doc = document.documentElement; doc.lang = lang; doc.dir = lang === 'he' ? 'rtl' : 'ltr';
    document.title = t('name');
    document.getElementById('brand-title').textContent = t('name');
    document.getElementById('credit').textContent = t('credit');
    var app = document.getElementById('app');
    if (!data) { app.innerHTML = '<div class="hero">' + soya(120) + '</div>'; return; }
    var issues = data.issues || [], issue = issues.filter(function (x) { return x.id === issueId; })[0] || issues[0];
    if (!issue) return; issueId = issue.id;
    var m = MOODS[mood][lang] || MOODS[mood].en, b = band();
    var html = '';
    if (notice) html += '<p class="new" role="status">' + esc(notice) + '</p>';
    html += '<section class="hero">' + soya(128, ' hello') + '<div class="bubble"><p>' + esc(m.hi(nick)) + '</p></div></section>' +
      '<h1>' + esc(L(issue.headline)) + '</h1><p class="mute">' + esc(t('week')) + ' · ' + esc(L(issue.week)) + '</p>' +
      '<section class="panel age"><label for="age"><b>' + esc(t('ageQ')) + '</b></label>' +
      '<div class="age-row"><input type="range" id="age" min="6" max="26" step="1" value="' + age + '" aria-valuetext="' + esc(t('ageYears')(age) + ', ' + t('bands')[b]) + '">' +
      '<output for="age" class="age-out">' + esc(age) + '</output></div>' +
      '<div class="bands">' + BANDS.map(function (x) { return '<button type="button" class="band' + (x.id === b ? ' on' : '') + '" data-age="' + x.from + '" aria-pressed="' + (x.id === b) + '"><b>' + esc(t('bands')[x.id]) + '</b><small>' + x.from + '–' + x.to + '</small></button>'; }).join('') + '</div>' +
      '<p class="mute small">' + esc(t('bandNote')[b]) + '</p></section>';
    html += issue.stories.map(function (s, i) { return story(s, i, issue.stories.length); }).join('');
    html += '<p class="say end"><span class="mini">' + soya(36) + '</span><span>' + esc(m.bye) + '</span></p>';
    html += '<section class="panel" id="notify"><h2>' + esc(t('notifyTitle')) + '</h2><p class="mute small">' + esc(t('notifyAsk')) + '</p>' +
      '<button type="button" class="primary" id="notify-btn">' + esc(t('notifyBtn')) + '</button><p class="note" id="notify-note" role="status"' + (notifyText() ? '' : ' hidden') + '>' + esc(notifyText()) + '</p>' +
      '<p class="mute small">' + esc(t('install')) + '</p></section>';
    html += '<section class="panel"><h2>' + esc(t('settings')) + '</h2>' +
      '<p class="label">' + esc(t('mood')) + '</p><div class="seg">' + Object.keys(MOODS).map(function (k) { return '<button type="button" data-mood="' + k + '" aria-pressed="' + (k === mood) + '"' + (k === mood ? ' class="on"' : '') + '>' + esc(t('moods')[k]) + '</button>'; }).join('') + '</div>' +
      '<p class="label">' + esc(t('lang')) + '</p><div class="seg">' + LANGS.map(function (k) { return '<button type="button" data-lang="' + k + '" lang="' + k + '" aria-pressed="' + (k === lang) + '"' + (k === lang ? ' class="on"' : '') + '>' + { en: 'English', he: 'עברית', fr: 'Français' }[k] + '</button>'; }).join('') + '</div>' +
      '<label for="nick" class="label">' + esc(t('nick')) + '</label><input id="nick" maxlength="20" autocomplete="off" dir="' + boxDir() + '" value="' + esc(nick) + '"><p class="mute small">' + esc(t('nickHint')) + '</p></section>';
    html += ideaBox();
    if (issues.length > 1) html += '<section class="panel"><h2>' + esc(t('older')) + '</h2><div class="seg wrap">' + issues.map(function (x) { return '<button type="button" data-issue="' + esc(x.id) + '"' + (x.id === issueId ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '>' + esc(L(x.week)) + '</button>'; }).join('') + '</div></section>';
    html += '<p class="mute small">' + esc(t('synthetic')) + ' ' + esc(t('privacy')) + '</p><p><a class="home" href="../../">' + esc(t('home')) + '</a></p>';
    app.innerHTML = html;
    wire();
  }

  var notifyState = '';
  function notifyText() { return notifyState ? t(notifyState) : ''; }
  function setNotify(k) { notifyState = k; var n = document.getElementById('notify-note'); if (n) { n.hidden = !k; n.textContent = notifyText(); } }

  function wire() {
    var app = document.getElementById('app');
    var slider = document.getElementById('age');
    slider.addEventListener('input', function () { var was = band(); age = +slider.value; put(K.age, String(age)); app.querySelector('.age-out').textContent = age; if (band() !== was) keepPlace(render); });
    app.querySelectorAll('[data-age]').forEach(function (bt) { bt.addEventListener('click', function () { age = +bt.getAttribute('data-age'); put(K.age, String(age)); keepPlace(render); }); });
    app.querySelectorAll('[data-mood]').forEach(function (bt) { bt.addEventListener('click', function () { mood = bt.getAttribute('data-mood'); put(K.mood, mood); keepPlace(render); }); });
    app.querySelectorAll('[data-lang]').forEach(function (bt) { bt.addEventListener('click', function () { lang = bt.getAttribute('data-lang'); put(K.lang, lang); keepPlace(render); }); });
    app.querySelectorAll('[data-issue]').forEach(function (bt) { bt.addEventListener('click', function () { issueId = bt.getAttribute('data-issue'); render(); window.scrollTo(0, 0); }); });
    var nk = document.getElementById('nick');
    nk.addEventListener('change', function () { nick = nk.value.replace(/[<>]/g, '').trim().slice(0, 20); put(K.nick, nick); keepPlace(render); });
    app.querySelectorAll('.opt').forEach(function (bt) {
      bt.addEventListener('click', function () { quiz[issueId + '|' + bt.getAttribute('data-q')] = +bt.getAttribute('data-o'); put(K.quiz, JSON.stringify(quiz)); keepPlace(render, bt.getAttribute('data-q')); });
    });
    document.getElementById('notify-btn').addEventListener('click', subscribe);
    var form = document.getElementById('idea');
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      var box = form.querySelector('textarea'), note = form.querySelector('.note'), trap = form.querySelector('input[name=website]'), text = box.value.trim();
      function say(s) { note.hidden = false; note.textContent = s; }
      if (trap && trap.value) return;
      if (text.length < 3) return say(t('ideaShort'));
      var body = new URLSearchParams({ kind: 'request', app: 'soya-news', text: text.slice(0, 300), email: '', lang: lang, website: '' });
      fetch(window.SOYA_WAITLIST.url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() })
        .then(function () { box.value = ''; say(t('ideaThanks')); }, function () { say(t('ideaFailed')); });
    });
  }
  /* Re-render without losing the reader's place on the page. */
  function keepPlace(fn, storyId) {
    var anchor = storyId ? document.getElementById('s-' + storyId) : document.activeElement;
    var top = anchor && anchor.getBoundingClientRect ? anchor.getBoundingClientRect().top : null, id = anchor && anchor.id;
    var focusSel = anchor && anchor.getAttribute && (anchor.id ? '#' + anchor.id : anchor.getAttribute('data-mood') ? '[data-mood="' + anchor.getAttribute('data-mood') + '"]' : anchor.getAttribute('data-lang') ? '[data-lang="' + anchor.getAttribute('data-lang') + '"]' : anchor.getAttribute('data-age') ? '[data-age="' + anchor.getAttribute('data-age') + '"]' : null);
    fn();
    var again = storyId ? document.getElementById('s-' + storyId) : (focusSel ? document.querySelector(focusSel) : null);
    if (again && top != null) { window.scrollBy(0, again.getBoundingClientRect().top - top); if (!storyId && again.focus) again.focus({ preventScroll: true }); }
  }

  /* New-issue alerts. Real push needs a sending server, which Soycatory does not run. Instead, where the browser allows it
     (an installed app on Chrome or Edge for Android and desktop), the service worker checks issues.json about once a day
     and shows a notification when a new issue appears. Everywhere else, the app says so when it is opened. */
  function subscribe() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return setNotify('notifyNone');
    if (Notification.permission === 'denied') return setNotify('notifyBlocked');
    Notification.requestPermission().then(function (p) {
      if (p !== 'granted') return setNotify(p === 'denied' ? 'notifyBlocked' : '');
      return navigator.serviceWorker.ready.then(function (reg) {
        if (reg.active) reg.active.postMessage({ type: 'seen', id: latestId(), lang: lang });
        if (!('periodicSync' in reg)) return setNotify('notifyOpen');
        return navigator.permissions.query({ name: 'periodic-background-sync' }).then(function (st) {
          if (st.state !== 'granted') return setNotify('notifyOpen');
          return reg.periodicSync.register('soya-news-check', { minInterval: 24 * 60 * 60 * 1000 }).then(function () { setNotify('notifyOn'); });
        }).catch(function () { setNotify('notifyOpen'); });
      });
    }).catch(function () { setNotify('notifyNone'); });
  }
  function latestId() { return data && data.issues && data.issues[0] ? data.issues[0].id : ''; }

  function load() {
    fetch('issues.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (d) {
      data = d; var latest = latestId(), seen = get(K.seen, '');
      if (seen && latest && latest !== seen) notice = t('newIssue');
      if (latest) put(K.seen, latest);
      var q = new URLSearchParams(location.search).get('issue'); issueId = q || latest;
      if (navigator.serviceWorker && navigator.serviceWorker.controller) navigator.serviceWorker.controller.postMessage({ type: 'seen', id: latest, lang: lang });
      render();
    }).catch(function () { render(); });
  }

  document.getElementById('lang-toggle').addEventListener('click', function () { lang = LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length]; put(K.lang, lang); render(); updateToggle(); });
  function updateToggle() { var n = LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length]; var b = document.getElementById('lang-toggle'); b.textContent = { en: 'English', he: 'עברית', fr: 'Français' }[n]; b.setAttribute('lang', n); }
  var origRender = render; render = function () { origRender(); updateToggle(); };
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function () { /* works without it */ });
  render(); load();
})();
