// Run with: node --test apps/2026-11-20-kafka-check/rules.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const K = require('./rules.js');

const ids = (text, opts) => K.analyze(text, opts).findings.map((f) => f.id);
const has = (text, id, opts) => assert.ok(ids(text, opts).includes(id), id + ' should fire; got ' + ids(text, opts).join(', '));
const not = (text, id, opts) => assert.ok(!ids(text, opts).includes(id), id + ' should not fire');

test('parse: comments, colon form, line continuation, blanks, and nonsense lines', () => {
  const p = K.parse('# c\n! c2\n\nacks = all\nretries: 5\nbootstrap.servers=a:9092,\\\n   b:9092\nnonsense line\n');
  assert.equal(p.props.acks, 'all'); assert.equal(p.props.retries, '5'); assert.equal(p.props['bootstrap.servers'], 'a:9092,b:9092');
  assert.equal(p.ignored, 1); assert.deepEqual(p.order, ['acks', 'retries', 'bootstrap.servers']);
  assert.deepEqual(K.parse(null).props, {}); assert.deepEqual(K.parse('').order, []);
});

test('parse: anything that looks like a secret is hidden and never appears in a finding', () => {
  const text = 'acks=1\nsasl.jaas.config=...PlainLoginModule required username="a" password="hunter2";\nssl.keystore.password=s3cret\nsome.api.key=abc123\n';
  const p = K.parse(text);
  assert.equal(p.hidden, 3);
  for (const k of ['sasl.jaas.config', 'ssl.keystore.password', 'some.api.key']) assert.equal(p.props[k], '(hidden)');
  assert.ok(!JSON.stringify(K.analyze(text)).includes('hunter2')); assert.ok(!JSON.stringify(K.analyze(text)).includes('s3cret'));
  assert.equal(K.analyze(text).hidden, 3);
});

test('parse: limits on lines and value length', () => {
  const many = Array.from({ length: 2000 }, (_, i) => 'k' + i + '=v').join('\n');
  assert.ok(K.parse(many).order.length <= 600);
  assert.ok(K.parse('x=' + 'a'.repeat(5000)).props.x.length <= 400);
});

test('detect: producer, consumer, broker, topic, connect, and mixed', () => {
  assert.deepEqual(K.detect({ acks: '1' }), ['producer']);
  assert.deepEqual(K.detect({ 'group.id': 'g' }), ['consumer']);
  assert.deepEqual(K.detect({ 'node.id': '1' }), ['broker']);
  assert.deepEqual(K.detect({ 'min.insync.replicas': '2' }), ['broker']);
  assert.deepEqual(K.detect({ 'cleanup.policy': 'compact' }), ['topic']);
  assert.deepEqual(K.detect({ 'errors.tolerance': 'all' }), ['connect']);
  assert.deepEqual(K.detect({ acks: '1', 'group.id': 'g' }).sort(), ['consumer', 'producer']);
  assert.deepEqual(K.detect({ 'bootstrap.servers': 'x' }), []);
});

test('producer: acks=0 and acks=1 are risks; acks=all is fine; the default depends on the version', () => {
  has('acks=0', 'acks-none'); has('acks=1', 'acks-one'); not('acks=all', 'acks-one'); not('acks=-1', 'acks-one');
  has('linger.ms=5', 'acks-one', { version: 2 });          // unset on Kafka 2.x means acks=1
  not('linger.ms=5', 'acks-one', { version: 4 }); not('linger.ms=5', 'acks-one', { version: 3 });
});

test('producer: retries=0 is a risk, other values are fine', () => { has('retries=0', 'retries-zero'); not('retries=3', 'retries-zero'); not('retries=2147483647', 'retries-zero'); });

