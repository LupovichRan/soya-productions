/* Ran Lupovich's CV, as data. Clients and past employers in banking are described, not named (site rule).
   Tags on each line: g = GenAI, d = data and Kafka, c = cloud, l = leadership. */
window.RAN_CV = {
  name: { en: 'Ran Lupovich', he: 'רן לופוביץ\'' },
  title: { en: 'Principal Architect · GenAI, Cloud & Data Platforms', he: 'ארכיטקט ראשי · GenAI, ענן ופלטפורמות דאטה' },
  where: { en: 'Israel · open to permanent roles, remote or flexible hybrid · relocating to the Be\'er Sheva area', he: 'ישראל · פתוח לתפקידים קבועים, מרחוק או היברידי גמיש · עובר לאזור באר שבע' },
  links: { email: 'ran.lupovich@gmail.com', linkedin: 'https://www.linkedin.com/in/ranlupovich', github: 'https://github.com/LupovichRan', soycatory: 'https://lupovichran.github.io/soya-productions/' },

  /* One opening paragraph per reader. */
  summary: {
    recruiter: {
      en: 'Hands-on architect and technology leader with 15+ years in enterprise data platforms, cloud and mission-critical banking systems. Today: CTO and principal consultant, leading data, cloud and GenAI delivery on AWS, Google Cloud and Azure. Built a major Israeli bank\'s Kafka platform from the ground up. Looking for a permanent principal or architect role, remote or flexible hybrid.',
      he: 'ארכיטקט ומוביל טכנולוגי מעשי עם יותר מ־15 שנות ניסיון בפלטפורמות דאטה ארגוניות, ענן ומערכות בנקאיות קריטיות. היום: CTO ויועץ ראשי, מוביל פרויקטים של דאטה, ענן ו־GenAI ב־AWS, ב־Google Cloud וב־Azure. הקים מאפס את פלטפורמת הקפקא של בנק ישראלי גדול. מחפש תפקיד קבוע של ארכיטקט ראשי, מרחוק או היברידי גמיש.'
    },
    leader: {
      en: 'I design systems that must not lose data and then stay with them in production. I set up a major bank\'s Kafka platform from vendor choice to on-call standards, co-led a SQL Server data lake move to BigQuery with hundreds of dbt models (recognised by the client in 2026), built a self-service cloud migration path used by about 100 customers, and built the backend team and the RAG and agent pipelines of a conversational AI platform that supports US military veterans, a startup that came out of stealth in 2026 and already serves many clients. For two years I have run AI coding agents under clear rules: I own the direction, the review, the tests and the cost.',
      he: 'אני מתכנן מערכות שאסור להן לאבד דאטה, ונשאר איתן בייצור. הקמתי את פלטפורמת הקפקא של בנק גדול, מבחירת הספק ועד תקני התפעול, הובלתי יחד העברה של אגם נתונים מ־SQL Server ל־BigQuery עם מאות מודלי dbt (שזכתה להוקרת הלקוח ב־2026), בניתי מסלול מעבר לענן בשירות עצמי שכ־100 לקוחות משתמשים בו, ובניתי את צוות ה־backend ואת צינורות ה־RAG והסוכנים של פלטפורמת בינה מלאכותית שיחתית שתומכת בוותיקי צבא אמריקאים, סטארט־אפ שיצא מחשאיות ב־2026 וכבר משרת לקוחות רבים. כבר שנתיים אני מפעיל סוכני קוד לפי כללים ברורים: הכיוון, הסקירה, הבדיקות והעלות נשארים אצלי.'
    },
    client: {
      en: 'You have data that must not get lost, a cloud bill that keeps growing, or a GenAI idea that needs to work in production. I come in, find where it breaks, design the fix, build it with your team and hand it over with standards your people can keep.',
      he: 'יש לכם דאטה שאסור שילך לאיבוד, חשבון ענן שרק גדל, או רעיון GenAI שצריך לעבוד בייצור. אני נכנס, מוצא איפה זה נשבר, מתכנן את התיקון, בונה אותו עם הצוות שלכם ומעביר אותו עם תקנים שהאנשים שלכם יוכלו לשמור עליהם.'
    },
    kid: {
      en: 'Hi, it\'s Soya. My human Ran builds the invisible pipes that carry information between computers, like water pipes but for messages. In a bank, one lost message could mean someone\'s money goes missing, so his pipes must never leak. Now he also teaches computers to answer questions, like a helper that talks with soldiers who came home from the army, and he makes little apps with me. He says it is work. I say it is typing.',
      he: 'היי, זה סויה. הבן אדם שלי, רן, בונה צינורות בלתי נראים שמעבירים מידע בין מחשבים, כמו צינורות מים, רק להודעות. בבנק, הודעה אחת שהולכת לאיבוד יכולה להיות כסף של מישהו שנעלם, אז אסור שהצינורות שלו ידלפו. עכשיו הוא גם מלמד מחשבים לענות על שאלות, כמו עוזר שמדבר עם חיילים שחזרו הביתה מהצבא, ובונה איתי אפליקציות קטנות. הוא אומר שזו עבודה. אני אומר שזה הקלדה.'
    }
  },

  skills: [
    { tag: 'l', en: 'Architecture & leadership', he: 'ארכיטקטורה והובלה', items: { en: 'End-to-end solution design, technical strategy, requirements, team mentoring, vendor evaluation, production delivery', he: 'תכנון פתרונות מקצה לקצה, אסטרטגיה טכנולוגית, דרישות, חניכת צוותים, בחירת ספקים, מסירה לייצור' } },
    { tag: 'g', en: 'GenAI platforms', he: 'פלטפורמות GenAI', items: { en: 'RAG pipelines, LLM integrations, AI agent orchestration, virtual assistants; Anthropic, OpenAI and NVIDIA technologies', he: 'צינורות RAG, שילוב מודלי שפה, תזמור סוכנים, עוזרים וירטואליים; טכנולוגיות של Anthropic, OpenAI ו־NVIDIA' } },
    { tag: 'c', en: 'Cloud & automation', he: 'ענן ואוטומציה', items: { en: 'AWS, Microsoft Azure, Google Cloud; hybrid infrastructure, Terraform, Ansible, Jenkins, CI/CD', he: 'AWS, Microsoft Azure, Google Cloud; תשתית היברידית, Terraform, Ansible, Jenkins, CI/CD' } },
    { tag: 'd', en: 'Data & streaming', he: 'דאטה וסטרימינג', items: { en: 'Kafka / Confluent, BigQuery, dbt, Airflow, Python, SQL, SQL Server and SSIS modernisation', he: 'Kafka / Confluent, BigQuery, dbt, Airflow, Python, SQL, מודרניזציה של SQL Server ו־SSIS' } },
    { tag: 'l', en: 'Security & quality', he: 'אבטחה ואיכות', items: { en: 'Data masking, encryption, lineage, GDPR-related controls, code review, testing, security reviews, budget control', he: 'מיסוך והצפנת נתונים, שושלת נתונים, בקרות בנוסח GDPR, סקירת קוד, בדיקות, סקירות אבטחה, בקרת תקציב' } }
  ],

  jobs: [
    { role: { en: 'CTO / Principal Technology Consultant', he: 'CTO / יועץ טכנולוגי ראשי' }, org: { en: '1 2 3 Completed', he: '1 2 3 Completed' }, when: { en: 'Jan 2022 – now · remote', he: 'ינואר 2022 – היום · מרחוק' },
      lines: [
        { tag: 'l', en: 'Lead architecture and hands-on delivery of data, cloud and AI work for financial services, cybersecurity, healthcare and technology clients.', he: 'מוביל ארכיטקטורה ומסירה מעשית של פרויקטי דאטה, ענן ובינה מלאכותית ללקוחות בפיננסים, סייבר, בריאות וטכנולוגיה.' },
        { tag: 'd', en: 'Co-led a major move of a SQL Server data lake to Google BigQuery, with Kafka pipelines and hundreds of dbt models. The client recognised the work for its technical execution and architecture in July 2026.', he: 'הובלתי יחד העברה גדולה של אגם נתונים מ־SQL Server ל־Google BigQuery, עם צינורות קפקא ומאות מודלי dbt. הלקוח הוקיר את העבודה על הביצוע הטכני והארכיטקטורה ביולי 2026.' },
        { tag: 'c', en: 'Designed and built an encrypted, self-service path from on-premises to the SaaS product, adopted by about 100 customers, and trained the client\'s support team to run the rollout.', he: 'תכננתי ובניתי מסלול מוצפן בשירות עצמי ממערכות מקומיות למוצר ה־SaaS, שכ־100 לקוחות אימצו, והכשרתי את צוות התמיכה של הלקוח להפעיל את ההטמעה.' },
        { tag: 'd', en: 'Built a metadata-driven privacy layer that discovers policy tags and rebuilds SQL views every day, for data masking and regional access control.', he: 'בניתי שכבת פרטיות מבוססת מטא־דאטה שמזהה תגי מדיניות ובונה מחדש תצוגות SQL בכל יום, למיסוך נתונים ולבקרת גישה לפי אזור.' },
        { tag: 'g', en: 'Design enterprise AI and virtual-assistant solutions with AWS, RAG and Anthropic, OpenAI and NVIDIA technologies.', he: 'מתכנן פתרונות בינה מלאכותית ועוזרים וירטואליים ארגוניים עם AWS, RAG וטכנולוגיות של Anthropic, OpenAI ו־NVIDIA.' },
        { tag: 'c', en: 'Deliver cloud enablement, CI/CD and security modernisation, including for a cybersecurity company, with API integration, lineage and privacy controls.', he: 'מוביל הטמעת ענן, CI/CD ומודרניזציה של אבטחה, כולל עבור חברת סייבר, עם שילוב API, שושלת נתונים ובקרות פרטיות.' }
      ] },
    { role: { en: 'Conversational AI platform for veterans\' wellbeing · architecture, team and build', he: 'פלטפורמת בינה מלאכותית שיחתית לרווחת ותיקי צבא · ארכיטקטורה, צוות ובנייה' }, org: { en: 'A US startup supporting military veterans', he: 'סטארט־אפ אמריקאי שתומך בוותיקי צבא' }, when: { en: 'Out of stealth in 2026, already serving many clients', he: 'יצא מחשאיות ב־2026 וכבר משרת לקוחות רבים' },
      lines: [
        { tag: 'l', en: 'First technical lead on the ground: set up the first engineering team and infrastructure, and led the team that owned the whole backend while writing backend services myself.', he: 'ראש הצוות הטכני הראשון בשטח: הקמתי את צוות הפיתוח הראשון ואת התשתית, והובלתי את הצוות שאחראי על כל ה־backend, תוך כתיבת שירותים בעצמי.' },
        { tag: 'g', en: 'Built RAG pipelines, LLM integrations and AI agent orchestration around the organisation\'s expert knowledge.', he: 'בניתי צינורות RAG, שילובי מודלי שפה ותזמור סוכנים סביב הידע המומחה של הארגון.' },
        { tag: 'l', en: 'The startup came out of stealth in 2026 and already serves many clients in the US.', he: 'הסטארט־אפ יצא מחשאיות ב־2026 וכבר משרת לקוחות רבים בארצות הברית.' }
      ] },
    { role: { en: 'AI-assisted engineering governance', he: 'ממשל לפיתוח בעזרת בינה מלאכותית' }, org: { en: 'Across projects', he: 'בכל הפרויקטים' }, when: { en: 'Past two years', he: 'בשנתיים האחרונות' },
      lines: [
        { tag: 'g', en: 'Supervised AI coding agents that carry out most of the code, while keeping ownership of architecture, code review, testing and security validation.', he: 'פיקחתי על סוכני קוד שכותבים את רוב הקוד, תוך שמירה על הארכיטקטורה, סקירת הקוד, הבדיקות ואימות האבטחה.' },
        { tag: 'l', en: 'Wrote the instructions and limits for Claude Code, Codex, Cursor, Gemini and Grok-based bots; ran security reviews and kept tool and infrastructure costs in check.', he: 'כתבתי הנחיות ומגבלות ל־Claude Code, Codex, Cursor, Gemini ובוטים מבוססי Grok; ערכתי סקירות אבטחה ושמרתי על עלויות הכלים והתשתית.' }
      ] },
    { role: { en: 'Technical Lead, Data Infrastructure', he: 'ראש צוות טכני, תשתיות דאטה' }, org: { en: 'A major Israeli bank', he: 'בנק ישראלי גדול' }, when: { en: '2019 – 2021', he: '2019 – 2021' },
      lines: [
        { tag: 'd', en: 'Architected and deployed the bank\'s enterprise Apache Kafka platform from the ground up for mission-critical workloads.', he: 'תכננתי והקמתי מאפס את פלטפורמת ה־Apache Kafka הארגונית של הבנק לעומסים קריטיים.' },
        { tag: 'l', en: 'Led vendor selection, high-availability design and production troubleshooting; set the streaming standards, design patterns and operating processes. Recognised by the bank in 2020 for establishing its event-streaming infrastructure.', he: 'הובלתי בחירת ספק, תכנון זמינות גבוהה ופתרון תקלות בייצור; קבעתי תקני סטרימינג, דפוסי תכנון ותהליכי תפעול. קיבלתי הוקרה מהבנק ב־2020 על הקמת תשתית הסטרימינג שלו.' }
      ] },
    { role: { en: 'Database Administration Team Lead', he: 'ראש צוות DBA' }, org: { en: 'A major Israeli bank', he: 'בנק ישראלי גדול' }, when: { en: '2017 – 2018', he: '2017 – 2018' },
      lines: [ { tag: 'l', en: 'Led and mentored the DBA team; set standards, onboarding and change control, and led performance work on critical IBM Db2 systems.', he: 'הובלתי וחנכתי את צוות ה־DBA; קבעתי תקנים, קליטה ובקרת שינויים, והובלתי שיפורי ביצועים במערכות IBM Db2 קריטיות.' } ] },
    { role: { en: 'Senior Database Administrator', he: 'DBA בכיר' }, org: { en: 'A major Israeli bank', he: 'בנק ישראלי גדול' }, when: { en: '2011 – 2016', he: '2011 – 2016' },
      lines: [ { tag: 'd', en: 'Ran enterprise IBM Db2 environments and led critical version migrations, with the focus on data integrity, continuity and operational risk.', he: 'ניהלתי סביבות IBM Db2 ארגוניות והובלתי שדרוגי גרסה קריטיים, עם דגש על שלמות נתונים, רציפות וסיכון תפעולי.' } ] },
    { role: { en: 'Database Administrator / System Engineer', he: 'DBA / מהנדס מערכת' }, org: { en: 'IAF Computers Unit', he: 'יחידת המחשבים של חיל האוויר' }, when: { en: '2006 – 2008', he: '2006 – 2008' },
      lines: [ { tag: 'd', en: 'Supported IBM Db2 and enterprise computing infrastructure.', he: 'תמיכה ב־IBM Db2 ובתשתית מחשוב ארגונית.' } ] }
  ],

  /* For clients: what I can do for you. */
  services: [
    { tag: 'd', en: 'Kafka reliability review: find where messages can be lost, repeated or reordered, and fix it.', he: 'סקירת אמינות קפקא: למצוא איפה הודעות יכולות ללכת לאיבוד, לחזור או להתבלבל בסדר, ולתקן.' },
    { tag: 'd', en: 'Data platform modernisation: from SQL Server and SSIS to BigQuery, dbt and Airflow, with tests and lineage.', he: 'מודרניזציה של פלטפורמת דאטה: מ־SQL Server ו־SSIS ל־BigQuery, dbt ו־Airflow, עם בדיקות ושושלת נתונים.' },
    { tag: 'g', en: 'GenAI in production: RAG and agents that answer from your own knowledge, with security review and a cost budget.', he: 'GenAI בייצור: RAG וסוכנים שעונים מתוך הידע שלכם, עם סקירת אבטחה ותקציב עלויות.' },
    { tag: 'g', en: 'AI-assisted engineering setup: rules, review and cost control for coding agents, so the team ships faster without losing ownership.', he: 'הקמת פיתוח בעזרת בינה מלאכותית: כללים, סקירה ובקרת עלויות לסוכני קוד, כדי שהצוות יספק מהר יותר בלי לאבד אחריות.' },
    { tag: 'c', en: 'Cloud enablement: landing zones, CI/CD and infrastructure as code on AWS, Google Cloud or Azure.', he: 'הטמעת ענן: סביבות בסיס, CI/CD ותשתית כקוד ב־AWS, ב־Google Cloud או ב־Azure.' }
  ],

  /* For kids: Soya explains in plain words. */
  kidFacts: [
    { en: 'Kafka is not a person here. It is a system that carries messages in the right order, so nothing gets lost. Ran built a giant one for a bank.', he: 'קפקא כאן זה לא סופר. זו מערכת שמעבירה הודעות בסדר הנכון, כך ששום דבר לא הולך לאיבוד. רן בנה אחת ענקית לבנק.' },
    { en: 'A database is a huge, tidy cupboard for information. For years Ran kept a bank\'s cupboards safe and fast.', he: 'מסד נתונים הוא ארון ענק ומסודר למידע. במשך שנים רן שמר שהארונות של בנק יהיו בטוחים ומהירים.' },
    { en: 'The cloud is not in the sky. It is other people\'s computers that you rent. Ran helps companies move there without breaking things.', he: 'הענן לא בשמיים. אלה מחשבים של אחרים ששוכרים. רן עוזר לחברות לעבור לשם בלי לשבור כלום.' },
    { en: 'He also teaches computers to answer questions from what a company knows. I asked one where my tuna is. It did not know.', he: 'הוא גם מלמד מחשבים לענות על שאלות ממה שחברה יודעת. שאלתי אחד איפה הטונה שלי. הוא לא ידע.' }
  ],

  side: [
    { en: 'Soycatory: a small factory of friendly web apps, one a day, in English and Hebrew.', he: 'Soycatory: מפעל קטן של אפליקציות רשת ידידותיות, אחת ביום, באנגלית ובעברית.', url: 'https://lupovichran.github.io/soya-productions/' },
    { en: 'Kafka Check: paste a Kafka config and see where messages could be lost, repeated or reordered.', he: 'בדיקת קפקא: מדביקים הגדרות קפקא ורואים איפה הודעות עלולות ללכת לאיבוד, לחזור או להתבלבל.', url: 'https://lupovichran.github.io/soya-productions/apps/2026-11-20-kafka-check/' },
    { en: 'Soya News: big things, explained for small cats, from age 6 to 66.', he: 'החדשות של סויה: דברים גדולים, מוסברים לחתולים קטנים, מגיל 6 עד 66.', url: 'https://lupovichran.github.io/soya-productions/apps/2026-11-21-soya-news/' }
  ],

  education: [
    { en: 'MBA, Business Administration · The College of Management Academic Studies · 2013–2015', he: 'MBA, מנהל עסקים · המסלול האקדמי המכללה למינהל · 2013–2015' },
    { en: 'B.Sc., Computer Science · The College of Management Academic Studies · 2010–2012', he: 'B.Sc., מדעי המחשב · המסלול האקדמי המכללה למינהל · 2010–2012' },
    { en: 'Programmer training · MAMRAM · 2006', he: 'קורס תכנות · ממר"ם · 2006' }
  ],
  certs: [
    { en: 'AWS Certified Cloud Practitioner · 2026–2029', he: 'AWS Certified Cloud Practitioner · 2026–2029' },
    { en: 'Confluent Certified Administrator for Apache Kafka · 2022', he: 'Confluent Certified Administrator for Apache Kafka · 2022' },
    { en: 'IBM Certified Database Administrator, Db2 11 for z/OS · 2017', he: 'IBM Certified Database Administrator, Db2 11 for z/OS · 2017' },
    { en: 'IBM Champion · 2019', he: 'IBM Champion · 2019' }
  ],
  more: { en: 'Also: IBM Db2 / z/OS, PostgreSQL, MongoDB Atlas, Amazon Aurora, Redis, Splunk, REST APIs, WSO2 / API Gateway, Confluent REST Proxy, Linux, Windows.', he: 'גם: IBM Db2 / z/OS, PostgreSQL, MongoDB Atlas, Amazon Aurora, Redis, Splunk, REST APIs, WSO2 / API Gateway, Confluent REST Proxy, Linux, Windows.' },
  languages: { en: 'Hebrew (native) · English (fluent) · French (basic)', he: 'עברית (שפת אם) · אנגלית (שוטפת) · צרפתית (בסיסית)' }
};

