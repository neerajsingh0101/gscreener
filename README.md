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

Gscreener is free.

It runs as a Google Apps Script inside your Google account. There is no server, third-party service, or subscription.

Google’s free Apps Script limits are enough for a normal personal mailbox.

## Security

Gscreener is open source, so you can review the code before installing it.

You deploy it inside your own Google Apps Script account. Your emails and sender lists stay inside your Google account.

No software is completely free of security risks. If you find a security issue, please contact [me](https://github.com/neerajsingh0101).

## No AI

Gscreener does not use AI.

It keeps a list of approved and rejected email addresses and checks incoming emails against those lists.

Nothing analyzes the contents of your emails, and nothing is sent to an external service.

## Install using an AI agent

Installation has two parts:

1. An AI agent installs and deploys Gscreener.
2. You enable the side panel inside Gmail.

An AI agent that can control a browser can:

* Create the Apps Script project.
* Copy the Gscreener code into it.
* Run the setup.
* Deploy the dashboard.

The agent follows this [checklist](docs/installation-steps.md)

You only need to help agent when Google asks you to:
* Sign in.
* Approve the requested permissions.

A normal chat at [claude.ai](http://claude.ai) or [chatgpt.com](http://chatgpt.com) cannot complete the installation because it cannot control your browser. Use one of these instead:

* Claude Code or Codex: Both can control a browser and complete the installation.
* Claude in Chrome: A Chrome extension available with paid Claude plans. Install it from [claude.com/claude-for-chrome⁠](https://claude.com/claude-for-chrome)￼.
* ChatGPT agent mode: Available in supported ChatGPT plans. See [ChatGPT agent](https://chatgpt.com/features/agent/)⁠￼.

Give your agent the following prompt.

> Install Gscreener by following the steps at
> https://github.com/neerajsingh0101/gscreener/blob/main/docs/installation-steps.md
>
> Complete all steps through deploying the web app. Do the clicking and pasting yourself.
> 
> Pause when Google asks me to sign in or when the “Gscreener wants access” permission screen appears. Let me complete those steps, and then continue.
> 
> Do not install the Gmail side panel.
>
> When you finish, show me the dashboard URL. Then show me how to enable the Gmail side panel using:
> https://github.com/neerajsingh0101/gscreener#enable-the-gmail-side-panel


### Enable the Gmail side panel

The agent cannot complete this part because it must be done inside your browser and not the automated browser controlled by the Agent.

To enable the Gmail side panel:

1. Open [script.google.com](https://script.google.com) .
2. Open your **Gscreener** project.
3. Click **Deploy** in the top-right corner.
4. Click **Test deployments**.
5. Click **Install**, and then click **Done**.
6. Reload Gmail.
7. Open any email.
8. Click the **Gscreener** icon in the right-hand side panel. It appears below **Contacts** and above the + icon.
9. The first time you open it, click **Authorize access** and approve the request.
    
## How to use Gscreener

When an unknown sender emails you, Gscreener holds the email until you approve or reject the sender.

To review a held email:

1. Open Gmail.
2. In the left sidebar, click **More** under **Labels**.
3. Open Gscreener/Pending.
4. Open one of the held emails.
5. Click the **Gscreener** icon in the right-hand side panel.
6. Approve or reject the sender.

When you approve an email:

* Their held emails are moved to your inbox.
* Future emails from them are delivered to your inbox.

When you reject an email:

* Their emails are moved to Gscreener/Rejected.
* Future emails from them stay out of your inbox.

No emails are deleted.

You do not need to check the Pending label every day. Gscreener sends a daily digest when someone is waiting for review. You can also review all pending senders from the dashboard.

## Updating Gscreener

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
