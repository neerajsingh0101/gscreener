# Gmail Screener

Email is a beautiful thing. However, these days anyone can send an email to you, and that leads
to all kinds of spam. To prevent this, I like to control the situation.

[HEY](https://www.hey.com/features/the-screener/) introduced a screener service, which I really
like. But because I am so intertwined with the Google Workspace ecosystem, I could not move to
HEY. So, inspired by their Screener, I built Gmail Screener.

No servers, no third-party services, and no cost. The script lives in your Google account, runs
on Google's infrastructure, and never sends your email anywhere. Nothing is ever deleted — you
are in full control.

**How it works:** email from anyone not on your approved list never reaches your inbox. It waits
under a `@Screener/Pending` label until you give the sender a 👍 (deliver now and forever) or a 👎
(never see them again). A daily digest email lists everyone awaiting review with one-click buttons.
People you write to are approved automatically.

## Contents

- [Cost](#cost)
- [Security](#security)
- [Installation steps](#installation-steps)
  - [Install manually](#install-manually)
  - [Install by agent](#install-by-agent)
- [Updating code](#updating-code)
- [Daily use](#daily-use)
- [The Gmail side panel](#the-gmail-side-panel)
- [Exemptions](#exemptions)
- [Things to know](#things-to-know)
- [How it works](#how-it-works)
- [Uninstall](#uninstall)
- [License](#license)

## Cost

Zero — always. Everything runs as a Google Apps Script inside your own Google account: there is
no server to rent, no third-party service, and no subscription. Google's free Apps Script quotas
comfortably cover a personal mailbox, so deploying and running this whole operation costs
nothing.

## Security

Every line of this project is open source, so you can review exactly what the code does before
running it. You also deploy it yourself, into your own Google Apps Script environment — your mail
and your sender lists never leave your Google account, and no third party is involved.

Having said that, a fair warning: software can always have vulnerabilities. If you notice any
security-related issue, please contact [me](https://github.com/neerajsingh0101).

## Installation steps

The steps below can be followed two ways: by hand, or by an AI agent that can drive a browser.
Both paths run exactly the same steps — pick whichever suits you.

### Install manually

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
11. In the Files list, hover over `Code.gs` and click the **⋮** (three-dot) menu that appears.
12. Choose **Rename**.
13. Type `Config` — no extension — and press **Enter**. (Every new project starts with a file
    called `Code.gs`; renaming it keeps your files matching this repo one-to-one.)
14. Select everything in it and replace it with the contents of
    [`Config.js` (raw)](https://raw.githubusercontent.com/neerajsingh0101/gmail-screener/main/src/Config.js).
15. Save (`⌘S`/`Ctrl+S`).
16. Click the **＋** next to "Files".
17. Choose **Script**.
18. Type `Setup` as the name — just `Setup`, no extension. (The editor adds `.gs` itself; typing
    `Setup.js` gets you a messy `Setup.js.gs`.)
19. Paste in the contents of
    [`Setup.js` (raw)](https://raw.githubusercontent.com/neerajsingh0101/gmail-screener/main/src/Setup.js).
20. Save (`⌘S`/`Ctrl+S`).
21. Click the **＋** next to "Files".
22. Choose **Script**.
23. Type `Screener` as the name — no extension.
24. Paste in the contents of
    [`Screener.js` (raw)](https://raw.githubusercontent.com/neerajsingh0101/gmail-screener/main/src/Screener.js).
25. Save (`⌘S`/`Ctrl+S`).
26. Click the **＋** next to "Files".
27. Choose **Script**.
28. Type `Digest` as the name — no extension.
29. Paste in the contents of
    [`Digest.js` (raw)](https://raw.githubusercontent.com/neerajsingh0101/gmail-screener/main/src/Digest.js).
30. Save (`⌘S`/`Ctrl+S`).
31. Click the **＋** next to "Files".
32. Choose **Script**.
33. Type `WebApp` as the name — no extension.
34. Paste in the contents of
    [`WebApp.js` (raw)](https://raw.githubusercontent.com/neerajsingh0101/gmail-screener/main/src/WebApp.js).
35. Save (`⌘S`/`Ctrl+S`).
36. Click the **＋** next to "Files".
37. Choose **Script**.
38. Type `AddOn` as the name — no extension.
39. Paste in the contents of
    [`AddOn.js` (raw)](https://raw.githubusercontent.com/neerajsingh0101/gmail-screener/main/src/AddOn.js).
40. Save (`⌘S`/`Ctrl+S`).
41. Click `Setup.gs` in the Files list. (The toolbar's function dropdown only lists functions
    from the file that's currently open — and only once it's saved.)
42. In the toolbar, open the function dropdown (next to **Debug**), choose **`setup`**, and click
    **Run**.
43. Authorize when asked. You'll see **"Google hasn't verified this app"** — click
    **Advanced → Go to Gmail Screener (unsafe)**. "Unsafe" only means Google didn't audit it: the
    code is this repo, running under your own account, visible to no one else.
44. Grant the Gmail permissions. The script asks for the minimum it needs: modify labels
    (`gmail.modify`), manage filters (`gmail.settings.basic`), manage its own triggers, and run
    as a Gmail add-on (the [side panel](#the-gmail-side-panel)).
45. Click **Deploy** (top right).
46. Click **New deployment**.
47. Click the gear next to "Select type" and choose **Web app**.
48. In the **Description** box, type `Gmail Screener dashboard`. (It's just a label for this
    deployment — it has no effect on behavior.)
49. *Execute as:* should already show **Me (your email)** — leave it.
50. Set *Who has access:* to **Only myself**.
51. Click **Deploy**.
52. Copy the web app URL and bookmark it — that's your screening dashboard, and the digest's
    👍/👎 buttons go through it too.

That's it. Screening starts immediately: new senders pile up in `@Screener/Pending`, your digest
arrives daily at 8am (change `DIGEST_HOUR` in `Config.js`), and the dashboard is at the web app URL.

### Install by agent

If you use an AI coding agent that can drive a browser — Claude Code, Codex, and friends — you
can hand it the manual steps instead of clicking through them yourself. (This is how the project
itself is maintained: an agent operating the Apps Script editor through Chrome.)

With Claude Code:

1. Give Claude browser control by adding Google's Chrome DevTools MCP server, then restart the
   session so the browser tools load:

   ```
   claude mcp add chrome-devtools -- npx -y chrome-devtools-mcp@latest
   ```

2. Paste this prompt:

   > Fire up the Chrome MCP and install Gmail Screener from
   > https://github.com/neerajsingh0101/gmail-screener by following the "Install manually"
   > steps in its README. Ask me to sign into Google in your browser window when it opens,
   > and to approve the Google authorization prompt when it appears — do everything else
   > yourself. When you're done, verify the install: labels created, filter in place,
   > triggers running, web app deployed, side panel installed.

3. You'll be needed exactly twice: once to sign into Google in the agent's Chrome window
   (a one-time login — the agent cannot and should not know your password), and once to
   click through the authorization screen. The agent handles the other fifty steps.

Other agents work the same way: give them a browser, point them at this README, and stay nearby
for the sign-in and the authorization prompt.

## Updating code

When code in this repo changes and you want it on your install:

1. Open your project at [script.google.com](https://script.google.com).
2. Open each changed file, select everything, paste the new raw contents, and save (`⌘S`/`Ctrl+S`).
3. Screening and digest changes take effect immediately — the triggers always run the latest
   saved code.
4. Dashboard (`WebApp`) changes additionally need a new deployment version, because the web app
   URL serves a frozen snapshot:
   1. Click **Deploy** → **Manage deployments**.
   2. Click the **pencil icon**.
   3. Under **Version**, choose **New version**.
   4. Click **Deploy**, then **Done**. (The URL — and your bookmark — stay the same.)
5. Finish every update by re-running `setup()` — always, even when `Setup.gs` itself didn't
   change: click `Setup.gs` in the Files list, choose `setup` in the toolbar dropdown, and click
   **Run**. `setup()` is idempotent, so running it any number of times is safe: it repairs the
   labels, filter and triggers, and seeds any newly added defaults — without ever touching lists
   you've changed or entries you've removed.

## Daily use

- **Digest email** — arrives only on days something is pending. 👍 delivers all held mail from that
  sender to your inbox and approves them forever; 👎 moves their mail to `@Screener/Rejected` and
  blocks them forever.
- **Dashboard** (web app URL) — same buttons, any time, plus the Exemptions section and your
  approved/rejected sender lists, where you can add or remove senders directly. Each pending
  sender's name links to their held mail in Gmail so you can read before deciding.
- **Gmail side panel** — read a held email in Gmail and approve/reject its sender right next to
  it; see [The Gmail side panel](#the-gmail-side-panel).
- **From the editor** — `approveSender('a@b.com')`, `rejectSender('a@b.com')`,
  `addExemption('keywords', 'login code')`, or re-run `setup()` to repair labels/filter/triggers.

## The Gmail side panel

The fastest workflow is deciding while reading: open a held email in Gmail and the **Gmail
Screener card** in the right-hand side panel shows the sender's status with the same 👍 Approve /
👎 Reject buttons. Opening the add-on with no email selected shows a home card listing everyone
awaiting review. It works in the Gmail mobile apps too.

(Buttons can't be injected into the email body itself — Gmail messages are immutable once
delivered — so a side-panel card is as close as Gmail allows.)

To enable it, after all files (including `appsscript.json` and `AddOn`) are in place and
`setup()` has been run:

1. Click **Deploy** (top right).
2. Click **Test deployments**.
3. In the dialog, click **Install**, then **Done**.
4. Reload your Gmail tab.
5. Open any email and click the **Gmail Screener icon** in the right-hand side panel.
6. The first time only: click **Authorize access** in the panel and approve.

## Exemptions

Two lists (managed from the dashboard) let mail bypass screening entirely:

- **Domains** — `github.com` delivers mail from any `…@github.com` address, subdomains included
  (`notifications@mail.github.com` matches too).
- **Subject keywords** — if the subject contains the phrase (substring match), the email is
  delivered no matter who sent it. `login code`, `OTP`, `password` and `verification` cover most
  sign-in, sign-up and password-reset flows.

Matching for both lists is case-insensitive. There is deliberately no per-address exemption —
exempting one address is the same as approving the sender, which you can do from the dashboard
(**Approved senders → Add**) without waiting for their first email.

New installs start pre-seeded with a few defaults — domains `github.com` and `stripe.com`,
keywords `login code` and `otp`. Remove any of them from the dashboard; `setup()` never re-adds
entries you've removed.

Three deliberate design decisions worth knowing:

1. **Exemption ≠ approval.** A keyword-exempted OTP email is delivered, but its sender stays
   unapproved — their next ordinary email is still screened. That's what you want for `noreply@`
   senders that send one login code and then start sending marketing.
2. **An explicit 👎 always beats an exemption.** If you rejected someone at an exempted domain,
   they stay rejected. Same for keywords: if a person you explicitly rejected sends an email
   containing one of your exemption keywords, it will not be delivered — an explicit rejection
   always wins.
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
- **Your other Gmail filters keep working.** Filters run once, at delivery, so labels from your
  own filters are applied normally — the screener never touches any label besides Inbox and its
  three `@Screener` labels. And when it delivers held or exempt mail, it re-checks your own
  "Skip Inbox" filters and leaves matching mail archived instead of forcing it into the inbox
  (Gmail offers no way to re-run filters, so the screener emulates that one action).
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

## How it works

1. `setup()` creates three labels and one catch-all Gmail filter ("larger:1" matches every email)
   that makes all incoming mail skip the inbox and land in a hidden `@Screener/Triage` label.
2. A time trigger runs `screenNewMail()` every minute. Mail from approved senders is moved to the
   inbox (you'll rarely notice the ≤1 minute delay). Mail from rejected senders goes to
   `@Screener/Rejected`. Mail matching an [exemption](#exemptions) — sender domain or subject
   keyword — is delivered immediately even from unknown senders. Everyone else waits in
   `@Screener/Pending`.
3. The same pass scans your Sent mail: anyone you email is added to the approved list.
4. Once a day, `sendDigest()` emails you the list of senders awaiting review with 👍/👎 buttons.
   The buttons hit a private web app (`doGet`) only your Google account can access, which also
   serves a dashboard with your pending/approved/rejected lists.

Your sender lists live in the script's own storage (Script Properties). Your mail never leaves
Gmail; the script only reads message headers (From/To/Subject) and moves labels around.

## Uninstall

Run `uninstall()` in the editor: it deletes the filter and triggers and releases everything in
`@Screener/Pending` back to your inbox. Labels, rejected mail and your sender lists are kept;
delete them manually if you want a clean slate. Then remove the script's access at
[myaccount.google.com/connections](https://myaccount.google.com/connections).

## License

[MIT](LICENSE)