test('producer: idempotence is off when set to false, or by default before Kafka 3.0; conflicts are caught only when it is explicitly on', () => {
  has('enable.idempotence=false', 'idempotence-off'); not('enable.idempotence=true', 'idempotence-off');
  has('acks=all', 'idempotence-off', { version: 2 }); not('acks=all', 'idempotence-off', { version: 4 });
  has('enable.idempotence=true\nacks=1', 'idempotence-conflict'); has('enable.idempotence=true\nretries=0', 'idempotence-conflict');
  has('enable.idempotence=true\nmax.in.flight.requests.per.connection=6', 'idempotence-conflict');
  not('enable.idempotence=true\nacks=all\nretries=5\nmax.in.flight.requests.per.connection=5', 'idempotence-conflict'); not('acks=1', 'idempotence-conflict');
  const f = K.analyze('enable.idempotence=true\nacks=1\nretries=0').findings.find((x) => x.id === 'idempotence-conflict');
  assert.match(f.en.why, /acks=1, retries=0/);
});

test('producer: reordering needs several in flight, retries on and no idempotence', () => {
  has('max.in.flight.requests.per.connection=5\nenable.idempotence=false', 'reorder');
  not('max.in.flight.requests.per.connection=5\nenable.idempotence=true', 'reorder');
  not('max.in.flight.requests.per.connection=1\nenable.idempotence=false', 'reorder');
  not('max.in.flight.requests.per.connection=5\nenable.idempotence=false\nretries=0', 'reorder');
  has('max.in.flight.requests.per.connection=5\nacks=1', 'reorder', { version: 4 });       // acks=1 silently turns idempotence off
  not('max.in.flight.requests.per.connection=5', 'reorder', { version: 4 });
});

test('producer: delivery.timeout.ms must cover linger and request timeouts; very short ones are a warning', () => {
  has('delivery.timeout.ms=20000\nlinger.ms=5000\nrequest.timeout.ms=30000', 'delivery-timeout');
  not('delivery.timeout.ms=120000', 'delivery-timeout'); has('delivery.timeout.ms=1000', 'delivery-timeout');
  not('delivery.timeout.ms=35000\nrequest.timeout.ms=20000', 'delivery-timeout'); not('delivery.timeout.ms=35000\nrequest.timeout.ms=20000', 'delivery-timeout-short');
  has('delivery.timeout.ms=29000\nrequest.timeout.ms=10000\nlinger.ms=0', 'delivery-timeout-short'); not('delivery.timeout.ms=120000', 'delivery-timeout-short');
});

test('producer: throughput tips', () => { has('linger.ms=0', 'linger-zero'); not('linger.ms=5', 'linger-zero'); has('compression.type=none', 'no-compression'); not('compression.type=lz4', 'no-compression'); });

test('transactions with a consumer that reads uncommitted records', () => {
  has('transactional.id=t1\ngroup.id=g', 'txn-read-uncommitted'); not('transactional.id=t1\ngroup.id=g\nisolation.level=read_committed', 'txn-read-uncommitted');
  not('transactional.id=t1', 'txn-read-uncommitted'); not('group.id=g', 'txn-read-uncommitted');
});

test('consumer: auto commit, offset reset, poll interval, heartbeat ratio, session timeout, static membership', () => {
  has('group.id=g', 'auto-commit'); has('group.id=g\nenable.auto.commit=true', 'auto-commit'); not('group.id=g\nenable.auto.commit=false', 'auto-commit');
  has('group.id=g', 'reset-latest'); has('group.id=g\nauto.offset.reset=latest', 'reset-latest'); not('group.id=g\nauto.offset.reset=earliest', 'reset-latest'); not('group.id=g\nauto.offset.reset=none', 'reset-latest');
  has('max.poll.interval.ms=30000', 'poll-interval'); not('max.poll.interval.ms=300000', 'poll-interval');
  has('heartbeat.interval.ms=20000\nsession.timeout.ms=45000', 'heartbeat-ratio'); not('heartbeat.interval.ms=3000\nsession.timeout.ms=45000', 'heartbeat-ratio');
  has('heartbeat.interval.ms=20000', 'heartbeat-ratio');                                       // against the 45000 default
  has('session.timeout.ms=6000', 'session-short'); not('session.timeout.ms=45000', 'session-short');
  has('group.id=g', 'static-membership'); not('group.id=g\ngroup.instance.id=a', 'static-membership');
});

