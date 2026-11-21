# Waiting lists, requests, video watch counts, newsletter reads and comments

Each app's one-pager (`one-pager.html?app=…`) has two small forms: **What would you add?** and **Tell me when it is ready**. They send what the person typed, and the app's name, to a small Google Apps Script that adds a row to a Google Sheet. One tab per app and kind, for example `idea-room waitlist` and `idea-room requests`. No server of ours, no database, no key in the repository.

Until the script's address is put into `waitlist.js`, the forms are switched off and say "opens soon". Nothing is sent anywhere.

## Set it up (about five minutes, once, by the Sheet's owner)

The Sheet already exists: **Soycatory waiting lists and requests** (in the owner's Google Drive, private). To connect it:

1. Open the Sheet. Choose **Extensions, then Apps Script**. Delete what is there and paste in `apps-script.gs` from this folder.
2. In Apps Script choose **Project settings** (the gear), then **Script properties**, then **Add script property**. Name `SHEET_ID`, value the long id in the Sheet's address (the part between `/d/` and `/edit`). Save.
3. Choose **Deploy, then New deployment**. Type **Web app**. Execute as **Me**. Who has access **Anyone**. Deploy, and allow the permissions it asks for (it only needs this one Sheet).
4. Copy the **Web app URL** (it ends in `/exec`).
5. Put that URL in `waitlist.js` as `url`, and merge. The forms switch on.

To check it works: open a one-pager, join the waiting list with your own email, and look for a row in that app's tab.

## Video watch counts and comments

The same script also receives, from `videos.html`: **watch counts** (tab `video metrics`) and **comments** (tab `video comments`). A count is a row such as "software-factory, play" or "software-factory, leave at 41 seconds": the video, the event (`play`, `q25`, `q50`, `q75`, `q100`, `pause`, `seek`, `leave`), the position, the length, the language, the time, and a **random number made for that one visit**. The number is held in memory and never stored in the browser, so it is not an identifier of a person or a device; it only joins a few events from one viewing. Nothing else is sent: no cookies, no address, no browser details. A browser that sends Do Not Track or Global Privacy Control is not counted at all. The page tells viewers what is counted.

The tab `video summary` (in the Sheet) turns the rows into views, how many reached each quarter, how many finished, and a count of where people stopped in each ten seconds. For a new video, copy its row in `video summary` and change the name in column A. Comments hold the comment, the moment it was written about, and the email only if the person gave one. They are not shown on the site.

It also receives, from `newsletter.html` ("Soya's AI week"): **reading counts** (tab `newsletter reads`) and **topic requests** (tab `newsletter requests`). A count is the issue date, the event (`view`, `seen` when half an item has been on screen, `more` for "Read more", `source` for opening the source link, `useful-yes`, `useful-no`, `end` for reaching the bottom, `leave` with the deepest item reached), the item, its position, the language, the time, and the same kind of one-visit random number. The same rules apply: no cookies, nothing stored in the browser, nothing from Do Not Track or Global Privacy Control, and the page says what is counted. The tab `newsletter summary` shows, for the issue date in B1, how many people saw each item, opened "Read more", opened the source, and answered Yes or No. For a new issue, change B1 and the item names in column A.

## What it keeps, and why

- **Waiting list:** the email, the language, the time, and that the person ticked the box saying they agree to one email. Used only to write once when that app grows into its next version.
- **Requests:** the sentence, an optional email (only so we can write back), the language, the time.
- Nothing else: no IP address, no tracking, no cookies. The Sheet is private to its owner.
- **Removing someone:** delete their row. Do it promptly when asked.
- **Safe against the usual tricks:** a hidden field catches robots; an email that is already there is added once and the person is told the same thing; a cell that starts with `=`, `+`, `-` or `@` is stored as plain text so it cannot run as a formula; each tab holds at most 5,000 rows.
- **Honest limit:** the page cannot read the script's answer (browsers hide it across sites), so it says "thank you" once the message has gone. A person with a bad connection could be told thank you and not be on the list. Check the Sheet now and then.
- Anyone who finds the script's address can send it rows. The caps and checks above limit the damage; the address is not secret, only unlisted. If it is ever abused, redeploy as a new version and change the address in `waitlist.js`.

## Adding an app

Add its short name to `APPS` in `apps-script.gs` (and redeploy a new version), and the two tabs appear on the first signup.
