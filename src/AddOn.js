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

// One clean card per state: after a verdict the card shows only the bold
// status headline and a link to the dashboard listing where it can be
// changed. Buttons appear only while a verdict is still pending.
function buildSenderCard(email) {
  const verdict = getVerdict(email);
  const exemption = verdict ? null : exemptionMatch(email, '');
  const section = CardService.newCardSection();
  let title;

  if (verdict === VERDICT.approved) {
    title = '👍 This email is approved';
    section.addWidget(changeLinkParagraph());
  } else if (verdict === VERDICT.rejected) {
    title = '👎 This email is rejected';
    section.addWidget(changeLinkParagraph());
  } else if (exemption) {
    title = '✨ Delivered via exemption (' + exemption + ')';
    section.addWidget(changeLinkParagraph());
  } else {
    title = '⏳ Awaiting your verdict';
    section.addWidget(verdictButtons(email));
  }

  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle(title))
    .addSection(section)
    .build();
}

function changeLinkParagraph() {
  const url = webAppUrl();
  const text = url
    ? 'If you want to change it, <a href="' + url + '">click here</a>.'
    : 'You can change this on the dashboard (deploy the web app to enable the link).';
  return CardService.newTextParagraph().setText(text);
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