/* One CV per position. Same facts; each version changes the title, the opening, which skills come first and what is
   highlighted. Modelled on Ran's tailored CVs. Share a version with ?role=<id>. */
window.RAN_CV.roles = [
  { id: 'principal', tag: 'all', order: ['l', 'g', 'c', 'd'],
    name: { en: 'Principal Architect', he: 'ארכיטקט ראשי' },
    title: { en: 'Principal Architect · GenAI, Cloud & Data Platforms', he: 'ארכיטקט ראשי · GenAI, ענן ופלטפורמות דאטה' },
    pitch: { en: 'Hands-on architect who takes data, cloud and GenAI work from requirements to production and stays for the handover: a major bank\'s Kafka platform from the ground up, a data lake move with hundreds of dbt models, and the backend and agent pipelines of a conversational AI platform.', he: 'ארכיטקט מעשי שלוקח עבודת דאטה, ענן ו־GenAI מהדרישות ועד הייצור, ונשאר עד ההעברה: פלטפורמת הקפקא של בנק גדול מאפס, העברת אגם נתונים עם מאות מודלי dbt, וה־backend וצינורות הסוכנים של פלטפורמת בינה מלאכותית שיחתית.' } },
  { id: 'data-architect', tag: 'd', order: ['d', 'l', 'c', 'g'],
    name: { en: 'Data Architect', he: 'ארכיטקט דאטה' },
    title: { en: 'Data Architect · Data Platforms, Streaming & Governance', he: 'ארכיטקט דאטה · פלטפורמות דאטה, סטרימינג וממשל נתונים' },
    pitch: { en: 'Data architect with 15+ years from database internals to cloud data platforms: built a major bank\'s enterprise Kafka platform, co-led a SQL Server data lake move to BigQuery with hundreds of dbt models (recognised by the client), and built privacy layers for masking, lineage and regional access.', he: 'ארכיטקט דאטה עם יותר מ־15 שנה, מהקרביים של מסדי נתונים ועד פלטפורמות דאטה בענן: בנה את פלטפורמת הקפקא הארגונית של בנק גדול, הוביל יחד העברת אגם נתונים מ־SQL Server ל־BigQuery עם מאות מודלי dbt (בהוקרת הלקוח), ובנה שכבות פרטיות למיסוך, שושלת נתונים וגישה לפי אזור.' } },
  { id: 'genai', tag: 'g', order: ['g', 'l', 'c', 'd'],
    name: { en: 'GenAI Architect', he: 'ארכיטקט GenAI' },
    title: { en: 'GenAI Architect · RAG, Agents & LLM Platforms', he: 'ארכיטקט GenAI · RAG, סוכנים ופלטפורמות מודלי שפה' },
    pitch: { en: 'GenAI architect who ships: first technical lead on the ground of a conversational AI startup for US veterans, building its backend team, RAG pipelines, LLM integrations and agent orchestration. Two years of running AI coding agents with clear rules, security review and cost control, on a base of 15 years of reliable data systems.', he: 'ארכיטקט GenAI שמספק: ראש הצוות הטכני הראשון בשטח של סטארט־אפ בינה מלאכותית שיחתית לוותיקי צבא אמריקאים, שבנה את צוות ה־backend, צינורות RAG, שילובי מודלי שפה ותזמור סוכנים. שנתיים של הפעלת סוכני קוד לפי כללים ברורים, עם סקירת אבטחה ובקרת עלויות, על בסיס של 15 שנה של מערכות דאטה אמינות.' } },
  { id: 'data-eng-lead', tag: 'd', order: ['d', 'c', 'l', 'g'],
    name: { en: 'Data Engineering Lead', he: 'ראש צוות הנדסת דאטה' },
    title: { en: 'Data Engineering Lead · BigQuery, dbt, Airflow & Kafka', he: 'ראש צוות הנדסת דאטה · BigQuery, dbt, Airflow וקפקא' },
    pitch: { en: 'Data engineering leader who has led teams and still builds: co-led a data lake move from SQL Server and SSIS to BigQuery, dbt and Airflow with Kafka pipelines and hundreds of models, led a bank\'s DBA team, and set streaming standards for mission-critical workloads.', he: 'מוביל הנדסת דאטה שהוביל צוותים ועדיין בונה: הוביל יחד העברת אגם נתונים מ־SQL Server ו־SSIS ל־BigQuery, dbt ו־Airflow עם צינורות קפקא ומאות מודלים, הוביל את צוות ה־DBA של בנק, וקבע תקני סטרימינג לעומסים קריטיים.' } },
  { id: 'ai-engineer', tag: 'g', order: ['g', 'd', 'c', 'l'],
    name: { en: 'AI Software Engineer', he: 'מהנדס תוכנה AI' },
    title: { en: 'Senior AI Software Engineer · Backend, RAG & Agents', he: 'מהנדס תוכנה AI בכיר · Backend, RAG וסוכנים' },
    pitch: { en: 'Hands-on engineer who writes backend services and AI pipelines himself: RAG, LLM integrations and agent orchestration for a conversational AI platform, Python and SQL data pipelines, and daily work with Claude Code, Codex, Cursor and Gemini under strict review and testing.', he: 'מהנדס מעשי שכותב בעצמו שירותי backend וצינורות בינה מלאכותית: RAG, שילובי מודלי שפה ותזמור סוכנים לפלטפורמה שיחתית, צינורות דאטה ב־Python וב־SQL, ועבודה יומיומית עם Claude Code, Codex, Cursor ו־Gemini תחת סקירה ובדיקות קפדניות.' } },
  { id: 'solutions', tag: 'c', order: ['c', 'l', 'd', 'g'],
    name: { en: 'Solutions Architect / TAM', he: 'ארכיטקט פתרונות / TAM' },
    title: { en: 'Solutions Architect · Customer-facing Data, Cloud & AI', he: 'ארכיטקט פתרונות · דאטה, ענן ו־AI מול לקוחות' },
    pitch: { en: 'Customer-facing architect who turns business needs into working systems: built a self-service cloud migration path adopted by about 100 customers and trained the client\'s support team, runs consulting for financial, cybersecurity, healthcare and technology clients, and knows production from years on call for a bank.', he: 'ארכיטקט מול לקוחות שהופך צרכים עסקיים למערכות עובדות: בנה מסלול מעבר לענן בשירות עצמי שכ־100 לקוחות אימצו והכשיר את צוות התמיכה של הלקוח, מייעץ ללקוחות בפיננסים, סייבר, בריאות וטכנולוגיה, ומכיר ייצור משנים של כוננות בבנק.' } }
];
