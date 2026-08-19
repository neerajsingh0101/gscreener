// The Gmail side panel add-on: open any email and approve or reject everyone
// who has written in it, without leaving Gmail. With no email open, the
// add-on's home card lists everyone awaiting review. Once the email you are on
// has nothing left to decide, the panel hands you the next held email, so a
// backlog can be cleared in one sitting. Enabled via
// Deploy > Test deployments > Install (see README).

// How many people a thread card lists before it stops. Undecided senders are
// listed first, so anything dropped is already approved or rejected.
const THREAD_SENDER_LIMIT = 15;

// Contextual card — shown when a message is open.
//
// Screening is per sender, but a thread can carry mail from several of them:
// one writer may be approved while another still has mail held. Gmail hands
// this trigger a single message, so a card built from that message alone
// showed one verdict and hid everyone else — leaving no way to approve the
// person whose mail was actually stuck. Cover the whole thread instead.
function onGmailMessageOpen(e) {
  const senders = threadSenders(e.gmail.threadId);
  if (senders.length > 1) return buildThreadCard(senders, e.gmail.threadId);
  return buildSenderCard(senders[0] || openMessageSender(e.gmail.messageId), e.gmail.threadId);
}

// Everyone who has written in this thread, most recent writer first. Your own
// address is left out — setup() approves it, so there is nothing to decide.
// Returns an empty list if the thread can't be read.
function threadSenders(threadId) {
  if (!threadId) return [];

  let messages;
  try {
    messages = Gmail.Users.Threads.get('me', threadId, {
      format: 'metadata',
      metadataHeaders: ['From'],
    }).messages || [];
  } catch (err) {
    return []; // e.g. the thread moved or was deleted while the panel was open
  }

  const self = normalizeEmail(getConfig('selfEmail') || '');
  const seen = {};
  const senders = [];
  // Newest first, so the message you are most likely reading is at the top.
  messages.slice().reverse().forEach(function (message) {
    const from = headerValue(message, 'From');
    if (!from) return;
    const email = normalizeEmail(from);
    if (email === self || seen[email]) return;
    seen[email] = true;
    senders.push(email);
  });
  return senders;
}

function openMessageSender(messageId) {
  const message = Gmail.Users.Messages.get('me', messageId, {
    format: 'metadata',
    metadataHeaders: ['From'],
  });
  return normalizeEmail(headerValue(message, 'From') || '');
}

// Home card — shown when the add-on is opened without a message.
function onAddOnHomepage() {
  const senders = pendingSenders();
  const builder = CardService.newCardBuilder().setHeader(
    CardService.newCardHeader()
      .setTitle('Gscreener')
      .setSubtitle(senders.length + ' awaiting review')
  );

  const section = CardService.newCardSection();
  if (senders.length === 0) {
    section.addWidget(
      CardService.newTextParagraph().setText('Nothing pending. Enjoy the quiet inbox.')
    );
  }
  senders.slice(0, 25).forEach(function (sender) {
    section.addWidget(
      CardService.newDecoratedText()
        .setTopLabel(sender.email)
        .setText(sender.name)
        .setBottomLabel(sender.count + ' held · ' + sender.latestSubject)
        .setWrapText(true)
    );
    section.addWidget(verdictButtons(sender.email, '', 'home'));
  });
  if (senders.length > 25) {
    section.addWidget(
      CardService.newTextParagraph().setText(
        '…and ' + (senders.length - 25) + ' more on the dashboard.'
      )
    );
  }

  return builder.addSection(section).build();
}

// Where an address stands right now, or null while the verdict is still yours
// to give. `label` names it in a thread row; `sentence` carries the
// single-sender card, where there is room to say it in full.
function senderStatus(email) {
  const verdict = getVerdict(email);
  if (verdict === VERDICT.approved) {
    return { label: 'Approved', sentence: 'This email is approved.' };
  }
  if (verdict === VERDICT.rejected) {
    return { label: 'Rejected', sentence: 'This email is rejected.' };
  }
  const exemption = exemptionMatch(email, '');
  if (!exemption) return null;
  return {
    label: 'Delivered via exemption (' + exemption + ')',
    sentence: 'Delivered via exemption (' + exemption + ').',
  };
}

// One clean card per state: the sender's address first (so it's clear WHICH
// email the verdict applies to), then a single status line. After a verdict,
// the change-it link sits on the same line; buttons appear only while a
// verdict is still pending. No card header — that avoids the divider line.
function buildSenderCard(email, threadId) {
  const status = senderStatus(email);
  const section = CardService.newCardSection();
  section.addWidget(CardService.newTextParagraph().setText('<b>' + escapeHtml(email) + '</b>'));

  if (status) {
    section.addWidget(statusParagraph('<b>' + status.sentence + '</b>'));
  } else {
    // No status line needed — the Approve/Reject buttons say it themselves.
    section.addWidget(verdictButtons(email, threadId));
    const link = dashboardLink();
    if (link) section.addWidget(link);
  }

  return CardService.newCardBuilder().addSection(section).build();
}

