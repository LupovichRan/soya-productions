/* Kafka Check: the rules. Pure functions with no page, storage or network, so they can be tested alone and run from the
   command line (cli.js). It reads a pasted Kafka client, broker, topic or Connect config and points at settings that can
   lose, repeat or reorder messages, each with why, what to do, and a link to Kafka's own documentation.

   What it is not: a proof. A config cannot show whether your code is idempotent, how fast it processes records, or whether
   you have ever tested a broker failure. It says so, and lists those questions as a checklist. Every rule is written from
   what Kafka's documentation says; where a rule is a rule of thumb rather than a documented fact, its text says "usually". */
(function (root) {
  'use strict';

  var DOCS_VERSION = '44';        /* the Kafka documentation version these links point to; change it when the docs move on */
  var PAGES = { producerconfigs: 'producer-configs', consumerconfigs: 'consumer-configs', brokerconfigs: 'broker-configs', topicconfigs: 'topic-configs', connectconfigs: 'kafka-connect-configs', sinkconnectorconfigs: 'kafka-connect-configs' };
  var DOCS = 'https://kafka.apache.org/' + DOCS_VERSION + '/configuration/';
  var SECRET = /(password|secret|token|credential|jaas|private\.key|key\.password|api[._-]?key|sasl\.oauthbearer)/i;
  var LIMITS = { lines: 600, valueLength: 400 };

  /** Read "key=value" lines (also "key: value"). Comments start with # or !. A trailing backslash joins the next line.
      Values of anything that looks like a secret are replaced, so nothing sensitive is ever shown or kept. */
  function parse(text) {
    var out = { props: {}, order: [], hidden: 0, ignored: 0 }, raw = String(text == null ? '' : text).replace(/\r/g, '').split('\n').slice(0, LIMITS.lines), i, line;
    for (i = 0; i < raw.length; i++) {
      line = raw[i];
      while (/\\\s*$/.test(line) && i + 1 < raw.length) { line = line.replace(/\\\s*$/, '') + raw[++i].replace(/^\s+/, ''); }
      line = line.trim();
      if (!line || line[0] === '#' || line[0] === '!') continue;
      var m = line.match(/^([^=:\s]+)\s*[=:]\s*(.*)$/);
      if (!m) { out.ignored++; continue; }
      var key = m[1].trim(), value = m[2].trim().slice(0, LIMITS.valueLength);
      if (SECRET.test(key)) { value = '(hidden)'; out.hidden++; }
      if (!(key in out.props)) out.order.push(key);
      out.props[key] = value;
    }
    return out;
  }

  var KEYS = {
    producer: ['acks', 'retries', 'linger.ms', 'batch.size', 'compression.type', 'enable.idempotence', 'transactional.id', 'max.in.flight.requests.per.connection', 'delivery.timeout.ms', 'request.timeout.ms', 'buffer.memory', 'max.block.ms'],
    consumer: ['group.id', 'enable.auto.commit', 'auto.commit.interval.ms', 'auto.offset.reset', 'max.poll.interval.ms', 'max.poll.records', 'session.timeout.ms', 'heartbeat.interval.ms', 'isolation.level', 'group.instance.id', 'group.protocol', 'fetch.min.bytes', 'partition.assignment.strategy'],
    broker: ['broker.id', 'node.id', 'process.roles', 'log.dirs', 'default.replication.factor', 'offsets.topic.replication.factor', 'auto.create.topics.enable', 'num.partitions', 'transaction.state.log.replication.factor', 'transaction.state.log.min.isr', 'log.retention.hours', 'log.retention.ms', 'log.retention.minutes', 'controller.quorum.voters', 'listeners'],
    topic: ['cleanup.policy', 'retention.ms', 'retention.bytes', 'replication.factor', 'delete.retention.ms', 'segment.ms'],
    connect: ['connector.class', 'errors.tolerance', 'errors.deadletterqueue.topic.name', 'errors.log.enable', 'errors.retry.timeout', 'offset.flush.interval.ms', 'tasks.max', 'key.converter', 'value.converter']
  };
  var SHARED = ['min.insync.replicas', 'unclean.leader.election.enable'];     // belong to both brokers and topics

  /** Which kinds of config are in the paste. */
  function detect(props) {
    var found = [];
    Object.keys(KEYS).forEach(function (role) { if (KEYS[role].some(function (k) { return k in props; })) found.push(role); });
    if (!found.length && SHARED.some(function (k) { return k in props; })) found.push('broker');
    return found;
  }

  function link(anchor) { return DOCS + (PAGES[anchor.split('_')[0]] || '') + '/#' + anchor; }

  /* Each rule: when(c) returns null (fine) or { keys: [...], v: {placeholders} }. Text is in English and Hebrew; {x} is replaced from v. */
  var RULES = [
    { id: 'acks-none', level: 'risk', role: 'producer', docs: link('producerconfigs_acks'),
      when: function (c) { return c.str('acks') === '0' ? { keys: ['acks'], v: {} } : null; },
      en: { title: 'The producer does not wait for any acknowledgement (acks=0)', why: 'It sends and moves on. If the broker is down or the message is lost on the way, the producer never finds out.', fix: 'Use acks=all, together with min.insync.replicas=2 on a topic with 3 replicas.' },
      he: { title: 'היצרן לא מחכה לשום אישור (acks=0)', why: 'הוא שולח וממשיך הלאה. אם הברוקר למטה או שההודעה אבדה בדרך, היצרן אף פעם לא יֵדע.', fix: 'להשתמש ב־acks=all, יחד עם min.insync.replicas=2 בנושא עם 3 העתקים.' } },
    { id: 'acks-one', level: 'risk', role: 'producer', docs: link('producerconfigs_acks'),
      when: function (c) { var a = c.eff('acks'); return a === '1' ? { keys: ['acks'], v: { from: c.has('acks') ? 'set' : 'the default before Kafka 3.0' } } : null; },
      en: { title: 'Only the leader has to acknowledge (acks=1)', why: 'A message the leader has acknowledged can still be lost if the leader fails before the other replicas have copied it.', fix: 'Use acks=all, together with min.insync.replicas=2 on a topic with 3 replicas.' },
      he: { title: 'רק המנהיג צריך לאשר (acks=1)', why: 'הודעה שהמנהיג אישר עדיין יכולה ללכת לאיבוד אם המנהיג נופל לפני שההעתקים האחרים העתיקו אותה.', fix: 'להשתמש ב־acks=all, יחד עם min.insync.replicas=2 בנושא עם 3 העתקים.' } },
    { id: 'retries-zero', level: 'risk', role: 'producer', docs: link('producerconfigs_retries'),
      when: function (c) { return c.num('retries') === 0 ? { keys: ['retries'], v: {} } : null; },
      en: { title: 'The producer never retries (retries=0)', why: 'A short broker hiccup or a leader change makes the send fail, and the message is dropped unless your code handles the error.', fix: 'Leave retries at its default (very large) and bound the effort with delivery.timeout.ms instead.' },
      he: { title: 'היצרן אף פעם לא מנסה שוב (retries=0)', why: 'תקלה קצרה בברוקר או החלפת מנהיג גורמת לשליחה להיכשל, וההודעה נזרקת אלא אם הקוד שלכם מטפל בשגיאה.', fix: 'להשאיר את retries בברירת המחדל (גבוהה מאוד) ולהגביל את המאמץ עם delivery.timeout.ms.' } },
    { id: 'idempotence-off', level: 'warn', role: 'producer', docs: link('producerconfigs_enable.idempotence'),
      when: function (c) { var explicit = c.str('enable.idempotence'); if (explicit === 'false') return { keys: ['enable.idempotence'], v: { why: 'it is set to false' } }; if (!c.has('enable.idempotence') && c.version < 3) return { keys: [], v: { why: 'before Kafka 3.0 it is off by default' } }; return null; },
      en: { title: 'Idempotence is off', why: 'With retries on, a retry can write the same message twice (and, with several requests in flight, in a different order). This is why: {why}.', fix: 'Set enable.idempotence=true. On Kafka 3.0 and later it is the default unless something else in the config switches it off.' },
      he: { title: 'אידמפוטנטיות כבויה', why: 'כשיש ניסיונות חוזרים, ניסיון חוזר יכול לכתוב את אותה הודעה פעמיים (ועם כמה בקשות במקביל, גם בסדר אחר). הסיבה: {why}.', fix: 'להגדיר enable.idempotence=true. בקפקא 3.0 ומעלה זו ברירת המחדל, אלא אם משהו אחר בהגדרות מכבה אותה.' } },
    { id: 'idempotence-conflict', level: 'risk', role: 'producer', docs: link('producerconfigs_enable.idempotence'),
      when: function (c) {
        if (c.str('enable.idempotence') !== 'true') return null; var bad = [];
        if (c.has('acks') && c.str('acks') !== 'all' && c.str('acks') !== '-1') bad.push('acks=' + c.str('acks'));
        if (c.num('retries') === 0) bad.push('retries=0');
        if (c.num('max.in.flight.requests.per.connection') > 5) bad.push('max.in.flight.requests.per.connection=' + c.str('max.in.flight.requests.per.connection'));
        return bad.length ? { keys: ['enable.idempotence'].concat(bad.map(function (x) { return x.split('=')[0]; })), v: { bad: bad.join(', ') } } : null; },
      en: { title: 'Idempotence is switched on, but other settings contradict it', why: 'Idempotence needs acks=all, retries above 0 and at most 5 requests in flight. You set: {bad}. The producer will refuse to start with this combination.', fix: 'Remove the conflicting settings, or set them to acks=all, a non-zero retries, and max.in.flight.requests.per.connection of 5 or less.' },
      he: { title: 'אידמפוטנטיות מופעלת, אבל הגדרות אחרות סותרות אותה', why: 'אידמפוטנטיות דורשת acks=all, retries גדול מ־0 ולכל היותר 5 בקשות במקביל. הגדרתם: {bad}. היצרן יסרב לעלות עם השילוב הזה.', fix: 'להסיר את ההגדרות הסותרות, או להגדיר acks=all, retries שאינו אפס, ו־max.in.flight.requests.per.connection של 5 או פחות.' } },
    { id: 'reorder', level: 'warn', role: 'producer', docs: link('producerconfigs_max.in.flight.requests.per.connection'),
      when: function (c) { var n = c.num('max.in.flight.requests.per.connection'); return (n > 1 && c.num('retries') !== 0 && !c.idem()) ? { keys: ['max.in.flight.requests.per.connection'], v: { n: n } } : null; },
      en: { title: 'Messages can arrive out of order after a retry', why: 'With {n} requests in flight, retries on and no idempotence, a failed batch can be retried after a later one succeeded.', fix: 'Turn on idempotence (it keeps order with up to 5 in flight), or set max.in.flight.requests.per.connection=1 if order matters and you cannot use idempotence.' },
      he: { title: 'הודעות יכולות להגיע בסדר שונה אחרי ניסיון חוזר', why: 'עם {n} בקשות במקביל, ניסיונות חוזרים ובלי אידמפוטנטיות, אצווה שנכשלה יכולה להישלח שוב אחרי שאצווה מאוחרת יותר הצליחה.', fix: 'להפעיל אידמפוטנטיות (היא שומרת על הסדר עד 5 בקשות במקביל), או להגדיר max.in.flight.requests.per.connection=1 אם הסדר חשוב ואי אפשר להשתמש באידמפוטנטיות.' } },
    { id: 'delivery-timeout', level: 'risk', role: 'producer', docs: link('producerconfigs_delivery.timeout.ms'),
      when: function (c) { var d = c.num('delivery.timeout.ms'); if (d == null) return null; var l = c.has('linger.ms') ? c.num('linger.ms') : 0, r = c.has('request.timeout.ms') ? c.num('request.timeout.ms') : 30000; return d < l + r ? { keys: ['delivery.timeout.ms'], v: { d: d, sum: l + r } } : null; },
      en: { title: 'delivery.timeout.ms is shorter than linger.ms plus request.timeout.ms', why: 'Kafka expects delivery.timeout.ms to be at least their sum ({sum} ms here, from what you set and the defaults). With {d} ms the producer will not accept the config.', fix: 'Raise delivery.timeout.ms (its default is 120000), or shorten linger.ms and request.timeout.ms.' },
      he: { title: 'delivery.timeout.ms קצר מסכום linger.ms ו־request.timeout.ms', why: 'קפקא מצפה ש־delivery.timeout.ms יהיה לפחות הסכום שלהם ({sum} מילישניות כאן, ממה שהגדרתם ומברירות המחדל). עם {d} מילישניות היצרן לא יקבל את ההגדרה.', fix: 'להגדיל את delivery.timeout.ms (ברירת המחדל 120000), או לקצר את linger.ms ואת request.timeout.ms.' } },
    { id: 'delivery-timeout-short', level: 'warn', role: 'producer', docs: link('producerconfigs_delivery.timeout.ms'),
      when: function (c) { var d = c.num('delivery.timeout.ms'); return (d != null && d >= 0 && d < 30000 && !(d < (c.has('linger.ms') ? c.num('linger.ms') : 0) + (c.has('request.timeout.ms') ? c.num('request.timeout.ms') : 30000))) ? { keys: ['delivery.timeout.ms'], v: { d: d } } : null; },
      en: { title: 'The producer gives up quickly', why: 'After {d} ms an unsent message is failed. A leader election or a rolling restart can take longer than that, so messages fail during normal maintenance. (A rule of thumb, not a documented limit.)', fix: 'Keep delivery.timeout.ms at or near its default of 120000 ms, and handle the failure callback.' },
      he: { title: 'היצרן מוותר מהר', why: 'אחרי {d} מילישניות הודעה שלא נשלחה נכשלת. בחירת מנהיג או הפעלה מחדש מדורגת יכולות לקחת יותר מזה, ולכן הודעות נכשלות בתחזוקה רגילה. (כלל אצבע, לא גבול מתועד.)', fix: 'להשאיר את delivery.timeout.ms קרוב לברירת המחדל, 120000, ולטפל בקריאה החוזרת של כישלון.' } },
    { id: 'linger-zero', level: 'tip', role: 'producer', docs: link('producerconfigs_linger.ms'),
      when: function (c) { return c.num('linger.ms') === 0 ? { keys: ['linger.ms'], v: {} } : null; },
      en: { title: 'No waiting to build batches (linger.ms=0)', why: 'Each send goes out almost alone, which costs throughput and broker work. This is a trade-off with latency, not an error.', fix: 'If a few milliseconds of delay is fine, try 5 to 20 ms, and raise batch.size if batches fill quickly. Measure before and after.' },
      he: { title: 'אין המתנה לבניית אצוות (linger.ms=0)', why: 'כל שליחה יוצאת כמעט לבד, מה שעולה בתפוקה ובעבודה של הברוקר. זה איזון מול זמן תגובה, לא שגיאה.', fix: 'אם כמה מילישניות של השהיה בסדר, לנסות 5 עד 20 מילישניות, ולהגדיל את batch.size אם האצוות מתמלאות מהר. למדוד לפני ואחרי.' } },
    { id: 'no-compression', level: 'tip', role: 'producer', docs: link('producerconfigs_compression.type'),
      when: function (c) { return c.str('compression.type') === 'none' ? { keys: ['compression.type'], v: {} } : null; },
      en: { title: 'Messages are sent uncompressed', why: 'Compression usually cuts network and disk use for text-like data, at some CPU cost.', fix: 'Try compression.type=lz4 or zstd and measure.' },
      he: { title: 'הודעות נשלחות בלי דחיסה', why: 'דחיסה בדרך כלל מקטינה שימוש ברשת ובדיסק עבור נתונים דמויי טקסט, במחיר מעט מעבד.', fix: 'לנסות compression.type=lz4 או zstd ולמדוד.' } },
    { id: 'txn-read-uncommitted', level: 'warn', role: 'both', docs: link('consumerconfigs_isolation.level'),
      when: function (c) { return (c.has('transactional.id') && c.has('group.id') && c.str('isolation.level') !== 'read_committed') ? { keys: ['transactional.id', 'isolation.level'], v: {} } : null; },
      en: { title: 'Transactions are used, but this consumer can read aborted messages', why: 'The default isolation.level is read_uncommitted, so a consumer also sees records from transactions that were later aborted.', fix: 'Set isolation.level=read_committed on consumers of transactional topics.' },
      he: { title: 'משתמשים בטרנזקציות, אבל הצרכן הזה יכול לקרוא הודעות שבוטלו', why: 'ברירת המחדל של isolation.level היא read_uncommitted, ולכן צרכן רואה גם רשומות מטרנזקציות שבוטלו אחר כך.', fix: 'להגדיר isolation.level=read_committed בצרכנים של נושאים טרנזקציוניים.' } },

    { id: 'auto-commit', level: 'warn', role: 'consumer', docs: link('consumerconfigs_enable.auto.commit'),
      when: function (c) { return (c.has('group.id') || c.has('enable.auto.commit')) && c.bool('enable.auto.commit', true) ? { keys: ['enable.auto.commit'], v: { how: c.has('enable.auto.commit') ? 'It is set to true.' : 'It is not set, and the default is true.' } } : null; },
      en: { title: 'Offsets are committed on a timer, not when your code is done', why: '{how} The consumer commits positions every few seconds whether or not your code has finished with the records. If processing is slow or handed to another thread and the app crashes, those records are skipped for good. If it crashes before the next commit, they are processed twice.', fix: 'For at-least-once handling, set enable.auto.commit=false and commit after the records are processed, and make processing safe to repeat.' },
      he: { title: 'ההיסטים נשמרים לפי שעון, לא כשהקוד שלכם סיים', why: '{how} הצרכן שומר מיקומים כל כמה שניות בין אם הקוד סיים לעבד את הרשומות ובין אם לא. אם העיבוד איטי או מועבר לתהליכון אחר והאפליקציה קורסת, הרשומות האלה מדולגות לתמיד. אם היא קורסת לפני השמירה הבאה, הן מעובדות פעמיים.', fix: 'לטיפול של לפחות פעם אחת: להגדיר enable.auto.commit=false, לשמור אחרי שהרשומות עובדו, ולוודא שעיבוד חוזר לא גורם נזק.' } },
    { id: 'reset-latest', level: 'warn', role: 'consumer', docs: link('consumerconfigs_auto.offset.reset'),
      when: function (c) { return c.has('group.id') && c.eff('auto.offset.reset') === 'latest' ? { keys: ['auto.offset.reset'], v: { how: c.has('auto.offset.reset') ? 'It is set to latest.' : 'It is not set, and the default is latest.' } } : null; },
      en: { title: 'A new or expired consumer group skips everything already in the topic', why: '{how} A group with no saved position, or one whose saved position has expired, starts at the newest record. Whatever was written before it first connected is never read.', fix: 'If missing data matters, use auto.offset.reset=earliest (and accept a full replay), none to fail loudly and decide yourself, or by_duration to start from a set time ago.' },
      he: { title: 'קבוצת צרכנים חדשה או שפג תוקפה מדלגת על כל מה שכבר בנושא', why: '{how} קבוצה בלי מיקום שמור, או כזו שהמיקום השמור שלה פג, מתחילה מהרשומה החדשה ביותר. כל מה שנכתב לפני שהתחברה לראשונה לא יקרא לעולם.', fix: 'אם נתונים חסרים חשובים, להשתמש ב־auto.offset.reset=earliest (ולקבל שחזור מלא), או none כדי להיכשל בקול ולהחליט בעצמכם, או by_duration כדי להתחיל מזמן קבוע אחורה.' } },
    { id: 'poll-interval', level: 'warn', role: 'consumer', docs: link('consumerconfigs_max.poll.interval.ms'),
      when: function (c) { var i = c.num('max.poll.interval.ms'); return (i != null && i < 60000) ? { keys: ['max.poll.interval.ms'], v: { i: i } } : null; },
      en: { title: 'Processing a batch has little time before the consumer is thrown out', why: 'If a poll takes longer than {i} ms between calls, the consumer is removed from the group and its partitions move, so the records it was holding are processed again elsewhere. (The default is 300000.)', fix: 'Lower max.poll.records so a batch finishes in time, or raise max.poll.interval.ms. Time your slowest batch.' },
      he: { title: 'לעיבוד אצווה יש מעט זמן לפני שהצרכן מושלך מהקבוצה', why: 'אם עוברות יותר מ־{i} מילישניות בין קריאות poll, הצרכן מוסר מהקבוצה והמחיצות שלו עוברות הלאה, והרשומות שהחזיק מעובדות שוב במקום אחר. (ברירת המחדל 300000.)', fix: 'להקטין את max.poll.records כך שאצווה תסתיים בזמן, או להגדיל את max.poll.interval.ms. למדוד את האצווה האיטית ביותר.' } },
    { id: 'heartbeat-ratio', level: 'warn', role: 'consumer', docs: link('consumerconfigs_heartbeat.interval.ms'),
      when: function (c) { if (c.str('group.protocol') === 'consumer') return null; var h = c.num('heartbeat.interval.ms'), s = c.has('session.timeout.ms') ? c.num('session.timeout.ms') : 45000; return (h != null && s && h > s / 3) ? { keys: ['heartbeat.interval.ms', 'session.timeout.ms'], v: { h: h, s: s } } : null; },
      en: { title: 'The heartbeat is too slow for the session timeout', why: 'Kafka advises heartbeat.interval.ms no higher than a third of session.timeout.ms. {h} ms against {s} ms leaves room for one lost heartbeat to look like a dead consumer.', fix: 'Set heartbeat.interval.ms to about a third of session.timeout.ms or less.' },
      he: { title: 'הדופק איטי מדי ביחס למגבלת ההפעלה', why: 'קפקא ממליץ ש־heartbeat.interval.ms לא יעלה על שליש מ־session.timeout.ms. {h} מילישניות מול {s} משאירות מצב שבו דופק אחד שאבד נראה כמו צרכן מת.', fix: 'להגדיר heartbeat.interval.ms לכשליש מ־session.timeout.ms או פחות.' } },
    { id: 'session-short', level: 'tip', role: 'consumer', docs: link('consumerconfigs_session.timeout.ms'),
      when: function (c) { if (c.str('group.protocol') === 'consumer') return null; var s = c.num('session.timeout.ms'); return (s != null && s < 10000) ? { keys: ['session.timeout.ms'], v: { s: s } } : null; },
      en: { title: 'A short session timeout causes extra rebalances', why: 'At {s} ms, a long garbage-collection pause or a network blip makes the group think this consumer died and reshuffle partitions. (A rule of thumb.)', fix: 'Keep session.timeout.ms near its default (45000 on recent versions) unless you need very fast failure detection.' },
      he: { title: 'מגבלת הפעלה קצרה גורמת לחלוקות מחדש מיותרות', why: 'ב־{s} מילישניות, הפסקת איסוף זבל ארוכה או הפרעת רשת גורמת לקבוצה לחשוב שהצרכן מת ולערבב את המחיצות. (כלל אצבע.)', fix: 'להשאיר את session.timeout.ms קרוב לברירת המחדל (45000 בגרסאות עדכניות) אלא אם צריך זיהוי תקלה מהיר מאוד.' } },
    { id: 'static-membership', level: 'tip', role: 'consumer', docs: link('consumerconfigs_group.instance.id'),
      when: function (c) { return c.has('group.id') && !c.has('group.instance.id') && c.str('group.protocol') !== 'consumer' ? { keys: [], v: {} } : null; },
      en: { title: 'A restart reshuffles the whole group', why: 'Without a fixed member id, every restart or rolling deploy triggers a rebalance.', fix: 'Consider group.instance.id (static membership) with a session timeout long enough to cover a restart.' },
      he: { title: 'הפעלה מחדש מערבבת את כל הקבוצה', why: 'בלי מזהה חבר קבוע, כל הפעלה מחדש או פריסה מדורגת גורמת לחלוקה מחדש.', fix: 'לשקול group.instance.id (חברות סטטית) עם מגבלת הפעלה שמספיקה לכסות הפעלה מחדש.' } },

    { id: 'group-protocol', level: 'tip', role: 'consumer', docs: link('consumerconfigs_group.protocol'),
      when: function (c) { return (c.version >= 4 && c.has('group.id') && c.str('group.protocol') !== 'consumer') ? { keys: c.has('group.protocol') ? ['group.protocol'] : [], v: {} } : null; },
      en: { title: 'The newer consumer rebalance protocol is available', why: 'Kafka 4.x offers group.protocol=consumer, where the broker coordinates group changes. The default is classic. It is designed to make rebalances less disruptive.', fix: 'Read the Kafka docs and check that your brokers support it before you switch; test with your own workload. Not needed if rebalances are not a problem for you.' },
      he: { title: 'פרוטוקול החלוקה החדש לצרכנים זמין', why: 'קפקא 4.x מציע group.protocol=consumer, שבו הברוקר מתאם שינויי קבוצה. ברירת המחדל היא classic. הוא נועד להפוך חלוקות מחדש לפחות מפריעות.', fix: 'לקרוא את התיעוד של קפקא ולוודא שהברוקרים שלכם תומכים בו לפני המעבר; לבדוק עם העומס שלכם. לא נחוץ אם חלוקות מחדש לא מפריעות לכם.' } },
    { id: 'minisr-one', level: 'risk', role: 'broker', docs: link('brokerconfigs_min.insync.replicas'),
      when: function (c) { var m = c.num('min.insync.replicas'); return m === 1 ? { keys: ['min.insync.replicas'], v: {} } : null; },
      en: { title: 'acks=all can still mean a single copy (min.insync.replicas=1)', why: 'With acks=all the leader waits for the in-sync replicas, but with min.insync.replicas=1 it may be the only one left. A message acknowledged then lives on one broker only.', fix: 'Use replication factor 3 with min.insync.replicas=2: you can lose one broker and keep writing without risking acknowledged data.' },
      he: { title: 'acks=all עדיין יכול להיות עותק אחד (min.insync.replicas=1)', why: 'עם acks=all המנהיג מחכה להעתקים המסונכרנים, אבל עם min.insync.replicas=1 הוא עלול להיות היחיד שנשאר. הודעה שאושרה אז קיימת בברוקר אחד בלבד.', fix: 'להשתמש במקדם העתקה 3 עם min.insync.replicas=2: אפשר לאבד ברוקר אחד ולהמשיך לכתוב בלי לסכן נתונים שאושרו.' } },
    { id: 'minisr-default', level: 'tip', role: 'broker', docs: link('brokerconfigs_min.insync.replicas'),
      when: function (c) { return (c.roles.indexOf('broker') >= 0 && !c.has('min.insync.replicas')) ? { keys: [], v: {} } : null; },
      en: { title: 'min.insync.replicas is not set, so it is 1', why: 'The default is 1, which means acks=all gives no more protection than one copy when the others fall behind.', fix: 'Set min.insync.replicas=2 as the broker default or per topic, with replication factor 3.' },
      he: { title: 'min.insync.replicas לא הוגדר, ולכן הוא 1', why: 'ברירת המחדל היא 1, כלומר acks=all לא נותן יותר הגנה מעותק אחד כשהאחרים מפגרים.', fix: 'להגדיר min.insync.replicas=2 כברירת מחדל בברוקר או לכל נושא, עם מקדם העתקה 3.' } },
    { id: 'minisr-too-high', level: 'warn', role: 'broker', docs: link('brokerconfigs_min.insync.replicas'),
      when: function (c) { var m = c.num('min.insync.replicas'), r = c.num('default.replication.factor') != null ? c.num('default.replication.factor') : c.num('replication.factor'); return (m != null && r != null && m >= r && r > 1) ? { keys: ['min.insync.replicas'], v: { m: m, r: r } } : null; },
      en: { title: 'Writes stop when any one broker is down', why: 'min.insync.replicas={m} with replication factor {r} means every replica must be in sync, so one broker restart makes acks=all writes fail.', fix: 'Keep min.insync.replicas one lower than the replication factor (2 of 3).' },
      he: { title: 'כתיבות נעצרות כשברוקר אחד למטה', why: 'min.insync.replicas={m} עם מקדם העתקה {r} אומר שכל ההעתקים חייבים להיות מסונכרנים, ולכן הפעלה מחדש של ברוקר אחד גורמת לכתיבות עם acks=all להיכשל.', fix: 'להשאיר את min.insync.replicas נמוך באחד ממקדם ההעתקה (2 מתוך 3).' } },
    { id: 'rf-one', level: 'risk', role: 'broker', docs: link('brokerconfigs_default.replication.factor'),
      when: function (c) { return (c.num('default.replication.factor') === 1 || c.num('replication.factor') === 1) ? { keys: [c.has('default.replication.factor') ? 'default.replication.factor' : 'replication.factor'], v: {} } : null; },
      en: { title: 'Topics have a single copy (replication factor 1)', why: 'If that broker or its disk is lost, the data is gone, and the partition is unavailable while it is down.', fix: 'Use replication factor 3 for anything you cannot recreate.' },
      he: { title: 'לנושאים יש עותק יחיד (מקדם העתקה 1)', why: 'אם הברוקר הזה או הדיסק שלו אובדים, הנתונים אבדו, והמחיצה לא זמינה בזמן שהוא למטה.', fix: 'להשתמש במקדם העתקה 3 לכל דבר שאי אפשר ליצור מחדש.' } },
    { id: 'unclean-election', level: 'risk', role: 'broker', docs: link('brokerconfigs_unclean.leader.election.enable'),
      when: function (c) { return c.str('unclean.leader.election.enable') === 'true' ? { keys: ['unclean.leader.election.enable'], v: {} } : null; },
      en: { title: 'A copy that is behind can become the leader (unclean leader election)', why: 'If every in-sync replica is lost, Kafka will promote one that is behind. It keeps serving, but messages that had been acknowledged are silently gone.', fix: 'Leave unclean.leader.election.enable=false (the default) unless availability matters more than the data.' },
      he: { title: 'עותק שמפגר יכול להפוך למנהיג (בחירת מנהיג לא נקייה)', why: 'אם כל ההעתקים המסונכרנים אבדו, קפקא יקדם אחד שמפגר. הוא ממשיך לשרת, אבל הודעות שאושרו נעלמו בשקט.', fix: 'להשאיר unclean.leader.election.enable=false (ברירת המחדל) אלא אם זמינות חשובה מהנתונים.' } },
    { id: 'auto-create', level: 'tip', role: 'broker', docs: link('brokerconfigs_auto.create.topics.enable'),
      when: function (c) { return (c.roles.indexOf('broker') >= 0 && c.bool('auto.create.topics.enable', true)) ? { keys: ['auto.create.topics.enable'], v: { how: c.has('auto.create.topics.enable') ? 'It is set to true.' : 'It is not set, and the default is true.' } } : null; },
      en: { title: 'A typo in a topic name creates a new topic', why: '{how} A client that writes to a misspelled name gets a topic made on the spot, with default settings, and the messages go somewhere nobody reads.', fix: 'In production, set auto.create.topics.enable=false and create topics on purpose, with the replication and retention you chose.' },
      he: { title: 'שגיאת כתיב בשם נושא יוצרת נושא חדש', why: '{how} לקוח שכותב לשם עם שגיאה מקבל נושא שנוצר במקום, עם הגדרות ברירת מחדל, וההודעות הולכות למקום שאף אחד לא קורא.', fix: 'בייצור, להגדיר auto.create.topics.enable=false וליצור נושאים בכוונה, עם ההעתקה והשמירה שבחרתם.' } },
    { id: 'internal-rf', level: 'risk', role: 'broker', docs: link('brokerconfigs_offsets.topic.replication.factor'),
      when: function (c) { var bad = ['offsets.topic.replication.factor', 'transaction.state.log.replication.factor'].filter(function (k) { return c.num(k) === 1; }); return bad.length ? { keys: bad, v: { which: bad.join(', ') } } : null; },
      en: { title: 'Consumer positions or transaction state are not replicated', why: '{which} is 1. Lose that broker and the groups forget where they were (or open transactions are lost), which means skipped or repeated records.', fix: 'Set both to 3 in production (and transaction.state.log.min.isr to 2).' },
      he: { title: 'מיקומי צרכנים או מצב טרנזקציות לא משוכפלים', why: '{which} הוא 1. אובדים את הברוקר הזה והקבוצות שוכחות איפה היו (או שטרנזקציות פתוחות אבדו), מה שאומר רשומות שדולגו או חזרו.', fix: 'להגדיר את שניהם ל־3 בייצור (ואת transaction.state.log.min.isr ל־2).' } },
    { id: 'short-retention', level: 'warn', role: 'broker', docs: link('topicconfigs_retention.ms'),
      when: function (c) {
        var ms = c.num('retention.ms'), h = c.num('log.retention.hours'), m = c.num('log.retention.minutes'), l = c.num('log.retention.ms'), best = null, key = null;
        [['retention.ms', ms], ['log.retention.ms', l], ['log.retention.minutes', m == null ? null : m * 60000], ['log.retention.hours', h == null ? null : h * 3600000]].forEach(function (p) { if (p[1] != null && p[1] >= 0 && (best == null || p[1] < best)) { best = p[1]; key = p[0]; } });
        return (best != null && best < 86400000) ? { keys: [key], v: { hours: Math.round(best / 360000) / 10 } } : null; },
      en: { title: 'Data is deleted after less than a day', why: 'Retention of about {hours} hours means a consumer that is down or lagging for longer than that loses records it never read.', fix: 'Set retention to comfortably more than your longest expected outage, and alert on consumer lag long before it nears retention.' },
      he: { title: 'נתונים נמחקים אחרי פחות מיום', why: 'שמירה של בערך {hours} שעות אומרת שצרכן שמושבת או מפגר יותר מזה מאבד רשומות שמעולם לא קרא.', fix: 'להגדיר שמירה שגבוהה בנוחות מההשבתה הארוכה ביותר הצפויה, ולהתריע על פיגור צרכנים הרבה לפני שהוא מתקרב לשמירה.' } },

    { id: 'connect-errors-all', level: 'risk', role: 'connect', docs: link('sinkconnectorconfigs_errors.tolerance'),
      when: function (c) { return (c.str('errors.tolerance') === 'all' && !c.has('errors.deadletterqueue.topic.name')) ? { keys: ['errors.tolerance'], v: { logged: c.bool('errors.log.enable', false) ? 'They are written to the log, which is easy to miss.' : 'They are not even logged (errors.log.enable is off).' } } : null; },
      en: { title: 'Records that fail are skipped and nothing keeps them', why: 'errors.tolerance=all with no dead letter queue means bad records are dropped. {logged}', fix: 'Set errors.deadletterqueue.topic.name (and errors.log.enable=true), and alert on the dead letter topic. Use errors.tolerance=none if you would rather stop.' },
      he: { title: 'רשומות שנכשלות מדולגות ושום דבר לא שומר אותן', why: 'errors.tolerance=all בלי תור מכתבים מתים אומר שרשומות פגומות נזרקות. {logged}', fix: 'להגדיר errors.deadletterqueue.topic.name (ואת errors.log.enable=true), ולהתריע על נושא המכתבים המתים. להשתמש ב־errors.tolerance=none אם מעדיפים לעצור.' } },
    { id: 'connect-flush', level: 'tip', role: 'connect', docs: link('connectconfigs_offset.flush.interval.ms'),
      when: function (c) { var n = c.num('offset.flush.interval.ms'); return (n != null && n > 60000) ? { keys: ['offset.flush.interval.ms'], v: { n: n } } : null; },
      en: { title: 'After a crash, a source connector can repeat a long stretch', why: 'Offsets are saved every {n} ms (the default is 60000). Everything since the last save is read again after a crash.', fix: 'Make the consumer of the topic safe to receive duplicates, and lower the interval if the replay window matters.' },
      he: { title: 'אחרי קריסה, מחבר מקור יכול לחזור על קטע ארוך', why: 'ההיסטים נשמרים כל {n} מילישניות (ברירת המחדל 60000). כל מה שאחרי השמירה האחרונה נקרא שוב אחרי קריסה.', fix: 'לוודא שהצרכן של הנושא מתמודד עם כפילויות, ולהקטין את המרווח אם חלון השחזור חשוב.' } }
  ];

  var ORDER = { risk: 0, warn: 1, tip: 2 };

  /** The things a config can never show. Shown as a checklist; they are questions to answer, not checks the tool did. */
  var CHECKLIST = [
    { en: 'Is the code that handles each record safe to run twice? (Duplicates happen even when everything is set well.)', he: 'האם הקוד שמטפל בכל רשומה בטוח להרצה פעמיים? (כפילויות קורות גם כשהכול מוגדר היטב.)' },
    { en: 'Do you commit offsets only after the work for those records is done?', he: 'האם אתם שומרים היסטים רק אחרי שהעבודה על אותן רשומות הסתיימה?' },
    { en: 'Does the slowest batch finish well inside max.poll.interval.ms?', he: 'האם האצווה האיטית ביותר מסתיימת הרבה לפני max.poll.interval.ms?' },
    { en: 'Do you check what happens when the send fails (a callback or the future), not only when it works?', he: 'האם אתם בודקים מה קורה כששליחה נכשלת (קריאה חוזרת או ה־future), לא רק כשהיא עובדת?' },
    { en: 'Do you alert on consumer lag, and is it far below your retention time?', he: 'האם אתם מתריעים על פיגור צרכנים, והאם הוא רחוק מתחת לזמן השמירה?' },
    { en: 'Have you ever stopped a broker on purpose in a test environment to see what the clients do?', he: 'האם אי פעם עצרתם ברוקר בכוונה בסביבת בדיקה כדי לראות מה הלקוחות עושים?' },
    { en: 'Is there a dead letter topic for records that cannot be processed, and does someone look at it?', he: 'האם יש נושא מכתבים מתים לרשומות שאי אפשר לעבד, והאם מישהו מסתכל עליו?' },
    { en: 'Do producers and consumers agree on the message format, and what happens when it changes?', he: 'האם יצרנים וצרכנים מסכימים על פורמט ההודעה, ומה קורה כשהוא משתנה?' },
    { en: 'Does the ordering you need hold? (Order is only kept within one partition, so the key choice matters.)', he: 'האם הסדר שאתם צריכים נשמר? (סדר נשמר רק בתוך מחיצה אחת, ולכן בחירת המפתח חשובה.)' },
    { en: 'For change-data-capture: do you know what happens to the source database log while the connector is stopped?', he: 'בלכידת שינויים: האם אתם יודעים מה קורה ליומן של מסד המקור בזמן שהמחבר עצור?' }
  ];

  function fill(t, v) { return String(t).replace(/\{(\w+)\}/g, function (m, k) { return v && k in v ? v[k] : m; }); }

  /** Check a pasted config. opts.version is 4 (default), 3 or 2 (2.x or older: the producer defaults were weaker). */
  function analyze(text, opts) {
    opts = opts || {};
    var parsed = (text && typeof text === 'object' && text.props) ? text : parse(typeof text === 'string' ? text : (text == null ? '' : String(text))), props = parsed.props, version = [2, 3, 4].indexOf(Number(opts.version)) >= 0 ? Number(opts.version) : 4;
    var roles = detect(props);
    var c = {
      roles: roles, version: version, props: props,
      has: function (k) { return k in props; },
      str: function (k) { return k in props ? String(props[k]).toLowerCase() : null; },
      num: function (k) { if (!(k in props)) return null; var n = Number(props[k]); return isFinite(n) && props[k] !== '' ? n : null; },
      bool: function (k, d) { var s = c.str(k); return s == null ? d : s === 'true'; },
      eff: function (k) {                                    // the value Kafka would use: what you set, or the default for the chosen version
        if (c.has(k)) return c.str(k);
        if (k === 'acks') return version >= 3 ? 'all' : '1';
        if (k === 'auto.offset.reset') return 'latest';
        return null;
      },
      idem: function () {                                    // is the producer effectively idempotent?
        var e = c.str('enable.idempotence'); if (e === 'true') return true; if (e === 'false') return false;
        if (version < 3) return false;
        var a = c.eff('acks'); return (a === 'all' || a === '-1') && c.num('retries') !== 0 && !(c.num('max.in.flight.requests.per.connection') > 5);
      }
    };
    var findings = [];
    RULES.forEach(function (r) {
      var applies = r.role === 'both' || roles.indexOf(r.role) >= 0 || (r.role === 'broker' && roles.indexOf('topic') >= 0);
      if (!applies) return;
      var hit = r.when(c); if (!hit) return;
      findings.push({ id: r.id, level: r.level, keys: hit.keys.filter(function (k) { return k in props; }).map(function (k) { return { key: k, value: props[k] }; }), docs: r.docs,
        en: { title: fill(r.en.title, hit.v), why: fill(r.en.why, hit.v), fix: fill(r.en.fix, hit.v) }, he: { title: fill(r.he.title, hit.v), why: fill(r.he.why, hit.v), fix: fill(r.he.fix, hit.v) } });
    });
    findings.sort(function (a, b) { return ORDER[a.level] - ORDER[b.level]; });
    return { roles: roles, version: version, settings: parsed.order.length, hidden: parsed.hidden, ignored: parsed.ignored, findings: findings,
      counts: { risk: findings.filter(function (f) { return f.level === 'risk'; }).length, warn: findings.filter(function (f) { return f.level === 'warn'; }).length, tip: findings.filter(function (f) { return f.level === 'tip'; }).length } };
  }

  var EXAMPLES = {
    risky: '# A producer that can lose and repeat messages\nbootstrap.servers=broker1:9092\nacks=1\nretries=0\nmax.in.flight.requests.per.connection=5\nlinger.ms=0\ncompression.type=none\nsasl.jaas.config=org.apache.kafka.common.security.plain.PlainLoginModule required username="app" password="hunter2";\n',
    consumer: '# A consumer that can skip records\nbootstrap.servers=broker1:9092\ngroup.id=orders\nenable.auto.commit=true\nauto.offset.reset=latest\nmax.poll.interval.ms=30000\nsession.timeout.ms=6000\nheartbeat.interval.ms=4000\n',
    broker: '# A broker setup that can lose acknowledged data\nprocess.roles=broker,controller\nnode.id=1\ndefault.replication.factor=1\nmin.insync.replicas=1\nunclean.leader.election.enable=true\nauto.create.topics.enable=true\noffsets.topic.replication.factor=1\nlog.retention.hours=6\n',
    connect: '# A sink connector that drops bad records\nconnector.class=io.example.SinkConnector\ntasks.max=2\nerrors.tolerance=all\n'
  };

  var api = { DOCS: DOCS, RULES: RULES, CHECKLIST: CHECKLIST, EXAMPLES: EXAMPLES, KEYS: KEYS, parse: parse, detect: detect, analyze: analyze, fill: fill };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SoyaKafka = api;
})(typeof window !== 'undefined' ? window : globalThis);
