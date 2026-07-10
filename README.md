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
- [Installation](#installation)
  - [Step 1: Let AI agent do the step 1](#step-1-let-ai-agent-do-the-step-1)
  - [Enable the Gmail side panel](#enable-the-gmail-side-panel)
- [How to use Gscreener](#how-to-use-gscreener)
- [Updating Gscreener](#updating-gscreener)
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

## Installation


Installation has two steps:

1. An AI agent installs and deploys Gscreener.
2. You manually enable the side panel inside Gmail.

## Step 1: Let AI agent do the step 1

The [checklist](docs/installation-steps.md) of items to be done is long.
But AI agent can help. An AI agent that can control a browser can do the work.

You only need to help the AI agent when Google asks you to:
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

To install changes from this repository:

1. Open your project at [script.google.com](https://script.google.com)⁠￼.
2. Open each file that changed.
3. Replace its contents with the latest version from this repository.
4. Save the file using ⌘S on macOS or Ctrl+S on Windows and Linux.

Changes to screening and digest emails take effect as soon as you save them.

Changes to the dashboard require a new deployment version:

1. Click **Deploy** → **Manage deployments**.
2. Click the pencil icon.
3. Under **Version**, select **New version**.
4. Click Deploy, and then click Done.

Your dashboard URL does not change.

After every update, run setup():

1. Open Setup.gs.
2. Select setup from the function menu in the toolbar.
3. Click **Run**.

It is safe to run setup() more than once. It repairs the labels, Gmail filter, and triggers. It also adds any new default settings.

It does not overwrite lists you have changed or restore entries you removed.


## Exemptions

Exemptions allow certain emails to bypass screening.

You can manage two exemption lists from the dashboard.

### Domains

Adding github.com allows emails from any @github.com address.

Subdomains are included, so an address such as notifications@mail.github.com also matches.

### Subject keywords

An email is delivered when its subject contains one of your exempted phrases.

Matching is case-insensitive and checks whether the phrase appears anywhere in the subject.

Useful examples include:

* login code
* OTP
* password
* verification

### Exemption does not mean approval

An exempted email is delivered, but its sender is not approved.

For example, an OTP email from a new noreply@ address may be delivered because its subject contains OTP. A later marketing email from the same address will still be screened.

### Rejection takes priority

An explicit rejection always overrides an exemption.

For example, an email will not be delivered when:

* You rejected the sender, even though their domain is exempted.
* You rejected the sender, even though the subject contains an exempted keyword.

### Exemptions also apply to held emails

When you add an exemption, Gscreener checks the emails already in Gscreener/Pending.

For example, if twelve GitHub emails are waiting and you add github.com, all twelve are released to your inbox.

The dashboard shows how many emails were released.

## Things to know

### Time-sensitive emails may be held

Confirmation emails, OTPs, and receipts can come from unknown senders.

Add common phrases such as login code, OTP, and password under Exemptions to deliver these messages immediately.

For other messages, check the dashboard or Gscreener/Pending.

### Delivery can take up to one minute

Gscreener checks held emails once per minute.

After an email is approved, it may take up to one minute to reach your inbox. Your phone notification appears when the email reaches the inbox.

### Your Gmail filters continue to work

Gscreener only changes the Inbox label and its three labels:

* Gscreener/Triage
* Gscreener/Pending
* Gscreener/Rejected

Your other Gmail filters still add their normal labels when an email arrives.

When Gscreener releases a held or exempted email, it also checks your own Skip Inbox filters. If the email matches one of those filters, it stays archived instead of being forced into your inbox.

Gmail does not provide a way to run filters again, so Gscreener reproduces the Skip Inbox behavior itself.

### Emails remain safe if the script stops

If a script error or quota problem stops Gscreener, incoming emails remain in Gscreener/Pending.

Nothing is lost.

Google Apps Script also sends you an email when a trigger repeatedly fails.


### Using multiple Google accounts

If the dashboard says you do not have permission, you may be signed in with the wrong Google account.

Open the dashboard in a browser profile or window where the correct Gmail account is the primary account.

### Rejected emails use storage

Rejected emails still count toward your Gmail storage.

For high-volume senders, occasionally delete the messages under Gscreener/Rejected or create your own cleanup rule.

## How it works

Gscreener cannot stop an email from reaching your Gmail account. Once someone sends it, Gmail receives it.

Instead, Gscreener moves every new email out of the inbox before you see it and then decides where it should go.

### Step 1: Move new mail to Triage

Gscreener adds a filter so that as soon as an email arrives, the filter removes it from the inbox and adds the hidden Gscreener/Triage label.

This prevents an unscreened email from appearing in your inbox.

### Step 2: Sort the email

A script runs once per minute and checks each email in Gscreener/Triage.

It then handles the message based on the sender:

* Approved sender: Move the email to the inbox.
* Rejected sender: Move the email to Gscreener/Rejected.
* Unknown sender: Move the email to Gscreener/Pending.
* Exempted email: Deliver it based on its sender domain or subject keyword.

That is the basic system: one Gmail filter moves all incoming mail out of the inbox, and a script sorts it.

Gscreener only reads the message headers it needs, including From, To, and Subject. It does not send your email anywhere.

The three Gscreener labels are normally hidden from the Gmail sidebar. Most of the time, you review pending senders from the dashboard, digest email, or Gmail side panel.

### Automatic approval from sent mail

Gscreener also checks your Sent folder.

When you email someone, their address is automatically added to your approved list. Their replies will not be screened.

### Daily digest

Once a day, sendDigest() sends you a list of the people waiting for review.

The digest buttons and dashboard are part of a private web app that only your Google account can access.

### Stored data

Your approved, rejected, and exemption lists are stored in Apps Script Properties inside your Google account.

Nothing leaves Google.

## Uninstall

Run `uninstall()` in the editor: it deletes the filter and triggers and releases everything in
`Gscreener/Pending` back to your inbox. Labels, rejected mail and your sender lists are kept;
delete them manually if you want a clean slate. Then remove the script's access at
[myaccount.google.com/connections](https://myaccount.google.com/connections).

## License

[MIT](LICENSE)
