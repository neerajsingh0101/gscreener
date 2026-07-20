// The daily digest: one email listing senders awaiting review, with
// one-click approve/reject buttons. Skipped entirely on days with nothing
// pending.

function sendDigest() {
  const senders = pendingSenders();
  if (senders.length === 0) return;

  const url = webAppUrl();
  const intro = url
    ? 'Review new senders below, or open the <a href="' + url + '">screening dashboard</a>.'
    : 'Deploy the web app (Deploy &gt; New deployment &gt; Web app) to get one-click buttons here. ' +
      "Until then, run approveSender('email') or rejectSender('email') in the script editor.";

  const rows = senders
    .map(function (sender) {
      return digestRow(sender, url);
    })
    .join('');

  const html =
    '<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:680px">' +
    '<h2 style="margin:0 0 4px">Gscreener</h2>' +
    '<p style="margin:0 0 16px;color:#555">' + intro + '</p>' +
    '<table cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%">' + rows + '</table>' +
    '<p style="margin:16px 0 0;color:#888;font-size:12px">Held mail stays under ' + escapeHtml(LABELS.pending) +
    ' — nothing is ever deleted.</p>' +
    '</div>';

  const subject =
    'Gscreener Digest: ' + senders.length + (senders.length === 1 ? ' sender' : ' senders') + ' awaiting review';
  const messageId = sendHtmlEmail(getConfig('selfEmail'), subject, html);

  // Belt and suspenders: the catch-all filter now excludes your own mail
  // (-from:me), so the digest already lands in your inbox untriaged. Re-assert
  // INBOX anyway so the digest still arrives on installs not yet migrated off
  // the older bare "larger:1" filter.
  Gmail.Users.Messages.modify(
    { addLabelIds: ['INBOX'], removeLabelIds: [getConfig('labelTriage')] },
    'me',
    messageId
  );
}

function digestRow(sender, url) {
  const buttonStyle =
    'display:inline-block;padding:6px 14px;border-radius:6px;text-decoration:none;color:#fff;font-size:13px;';
  const actions = url
    ? '<a href="' + actionUrl(url, 'approve', sender.email) + '" style="' + buttonStyle + 'background:#1e8e3e">&#128077; Approve</a>' +
      '&nbsp;<a href="' + actionUrl(url, 'reject', sender.email) + '" style="' + buttonStyle + 'background:#d93025">&#128078; Reject</a>'
    : '';

  return (
    '<tr style="border-bottom:1px solid #eee">' +
    '<td style="vertical-align:top">' +
    '<strong>' + escapeHtml(sender.name) + '</strong> &lt;' + escapeHtml(sender.email) + '&gt;<br>' +
    '<span style="color:#666;font-size:13px">' + sender.count + ' held &middot; latest: ' +
    escapeHtml(sender.latestSubject) + '</span>' +
    '</td>' +
    '<td style="white-space:nowrap;text-align:right;vertical-align:top">' + actions + '</td>' +
    '</tr>'
  );
}

function actionUrl(base, action, email) {
  return base + '?action=' + action + '&sender=' + encodeURIComponent(email);
}
