/* Soya News: a weekly AI newspaper for curious kids, read by Soya the cat reporter.
   The reader picks an age from 6 to 26 and the same story is told at that level, in English, Hebrew or French.
   Stored on this device only: language, age, Soya's mood, a nickname, the last issue seen, quiz answers.
   Nothing is counted and nothing is sent, except a topic idea a reader chooses to send (no name, no email). */
(function () {
  'use strict';

  var K = { lang: 'soya-news-lang', age: 'soya-news-age', mood: 'soya-news-mood', nick: 'soya-news-nick', seen: 'soya-news-seen', quiz: 'soya-news-quiz', rate: 'soya-news-rate', gender: 'soya-news-gender' };
  var VERSION = '2026-11-21.10';
  var LANGS = ['en', 'he', 'fr'];
  var BANDS = [{ id: 'cub', from: 6, to: 8, pose: 'bell' }, { id: 'explorer', from: 9, to: 12, pose: 'wow' }, { id: 'teen', from: 13, to: 17, pose: 'glasses' }, { id: 'grown', from: 18, to: 25, pose: 'crown' }, { id: 'owner', from: 26, to: 66, pose: 'sit' }];
  var MAX_AGE = 66;
  var MOOD_POSE = { curious: 'wow', silly: 'party', calm: 'happy' };

  var I18N = {
    en: {
      name: 'Soya News', tagline: 'The world explained by Soya the cat: true, logical and fun', week: 'This week',
      ageQ: 'How old is the reader?', ageYears: function (n) { return n + ' years'; },
      bands: { cub: 'Kitten', explorer: 'Curious cat', teen: 'Cool cat', grown: 'Top cat', owner: 'Cat owner' },
      bandNote: { cub: 'Short and simple, with pictures in words.', explorer: 'How it works, with real numbers.', teen: 'The why behind it, and a question to think about.', grown: 'The full picture, with the details.', owner: 'Plain words for grown-ups, and a question to ask your kid.' },
      talk: 'Talk about it with your kid',
      factsBtn: "What's fact? Show the sources", factsHide: 'Hide the sources', key: 'How to read the colours',
      kinds: { fact: 'Fact', inference: 'Soya thinks', assumption: 'A guess' },
      kindNote: { fact: 'It is written in a source you can open.', inference: 'Soya worked it out from the facts.', assumption: 'It might be wrong. Nobody knows yet.' },
      sources: 'Sources', tunaKey: 'Tuna = how much we trust a source. 5 tuna: the official source or a careful big newsroom. 1 tuna: an unknown site.', tuna: function (n) { return n + ' of 5 tuna'; }, from: 'from',
      callMe: 'I am', genders: { m: 'a boy cat', f: 'a girl cat', x: 'just a cat' },
      hint: 'Tap something flying around me to jump to its story!',
      stageLabel: 'Soya in his 3D newsroom, with this week\'s stories flying around him. Tap one to read it.',
      small: 'Big things, explained for small cats', live: 'Soya moves around', liveOpts: { on: 'Yes', calm: 'Calm, he sits still' },
      read: 'Soya, read it to me', stopRead: 'Stop reading', reading: 'Soya is reading...', noVoice: 'This browser cannot read aloud.', catLabel: 'Soya the cat. Tap him.',
      taps: ['Meow! That tickles.', 'Did you know cats sleep about 15 hours a day?', 'Keep reading, I am watching!', 'Purr. Good question.', 'I am a reporter, not a pillow!'],
      cheer: ['Yes! You got it!', 'Clever cat!', 'Purr-fect!'], oops: ['Oops! Try to remember it.', 'Almost! Now you know.'], rateQ: 'How clear was this?', rateThanks: 'Thanks! Soya will use this to explain better.', stars: function (n) { return n + ' of 5'; },
      mouse: 'Report a problem or an idea', mouseSay: 'A mouse! Tell him what went wrong.', tellUs: 'Tell us!', kindsBug: { bug: 'Something is broken', idea: 'I have an idea', fix: 'Please fix this' }, boxSoon: "Soya's mailbox opens soon.",
      bugTitle: 'Something wrong or confusing?', bugLabel: 'What happened?', bugSend: 'Send the report', bugAdds: function (v) { return 'We also send the app version (' + v + '), the language and the age level, nothing else.'; }, bugThanks: 'Thank you. We will look at it.', bugGithub: 'Grown-ups can also report it on GitHub',
      aboutTitle: 'I\'m raising a human', about: function (n) { return [
        'Hi, I\'m Soya. I\'m only ' + n + (n === 1 ? ' month' : ' months') + ' old, and I\'m already raising a human. His name is Ran.',
        'Training him is hard work. Every morning I send him off to work, so my bowl is always full of tuna. He says he is "the chief technology officer of a software company" and fixes big, tricky computer systems. I think he just presses keys all day, like I do when I walk on the keyboard. The difference is, they pay him for it.',
        'He is also the proud dad of a smart 9-year-old girl. She is the one who really runs the house. I come second. Ran comes third.',
        'Together we made Soya News, so small cats and big cats can understand the world. If you like it, share it with your kids. And if you see Ran, remind him: dinner is at six. Sharp.'
      ]; },
      treatTitle: "Soya's treat box", treat: 'Buy Soya a tuna can', treatNote: 'Soya News is free and has no ads. If it helps your family, a grown-up can buy Soya a treat. It keeps the stories coming.', treatSoon: "Soya's treat box opens soon.", bio: "Ran's bio on LinkedIn", contactTitle: 'Contact Ran', contactNote: 'For grown-ups: questions, ideas or working together.', linkedin: 'LinkedIn', email: 'Email', fullPhoto: 'Tap to see the full photo', close: 'Close', grownups: 'For grown-ups', ranAlt: 'Ran, Soya\'s human', share: 'Share Soya News', shared: 'Link copied. Thank you for sharing!', shareText: 'Soya the cat explains the world to kids, at their age.',
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
      name: 'החדשות של סויה', tagline: 'העולם בהסבר של סויה החתול: אמת, היגיון וכיף', week: 'השבוע',
      ageQ: 'בן או בת כמה הקורא?', ageYears: function (n) { return 'בן ' + n; },
      bands: { cub: 'גור חתולים', explorer: 'חתול סקרן', teen: 'חתול מגניב', grown: 'חתול על', owner: 'בעלי חתול' },
      bandNote: { cub: 'קצר ופשוט, עם תמונות במילים.', explorer: 'איך זה עובד, עם מספרים אמיתיים.', teen: 'הלמה שמאחורי, ושאלה לחשוב עליה.', grown: 'התמונה המלאה, עם הפרטים.', owner: 'מילים פשוטות למבוגרים, ושאלה לשאול את הילדים.' },
      talk: 'מדברים על זה עם הילדים',
      factsBtn: 'מה עובדה? מראים את המקורות', factsHide: 'מסתירים את המקורות', key: 'איך קוראים את הצבעים',
      kinds: { fact: 'עובדה', inference: 'סויה חושב', assumption: 'ניחוש' },
      kindNote: { fact: 'זה כתוב במקור שאפשר לפתוח.', inference: 'סויה הסיק את זה מהעובדות.', assumption: 'זה יכול להיות לא נכון. אף אחד עוד לא יודע.' },
      sources: 'מקורות', tunaKey: 'טונה = כמה אנחנו סומכים על מקור. 5 טונות: המקור הרשמי או חדר חדשות גדול וזהיר. טונה אחת: אתר לא מוכר.', tuna: function (n) { return n + ' מתוך 5 טונות'; }, from: 'מתוך',
      callMe: 'אני', genders: { m: 'חתול', f: 'חתולה', x: 'לא משנה' },
      hint: 'לחצו על משהו שעף סביבי כדי לקפוץ לכתבה שלו!',
      stageLabel: 'סויה בחדר החדשות התלת־ממדי שלו, והכתבות של השבוע עפות סביבו. לוחצים על אחת כדי לקרוא.',
      small: 'דברים גדולים, מוסברים לחתולים קטנים', live: 'סויה מסתובב באתר', liveOpts: { on: 'כן', calm: 'רגוע, הוא יושב במקום' },
      read: 'סויה, תקריא לי', stopRead: 'מפסיקים להקריא', reading: 'סויה מקריא...', noVoice: 'הדפדפן הזה לא יודע להקריא בקול.', catLabel: 'סויה החתול. אפשר ללחוץ עליו.',
      taps: ['מיאו! זה מדגדג.', 'ידעתם שחתולים ישנים בערך 15 שעות ביום?', 'תמשיכו לקרוא, אני מסתכל!', 'פררר. שאלה טובה.', 'אני כתב, לא כרית!'],
      cheer: ['כן! צדקתם!', 'חתול חכם!', 'מושלם!'], oops: ['אופס! תזכרו את זה.', 'כמעט! עכשיו אתם יודעים.'], rateQ: 'כמה זה היה ברור?', rateThanks: 'תודה! סויה ישתמש בזה כדי להסביר טוב יותר.', stars: function (n) { return n + ' מתוך 5'; },
      mouse: 'דיווח על תקלה או רעיון', mouseSay: 'עכבר! ספרו לו מה השתבש.', tellUs: 'ספרו לנו!', kindsBug: { bug: 'משהו לא עובד', idea: 'יש לי רעיון', fix: 'צריך לתקן' }, boxSoon: 'תיבת הדואר של סויה נפתחת בקרוב.',
      bugTitle: 'משהו לא עובד או לא ברור?', bugLabel: 'מה קרה?', bugSend: 'שולחים את הדיווח', bugAdds: function (v) { return 'אנחנו שולחים גם את גרסת האפליקציה (' + v + '), את השפה ואת רמת הגיל, ולא שום דבר אחר.'; }, bugThanks: 'תודה. נבדוק את זה.', bugGithub: 'מבוגרים יכולים לדווח גם ב־GitHub',
      aboutTitle: 'אני מגדל בן אדם', about: function (n) { return [
        'היי, אני סויה. אני רק ' + (n === 1 ? 'בן חודש' : 'בן ' + n + ' חודשים') + ', וכבר אני מגדל בן אדם. קוראים לו רן.',
        'לאלף אותו זו עבודה קשה. כל בוקר אני שולח אותו לעבודה, כדי שהקערה שלי תמיד תהיה מלאה בטונה. הוא אומר שהוא "מנהל הטכנולוגיה של חברת תוכנה" ומתקן מערכות מחשב גדולות ומסובכות. לדעתי הוא פשוט לוחץ על מקשים כל היום, כמו שאני הולך על המקלדת. ההבדל הוא שלו משלמים על זה.',
        'הוא גם אבא גאה לילדה חכמה בת 9. היא זאת שבאמת מנהלת את הבית. אני במקום השני. רן במקום השלישי.',
        'ביחד עשינו את החדשות של סויה, כדי שחתולים קטנים וחתולים גדולים יבינו את העולם. אם אהבתם, שתפו עם הילדים שלכם. ואם אתם פוגשים את רן, תזכירו לו: ארוחת ערב בשש. בדיוק.'
      ]; },
      treatTitle: 'קופת הפינוקים של סויה', treat: 'קונים לסויה קופסת טונה', treatNote: 'החדשות של סויה בחינם ובלי פרסומות. אם זה עוזר למשפחה שלכם, מבוגר יכול לקנות לסויה פינוק. ככה הכתבות ממשיכות להגיע.', treatSoon: 'קופת הפינוקים של סויה נפתחת בקרוב.', bio: 'הביוגרפיה של רן בלינקדאין', contactTitle: 'יוצרים קשר עם רן', contactNote: 'למבוגרים: שאלות, רעיונות או עבודה משותפת.', linkedin: 'לינקדאין', email: 'מייל', fullPhoto: 'לוחצים כדי לראות את התמונה המלאה', close: 'סוגרים', grownups: 'למבוגרים', ranAlt: 'רן, הבן אדם של סויה', share: 'משתפים את החדשות של סויה', shared: 'הקישור הועתק. תודה ששיתפתם!', shareText: 'סויה החתול מסביר את העולם לילדים, בגובה העיניים שלהם.',
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
      name: 'Les Nouvelles de Soya', tagline: "Le monde expliqué par Soya le chat : vrai, logique et drôle", week: 'Cette semaine',
      ageQ: 'Quel âge a le lecteur ?', ageYears: function (n) { return n + ' ans'; },
      bands: { cub: 'Chaton', explorer: 'Chat curieux', teen: 'Chat cool', grown: 'Super chat', owner: 'Maître du chat' },
      bandNote: { cub: 'Court et simple, avec des images en mots.', explorer: 'Comment ça marche, avec de vrais chiffres.', teen: 'Le pourquoi, et une question pour réfléchir.', grown: "L'image complète, avec les détails.", owner: 'Des mots simples pour les adultes, et une question à poser à votre enfant.' },
      talk: 'En parler avec votre enfant',
      factsBtn: "C'est vrai ? Voir les sources", factsHide: 'Cacher les sources', key: 'Comment lire les couleurs',
      kinds: { fact: 'Fait', inference: 'Soya pense', assumption: 'Une supposition' },
      kindNote: { fact: "C'est écrit dans une source que tu peux ouvrir.", inference: "Soya l'a déduit des faits.", assumption: "Ça peut être faux. Personne ne le sait encore." },
      sources: 'Sources', tunaKey: "Thon = notre confiance dans une source. 5 thons : la source officielle ou une grande rédaction rigoureuse. 1 thon : un site inconnu.", tuna: function (n) { return n + ' thons sur 5'; }, from: 'source',
      callMe: 'Je suis', genders: { m: 'un chat', f: 'une minette', x: 'peu importe' },
      hint: "Touche un objet qui vole autour de moi pour aller à son histoire !",
      stageLabel: 'Soya dans sa salle de rédaction en 3D, avec les histoires de la semaine qui volent autour de lui. Touche-en une pour la lire.',
      small: 'Les grandes choses, expliquées aux petits chats', live: 'Soya se promène', liveOpts: { on: 'Oui', calm: 'Calme, il reste assis' },
      read: 'Soya, lis-moi ça', stopRead: 'Arrêter la lecture', reading: 'Soya lit...', noVoice: 'Ce navigateur ne sait pas lire à voix haute.', catLabel: 'Soya le chat. Touche-le.',
      taps: ['Miaou ! Ça chatouille.', 'Tu savais que les chats dorment environ 15 heures par jour ?', 'Continue à lire, je te regarde !', 'Ronron. Bonne question.', 'Je suis reporter, pas un coussin !'],
      cheer: ['Oui ! Bravo !', 'Chat malin !', 'Parfait !'], oops: ['Oups ! Retiens-le bien.', 'Presque ! Maintenant tu sais.'], rateQ: 'C\'était clair ?', rateThanks: 'Merci ! Soya s\'en servira pour mieux expliquer.', stars: function (n) { return n + ' sur 5'; },
      mouse: 'Signaler un bug ou une idée', mouseSay: 'Une souris ! Dis-lui ce qui ne va pas.', tellUs: 'Dis-nous tout !', kindsBug: { bug: 'Ça ne marche pas', idea: "J'ai une idée", fix: 'À corriger' }, boxSoon: 'La boîte aux lettres de Soya ouvre bientôt.',
      bugTitle: 'Quelque chose ne va pas ou n\'est pas clair ?', bugLabel: 'Que s\'est-il passé ?', bugSend: 'Envoyer le signalement', bugAdds: function (v) { return 'Nous envoyons aussi la version de l\'appli (' + v + '), la langue et le niveau d\'âge, rien d\'autre.'; }, bugThanks: 'Merci. Nous allons regarder.', bugGithub: 'Les adultes peuvent aussi le signaler sur GitHub',
      aboutTitle: 'J\'élève un humain', about: function (n) { return [
        'Salut, je suis Soya. Je n\'ai que ' + n + ' mois, et j\'élève déjà un humain. Il s\'appelle Ran.',
        'Le dresser, c\'est du travail. Chaque matin, je l\'envoie au travail pour que ma gamelle soit toujours pleine de thon. Il dit qu\'il est « directeur technique d\'une entreprise de logiciels » et qu\'il répare de gros systèmes informatiques compliqués. Moi, je crois qu\'il appuie sur des touches toute la journée, comme moi quand je marche sur le clavier. La différence, c\'est qu\'on le paie pour ça.',
        'C\'est aussi le papa fier d\'une petite fille de 9 ans très maligne. C\'est elle qui commande vraiment à la maison. Moi, je suis deuxième. Ran est troisième.',
        'Ensemble, on a fait Les Nouvelles de Soya, pour que les petits chats et les grands chats comprennent le monde. Si tu aimes, partage avec tes enfants. Et si tu croises Ran, rappelle-lui : le dîner, c\'est à six heures. Pile.'
      ]; },
      treatTitle: 'La boîte à friandises de Soya', treat: 'Offrir une boîte de thon à Soya', treatNote: "Les Nouvelles de Soya sont gratuites et sans pub. Si elles aident ta famille, un adulte peut offrir une friandise à Soya. Ça fait venir les prochaines histoires.", treatSoon: 'La boîte à friandises de Soya ouvre bientôt.', bio: 'La bio de Ran sur LinkedIn', contactTitle: 'Contacter Ran', contactNote: 'Pour les adultes : questions, idées ou travailler ensemble.', linkedin: 'LinkedIn', email: 'E-mail', fullPhoto: 'Touche pour voir la photo entière', close: 'Fermer', grownups: 'Pour les adultes', ranAlt: 'Ran, l\'humain de Soya', share: 'Partager Les Nouvelles de Soya', shared: 'Lien copié. Merci de partager !', shareText: 'Soya le chat explique le monde aux enfants, à leur hauteur.',
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
  var age = Math.min(MAX_AGE, Math.max(6, parseInt(get(K.age, '9'), 10) || 9));
  var mood = MOODS[get(K.mood, 'curious')] ? get(K.mood, 'curious') : 'curious';
  var nick = String(get(K.nick, '')).slice(0, 20);
  var gender = ['m', 'f', 'x'].indexOf(get(K.gender, 'x')) >= 0 ? get(K.gender, 'x') : 'x';
  var openFacts = {};
  var live = get('soya-news-live', 'on') === 'calm' ? 'calm' : 'on', firstPaint = true, seenStory = {};
  var VOICE = { en: 'en-US', he: 'he-IL', fr: 'fr-FR' };
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  var quiz = {}; try { quiz = JSON.parse(get(K.quiz, '{}')) || {}; } catch (e) { quiz = {}; }
  var rates = {}; try { rates = JSON.parse(get(K.rate, '{}')) || {}; } catch (e) { rates = {}; }
  var data = null, issueId = null, notice = '';

  function t(k) { return I18N[lang][k]; }
  /* Hebrew and French titles follow the reader's choice: חתול or חתולה, chat or minette. Soya himself stays male. */
  var GENDERED = {
    he: { m: { cub: 'חתלתול', explorer: 'חתול סקרן', teen: 'חתול מגניב', grown: 'חתול על', owner: 'בעל חתול', ageQ: 'בן כמה אתה?' },
          f: { cub: 'חתלתולה', explorer: 'חתולה סקרנית', teen: 'חתולה מגניבה', grown: 'חתולת על', owner: 'בעלת חתול', ageQ: 'בת כמה את?' } },
    fr: { m: { cub: 'Chaton', explorer: 'Chat curieux', teen: 'Chat cool', grown: 'Super chat', owner: 'Maître du chat', ageQ: 'Quel âge as-tu ?' },
          f: { cub: 'Chatonne', explorer: 'Minette curieuse', teen: 'Minette cool', grown: 'Super minette', owner: 'Maîtresse du chat', ageQ: 'Quel âge as-tu ?' } }
  };
  function g() { return (GENDERED[lang] && GENDERED[lang][gender]) || null; }
  function bandName(id) { return (g() && g()[id]) || t('bands')[id]; }
  function ageQ() { return (g() && g().ageQ) || t('ageQ'); }
  function L(o) { return (o && (o[lang] || o.en)) || ''; }
  function band() { for (var i = 0; i < BANDS.length; i++) if (age <= BANDS[i].to) return BANDS[i].id; return 'owner'; }
  function bandOf(id) { return BANDS.filter(function (x) { return x.id === id; })[0]; }
  /* Soya, drawn for the annabelle-games home (assets/soya-*.svg). */
  function cat(pose, size, cls) { return '<img class="cat' + (cls ? ' ' + cls : '') + '" src="assets/soya-' + pose + '.svg" width="' + size + '" height="' + Math.round(size * 1.1) + '" alt="">'; }
  function boxDir() { return lang === 'he' ? 'rtl' : 'ltr'; }

  /* Drawings: simple shapes, so they stay crisp on any screen. */
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
      '<p class="body">' + esc(L(s.levels[b] || s.levels.grown)) + '</p>' +
      '<button type="button" class="ghost read-btn" data-read="' + esc(s.id) + '">' + esc(t('read')) + '</button>' +
      (b === 'owner' && s.talk ? '<div class="talk"><b>' + esc(t('talk')) + '</b><span>' + esc(L(s.talk)) + '</span></div>' : '') +
      '<p class="say"><span class="mini">' + cat(MOOD_POSE[mood], 44) + '</span><span>' + esc(m.react[i % m.react.length]) + '</span></p>' +
      '<div class="word"><b>' + esc(t('word')) + ': ' + esc(L(s.word.term)) + '</b><span>' + esc(L(s.word.means)) + '</span></div>' +
      '<div class="quiz" role="group" aria-label="' + esc(t('quiz')) + '"><p class="label">' + esc(t('quiz')) + '</p><p class="q">' + esc(L(s.quiz.q)) + '</p><div class="opts">' + opts + '</div><p class="verdict" role="status">' + esc(verdict) + '</p></div>' +
      factsBlock(s) + rateRow(s) + '</article>';
  }

  var KIND_ICON = { fact: '<circle cx="12" cy="12" r="10"/><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#0F1424" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
    inference: '<path d="M12 2l10 10-10 10L2 12z"/><path d="M8 12h7M12.5 8.5L16 12l-3.5 3.5" fill="none" stroke="#0F1424" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
    assumption: '<rect x="2" y="2" width="20" height="20" rx="5"/><path d="M9.2 9.2a2.9 2.9 0 1 1 3.9 2.7c-.8.3-1.1.8-1.1 1.6v.6" fill="none" stroke="#0F1424" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="17.6" r="1.4" fill="#0F1424"/>' };
  function kindTag(k) { return '<span class="kind k-' + k + '"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">' + KIND_ICON[k] + '</svg>' + esc(t('kinds')[k]) + '</span>'; }
  function tunaRow(n) {
    var fish = '<path d="M3 12c3-5 9-6 14-3l4-3v12l-4-3c-5 3-11 2-14-3z"/><circle cx="7.5" cy="11" r="1.1" fill="#0F1424"/>';
    var out = ''; for (var i = 1; i <= 5; i++) out += '<svg class="fish' + (i <= n ? ' on' : '') + '" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">' + fish + '</svg>';
    return '<span class="tuna" role="img" aria-label="' + esc(t('tuna')(n)) + '">' + out + '</span>';
  }
  /* "What's fact?": each claim coloured by kind, with the sources it comes from and how far we trust them. */
  function factsBlock(s) {
    if (!s.facts) return '<p class="src"><a href="' + esc(s.source) + '" target="_blank" rel="noopener">' + esc(t('source')) + '</a></p>';
    var open = !!openFacts[s.id];
    var html = '<button type="button" class="ghost facts-btn" data-facts="' + esc(s.id) + '" aria-expanded="' + open + '">' + esc(open ? t('factsHide') : t('factsBtn')) + '</button>';
    if (!open) return html;
    html += '<div class="facts"><ol class="claims">' + s.facts.map(function (f) {
      var refs = (f.src || []).map(function (i) { return '<a href="' + esc(s.sources[i].url) + '" target="_blank" rel="noopener">' + esc(s.sources[i].name) + '</a>'; }).join(', ');
      return '<li class="claim c-' + f.kind + '">' + kindTag(f.kind) + '<span>' + esc(L(f.text)) + (refs ? ' <small class="mute">(' + esc(t('from')) + ' ' + refs + ')</small>' : '') + '</span></li>';
    }).join('') + '</ol><p class="label">' + esc(t('sources')) + '</p><ol class="srcs">' + s.sources.map(function (x) {
      return '<li><a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.name) + '</a> ' + tunaRow(x.tuna) + '<small class="mute">' + esc(L(x.why)) + '</small></li>';
    }).join('') + '</ol></div>';
    return html;
  }
  function keyPanel() {
    return '<details class="panel key"><summary>' + esc(t('key')) + '</summary><ol class="claims">' + ['fact', 'inference', 'assumption'].map(function (k) {
      return '<li class="claim c-' + k + '">' + kindTag(k) + '<span>' + esc(t('kindNote')[k]) + '</span></li>';
    }).join('') + '</ol><p class="small">' + tunaRow(4) + ' ' + esc(t('tunaKey')) + '</p></details>';
  }
  function canSend() { return !!(window.SOYA_WAITLIST && window.SOYA_WAITLIST.url); }
  function send(fields) {
    var body = new URLSearchParams(fields); body.set('app', 'soya-news'); body.set('lang', lang); body.set('website', '');
    return fetch(window.SOYA_WAITLIST.url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
  }
  /* "How clear was this?" from 1 to 5 paws. Kept on the device; sent (story, paws, age level) only if the receiver is set. */
  function rateRow(s) {
    var k = issueId + '|' + s.id, got = rates[k];
    var paws = [1, 2, 3, 4, 5].map(function (n) {
      return '<button type="button" class="paw' + (got && n <= got ? ' on' : '') + '" data-rate="' + esc(s.id) + '" data-n="' + n + '" aria-label="' + esc(t('stars')(n)) + '" aria-pressed="' + (got === n) + '"><svg viewBox="0 0 100 100" width="26" height="26" aria-hidden="true"><ellipse cx="50" cy="66" rx="22" ry="18"/><ellipse cx="24" cy="42" rx="9" ry="12"/><ellipse cx="42" cy="28" rx="9" ry="12"/><ellipse cx="60" cy="28" rx="9" ry="12"/><ellipse cx="78" cy="42" rx="9" ry="12"/></svg></button>';
    }).join('');
    return '<div class="rate"><p class="label">' + esc(t('rateQ')) + '</p><div class="paws" role="group" aria-label="' + esc(t('rateQ')) + '">' + paws + '</div><p class="mute small" role="status">' + (got ? esc(t('rateThanks')) : '') + '</p></div>';
  }
  var GITHUB = 'https://github.com/LupovichRan/soya-productions/issues/new?title=' + encodeURIComponent('Soya News: ');
  /* The mouse from Soya's game (annabelle-games) sits on the edge of the screen; tap it to report a problem or an idea. */
  var MOUSE = '<svg viewBox="0 0 120 70" width="40" height="24" aria-hidden="true"><path d="M100,48 Q125,40 115,20" stroke="#ff7aa8" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="60" cy="45" rx="42" ry="22" fill="#9aa3ad" stroke="#5b636c" stroke-width="3"/><circle cx="30" cy="26" r="12" fill="#c3cad1" stroke="#5b636c" stroke-width="3"/><circle cx="30" cy="26" r="6" fill="#ffb3c8"/><circle cx="22" cy="44" r="4" fill="#222"/><circle cx="18" cy="52" r="5" fill="#ff7aa8"/><path d="M50,30 l6,10 l6,-10 l6,10" stroke="#5fd38d" stroke-width="3" fill="none"/></svg>';
  var bugKind = 'bug';
  function bugBox() {
    var html = '<button type="button" class="mouse-btn" id="mouse-btn" aria-label="' + esc(t('mouse')) + '" title="' + esc(t('mouse')) + '">' + MOUSE + '</button>' +
      '<dialog class="bug-dlg" id="bug-dlg" aria-labelledby="bug-h"><div class="bug-head">' + MOUSE.replace('width="40" height="24"', 'width="64" height="38"') + '<h2 id="bug-h">' + esc(t('tellUs')) + '</h2></div>';
    if (canSend()) html += '<form id="bug-form" novalidate><div class="seg" role="group" aria-label="' + esc(t('bugTitle')) + '">' + ['bug', 'idea', 'fix'].map(function (k) { return '<button type="button" data-kind="' + k + '" aria-pressed="' + (k === bugKind) + '"' + (k === bugKind ? ' class="on"' : '') + '>' + esc(t('kindsBug')[k]) + '</button>'; }).join('') + '</div>' +
      '<label for="bug-text">' + esc(t('bugLabel')) + '</label><textarea id="bug-text" maxlength="500" autocomplete="off" dir="' + boxDir() + '"></textarea>' +
      '<p class="mute small">' + esc(t('ideaSafe')) + ' ' + esc(t('bugAdds')(VERSION)) + '</p><div class="hp" aria-hidden="true"><label>Leave this empty <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>' +
      '<p class="note" role="status" hidden></p><button type="submit" class="ghost">' + esc(t('bugSend')) + '</button></form>';
    else html += '<p class="mute">' + esc(t('boxSoon')) + '</p>';
    return html + '<p><a href="' + esc(GITHUB) + '" target="_blank" rel="noopener">' + esc(t('bugGithub')) + '</a></p><button type="button" class="ghost" id="bug-close">' + esc(t('close')) + '</button></dialog>';
  }
  /* Soya introduces his human (photo from Ran's company page, with his permission), then the treat box. */
  /* Soya was 6 months old on 21 November 2026, so he was born around 21 May 2026. His age counts up by itself. */
  function soyaMonths() { var b = new Date(2026, 4, 21), d = new Date(); var m = (d.getFullYear() - b.getFullYear()) * 12 + d.getMonth() - b.getMonth() - (d.getDate() < b.getDate() ? 1 : 0); return Math.max(1, m); }
  var BIO = 'https://www.linkedin.com/in/ranlupovich', EMAIL = 'ranlupovich@gmail.com';
  function aboutBox() {
    var link = window.SOYA_TREATS && /^https:\/\//.test(window.SOYA_TREATS.url || '') ? window.SOYA_TREATS.url : '';
    return '<section class="panel about"><div class="meet">' + cat('happy', 72, 'meet-cat') + '<button type="button" class="ran-btn" id="ran-photo" aria-label="' + esc(t('fullPhoto')) + '"><img class="ran" src="assets/ran.jpg" width="120" height="120" alt="' + esc(t('ranAlt')) + '"></button></div>' +
      '<h2>' + esc(t('aboutTitle')) + '</h2>' + t('about')(soyaMonths()).map(function (x) { return '<p class="said">' + esc(x) + '</p>'; }).join('') +
      '<p><a class="bio" href="' + BIO + '" target="_blank" rel="noopener">' + esc(t('bio')) + '</a></p>' +
      '<div class="contact"><p class="label">' + esc(t('contactTitle')) + '</p><p class="mute small">' + esc(t('contactNote')) + '</p>' +
      '<ol class="contact-list"><li><span>' + esc(t('linkedin')) + '</span><a href="' + BIO + '" target="_blank" rel="noopener" dir="ltr">linkedin.com/in/ranlupovich</a></li>' +
      '<li><span>' + esc(t('email')) + '</span><a href="mailto:' + EMAIL + '?subject=' + encodeURIComponent('Soya News') + '" dir="ltr">' + EMAIL + '</a></li></ol></div>' +
      '<dialog class="photo-box" id="ran-dialog" aria-label="' + esc(t('ranAlt')) + '"><img src="assets/ran-full.jpg" width="669" height="1024" alt="' + esc(t('ranAlt')) + '">' +
      '<div class="photo-actions"><a class="bio" href="' + BIO + '" target="_blank" rel="noopener">' + esc(t('bio')) + '</a><button type="button" class="ghost" id="ran-close">' + esc(t('close')) + '</button></div></dialog>' +
      '<button type="button" class="ghost" id="share">' + esc(t('share')) + '</button><p class="note" id="share-note" role="status" hidden></p></section>' +
      '<section class="panel treat"><div class="treat-row"><svg class="can" viewBox="0 0 64 56" width="64" height="56" aria-hidden="true"><ellipse cx="32" cy="44" rx="28" ry="9" fill="#8A93AD"/><rect x="4" y="18" width="56" height="26" fill="#B9C1D6"/><rect x="4" y="24" width="56" height="13" fill="#5EE0C1"/><path d="M16 30.5c5-6 15-7 24-3l6-4v14l-6-4c-9 4-19 3-24-3z" fill="#FF9E7A"/><ellipse cx="32" cy="18" rx="28" ry="9" fill="#D8DEEC"/><ellipse cx="32" cy="18" rx="20" ry="5.5" fill="#B9C1D6"/></svg>' +
      '<div><p class="label">' + esc(t('grownups')) + '</p><h2>' + esc(t('treatTitle')) + '</h2></div></div><p>' + esc(t('treatNote')) + '</p>' +
      (link ? '<a class="ghost treat-btn" href="' + esc(link) + '" target="_blank" rel="noopener">' + esc(t('treat')) + '</a>' : '<p class="mute">' + esc(t('treatSoon')) + '</p>') + '</section>';
  }
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
    if (!data) { app.innerHTML = '<div class="hero">' + cat('sit', 120) + '</div>'; return; }
    var issues = data.issues || [], issue = issues.filter(function (x) { return x.id === issueId; })[0] || issues[0];
    if (!issue) return; issueId = issue.id;
    var m = MOODS[mood][lang] || MOODS[mood].en, b = band();
    var html = '';
    if (notice) html += '<p class="new" role="status">' + esc(notice) + '</p>';
    html += '<div class="stage" id="stage"></div><section class="hero">' + cat(MOOD_POSE[mood], 120, 'hello') + '<div class="bubble"><p>' + esc(m.hi(nick)) + '</p></div></section>' +
      '<p class="tagline">' + esc(t('small')) + '</p><p class="mute">' + esc(t('tagline')) + '</p>' +
      '<h1>' + esc(L(issue.headline)) + '</h1><p class="mute">' + esc(t('week')) + ' · ' + esc(L(issue.week)) + '</p>' +
      '<section class="panel age"><label for="age"><b>' + esc(ageQ()) + '</b></label>' +
      '<div class="age-row">' + cat(bandOf(b).pose, 56, 'band-cat') + '<input type="range" id="age" min="6" max="' + MAX_AGE + '" step="1" value="' + age + '" aria-valuetext="' + esc(t('ageYears')(age) + ', ' + bandName(b)) + '">' +
      '<output for="age" class="age-out">' + esc(age) + '</output></div>' +
      '<div class="bands">' + BANDS.map(function (x) { return '<button type="button" class="band' + (x.id === b ? ' on' : '') + '" data-age="' + x.from + '" aria-pressed="' + (x.id === b) + '"><b>' + esc(bandName(x.id)) + '</b><small>' + x.from + '–' + x.to + '</small></button>'; }).join('') + '</div>' +
      '<p class="mute small">' + esc(t('bandNote')[b]) + '</p></section>' + keyPanel();
    html += issue.stories.map(function (s, i) { return story(s, i, issue.stories.length); }).join('');
    html += '<p class="say end"><span class="mini">' + cat(MOOD_POSE[mood], 44) + '</span><span>' + esc(m.bye) + '</span></p>';
    html += '<section class="panel" id="notify"><h2>' + esc(t('notifyTitle')) + '</h2><p class="mute small">' + esc(t('notifyAsk')) + '</p>' +
      '<button type="button" class="primary" id="notify-btn">' + esc(t('notifyBtn')) + '</button><p class="note" id="notify-note" role="status"' + (notifyText() ? '' : ' hidden') + '>' + esc(notifyText()) + '</p>' +
      '<p class="mute small">' + esc(t('install')) + '</p></section>';
    html += '<section class="panel"><h2>' + esc(t('settings')) + '</h2>' +
      '<p class="label">' + esc(t('mood')) + '</p><div class="seg">' + Object.keys(MOODS).map(function (k) { return '<button type="button" data-mood="' + k + '" aria-pressed="' + (k === mood) + '"' + (k === mood ? ' class="on"' : '') + '>' + esc(t('moods')[k]) + '</button>'; }).join('') + '</div>' +
      '<p class="label">' + esc(t('callMe')) + '</p><div class="seg">' + ['m', 'f', 'x'].map(function (k) { return '<button type="button" data-gender="' + k + '" aria-pressed="' + (k === gender) + '"' + (k === gender ? ' class="on"' : '') + '>' + esc(t('genders')[k]) + '</button>'; }).join('') + '</div><p class="label">' + esc(t('live')) + '</p><div class="seg">' + ['on', 'calm'].map(function (k) { return '<button type="button" data-live="' + k + '" aria-pressed="' + (k === live) + '"' + (k === live ? ' class="on"' : '') + '>' + esc(t('liveOpts')[k]) + '</button>'; }).join('') + '</div><p class="label">' + esc(t('lang')) + '</p><div class="seg">' + LANGS.map(function (k) { return '<button type="button" data-lang="' + k + '" lang="' + k + '" aria-pressed="' + (k === lang) + '"' + (k === lang ? ' class="on"' : '') + '>' + { en: 'English', he: 'עברית', fr: 'Français' }[k] + '</button>'; }).join('') + '</div>' +
      '<label for="nick" class="label">' + esc(t('nick')) + '</label><input id="nick" maxlength="20" autocomplete="off" dir="' + boxDir() + '" value="' + esc(nick) + '"><p class="mute small">' + esc(t('nickHint')) + '</p></section>';
    html += ideaBox() + bugBox() + aboutBox();
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
    app.querySelectorAll('[data-lang]').forEach(function (bt) { bt.addEventListener('click', function () { if (window.SoyaLive) window.SoyaLive.stop(); lang = bt.getAttribute('data-lang'); put(K.lang, lang); keepPlace(render); }); });
    app.querySelectorAll('[data-issue]').forEach(function (bt) { bt.addEventListener('click', function () { issueId = bt.getAttribute('data-issue'); render(); window.scrollTo(0, 0); }); });
    var nk = document.getElementById('nick');
    nk.addEventListener('change', function () { nick = nk.value.replace(/[<>]/g, '').trim().slice(0, 20); put(K.nick, nick); keepPlace(render); });
    app.querySelectorAll('.opt').forEach(function (bt) {
      bt.addEventListener('click', function () {
        var qid = bt.getAttribute('data-q'), o = +bt.getAttribute('data-o'), br = bt.getBoundingClientRect();
        quiz[issueId + '|' + qid] = o; put(K.quiz, JSON.stringify(quiz)); keepPlace(render, qid);
        var st = ((data.issues || []).filter(function (x) { return x.id === issueId; })[0] || { stories: [] }).stories.filter(function (x) { return x.id === qid; })[0], S = window.SoyaLive;
        if (S && st) { if (o === st.quiz.answer) { S.smile(2000); S.hop(); S.say(pick(t('cheer'))); if (window.Soya3D) { window.Soya3D.burst(br.left + br.width / 2, br.top + br.height / 2); if (window.Soya3D.stage) window.Soya3D.stage.smile(); } } else { S.wow(1600); S.say(pick(t('oops'))); } }
      });
    });
    document.getElementById('notify-btn').addEventListener('click', subscribe);
    wireLive(app);
    attach3d();
    app.querySelectorAll('[data-facts]').forEach(function (bt) { bt.addEventListener('click', function () { var id = bt.getAttribute('data-facts'); openFacts[id] = !openFacts[id]; keepPlace(render, id); var again = document.querySelector('[data-facts="' + id + '"]'); if (again) again.focus({ preventScroll: true }); }); });
    app.querySelectorAll('[data-gender]').forEach(function (bt) { bt.addEventListener('click', function () { gender = bt.getAttribute('data-gender'); put(K.gender, gender); keepPlace(render); }); });
    app.querySelectorAll('[data-rate]').forEach(function (bt) {
      bt.addEventListener('click', function () {
        var id = bt.getAttribute('data-rate'), n = +bt.getAttribute('data-n'), k = issueId + '|' + id, first = !rates[k];
        rates[k] = n; put(K.rate, JSON.stringify(rates)); if (window.SoyaLive) window.SoyaLive.smile(1500);
        if (canSend()) send({ kind: 'rate', issue: issueId, story: id, paws: String(n), level: band(), first: first ? 'yes' : 'no' }).catch(function () {});
        keepPlace(render, id);
      });
    });
    var dlgB = document.getElementById('bug-dlg'), mouseBtn = document.getElementById('mouse-btn');
    mouseBtn.addEventListener('click', function () {
      if (dlgB.showModal) dlgB.showModal(); else dlgB.setAttribute('open', '');
      if (window.SoyaLive) { window.SoyaLive.wow(1400); window.SoyaLive.say(t('mouseSay')); }
      var first = dlgB.querySelector('textarea'); if (first) first.focus();
    });
    document.getElementById('bug-close').addEventListener('click', function () { dlgB.close(); mouseBtn.focus(); });
    dlgB.addEventListener('click', function (e) { if (e.target === dlgB) dlgB.close(); });
    dlgB.querySelectorAll('[data-kind]').forEach(function (b) { b.addEventListener('click', function () { bugKind = b.getAttribute('data-kind'); dlgB.querySelectorAll('[data-kind]').forEach(function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); }); }); });
    var bug = document.getElementById('bug-form');
    if (bug) bug.addEventListener('submit', function (e) {
      e.preventDefault();
      var box = bug.querySelector('textarea'), note = bug.querySelector('.note'), trap = bug.querySelector('input[name=website]'), text = box.value.trim();
      function say(x) { note.hidden = false; note.textContent = x; }
      if (trap && trap.value) return;
      if (text.length < 3) return say(t('ideaShort'));
      send({ kind: 'bug', type: bugKind, text: text.slice(0, 500), version: VERSION, level: band(), issue: issueId || '' }).then(function () { box.value = ''; say(t('bugThanks')); }, function () { say(t('ideaFailed')); });
    });
    var dlg = document.getElementById('ran-dialog'), opener = document.getElementById('ran-photo');
    if (dlg && opener) {
      opener.addEventListener('click', function () { if (dlg.showModal) dlg.showModal(); else window.open('assets/ran-full.jpg', '_blank'); });
      document.getElementById('ran-close').addEventListener('click', function () { dlg.close(); opener.focus(); });
      dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    }
    document.getElementById('share').addEventListener('click', function () {
      var url = new URL('./', location.href).href, note = document.getElementById('share-note');
      function done() { note.hidden = false; note.textContent = t('shared'); }
      if (navigator.share) { navigator.share({ title: t('name'), text: t('shareText'), url: url }).catch(function () {}); return; }
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { note.hidden = false; note.textContent = url; });
      else { note.hidden = false; note.textContent = url; }
    });
    var form = document.getElementById('idea');
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      var box = form.querySelector('textarea'), note = form.querySelector('.note'), trap = form.querySelector('input[name=website]'), text = box.value.trim();
      function say(s) { note.hidden = false; note.textContent = s; }
      if (trap && trap.value) return;
      if (text.length < 3) return say(t('ideaShort'));
      send({ kind: 'request', text: text.slice(0, 300), email: '' })
        .then(function () { box.value = ''; say(t('ideaThanks')); }, function () { say(t('ideaFailed')); });
    });
  }
  /* Live Soya (soya-live.js): reacts to reading, quizzes and ratings, and reads stories aloud. */
  var storyWatch = null;
  function wireLive(app) {
    var S = window.SoyaLive; if (!S) return;
    var issue = (data.issues || []).filter(function (x) { return x.id === issueId; })[0] || {}, m = MOODS[mood][lang] || MOODS[mood].en;
    S.setEnabled(live === 'on');
    if (firstPaint) {
      firstPaint = false;
      S.init({ hello: t('hint'), label: t('catLabel'), onTap: function () { S.say(pick(t('taps'))); } });
      S.arrange(app.querySelectorAll('.story'));
    }
    if (storyWatch) storyWatch.disconnect();
    if ('IntersectionObserver' in window) {
      storyWatch = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return; var id = e.target.id.slice(2), i = (issue.stories || []).map(function (x) { return x.id; }).indexOf(id);
          if (i < 0 || seenStory[issueId + id] || S.isSpeaking()) return; seenStory[issueId + id] = true;
          S.walkTo(i % 2 ? 0.02 : 0.98, function () { S.say(m.react[i % m.react.length]); });
        });
      }, { threshold: 0.55 });
      app.querySelectorAll('.story').forEach(function (n) { storyWatch.observe(n); });
    }
    app.querySelectorAll('[data-read]').forEach(function (bt) {
      if (S.isSpeaking() && bt.getAttribute('data-read') === reading) bt.textContent = t('stopRead');
      bt.addEventListener('click', function () {
        var id = bt.getAttribute('data-read');
        if (S.isSpeaking() && reading === id) { S.stop(); return; }
        var st = (issue.stories || []).filter(function (x) { return x.id === id; })[0]; if (!st) return;
        var text = L(st.title) + '. ' + L(st.levels[band()] || st.levels.grown);
        reading = id;
        if (!S.speak(text, VOICE[lang], t('reading'))) { S.say(t('noVoice')); return; }
        bt.textContent = t('stopRead');
      });
    });
    app.querySelectorAll('[data-live]').forEach(function (bt) { bt.addEventListener('click', function () { live = bt.getAttribute('data-live'); put('soya-news-live', live); keepPlace(render); }); });
  }
  var reading = '';
  /* The 3D stage (soya-3d.js, a module that loads after this file). */
  function attach3d() {
    var D = window.Soya3D, host = document.getElementById('stage'); if (!D || !host || !data) return;
    D.setEnabled(live === 'on');
    if (D.stage) { D.stage.attach(host); return; }
    var issue = (data.issues || [])[0]; if (!issue) return;
    D.mount(issue.stories.map(function (x) { return { id: x.id, art: x.art }; }), {
      label: t('stageLabel'),
      onPick: function (id) {
        var el = document.getElementById('s-' + id); if (!el) return;
        el.scrollIntoView({ behavior: window.SoyaLive && window.SoyaLive.reduced() ? 'auto' : 'smooth', block: 'start' });
      },
      onSoya: function () { if (window.SoyaLive) window.SoyaLive.say(pick(t('taps'))); }
    }).then(function (st) { var h = document.getElementById('stage'); if (st && h) st.attach(h); }).catch(function () {});
  }
  document.addEventListener('soya3d-ready', attach3d);
  document.addEventListener('soya-speak', function (e) {
    if (e.detail.speaking) return;
    document.querySelectorAll('[data-read]').forEach(function (b) { b.textContent = t('read'); }); reading = '';
  });

  /* Re-render without losing the reader's place on the page. */
  function keepPlace(fn, storyId) {
    var anchor = storyId ? document.getElementById('s-' + storyId) : document.activeElement;
    var top = anchor && anchor.getBoundingClientRect ? anchor.getBoundingClientRect().top : null, id = anchor && anchor.id;
    var focusSel = anchor && anchor.getAttribute && (anchor.id ? '#' + anchor.id : anchor.getAttribute('data-mood') ? '[data-mood="' + anchor.getAttribute('data-mood') + '"]' : anchor.getAttribute('data-lang') ? '[data-lang="' + anchor.getAttribute('data-lang') + '"]' : anchor.getAttribute('data-age') ? '[data-age="' + anchor.getAttribute('data-age') + '"]' : anchor.getAttribute('data-gender') ? '[data-gender="' + anchor.getAttribute('data-gender') + '"]' : null);
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

  document.getElementById('lang-toggle').addEventListener('click', function () { if (window.SoyaLive) window.SoyaLive.stop(); lang = LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length]; put(K.lang, lang); render(); updateToggle(); });
  function updateToggle() { var n = LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length]; var b = document.getElementById('lang-toggle'); b.textContent = { en: 'English', he: 'עברית', fr: 'Français' }[n]; b.setAttribute('lang', n); }
  var origRender = render; render = function () { origRender(); updateToggle(); };
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function () { /* works without it */ });
  render(); load();
})();
