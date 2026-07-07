// The Gmail side panel add-on: open any email and approve or reject its
// sender without leaving Gmail. With no email open, the add-on's home card
// lists everyone awaiting review. Enabled via Deploy > Test deployments >
// Install (see README).

// Contextual card — shown when a message is open.
function onGmailMessageOpen(e) {
  const message = Gmail.Users.Messages.get('me', e.gmail.messageId, {
    format: 'metadata',
    metadataHeaders: ['From'],
  });
  const from = headerValue(message, 'From') || '';
  return buildSenderCard(normalizeEmail(from));
}

// Home card — shown when the add-on is opened without a message.
function onAddOnHomepage() {
  const senders = pendingSenders();
  const builder = CardService.newCardBuilder().setHeader(
    CardService.newCardHeader()
      .setTitle('Gmail Screener')
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
    section.addWidget(verdictButtons(sender.email));
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

// One clean card per state: the sender's address first (so it's clear WHICH
// email the verdict applies to), then a single status line. After a verdict,
// the change-it link sits on the same line; buttons appear only while a
// verdict is still pending. No card header — that avoids the divider line.
function buildSenderCard(email) {
  const verdict = getVerdict(email);
  const exemption = verdict ? null : exemptionMatch(email, '');
  const section = CardService.newCardSection();
  section.addWidget(CardService.newTextParagraph().setText('<b>' + escapeHtml(email) + '</b>'));

  if (verdict === VERDICT.approved) {
    section.addWidget(statusParagraph('<b>This email is approved 👍</b>.'));
  } else if (verdict === VERDICT.rejected) {
    section.addWidget(statusParagraph('<b>This email is rejected 👎</b>.'));
  } else if (exemption) {
    section.addWidget(statusParagraph('<b>Delivered via exemption (' + exemption + ') ✨</b>.'));
  } else {
    section.addWidget(CardService.newTextParagraph().setText('⏳ Awaiting your verdict'));
    section.addWidget(verdictButtons(email));
  }

  return CardService.newCardBuilder().addSection(section).build();
}

function statusParagraph(statusHtml) {
  const url = webAppUrl();
  const suffix = url ? ' If you want to change it, <a href="' + url + '">click here</a>' : '';
  return CardService.newTextParagraph().setText(statusHtml + suffix);
}

function verdictButtons(email) {
  return CardService.newButtonSet()
    .addButton(
      CardService.newTextButton()
        .setText('👍 Approve')
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setBackgroundColor('#1e8e3e')
        .setOnClickAction(
          CardService.newAction().setFunctionName('addonApprove').setParameters({ email: email })
        )
    )
    .addButton(
      CardService.newTextButton()
        .setText('👎 Reject')
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setBackgroundColor('#d93025')
        .setOnClickAction(
          CardService.newAction().setFunctionName('addonReject').setParameters({ email: email })
        )
    );
}

function addonApprove(e) {
  const email = e.parameters.email;
  const released = approveSender(email);
  return addonActionResponse(email, '👍 Approved — released ' + released + ' held email(s).');
}

function addonReject(e) {
  const email = e.parameters.email;
  const moved = rejectSender(email);
  return addonActionResponse(email, '👎 Rejected — moved ' + moved + ' email(s) out of screening.');
}

function addonActionResponse(email, toast) {
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText(toast))
    .setNavigation(CardService.newNavigation().updateCard(buildSenderCard(email)))
    .build();
}
