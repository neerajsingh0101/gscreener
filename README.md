# Gscreener

Gscreener brings HEY-style [email screening](https://www.hey.com/features/the-screener) to Gmail.

Anyone can send you an email, which makes it easy for spam and unwanted messages to reach your inbox. HEY⁠￼ solves this with its Screener. 
I liked the idea, but I wanted to keep using Gmail and Google Workspace, so I built Gscreener.

Gscreener is free and runs entirely inside your Google account. There are no servers, subscriptions, or third-party services. 
Your emails never leave Google, and nothing is deleted.

When an unknown sender emails you, their message is held until you approve or reject them:

* **Approve**: Deliver their emails now and in the future.
* **Reject**: Keep their emails out of your inbox.

Gscreener sends you a daily digest of emails waiting for review. You can also manage them from the dashboard or the Gmail side panel.

<img width="1542" height="538" alt="CleanShot 2026-07-10 at 00 57 41" src="https://github.com/user-attachments/assets/f98c8b77-17d7-4aeb-bea9-cd1ee992085c" />

<img width="729" height="633" alt="CleanShot 2026-07-10 at 00 58 49" src="https://github.com/user-attachments/assets/735377ad-18ae-48d5-aff1-68ba382d5e3e" />

<img width="705" height="563" alt="CleanShot 2026-07-10 at 01 00 26" src="https://github.com/user-attachments/assets/3d8f3032-8578-4825-8f1f-b046c4b76e54" />

<img width="777" height="927" alt="CleanShot 2026-07-10 at 01 00 51" src="https://github.com/user-attachments/assets/d40d7aab-ceea-4499-9e4f-9a1ba777e133" />

<img width="253" height="121" alt="CleanShot 2026-07-10 at 01 03 35" src="https://github.com/user-attachments/assets/2a57c07a-b644-4b33-8032-902e2599b2a4" />



## Contents

- [Cost](#cost)
- [Security](#security)
- [No AI](#no-ai)
- [Installation by an AI agent](#installation-by-an-ai-agent)
- [Making Gmail side panel work](#making-gmail-side-panel-work)
- [How to use it](#how-to-use-it)
- [Updating code](#updating-code)
- [Daily use](#daily-use)
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

## No AI

You will be disappointed to know that this tool does not need AI to do its job. It does its job the
old-fashioned way: it keeps a list of the emails you have approved and the ones you have rejected,
and it checks every incoming email against that list. Nothing reads your mail, and nothing is sent
anywhere to be analyzed.

## Installation by an AI agent

Installation comes in two parts:

1. **The agent sets it up for you.** An AI that can drive a web browser creates the Apps Script
   project, pastes in the code, runs it, and deploys your dashboard — the whole
   [detailed checklist](docs/installation-steps.md), without you clicking through it yourself. You
   just handle the two moments that need a human: signing into Google and approving the permissions.
2. **You turn on the Gmail side panel.** One short step the agent can't do for you — it has to
   happen inside *your* Gmail — covered in
   [Making Gmail side panel work](#making-gmail-side-panel-work). The agent points you there when
   it's done.

You don't need to be a developer for either part.

One catch worth knowing: plain chat at **claude.ai** or **chatgpt.com** can't do part 1 on its
own. Those answer in text; they can't click buttons inside your browser. You need a version that
can actually *control a browser*:

- **Claude Code** or **Codex** — if you already use either, you're all set: they can drive a
  browser, so the install just works. Point them at this README and go.
- **Claude in Chrome** — a browser extension (included with paid Claude plans) that clicks and
  types in your own Chrome, where you're already signed into Google. Get it at
  [claude.com/claude-for-chrome](https://claude.com/claude-for-chrome).
- **ChatGPT agent mode** — turn on **Agent** in ChatGPT (Plus and up); it runs its own browser
  and pauses for you to sign in when needed. See [ChatGPT agent](https://chatgpt.com/features/agent/).

Once it can see your browser, paste this:

> Install Gscreener for me by following the steps in
> https://github.com/neerajsingh0101/gscreener/blob/main/docs/installation-steps.md, up to and
> including deploying the web app. Do all the clicking and pasting yourself. Two moments need me:
> when Google asks me to sign in, and when the "Gscreener wants access" permission screen appears
> — pause and let me handle those, then keep going. Do not install the Gmail side panel
> yourself. When you're finished, show me my dashboard URL, then print the one step left for me to
> do by hand — turning on the side panel — and link me to
> https://github.com/neerajsingh0101/gscreener#making-gmail-side-panel-work.

You'll be needed at two moments during part 1 — the Google sign-in and the permission approval
(the agent can't and shouldn't know your password or grant Gmail access for you) — and then
once more for part 2. The agent does everything else.

## Making Gmail side panel work

This is the part the agent leaves to you — it has to happen inside your own Gmail, and it takes
about a minute.

The payoff: open a held email in Gmail and the **Gscreener card** in the right-hand side panel
shows the sender's status with the same 👍 Approve / 👎 Reject buttons, so you can
decide while reading. Opening it with no email selected lists everyone awaiting review, and it
works in the Gmail mobile apps too. (Buttons can't go in the email body — Gmail messages are
immutable once delivered — so a side-panel card is as close as Gmail allows.)

1. Open [script.google.com](https://script.google.com) and click your **Gscreener** project.
2. Click **Deploy** (top right), then **Test deployments**.
3. In the dialog, click **Install**, then **Done**.
4. Reload your Gmail tab, open any email, and click the **Gscreener icon** in the right-hand side
   panel (just below **Contacts**, just above the **+**).
5. The first time only: click **Authorize access** in the panel and approve.

## How to use it

After the installation, go to your Gmail account and follow these steps:

1. In the left sidebar, under **Labels**, click **More**. (The Gscreener labels are hidden, so
   they only appear once you expand **More**.)
2. You'll see three labels: `Gscreener/Pending`, `Gscreener/Rejected` and `Gscreener/Triage`.
   Click **`Gscreener/Pending`**.
3. Open one of the held emails, then look at the right-hand side panel.
4. Click the **Gscreener** icon — it sits just below **Contacts** and just above the **+** sign.
5. Read the email and give the sender a 👍 **Approve** or a 👎 **Reject**.

That's the whole loop. 👍 delivers this sender's mail to your inbox from now on (and releases
anything of theirs already held); 👎 sends it to `Gscreener/Rejected` forever. Nothing is deleted
either way.

You don't have to do this every day. Once a day, Gscreener emails you a digest of everyone
awaiting review with the same 👍/👎 buttons, and the dashboard shows the whole queue at a glance —
see [Daily use](#daily-use).

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
  sender to your inbox and approves them forever; 👎 moves their mail to `Gscreener/Rejected` and
  blocks them forever.
- **Dashboard** (web app URL) — same buttons, any time, plus the Exemptions section and your
  approved/rejected sender lists, where you can add or remove senders directly. Each pending
  sender's name links to their held mail in Gmail so you can read before deciding.
- **Gmail side panel** — read a held email in Gmail and approve/reject its sender right next to
  it; see [Making Gmail side panel work](#making-gmail-side-panel-work).
- **From the editor** — `approveSender('a@b.com')`, `rejectSender('a@b.com')`,
  `addExemption('keywords', 'login code')`, or re-run `setup()` to repair labels/filter/triggers.

## Exemptions

Two lists (managed from the dashboard) let mail bypass screening entirely:

- **Domains** — `github.com` delivers mail from any `…@github.com` address, subdomains included
  (`notifications@mail.github.com` matches too).
- **Subject keywords** — if the subject contains the phrase (substring match), the email is
  delivered no matter who sent it. `login code`, `OTP`, `password` and `verification` cover most
  sign-in, sign-up and password-reset flows.

Matching for both lists is case-insensitive. There is deliberately no per-address exemption —
exempting one address is the same as approving the sender, which you can do from the dashboard
(**Approved emails → Add**) without waiting for their first email.

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
   `Gscreener/Pending` immediately releases all twelve to your inbox (`rescreenPending()`
   re-checks everything held and reports the count in the dashboard notice).

## Things to know

- **Time-sensitive mail from new senders is held too.** Sign-up confirmations, OTPs and receipts
  from services you just joined are "unknown senders". Add subject keywords like `login code`,
  `OTP` and `password` under [Exemptions](#exemptions) so those are delivered instantly; for
  anything else, check `Gscreener/Pending` or the dashboard.
- **Approved mail arrives with up to a 1 minute delay** (the polling interval). Phone notifications
  fire when the mail reaches your inbox.
- **Your other Gmail filters keep working.** Filters run once, at delivery, so labels from your
  own filters are applied normally — the screener never touches any label besides Inbox and its
  three `Gscreener` labels. And when it delivers held or exempt mail, it re-checks your own
  "Skip Inbox" filters and leaves matching mail archived instead of forcing it into the inbox
  (Gmail offers no way to re-run filters, so the screener emulates that one action).
- **If the script ever stops** (uncaught error, quota), mail queues up safely in
  `Gscreener/Pending` — nothing is lost. Apps Script emails you when a trigger fails repeatedly.
- **Quotas:** consumer accounts get 90 min/day of trigger runtime; an idle screening pass takes
  well under a second, so an every-minute trigger uses a fraction of that. If you want more
  headroom, set `POLL_MINUTES = 5`.
- **Multiple Google accounts in one browser:** if the dashboard says you need permission, you're
  signed into the wrong account — open the link in a profile/window where the Gmail account is
  primary.
- **Storage:** rejected mail still counts toward your Gmail storage. If a rejected sender is
  high-volume, occasionally empty the label (or add your own cleanup rule).

## How it works

**The screening strategy.** Nothing can stop an email from being *delivered* to your Gmail —
once someone sends it, it lands in your account no matter what. So Gscreener can't literally hold
mail back before it arrives. Instead it does the next best thing, entirely with Gmail labels
inside your own mailbox:

1. A single catch-all Gmail filter (`larger:1`, which matches every email) fires the instant any
   mail arrives and immediately pulls it **out of the inbox** into a hidden staging label,
   `Gscreener/Triage`. So no email is ever seen in your inbox unscreened.
2. A script runs every minute, looks at who each staged email is *from*, and re-labels it: mail
   from an **approved** sender is put in your inbox; mail from a **rejected** sender goes to
   `Gscreener/Rejected`; mail from an **unknown** sender waits in `Gscreener/Pending`; and mail
   matching an [exemption](#exemptions) (sender domain or subject keyword) is delivered straight to
   the inbox even from an unknown sender.

That's the whole trick — a catch-all "skip inbox" filter plus a script that sorts by sender. It's
the same approach [HEY](https://www.hey.com/features/the-screener/) uses. Nothing is ever deleted
or sent anywhere; the script only reads message headers (From/To/Subject) and moves labels around.

All three `Gscreener/*` labels are **hidden** from your Gmail sidebar — they're plumbing you never
need to open. You review pending senders from the daily digest email and the dashboard, not by
clicking a label.

A few more details:

- The same minute-by-minute pass also scans your **Sent** mail: anyone you email is added to your
  approved list automatically, so people you reach out to are never screened.
- Once a day, `sendDigest()` emails you the senders awaiting review with 👍/👎 buttons. Those
  buttons (and the dashboard) are a private web app only your own Google account can open.
- Your approved/rejected/exemption lists live in the script's own storage (Script Properties),
  inside your Google account. Nothing leaves Gmail.

## Uninstall

Run `uninstall()` in the editor: it deletes the filter and triggers and releases everything in
`Gscreener/Pending` back to your inbox. Labels, rejected mail and your sender lists are kept;
delete them manually if you want a clean slate. Then remove the script's access at
[myaccount.google.com/connections](https://myaccount.google.com/connections).

## License

[MIT](LICENSE)
