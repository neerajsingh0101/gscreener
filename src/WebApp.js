// The screening dashboard, served as a private Apps Script web app
// (Execute as me / Only myself). The digest's approve/reject buttons land
// here too, and the Exemptions section is managed from this page.

function doGet(e) {
  // While actually serving the web app, getUrl() is trustworthy — remember
  // the real dashboard URL for the digest and side-panel links.
  try {
    const servedUrl = ScriptApp.getService().getUrl();
    if (servedUrl) setConfig('dashboardUrl', servedUrl);
  } catch (err) {
    // Non-fatal: links fall back to getUrl() until a dashboard visit succeeds.
  }

  const params = (e && e.parameter) || {};
  let notice = '';

  if (params.action === 'add-exemption' && params.value) {
    notice = handleAddExemption(params.type, params.value);
  } else if (params.action === 'remove-exemption' && params.type && params.value) {
    if (EXEMPTION_TYPES.indexOf(params.type) !== -1) {
      removeExemption(params.type, params.value);
      notice = 'Removed "' + params.value + '" from exempted ' + params.type + '.';
    }
  } else if (params.action && params.sender) {
    const sender = normalizeEmail(params.sender);
    if (params.action === 'approve') {
      const released = approveSender(sender);
      notice = 'Approved ' + sender + ' — released ' + released + ' held email(s) to your inbox.';
    } else if (params.action === 'reject') {
      const moved = rejectSender(sender);
      notice = 'Rejected ' + sender + ' — moved ' + moved + ' email(s) to ' + LABELS.rejected + '.';
    } else if (params.action === 'clear') {
      clearVerdict(sender);
      notice = 'Cleared verdict for ' + sender + '. Their next email will be screened again.';
    }
  }

  return HtmlService.createHtmlOutput(renderDashboard(notice)).setTitle('Gmail Screener');
}

