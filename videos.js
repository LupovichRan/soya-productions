/* The list of Soya's videos, newest first. Each video has an MP4, English and Hebrew captions (WebVTT) and a poster in
   assets/videos/ named after its slug. Made with factory/videos/make_video.py from a script in factory/videos/scripts/.
   To add one: render it, then copy an entry to the top of this list. */
window.SOYA_VIDEOS = [
  {
    "slug": "soycatory-intro",
    "date": "2026-11-21",
    "seconds": 47,
    "title": {
      "en": "Meet Soycatory",
      "he": "תכירו את Soycatory"
    },
    "description": {
      "en": "Soya the cat introduces Soycatory: a small factory that makes one friendly app a day for everyday people, in plain words, with no ads and no tracking. About 50 seconds.",
      "he": "סויה החתול מציג את Soycatory: מפעל קטן שמכין אפליקציה ידידותית אחת ביום לכל אחד, במילים פשוטות, בלי פרסומות ובלי מעקב. בערך 50 שניות."
    },
    "transcript": {
      "en": [
        "Hi. I'm Soya, a cat. And this is Soycatory: a small factory that makes friendly apps for everyday people.",
        "The idea is simple. One small app a day, until something catches.",
        "Every app speaks plain words, in English and Hebrew. No ads. No tracking. It just works on your phone.",
        "There are apps for small cats, like Soya News and Animal Facts. And apps for big cats, like Read It Simply and Kafka Check.",
        "And you are part of it. Try an app, tell us what you would add, and the factory builds it.",
        "AI helps build the apps. But people review every one, and every fact links to its source.",
        "So come and try them. And tell me what you would add. Meow."
      ],
      "he": [
        "היי. אני סויה, חתול. וזה Soycatory: מפעל קטן שמכין אפליקציות ידידותיות לכל אחד.",
        "הרעיון פשוט. אפליקציה קטנה אחת ביום, עד שמשהו תופס.",
        "כל אפליקציה מדברת במילים פשוטות, באנגלית ובעברית. בלי פרסומות. בלי מעקב. פשוט עובד בטלפון.",
        "יש אפליקציות לחתולים קטנים, כמו החדשות של סויה והעובדות על חיות. ויש לחתולים גדולים, כמו קוראים בפשטות ובדיקת קפקא.",
        "ואתם חלק מזה. מנסים אפליקציה, מספרים לנו מה הייתם מוסיפים, והמפעל בונה את זה.",
        "בינה מלאכותית עוזרת לבנות את האפליקציות. אבל אנשים בודקים כל אחת, וכל עובדה מקושרת למקור שלה.",
        "אז בואו לנסות. ותגידו לי מה הייתם מוסיפים. מיאו."
      ]
    }
  },
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
