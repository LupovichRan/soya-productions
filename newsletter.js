/* Soya's AI week: one issue a week, newest first. Each item links to where it came from.
   status 'confirmed' = a primary source or two independent reports; 'reported' = one report or aggregators only. */
window.SOYA_NEWSLETTER = [
  {
    issue: '2026-11-21',
    week: { en: 'Week of 15–21 November 2026', he: 'השבוע של 15–21 בנובמבר 2026' },
    tldr: {
      en: ['Anthropic went public at a value of about $1.5 trillion.', 'Nvidia earned a record, then stopped shipping AI chips to China as the US tightened the rules.', 'Coding agents are moving into every tool, and Apple is reportedly building one too.'],
      he: ['Anthropic נכנסה לבורסה בשווי של כ־1.5 טריליון דולר.', 'Nvidia הרוויחה שיא, ואז הפסיקה לשלוח שבבי בינה מלאכותית לסין כשארצות הברית החמירה את הכללים.', 'סוכני תכנות נכנסים לכל כלי, ולפי דיווח גם Apple בונה אחד.']
    },
    items: [
      { id: 'anthropic-ipo', topic: 'money', status: 'confirmed', source: 'Anthropic', url: 'https://www.anthropic.com/news/anthropic-prices-initial-public-offering',
        title: { en: 'Anthropic is now a public company', he: 'Anthropic היא עכשיו חברה ציבורית' },
        line: { en: 'Shares priced at $83 and began trading on Nasdaq as ANT on 19 November.', he: 'המניה תומחרה ב־83 דולר והחלה להיסחר בנאסד"ק בסימול ANT ב־19 בנובמבר.' },
        more: { en: 'It raised about $79 billion for the company, the second-largest IPO valuation after SpaceX. The stock closed its first day up 17%, then reportedly fell 9–12% the next day. Revenue for the first nine months of 2026 was $33.2 billion. Soycatory is built with Claude, which Anthropic makes.', he: 'החברה גייסה כ־79 מיליארד דולר, השווי השני בגודלו בהנפקה אחרי SpaceX. המניה סגרה את היום הראשון בעלייה של 17%, ולפי דיווחים ירדה 9–12% למחרת. ההכנסות בתשעת החודשים הראשונים של 2026 היו 33.2 מיליארד דולר. Soycatory נבנית עם Claude, ש־Anthropic מייצרת.' } },
      { id: 'nvidia-record', topic: 'chips', status: 'confirmed', source: 'CNBC', url: 'https://www.cnbc.com/2026/11/17/nvidia-nvda-earnings-report-q3-2027.html',
        title: { en: 'Nvidia: record data center sales', he: 'Nvidia: שיא במכירות למרכזי נתונים' },
        line: { en: 'Data center revenue hit $107.6 billion in a quarter, up 110% from a year ago.', he: 'ההכנסות ממרכזי נתונים הגיעו ל־107.6 מיליארד דולר ברבעון, עלייה של 110% משנה שעברה.' },
        more: { en: 'That beat what analysts expected. The demand for computers that train and run AI is still growing fast, and it is what pays for most of the AI boom.', he: 'זה יותר ממה שהאנליסטים ציפו. הביקוש למחשבים שמאמנים ומריצים בינה מלאכותית עדיין גדל מהר, והוא מה שמממן את רוב הגל הזה.' } },
      { id: 'nvidia-china', topic: 'chips', status: 'confirmed', source: 'Bloomberg', url: 'https://www.bloomberg.com/news/articles/2026-11-18/interim-nvidia-ceo-says-it-s-no-longer-sending-ai-chips-to-china',
        title: { en: 'Nvidia stops sending AI chips to China', he: 'Nvidia מפסיקה לשלוח שבבי בינה מלאכותית לסין' },
        line: { en: 'Its interim chief executive said the company no longer ships its licensed data center chips there.', he: 'המנכ"לית הזמנית אמרה שהחברה כבר לא שולחת לשם את שבבי מרכזי הנתונים שקיבלו רישיון.' },
        more: { en: 'Nvidia sold $2.4 billion of those chips to China last quarter, and its forecast now leaves them out. Bloomberg also reported banned chips installed at a Shanghai data center.', he: 'ברבעון האחרון Nvidia מכרה לסין שבבים כאלה ב־2.4 מיליארד דולר, והתחזית שלה כבר לא כוללת אותם. Bloomberg דיווחה גם על שבבים אסורים שהותקנו במרכז נתונים בשנגחאי.' } },
      { id: 'us-remote-access', topic: 'rules', status: 'confirmed', source: 'Bloomberg', url: 'https://www.bloomberg.com/news/articles/2026-11-16/us-moves-to-limit-remote-access-to-advanced-ai-chips',
        title: { en: 'The US closes the "rent it abroad" gap', he: 'ארצות הברית סוגרת את פרצת "שוכרים בחו"ל"' },
        line: { en: 'Data centers in five countries will need a US licence before they get advanced AI chips.', he: 'מרכזי נתונים בחמש מדינות יצטרכו רישיון אמריקאי לפני שיקבלו שבבי בינה מלאכותית מתקדמים.' },
        more: { en: 'The countries are Singapore, Malaysia, Thailand, Indonesia and Brazil. The aim is to stop Chinese firms reaching the chips through offshore data centers. CNBC says it puts Southeast Asia\'s data center boom at risk.', he: 'המדינות הן סינגפור, מלזיה, תאילנד, אינדונזיה וברזיל. המטרה היא למנוע מחברות סיניות להגיע לשבבים דרך מרכזי נתונים מחוץ לסין. לפי CNBC זה מסכן את תנופת מרכזי הנתונים בדרום־מזרח אסיה.' } },
      { id: 'apple-agent', topic: 'agents', status: 'confirmed', source: 'Bloomberg', url: 'https://bloomberg.com/news/articles/2026-11-19/apple-is-working-on-ai-agent-for-device-control-apps-browsing-and-coding',
        title: { en: 'Apple is building an AI helper that does things for you', he: 'Apple בונה עוזר בינה מלאכותית שעושה דברים בשבילכם' },
        line: { en: 'It would control apps, browse the web and write code on your device, based on Apple job listings.', he: 'הוא אמור להפעיל אפליקציות, לגלוש ולכתוב קוד במכשיר, לפי מודעות דרושים של Apple.' },
        more: { en: 'This comes from Bloomberg reading Apple\'s job listings, not from an Apple announcement. AppleInsider reported the same. Nothing has a release date.', he: 'המידע מגיע מקריאה של Bloomberg במודעות הדרושים של Apple, לא מהודעה של Apple. גם AppleInsider דיווח על כך. אין תאריך יציאה.' } },
      { id: 'coding-agents', topic: 'agents', status: 'reported', source: 'AI Agents Directory', url: 'https://aiagentsdirectory.com/news/ai-agents-news-brief-november-17-2026',
        title: { en: 'Coding agents are moving into every tool', he: 'סוכני תכנות נכנסים לכל כלי' },
        line: { en: 'Android Studio lets you pick from 40+ agents; GitHub Copilot sessions follow you between devices.', he: 'Android Studio מאפשר לבחור מתוך יותר מ־40 סוכנים; עבודה ב־GitHub Copilot ממשיכה איתכם בין מכשירים.' },
        more: { en: 'Replit launched "Missions", where several agents plan, build and test together. Meta reportedly bought Conductor, which runs many coding agents at once. These come from roundups, so check each company\'s own post.', he: 'Replit השיקה את "Missions", שבו כמה סוכנים מתכננים, בונים ובודקים יחד. לפי דיווח Meta קנתה את Conductor, שמריצה הרבה סוכני תכנות בבת אחת. הפרטים מגיעים מסיכומים, אז כדאי לבדוק בהודעה של כל חברה.' } },
      { id: 'new-models', topic: 'models', status: 'reported', source: 'The Neuron', url: 'https://theneuron.ai/digest/everything-that-happened-in-ai-today-friday-november-20-2026',
        title: { en: 'A busy week for new AI models', he: 'שבוע עמוס במודלים חדשים' },
        line: { en: 'New versions reportedly came from OpenAI (GPT-6.2), Google (Gemini 4), Alibaba (Qwen4-Max) and Microsoft.', he: 'לפי דיווחים יצאו גרסאות חדשות מ־OpenAI ‏(GPT-6.2), מ־Google ‏(Gemini 4), מ־Alibaba ‏(Qwen4-Max) ומ־Microsoft.' },
        more: { en: 'Trackers disagree on some names and dates, so treat the details as reported. Alibaba kept its top Qwen4 model closed instead of publishing it openly.', he: 'יש מחלוקת בין האתרים על חלק מהשמות והתאריכים, אז הפרטים בגדר דיווח. Alibaba השאירה את מודל ה־Qwen4 המוביל שלה סגור ולא פרסמה אותו בגלוי.' } },
      { id: 'open-models', topic: 'open', status: 'reported', source: 'NoCode MBA', url: 'https://www.nocode.mba/ai-release-tracker/2026/11',
        title: { en: 'Open models you can download', he: 'מודלים פתוחים שאפשר להוריד' },
        line: { en: 'Moonshot\'s Kimi K3.1 Pro and Runway\'s Praxis-1 (Apache 2.0) were released with their weights.', he: 'Kimi K3.1 Pro של Moonshot ו־Praxis-1 של Runway ‏(Apache 2.0) שוחררו יחד עם המשקלות שלהם.' },
        more: { en: 'Small open speech models also arrived, some small enough to run in a browser. Check each model\'s licence before using it in a product.', he: 'הגיעו גם מודלים פתוחים קטנים לדיבור, חלקם קטנים מספיק כדי לרוץ בדפדפן. לפני שימוש במוצר כדאי לבדוק את הרישיון של כל מודל.' } },
      { id: 'eu-ai-act', topic: 'rules', status: 'reported', source: 'CASRAI', url: 'https://casrai.org/news/eu-ai-act-2-december-2026-obligations-article-50',
        title: { en: 'Europe: AI content must be marked from 2 December', he: 'אירופה: מ־2 בדצמבר צריך לסמן תוכן של בינה מלאכותית' },
        line: { en: 'Generative AI already on the EU market must mark what it makes, and new bans start the same day.', he: 'בינה מלאכותית יוצרת שכבר נמצאת בשוק האירופי צריכה לסמן את מה שהיא מייצרת, ואיסורים חדשים נכנסים לתוקף באותו יום.' },
        more: { en: 'The new bans cover AI that makes non-consensual intimate images or child abuse material. The bigger "high-risk" rules were pushed to December 2027. Check the European Commission\'s pages for final dates.', he: 'האיסורים החדשים חלים על בינה מלאכותית שמייצרת תמונות אינטימיות בלי הסכמה או חומר של פגיעה בילדים. הכללים הגדולים של "סיכון גבוה" נדחו לדצמבר 2027. את התאריכים הסופיים כדאי לבדוק באתר הנציבות האירופית.' } }
    ]
  }
];