function handleAddExemption(type, rawValue) {
  if (EXEMPTION_TYPES.indexOf(type) === -1) return 'Unknown exemption type.';

  let value = String(rawValue).trim();
  if (type === 'domains') {
    value = normalizeDomain(value);
    if (value.indexOf('@') !== -1) {
      // A full address typed into the domain box — file it where it belongs.
      type = 'emails';
      value = normalizeEmail(value);
    }
  } else if (type === 'emails') {
    value = normalizeEmail(value);
    if (value.indexOf('@') === -1) {
      return '"' + value + '" is not an email address — did you mean the domains list?';
    }
  } else {
    // HTML form GETs encode spaces as '+', and Apps Script hands the '+'
    // through undecoded. Keywords never legitimately contain one, so map it
    // back to the space the user typed.
    value = value.replace(/\+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  if (value.length < 2) return 'That value is too short.';

  addExemption(type, value);
  const released = rescreenPending();
  return (
    'Added "' + value + '" to exempted ' + type +
    (released ? ' — released ' + released + ' held email(s) to your inbox.' : '.')
  );
}

function renderDashboard(notice) {
  const url = webAppUrl();
  const senders = pendingSenders();
  const verdicts = allVerdicts();

  const pendingRows = senders
    .map(function (sender) {
      return (
        '<tr>' +
        '<td><a class="sender" target="_blank" rel="noopener" href="' + gmailSearchUrl(sender.email) + '">' +
        '<strong>' + escapeHtml(sender.name) + '</strong></a><br>' +
        '<span class="muted">' + escapeHtml(sender.email) + ' &middot; ' + sender.count + ' held &middot; ' +
        escapeHtml(sender.latestSubject) + '</span></td>' +
        '<td class="actions">' +
        '<a class="btn approve" href="' + actionUrl(url, 'approve', sender.email) + '">&#128077; Approve</a> ' +
        '<a class="btn reject" href="' + actionUrl(url, 'reject', sender.email) + '">&#128078; Reject</a>' +
        '</td>' +
        '</tr>'
      );
    })
    .join('');

  function verdictList(emails) {
    if (emails.length === 0) return '<li class="muted">none yet</li>';
    return emails
      .map(function (email) {
        return (
          '<li>' + escapeHtml(email) +
          ' <a class="undo" href="' + actionUrl(url, 'clear', email) + '">Delete</a></li>'
        );
      })
      .join('');
  }

  return (
    '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<style>' +
    'body{font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:720px;margin:24px auto;padding:0 16px;color:#202124}' +
    'h1{font-size:22px}h2{font-size:16px;margin-top:32px}h3{font-size:14px;margin:20px 0 6px}' +
    '.exemptions-title{font-size:21px}' +
    'table{border-collapse:collapse;width:100%}td{padding:10px 8px;border-bottom:1px solid #eee;vertical-align:top}' +
    '.muted{color:#5f6368;font-size:13px}' +
    '.actions{white-space:nowrap;text-align:right}' +
    '.btn{display:inline-block;padding:6px 14px;border-radius:6px;text-decoration:none;color:#fff;font-size:13px}' +
    '.approve{background:#1e8e3e}.reject{background:#d93025}' +
    '.notice{background:#e6f4ea;border:1px solid #1e8e3e;border-radius:6px;padding:10px 14px;margin:16px 0}' +
    '.sender{color:#202124;text-decoration:none}.sender:hover strong{text-decoration:underline}' +
    'ul{padding-left:20px}li{margin:4px 0}' +
    '.undo{color:#5f6368;font-size:12px;margin-left:6px}' +
    '.chips{margin:4px 0 8px}' +
    '.chip{display:inline-block;border:1px solid #dadce0;border-radius:16px;padding:4px 10px;margin:3px 3px 3px 0;font-size:13px;background:#fff}' +
    '.chip a{color:#5f6368;text-decoration:none;margin-left:6px}' +
    '.add input[type=text]{padding:6px 10px;border:1px solid #dadce0;border-radius:6px;font-size:13px;width:220px}' +
    '.add button{padding:6px 14px;border:0;border-radius:6px;background:#1a73e8;color:#fff;font-size:13px;cursor:pointer}' +
    '</style></head><body>' +
    '<h1>Gmail Screener</h1>' +
    (notice ? '<div class="notice">' + escapeHtml(notice) + '</div>' : '') +
    '<h2>Awaiting review (' + senders.length + ')</h2>' +
    (senders.length === 0
      ? '<p class="muted">Nothing pending. Enjoy the quiet inbox.</p>'
      : '<p class="muted">Click a sender&#39;s name to read their held mail in Gmail.</p>' +
        '<table>' + pendingRows + '</table>') +
    '<h2 class="exemptions-title">Exemptions</h2>' +
    '<p class="muted">Not all emails are equal. You may have priority clients whose emails should ' +
    'not be screened. You can add their domains to “Exempted domains”.</p>' +
    '<p class="muted">Similarly, emails containing OTPs are time-sensitive and should not be ' +
    'screened. You can use “Exempted keywords” to match these emails.</p>' +
    '<p class="muted">Please note that an exemption can allow an email to be delivered, but it ' +
    'does not approve the sender. If you have explicitly rejected a sender, that rejection still ' +
    'takes priority. In that case, the email will not be delivered even if its subject contains ' +
    'an exempted keyword or it comes from an exempted domain.</p>' +
    exemptionBlock(url, 'domains', 'Exempted domains', 'Any email address from these domains will not be held for screening and will be delivered to your inbox. Matching is case-insensitive.', 'github.com') +
    exemptionBlock(url, 'emails', 'Exempted email addresses', 'Emails from these specific email addresses will not be held for screening and will be delivered to your inbox. Matching is case-insensitive.', 'noreply@stripe.com') +
    exemptionBlock(url, 'keywords', 'Exempted keywords', 'Emails with subjects containing any of these keywords will skip screening and be delivered directly to your inbox. Keyword matching is case-insensitive.', 'login code') +
    '<h2>Approved senders (' + verdicts.approved.length + ')</h2>' +
    '<ul>' + verdictList(verdicts.approved) + '</ul>' +
    '<h2>Rejected senders (' + verdicts.rejected.length + ')</h2>' +
    '<ul>' + verdictList(verdicts.rejected) + '</ul>' +
    '</body></html>'
  );
}

function exemptionBlock(url, type, title, hint, placeholder) {
  const values = getExemptions(type);
  const chips = values
    .map(function (value) {
      return (
        '<span class="chip">' + escapeHtml(value) +
        '<a href="' + exemptionUrl(url, 'remove-exemption', type, value) + '" title="Remove">&times;</a>' +
        '</span>'
      );
    })
    .join('');

  return (
    '<h3>' + title + '</h3>' +
    '<p class="muted">' + hint + '</p>' +
    '<div class="chips">' + chips + '</div>' +
    '<form class="add" method="get" action="' + url + '">' +
    '<input type="hidden" name="action" value="add-exemption">' +
    '<input type="hidden" name="type" value="' + type + '">' +
    '<input type="text" name="value" placeholder="' + escapeHtml(placeholder) + '" required> ' +
    '<button type="submit">Add</button>' +
    '</form>'
  );
}

function exemptionUrl(base, action, type, value) {
  return base + '?action=' + action + '&type=' + type + '&value=' + encodeURIComponent(value);
}

function gmailSearchUrl(email) {
  return 'https://mail.google.com/mail/u/0/#search/' + encodeURIComponent('from:' + email);
}
