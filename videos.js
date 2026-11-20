/* The list of Soya's videos, newest first. Each video has an MP4, English and Hebrew captions (WebVTT) and a poster in
   assets/videos/ named after its slug. Made with factory/videos/make_video.py from a script in factory/videos/scripts/.
   To add one: render it, then copy an entry to the top of this list. */
window.SOYA_VIDEOS = [
  {
    "slug": "software-factory",
    "date": "2026-11-20",
    "seconds": 94,
    "title": {
      "en": "What is a software factory?",
      "he": "מה זה מפעל תוכנה?"
    },
    "description": {
      "en": "Soya the cat explains what a software factory is, how Soycatory's works in five steps, and why the people stay in charge. About 80 seconds.",
      "he": "סויה החתול מסביר מה זה מפעל תוכנה, איך המפעל של Soycatory עובד בחמישה שלבים, ולמה האנשים נשארים אחראים. כ־80 שניות."
    },
    "transcript": {
      "en": [
        "Hi. I'm Soya. I'm a cat, and I explain the things you keep hearing about. Today: what is a software factory?",
        "A factory makes the same kind of thing again and again, with steps you can check. A cookie factory goes: dough, bake, check, box. A software factory does the same for apps.",
        "Ours has five steps. One: read what is new in AI and software. Two: pick the idea that would help an everyday person the most.",
        "Three: build one small app. Four: check it. Tests, a scan for secrets, and a look at the phone screen, in English and in Hebrew.",
        "Five: ask a person. The factory sends a request that says, here is my change, please look. It is not allowed to skip the checks.",
        "Here is a trend. People now put an agent above the tools. It decides what is next, checks the result, and follows up. Some call that an outer loop. Our factory uses a small one.",
        "But an agent is only as good as its rules. Ours cannot spend money, cannot open accounts, and cannot promise anyone ownership. A person decides those.",
        "Why small apps? Because small things can be finished, checked and fixed. So the factory makes one app a day, until something catches.",
        "I'm Soya. Try the apps, tell us what you would add, and come back for the next one."
      ],
      "he": [
        "היי, אני סויה. אני חתול, ואני מסביר דברים שאתם כל הזמן שומעים עליהם. היום: מה זה מפעל תוכנה?",
        "מפעל מייצר שוב ושוב את אותו סוג של דבר, בשלבים שאפשר לבדוק. מפעל עוגיות עובד כך: בצק, אפייה, בדיקה, אריזה. מפעל תוכנה עושה את זה לאפליקציות.",
        "למפעל שלנו יש חמישה שלבים. אחד: לקרוא מה חדש בבינה מלאכותית ובתוכנה. שניים: לבחור את הרעיון שהכי יעזור לאדם רגיל.",
        "שלושה: לבנות אפליקציה קטנה אחת. ארבעה: לבדוק אותה. בדיקות, סריקה של סודות, ומבט על מסך הטלפון, באנגלית ובעברית.",
        "חמישה: לשאול אדם. המפעל שולח בקשה שאומרת: הנה השינוי שלי, בבקשה תסתכלו. אסור לו לדלג על הבדיקות.",
        "והנה מגמה. אנשים מציבים היום סוכן מעל הכלים. הוא מחליט מה הבא, בודק את התוצאה, וממשיך לעקוב. יש שקוראים לזה לולאה חיצונית. במפעל שלנו יש כזו, קטנה.",
        "אבל סוכן טוב רק כמו הכללים שלו. הסוכן שלנו לא יכול להוציא כסף, לא יכול לפתוח חשבונות, ולא יכול להבטיח לאף אחד בעלות. את זה אדם מחליט.",
        "למה אפליקציות קטנות? כי דברים קטנים אפשר לסיים, לבדוק ולתקן. אז המפעל מייצר אפליקציה ביום, עד שמשהו יתפוס.",
        "אני סויה. נסו את האפליקציות, ספרו לנו מה הייתם מוסיפים, וחזרו להמשך."
      ]
    }
  }
];

/* Ideas for the next episodes. Not made yet; each needs facts we can point to before it is. */
window.SOYA_VIDEO_IDEAS = {
  en: ['What is an AI agent?', 'What is an outer loop?', 'Small models and big models: which one for what?', 'What does open source mean?'],
  he: ['מה זה סוכן בינה מלאכותית?', 'מה זה לולאה חיצונית?', 'מודלים קטנים ומודלים גדולים: מה מתאים למה?', 'מה זה קוד פתוח?']
};
