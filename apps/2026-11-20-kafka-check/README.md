# Kafka Check

*Made by Soycatory.* App 8, 20 November 2026. English and Hebrew. A browser app and a command-line tool.

Paste a Kafka producer, consumer, broker, topic or Connect config. It points at settings that can **lose, repeat or reorder messages**, in plain words: what the setting does, why it is a problem, what to do, and a link to Kafka's own documentation. Findings come in three levels: **risk** (can lose or corrupt data), **worth a look**, and **tip** (a trade-off, such as throughput).

## What it is not

A config cannot prove a system is reliable. It cannot show whether your code is safe to run twice, how long your processing takes, or what happens when a broker fails. The app says so, and ends with ten questions no config can answer (idempotent processing, commit timing, lag against retention, a real broker-failure test, a dead letter topic, ordering, and so on). They are questions for the team, not checks the tool did.

## Privacy

It runs in the browser. What you paste is not sent anywhere and is not saved. Before anything is checked, values of keys that look like secrets (`password`, `secret`, `token`, `jaas`, `api key`, `credential`…) are replaced by `(hidden)`, so they never appear in the results. Only the language choice is stored (`soya-kafkacheck-lang`).

## The command line

```
node apps/2026-11-20-kafka-check/cli.js producer.properties consumer.properties [--version 4|3|2] [--lang en|he] [--fail-on risk|warn|never] [--json]
```

Reads each file (or `-` for standard input), prints the findings, and **exits 1 if anything at or above `--fail-on` (default `risk`) is found**, so a team can put it in CI. `--json` gives the same findings as data. Needs only Node.

## Where the rules come from

Every rule is written from Kafka's configuration documentation (version 4.4 when it was written) and each finding links to the exact setting. The facts behind the rules were checked against that documentation on 20 November 2026; some sections were read only through a summary, so **re-check a rule against the docs before you rely on it**. Where a rule is a rule of thumb, not a documented fact, its text says "usually" or "a rule of thumb". The documentation version the links point to is one constant (`DOCS_VERSION` in `rules.js`).

What it knows, by kind:
- **Producer:** `acks`, `retries`, idempotence and the settings that conflict with it, in-flight requests and reordering, `delivery.timeout.ms`, `linger.ms`, compression, transactions without `read_committed`.
- **Consumer:** auto commit, `auto.offset.reset`, `max.poll.interval.ms`, heartbeat against session timeout (classic protocol only), static membership, the newer rebalance protocol.
- **Broker and topic:** `min.insync.replicas`, replication factor, unclean leader election, auto topic creation, internal topic replication, short retention.
- **Connect:** `errors.tolerance=all` without a dead letter queue, offset flush interval.
- **Version:** the choice of Kafka version changes the defaults it assumes (before 3.0 the producer did not use `acks=all` or idempotence by default).

## Adding or changing a rule

A rule in `rules.js` has an id, a level, which kind of config it applies to, a `when` function, English and Hebrew text, and a link to the documentation. Every rule needs a test that makes it fire and one that keeps it quiet (`rules.test.js`), and the tests check that every rule has both languages, a fix, a link, and no left-over placeholders. Run `node --test apps/2026-11-20-kafka-check/rules.test.js`.

## Files

`index.html`, `styles.css`, `rules.js` (the rules, tested), `app.js` (screens and text in both languages), `cli.js` (command line), `sw.js` (offline; cache `kafkacheck-…`), `manifest.webmanifest`, `icons/`, `assets/`.