// Several people have written in this thread, and each is screened
// separately. One row per person, whoever still needs a verdict first — those
// are the only rows with anything to do. Deciding one refreshes the card in
// place, so the rest stay on screen and can be worked through in a row.
function buildThreadCard(senders, threadId) {
  const rows = senders.map(function (email) {
    return { email: email, status: senderStatus(email) };
  });
  const undecided = rows.filter(function (row) { return !row.status; });
  const decided = rows.filter(function (row) { return row.status; });

  const section = CardService.newCardSection();
  undecided.concat(decided).slice(0, THREAD_SENDER_LIMIT).forEach(function (row) {
    section.addWidget(
      CardService.newDecoratedText()
        .setText('<b>' + escapeHtml(row.email) + '</b>')
        .setBottomLabel(row.status ? row.status.label : 'Awaiting your verdict')
        .setWrapText(true)
    );
    if (!row.status) section.addWidget(verdictButtons(row.email, threadId));
  });

  if (rows.length > THREAD_SENDER_LIMIT) {
    section.addWidget(
      CardService.newTextParagraph().setText(
        '…and ' + (rows.length - THREAD_SENDER_LIMIT) + ' more, already decided.'
      )
    );
  }

  const link = dashboardLink();
  if (link) section.addWidget(link);

  return CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('Gscreener')
        .setSubtitle(
          rows.length + ' senders · ' +
          (undecided.length ? undecided.length + ' awaiting review' : 'all decided')
        )
    )
    .addSection(section)
    .build();
}

// The queue card: the next held email, shown once the conversation you were
// on has nothing left to decide. Deciding here pulls up the one after it, so
// the whole backlog can be worked through from the panel — Gmail gives an
// add-on no way to open a thread itself, hence the link to go read it.
function buildNextCard(next) {
  const section = CardService.newCardSection();

  if (!next) {
    section.addWidget(
      CardService.newTextParagraph().setText('Nothing left to review. Enjoy the quiet inbox.')
    );
    return queueCard(section, 'All caught up');
  }

  const row = CardService.newDecoratedText()
    .setText('<b>' + escapeHtml(next.email) + '</b>')
    .setBottomLabel(next.subject)
    .setWrapText(true);
  if (next.name !== next.email) row.setTopLabel(next.name);
  section.addWidget(row);
  section.addWidget(verdictButtons(next.email, next.threadId, 'next'));
  section.addWidget(
    CardService.newTextButton()
      .setText('Open this email')
      .setOpenLink(CardService.newOpenLink().setUrl(gmailThreadUrl(next.threadId)))
  );

  const link = dashboardLink();
  if (link) section.addWidget(link);

  return queueCard(section, 'Next email awaiting review');
}

function queueCard(section, subtitle) {
  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('Gscreener').setSubtitle(subtitle))
    .addSection(section)
    .build();
}

// Held mail is archived under the pending label, so the thread is opened from
// All Mail rather than the inbox.
function gmailThreadUrl(threadId) {
  return 'https://mail.google.com/mail/u/0/#all/' + threadId;
}

// Secondary link — e.g. to approve a sender's whole domain. The leading <br>
// keeps it off the buttons. (Gmail forces link color.)
function dashboardLink() {
  const url = webAppUrl();
  if (!url) return null;
  return CardService.newTextParagraph().setText(
    '<br><a href="' + url + '">Click here</a>' +
    '<font color="#5f6368"> to visit Gscreener dashboard.</font>'
  );
}

function statusParagraph(statusHtml) {
  const url = webAppUrl();
  const suffix = url ? ' If you want to change it, <a href="' + url + '">click here</a>.' : '';
  return CardService.newTextParagraph().setText(statusHtml + suffix);
}

// The thread id rides along so the refreshed card can be rebuilt from the
// whole conversation. It is empty for the home card, which has no thread.
// `source` names the card these buttons sit on, which decides where the next
// card comes from — see addonNextCard.
function verdictButtons(email, threadId, source) {
  const parameters = { email: email, threadId: threadId || '', source: source || 'thread' };
  return CardService.newButtonSet()
    .addButton(
      CardService.newTextButton()
        .setText('👍 Approve')
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setBackgroundColor('#1e8e3e')
        .setOnClickAction(
          CardService.newAction().setFunctionName('addonApprove').setParameters(parameters)
        )
    )
    .addButton(
      CardService.newTextButton()
        .setText('👎 Reject')
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setBackgroundColor('#d93025')
        .setOnClickAction(
          CardService.newAction().setFunctionName('addonReject').setParameters(parameters)
        )
    );
}

function addonApprove(e) {
  approveSender(e.parameters.email);
  return addonActionResponse(e.parameters, VERDICT.approved);
}

function addonReject(e) {
  rejectSender(e.parameters.email);
  return addonActionResponse(e.parameters, VERDICT.rejected);
}

// A toast confirms the verdict just given, which frees the card itself to move
// on to the next decision instead of restating one already made.
function addonActionResponse(parameters, verdict) {
  const email = normalizeEmail(parameters.email);
  return CardService.newActionResponseBuilder()
    .setNotification(
      CardService.newNotification().setText(
        (verdict === VERDICT.approved ? 'Approved ' : 'Rejected ') + email
      )
    )
    .setNavigation(CardService.newNavigation().updateCard(addonNextCard(parameters, email)))
    .build();
}

// Where the panel goes after a verdict. Whatever still needs deciding closest
// to hand wins:
//
//   home   — the home card already IS the queue, so redraw it: the sender just
//            decided drops off and the rest stay where they were.
//   thread — someone else in this conversation is still waiting, so finish the
//            thread before leaving it.
//   else   — nothing left to decide here, so pull up the next held email.
function addonNextCard(parameters, decided) {
  if (parameters.source === 'home') return onAddOnHomepage();

  if (parameters.source !== 'next') {
    const senders = threadSenders(parameters.threadId);
    const stillWaiting = senders.some(function (email) {
      return !senderStatus(email);
    });
    if (stillWaiting) {
      return senders.length > 1
        ? buildThreadCard(senders, parameters.threadId)
        : buildSenderCard(senders[0], parameters.threadId);
    }
  }

  return buildNextCard(nextPendingEmail([decided]));
}
