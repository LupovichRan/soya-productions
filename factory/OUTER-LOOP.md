# The outer loop

> **Ran's writing rule (always):** never use bullet points in anything you write (reports, emails, pull requests, posts, docs, app text). Use numbered lists or plain sentences.

The factory should not wait for a person to carry messages between its parts. The outer loop is an agent that, on a schedule, **decides what is next, checks the result, follows up, and only brings a person in where a person is needed**. The idea is borrowed from the way people now use agents as the layer above Claude Code, not inside it.

## What it does each day (after the build run has opened its pull request)

1. **Look.** Open pull requests, their checks, the live site, the mailbox, the requests in the Sheet, the Supabase numbers.
2. **Finish what is safe to finish.** Merge a pull request when all of these are true: it comes from the factory or this loop, every check is green, the secret scan is green, the app's tests pass, it adds or changes only what its description says, and it touches no key, billing, licence or ownership text. Then check the live site shows it.
3. **Follow up.** Read new "what would you add?" requests and waiting-list rows. Turn repeated or strong requests into a line in `factory/backlog.md` (as a candidate with a score) and, when small and clear, into a pull request. Note who asked only by the app and the sentence, never the email.
3b. **Run the channel.** Follow `factory/CHANNEL.md`: read `video summary`, `video comments` and the requests, and let drop-offs and repeated questions decide the next scene fixes and the next video.
4. **Post.** Publish the day's LinkedIn post from `factory/posts/` once the app is live and checked.
5. **Report.** Send one short email to Ran with what happened and, at the top, only what needs him.

## What it never does without Ran

Spend money. Create or change an account or a login. Accept a licence or a legal term. Promise or give anyone ownership, equity or money. Delete data. Change who can read a table or a sheet. Publish anything but the day's post. Touch another project's data. Share an email address anywhere. Merge a pull request with a red or missing check, or one that changes these rules. Anything surprising: stop and email.

## Making a day

The daily app comes with a brief (`factory/studio/briefs/`). `python3 factory/studio/studio.py check` must report no gaps before the post is published.

## What needs Ran, once

Logins and approvals that only he can give: connect LinkedIn, deploy the waiting-list script, connect his computer if a local model is wanted. After that the loop runs on its own.

## How it knows it did well

A day is done when: one app is live and listed, its one-pager and intro exist, its post is published, no pull request of the loop's is left open and green, and the email to Ran has nothing "Needs Ran" that could have been done by the loop. If something is red, the loop fixes it or says plainly what is stuck.
