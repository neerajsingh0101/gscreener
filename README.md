# Gmail Screener

Email screening for Gmail, inspired by [HEY's Screener](https://www.hey.com/features/the-screener/) —
as a free Google Apps Script you run on your own account. No servers, no third parties, no cost: the script
lives in your Google account, runs on Google's infrastructure, and never sends your mail anywhere.

**How it works:** email from anyone not on your approved list never reaches your inbox. It waits
under a `@Screener/Pending` label until you give the sender a 👍 (deliver now and forever) or a 👎
(never see them again). A daily digest email lists everyone awaiting review with one-click buttons.
People you write to are approved automatically.

Nothing is ever deleted. Rejected mail stays in your Gmail under `@Screener/Rejected` — searchable,
recoverable, just never in your inbox.

## Under the hood

1. `setup()` creates three labels and one catch-all Gmail filter ("larger:1" matches every email)
   that makes all incoming mail skip the inbox and land in a hidden `@Screener/Triage` label.
2. A time trigger runs `screenNewMail()` every minute. Mail from approved senders is moved to the
   inbox (you'll rarely notice the ≤1 minute delay). Mail from rejected senders goes to
   `@Screener/Rejected`. Mail matching an [exemption](#exemptions) — sender domain, sender address
   or subject keyword — is delivered immediately even from unknown senders. Everyone else waits in
   `@Screener/Pending`.
3. The same pass scans your Sent mail: anyone you email is added to the approved list.
4. Once a day, `sendDigest()` emails you the list of senders awaiting review with 👍/👎 buttons.
   The buttons hit a private web app (`doGet`) only your Google account can access, which also
   serves a dashboard with your pending/approved/rejected lists.

Your sender lists live in the script's own storage (Script Properties). Your mail never leaves
Gmail; the script only reads message headers (From/To/Subject) and moves labels around.

## Install (~5 minutes)

One action per step. Code links open the **raw** file, so `⌘A`/`Ctrl+A` selects exactly what you
need to copy.

1. Go to [script.google.com](https://script.google.com).
2. Click **New project**.
3. Click the project name at the top (it says **Untitled project**).
4. Rename it to `Gmail Screener`.
5. In the left sidebar, click the **gear icon** (that's Project Settings — the label isn't shown).
6. Check **"Show `appsscript.json` manifest file in editor"**.
7. Click the **`<>` (Editor)** icon in the left sidebar to get back to the code.
8. Click `appsscript.json` in the Files list.
9. Select everything and replace it with the contents of
   [`appsscript.json` (raw)](https://raw.githubusercontent.com/neerajsingh0101/gmail-screener/main/src/appsscript.json).
   If your digest should arrive on a different clock, change `timeZone` to your
   [IANA time zone](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones).
10. Press `⌘S`/`Ctrl+S` to save.
11. Click `Code.gs` in the Files list.
12. Select everything and replace it with the contents of
    [`Config.js` (raw)](https://raw.githubusercontent.com/neerajsingh0101/gmail-screener/main/src/Config.js).
    Save (`⌘S`/`Ctrl+S`).
13. Click the **＋** next to "Files".
14. Choose **Script**.
15. Type `Setup` as the name — just `Setup`, no extension. (The editor adds `.gs` itself; typing
    `Setup.js` gets you a messy `Setup.js.gs`.)
16. Paste in the contents of
    [`Setup.js` (raw)](https://raw.githubusercontent.com/neerajsingh0101/gmail-screener/main/src/Setup.js).
17. Save (`⌘S`/`Ctrl+S`).
18. Click the **＋** next to "Files".
19. Choose **Script**.
20. Type `Screener` as the name — no extension.
21. Paste in the contents of
    [`Screener.js` (raw)](https://raw.githubusercontent.com/neerajsingh0101/gmail-screener/main/src/Screener.js).
22. Save (`⌘S`/`Ctrl+S`).
23. Click the **＋** next to "Files".
24. Choose **Script**.
25. Type `Digest` as the name — no extension.
26. Paste in the contents of
    [`Digest.js` (raw)](https://raw.githubusercontent.com/neerajsingh0101/gmail-screener/main/src/Digest.js).
27. Save (`⌘S`/`Ctrl+S`).
28. Click the **＋** next to "Files".
29. Choose **Script**.
30. Type `WebApp` as the name — no extension.
31. Paste in the contents of
    [`WebApp.js` (raw)](https://raw.githubusercontent.com/neerajsingh0101/gmail-screener/main/src/WebApp.js).
32. Save (`⌘S`/`Ctrl+S`).
33. Click `Setup.gs` in the Files list. (The toolbar's function dropdown only lists functions
    from the file that's currently open — and only once it's saved.)
34. In the toolbar, open the function dropdown (next to **Debug**), choose **`setup`**, and click
    **Run**.
35. Authorize when asked. You'll see **"Google hasn't verified this app"** — click
    **Advanced → Go to Gmail Screener (unsafe)**. "Unsafe" only means Google didn't audit it: the
    code is this repo, running under your own account, visible to no one else.
36. Grant the Gmail permissions. The script asks for the minimum it needs: modify labels
    (`gmail.modify`), manage filters (`gmail.settings.basic`), and manage its own triggers.
37. Click **Deploy** (top right).
38. Click **New deployment**.
39. Click the gear next to "Select type" and choose **Web app**.
40. In the **Description** box, type `Gmail Screener dashboard`. (It's just a label for this
    deployment — it has no effect on behavior.)
41. *Execute as:* should already show **Me (your email)** — leave it.
42. Set *Who has access:* to **Only myself**.
43. Click **Deploy**.
44. Copy the web app URL and bookmark it — that's your screening dashboard, and the digest's
    👍/👎 buttons go through it too.

That's it. Screening starts immediately: new senders pile up in `@Screener/Pending`, your digest
arrives daily at 8am (change `DIGEST_HOUR` in `Config.js`), and the dashboard is at the web app URL.

Prefer the command line? With [clasp](https://github.com/google/clasp):
`npm i -g @google/clasp && clasp login && clasp create --type standalone --title "Gmail Screener" --rootDir src && clasp push`,
then do steps 5–6 in the editor (`clasp open`).

## Daily use

- **Digest email** — arrives only on days something is pending. 👍 delivers all held mail from that
  sender to your inbox and approves them forever; 👎 moves their mail to `@Screener/Rejected` and
  blocks them forever.
- **Dashboard** (web app URL) — same buttons, any time, plus the Exemptions section and your
  approved/rejected lists with per-sender undo.
- **From the editor** — `approveSender('a@b.com')`, `rejectSender('a@b.com')`,
  `addExemption('keywords', 'login code')`, or re-run `setup()` to repair labels/filter/triggers.

## Exemptions

Three lists (managed from the dashboard) let mail bypass screening entirely:

- **Domains** — `github.com` delivers mail from any `…@github.com` address, subdomains included
  (`notifications@mail.github.com` matches too).
- **Email addresses** — specific senders, e.g. `noreply@stripe.com`.
- **Subject keywords** — if the subject contains the phrase (case-insensitive substring), the
  email is delivered no matter who sent it. `login code`, `OTP`, `password` and `verification`
  cover most sign-in, sign-up and password-reset flows.

Three deliberate design decisions worth knowing:

1. **Exemption ≠ approval.** A keyword-exempted OTP email is delivered, but its sender stays
   unapproved — their next ordinary email is still screened. That's what you want for `noreply@`
   senders that send one login code and then start sending marketing.
2. **An explicit 👎 always beats an exemption.** If you rejected someone at an exempted domain,
   they stay rejected.
3. **Exemptions apply retroactively.** Adding `github.com` while twelve GitHub emails sit in
   `@Screener/Pending` immediately releases all twelve to your inbox (`rescreenPending()`
   re-checks everything held and reports the count in the dashboard notice).

## Things to know

- **Time-sensitive mail from new senders is held too.** Sign-up confirmations, OTPs and receipts
  from services you just joined are "unknown senders". Add subject keywords like `login code`,
  `OTP` and `password` under [Exemptions](#exemptions) so those are delivered instantly; for
  anything else, check `@Screener/Pending` or the dashboard.
- **Approved mail arrives with up to a 1 minute delay** (the polling interval). Phone notifications
  fire when the mail reaches your inbox.
- **If the script ever stops** (uncaught error, quota), mail queues up safely in
  `@Screener/Pending` — nothing is lost. Apps Script emails you when a trigger fails repeatedly.
- **Quotas:** consumer accounts get 90 min/day of trigger runtime; an idle screening pass takes
  well under a second, so an every-minute trigger uses a fraction of that. If you want more
  headroom, set `POLL_MINUTES = 5`.
- **Multiple Google accounts in one browser:** if the dashboard says you need permission, you're
  signed into the wrong account — open the link in a profile/window where the Gmail account is
  primary.
- **Storage:** rejected mail still counts toward your Gmail storage. If a rejected sender is
  high-volume, occasionally empty the label (or add your own cleanup rule).

## Uninstall

Run `uninstall()` in the editor: it deletes the filter and triggers and releases everything in
`@Screener/Pending` back to your inbox. Labels, rejected mail and your sender lists are kept;
delete them manually if you want a clean slate. Then remove the script's access at
[myaccount.google.com/connections](https://myaccount.google.com/connections).

## License

[MIT](LICENSE)
