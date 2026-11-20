/* The list of Soya's videos, newest first. Each video has an MP4, English and Hebrew captions (WebVTT) and a poster in
   assets/videos/ named after its slug. Made with factory/videos/make_video.py from a script in factory/videos/scripts/.
   To add one: render it, then copy an entry to the top of this list. */
window.SOYA_VIDEOS = [
  {
    "slug": "software-factory",
    "date": "2026-11-20",
    "seconds": 76,
    "title": {
      "en": "What is a software factory?",
      "he": "מה זה מפעל תוכנה?"
    },
    "description": {
      "en": "Soya the cat explains what a software factory is, how Soycatory's works in five steps, and why the people stay in charge. About a minute.",
      "he": "סויה החתול מסביר מה זה מפעל תוכנה, איך המפעל של Soycatory עובד בחמישה שלבים, ולמה האנשים נשארים אחראים. בערך דקה."
    },
    "transcript": {
      "en": [
        "Hey. I'm Soya, a cat who explains things. Today: what is a software factory? One minute. Let's go.",
        "A factory makes the same thing again and again, in steps you can check. Cookies: dough, bake, check, box. Apps: idea, build, check, app.",
        "Ours has five steps. One: read what's new in AI. Two: pick the idea that helps a real person most.",
        "Three: build one tiny app. Four: check it. Tests, a scan for secrets, and a look at a phone screen.",
        "Five: ask a human. The factory sends a request that says: here's my change, take a look. No skipping the checks.",
        "The trend right now? An agent above the tools. It decides what's next, checks the result, follows up. Some call it an outer loop. We run a small one.",
        "But an agent is only as good as its rules. Ours can't spend money, can't open accounts, can't promise ownership. Humans decide that.",
        "Why tiny apps? Tiny things get finished, checked, fixed. So: one app a day, until something catches.",
        "I'm Soya. Try the apps. Tell us what you'd add. Later."
      ],
      "he": [
        "היי. אני סויה, חתול שמסביר דברים. היום: מה זה מפעל תוכנה? דקה אחת. יאללה.",
        "מפעל מייצר את אותו דבר שוב ושוב, בשלבים שאפשר לבדוק. עוגיות: בצק, אפייה, בדיקה, אריזה. אפליקציות: רעיון, בנייה, בדיקה, אפליקציה.",
        "למפעל שלנו יש חמישה שלבים. אחד: לקרוא מה חדש בבינה מלאכותית. שניים: לבחור את הרעיון שהכי יעזור לאדם אמיתי.",
        "שלושה: לבנות אפליקציה קטנטנה אחת. ארבעה: לבדוק אותה. בדיקות, סריקה של סודות, ומבט על מסך טלפון.",
        "חמישה: לשאול בן אדם. המפעל שולח בקשה שאומרת: הנה השינוי שלי, תסתכלו. אסור לדלג על הבדיקות.",
        "המגמה עכשיו? סוכן שיושב מעל הכלים. הוא מחליט מה הבא, בודק את התוצאה, וממשיך לעקוב. יש שקוראים לזה לולאה חיצונית. אצלנו רצה אחת קטנה.",
        "אבל סוכן טוב רק כמו הכללים שלו. הסוכן שלנו לא מוציא כסף, לא פותח חשבונות, ולא מבטיח בעלות. את זה בני אדם מחליטים.",
        "למה אפליקציות קטנטנות? כי דברים קטנים מסיימים, בודקים ומתקנים. אז: אפליקציה ביום, עד שמשהו יתפוס.",
        "אני סויה. נסו את האפליקציות. ספרו לנו מה הייתם מוסיפים. להתראות."
      ]
    }
  }
];

/* Ideas for the next episodes. Not made yet; each needs facts we can point to before it is. */
window.SOYA_VIDEO_IDEAS = {
  en: ['What is an AI agent?', 'What is an outer loop?', 'Small models and big models: which one for what?', 'What does open source mean?'],
  he: ['מה זה סוכן בינה מלאכותית?', 'מה זה לולאה חיצונית?', 'מודלים קטנים ומודלים גדולים: מה מתאים למה?', 'מה זה קוד פתוח?']
};