test('consumer: heartbeat and session rules do not apply to the newer protocol; the tip appears on 4.x for the classic one only', () => {
  not('heartbeat.interval.ms=20000\nsession.timeout.ms=45000\ngroup.protocol=consumer', 'heartbeat-ratio');
  not('session.timeout.ms=6000\ngroup.protocol=consumer', 'session-short'); not('group.id=g\ngroup.protocol=consumer', 'static-membership');
  has('group.id=g', 'group-protocol', { version: 4 }); has('group.id=g\ngroup.protocol=classic', 'group-protocol', { version: 4 });
  not('group.id=g\ngroup.protocol=consumer', 'group-protocol', { version: 4 }); not('group.id=g', 'group-protocol', { version: 3 });
});

test('broker and topic: min.insync.replicas, replication, unclean election, auto create, internal topics, retention', () => {
  has('node.id=1\nmin.insync.replicas=1', 'minisr-one'); not('node.id=1\nmin.insync.replicas=2', 'minisr-one');
  has('node.id=1', 'minisr-default'); not('node.id=1\nmin.insync.replicas=2', 'minisr-default');
  has('min.insync.replicas=3\ndefault.replication.factor=3', 'minisr-too-high'); not('min.insync.replicas=2\ndefault.replication.factor=3', 'minisr-too-high');
  has('min.insync.replicas=2\nreplication.factor=2\ncleanup.policy=delete', 'minisr-too-high');
  has('default.replication.factor=1', 'rf-one'); has('cleanup.policy=delete\nreplication.factor=1', 'rf-one'); not('default.replication.factor=3', 'rf-one');
  has('unclean.leader.election.enable=true', 'unclean-election'); not('unclean.leader.election.enable=false', 'unclean-election');
  has('node.id=1', 'auto-create'); has('node.id=1\nauto.create.topics.enable=true', 'auto-create'); not('node.id=1\nauto.create.topics.enable=false', 'auto-create');
  has('offsets.topic.replication.factor=1', 'internal-rf'); has('transaction.state.log.replication.factor=1', 'internal-rf'); not('offsets.topic.replication.factor=3', 'internal-rf');
  has('retention.ms=3600000', 'short-retention'); has('log.retention.hours=6', 'short-retention'); has('log.retention.minutes=30', 'short-retention');
  not('retention.ms=604800000', 'short-retention'); not('log.retention.hours=168', 'short-retention'); not('retention.ms=-1', 'short-retention');
  assert.match(K.analyze('log.retention.hours=6').findings.find((f) => f.id === 'short-retention').en.why, /about 6 hours/);
});

test('connect: errors.tolerance=all without a dead letter queue is a risk; the flush interval is a tip', () => {
  has('connector.class=x\nerrors.tolerance=all', 'connect-errors-all');
  not('connector.class=x\nerrors.tolerance=all\nerrors.deadletterqueue.topic.name=dlq', 'connect-errors-all'); not('connector.class=x\nerrors.tolerance=none', 'connect-errors-all');
  assert.match(K.analyze('errors.tolerance=all').findings[0].en.why, /not even logged/);
  assert.match(K.analyze('errors.tolerance=all\nerrors.log.enable=true').findings[0].en.why, /written to the log/);
  has('offset.flush.interval.ms=300000', 'connect-flush'); not('offset.flush.interval.ms=60000', 'connect-flush');
});

test('roles gate the rules: a producer config does not get broker advice, and vice versa', () => {
  assert.deepEqual(ids('acks=all\nretries=5'), []);
  not('acks=1', 'auto-create'); not('group.id=g', 'minisr-default'); not('node.id=1', 'auto-commit');
});

test('findings come ordered risk, then warning, then tip; counts add up', () => {
  const r = K.analyze(K.EXAMPLES.broker + '\n' + K.EXAMPLES.consumer);
  const order = r.findings.map((f) => f.level); const rank = { risk: 0, warn: 1, tip: 2 };
  assert.deepEqual(order, order.slice().sort((a, b) => rank[a] - rank[b]));
  assert.equal(r.counts.risk + r.counts.warn + r.counts.tip, r.findings.length); assert.ok(r.counts.risk >= 4);
});

test('every example behaves as its title says', () => {
  assert.ok(ids(K.EXAMPLES.risky).includes('acks-one') && ids(K.EXAMPLES.risky).includes('retries-zero'));
  assert.ok(ids(K.EXAMPLES.consumer).includes('auto-commit') && ids(K.EXAMPLES.consumer).includes('reset-latest') && ids(K.EXAMPLES.consumer).includes('heartbeat-ratio'));
  for (const id of ['rf-one', 'minisr-one', 'unclean-election', 'internal-rf', 'short-retention']) assert.ok(ids(K.EXAMPLES.broker).includes(id), id);
  assert.ok(ids(K.EXAMPLES.connect).includes('connect-errors-all'));
});

test('a well-set config gets no risk and no warning', () => {
  const good = 'bootstrap.servers=b:9092\nacks=all\nenable.idempotence=true\nretries=2147483647\ndelivery.timeout.ms=120000\nlinger.ms=5\ncompression.type=lz4\n' +
    'group.id=g\nenable.auto.commit=false\nauto.offset.reset=earliest\ngroup.instance.id=a\nmax.poll.interval.ms=300000\nsession.timeout.ms=45000\nheartbeat.interval.ms=3000\n' +
    'node.id=1\nmin.insync.replicas=2\ndefault.replication.factor=3\nunclean.leader.election.enable=false\nauto.create.topics.enable=false\noffsets.topic.replication.factor=3\nlog.retention.hours=168\n';
  const r = K.analyze(good); assert.equal(r.counts.risk, 0, JSON.stringify(r.findings.map((f) => f.id))); assert.equal(r.counts.warn, 0, JSON.stringify(r.findings.map((f) => f.id)));
});

test('every rule has English and Hebrew text, a fix, a documentation link, and no left-over placeholders when it fires', () => {
  assert.ok(K.RULES.length >= 25); const seen = new Set();
  for (const r of K.RULES) { assert.ok(!seen.has(r.id), 'duplicate ' + r.id); seen.add(r.id); assert.ok(['risk', 'warn', 'tip'].includes(r.level)); assert.match(r.docs, /^https:\/\/kafka\.apache\.org\/\d+\/configuration\/[a-z-]+\/#[a-z]+_[\w.]+$/, r.id);
    for (const l of ['en', 'he']) for (const f of ['title', 'why', 'fix']) assert.ok(r[l][f] && r[l][f].length >= 10, r.id + ' ' + l + ' ' + f); }
  const everything = Object.values(K.EXAMPLES).join('\n').replace('default.replication.factor=1', 'default.replication.factor=3').replace('min.insync.replicas=1', 'min.insync.replicas=3') + '\nreplication.factor=1\nenable.idempotence=false\nmax.in.flight.requests.per.connection=5\nretries=3\nacks=0\ntransactional.id=t\ngroup.id=g\nenable.idempotence=true\nacks=1\nretries=0\nmax.in.flight.requests.per.connection=7\ndelivery.timeout.ms=1000\nmin.insync.replicas=3\nreplication.factor=3\ncleanup.policy=delete\noffset.flush.interval.ms=300000\nsession.timeout.ms=6000\nheartbeat.interval.ms=30000';
  const r = K.analyze(everything, { version: 4 }); assert.ok(r.findings.length >= 20);
  for (const f of r.findings) for (const l of ['en', 'he']) for (const k of ['title', 'why', 'fix']) { assert.ok(!/\{\w+\}/.test(f[l][k]), f.id + ' ' + l + ' ' + k + ': ' + f[l][k]); assert.ok(!/undefined|NaN/.test(f[l][k]), f.id); }
  for (const f of r.findings) assert.ok(/[א-ת]/.test(f.he.title) && /[א-ת]/.test(f.he.why), f.id);
});

test('the checklist has ten questions in both languages', () => { assert.equal(K.CHECKLIST.length, 10); for (const q of K.CHECKLIST) assert.ok(q.en.length > 20 && /[א-ת]/.test(q.he)); });

test('bad input never throws', () => { for (const x of [null, undefined, '', '   ', '\n\n', 'a=', '=b', 'x'.repeat(10000), 'acks=\u0000', 42]) assert.doesNotThrow(() => K.analyze(x)); assert.equal(K.analyze('', { version: 'x' }).version, 4); });
