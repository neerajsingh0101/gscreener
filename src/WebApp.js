// The screening dashboard, served as a private Apps Script web app
// (Execute as me / Only myself). The digest's approve/reject buttons land
// here too, and the Exemptions section is managed from this page.
//
// Visual design follows the "Gscreener Dashboard" Claude Design project:
// Public Sans, warm off-white page, white cards, terracotta accent.

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

  return HtmlService.createHtmlOutput(renderDashboard(notice)).setTitle('Gscreener Dashboard');
}

function handleAddExemption(type, rawValue) {
  if (EXEMPTION_TYPES.indexOf(type) === -1) return 'Unknown exemption type.';

  let value = String(rawValue).trim();
  if (type === 'domains') {
    value = normalizeDomain(value);
    if (value.indexOf('@') !== -1) {
      // A full address typed into the domain box — that's a sender approval.
      const email = normalizeEmail(value);
      const released = approveSender(email);
      return 'That is an email address, so ' + email + ' was added to approved senders' +
        (released ? ' — released ' + released + ' held email(s) to your inbox.' : '.');
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

  return (
    '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<link rel="preconnect" href="https://fonts.googleapis.com">' +
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    '<link href="https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,400;0,500;0,600;0,700&display=swap" rel="stylesheet">' +
    '<style>' + dashboardCss() + '</style>' +
    '</head><body><div class="page"><div class="column">' +
    '<header class="masthead"><h1>Gscreener Dashboard</h1>' +
    '<p class="tagline">Manage what reaches your inbox</p></header>' +
    (notice ? '<div class="notice">' + escapeHtml(notice) + '</div>' : '') +
    pendingCard(url, senders) +
    exemptionsCard(url) +
    sendersCard(url, 'Approved senders', verdicts.approved, true, '') +
    sendersCard(url, 'Rejected emails', verdicts.rejected, false,
      'Rejected emails are not deleted. They stay in your Gmail under the “' + LABELS.rejected +
      '” label — you can read them, and even reply to them.') +
    '</div></div></body></html>'
  );
}

function dashboardCss() {
  return (
    '*{box-sizing:border-box}' +
    'html,body{margin:0;padding:0}' +
    'body{font-family:"Public Sans",-apple-system,BlinkMacSystemFont,sans-serif;background:oklch(0.985 0.004 75);color:oklch(0.30 0.01 60);-webkit-font-smoothing:antialiased}' +
    'a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}' +
    '.page{min-height:100vh;padding:56px 24px 96px;display:flex;justify-content:center;--accent:#b25c43}' +
    '.column{width:100%;max-width:680px}' +
    '.masthead{margin-bottom:40px}' +
    '.masthead h1{font-size:22px;font-weight:700;letter-spacing:-0.02em;color:oklch(0.25 0.01 60);line-height:1.1;margin:0}' +
    '.tagline{font-size:14px;color:oklch(0.55 0.01 60);margin:4px 0 0}' +
    '.card{background:#fff;border:1px solid oklch(0.92 0.004 75);border-radius:14px;padding:24px;margin-bottom:20px;box-shadow:0 1px 2px rgba(30,25,20,0.04)}' +
    '.card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:16px}' +
    '.card-title{display:flex;align-items:center;gap:10px}' +
    '.card-title h2{font-size:17px;font-weight:700;letter-spacing:-0.01em;color:oklch(0.25 0.01 60);margin:0}' +
    '.count{font-size:12px;font-weight:600;color:oklch(0.55 0.01 60);background:oklch(0.94 0.004 75);border-radius:999px;padding:2px 9px}' +
    '.notice,.all-clear{display:flex;align-items:center;gap:12px;padding:14px 16px;background:oklch(0.975 0.006 155);border:1px solid oklch(0.92 0.02 155);border-radius:10px;font-size:14px;color:oklch(0.42 0.03 155)}' +
    '.notice{margin-bottom:20px}' +
    '.badge{width:30px;height:30px;border-radius:999px;background:oklch(0.72 0.11 150);display:flex;align-items:center;justify-content:center;flex-shrink:0}' +
    '.tick{width:12px;height:7px;border-left:2.5px solid #fff;border-bottom:2.5px solid #fff;transform:rotate(-45deg) translate(1px,-1px)}' +
    '.help{display:flex;flex-direction:column;gap:12px;font-size:13.5px;line-height:1.55;color:oklch(0.52 0.01 60);margin:12px 0 22px;padding:14px 16px;background:oklch(0.975 0.004 75);border-radius:10px}' +
    '.callout{padding-left:12px;border-left:3px solid oklch(0.85 0.04 40)}' +
    '.subsection{margin-top:20px}' +
    '.subsection h3{font-size:14px;font-weight:600;color:oklch(0.32 0.01 60);margin:0 0 4px}' +
    '.hint{font-size:12.5px;color:oklch(0.58 0.01 60);line-height:1.5;margin:0 0 12px}' +
    '.chips{display:flex;flex-wrap:wrap;gap:8px;align-items:center}' +
    '.chip{display:inline-flex;align-items:center;gap:7px;padding:6px 8px 6px 12px;background:oklch(0.97 0.005 75);border:1px solid oklch(0.90 0.004 75);border-radius:999px;font-size:13px;font-weight:500;color:oklch(0.34 0.01 60)}' +
    '.chip a{width:18px;height:18px;border-radius:999px;display:flex;align-items:center;justify-content:center;color:oklch(0.62 0.01 60);font-size:14px;line-height:1}' +
    '.chip a:hover{background:oklch(0.90 0.02 40);color:var(--accent);text-decoration:none}' +
    'details.adder{display:inline-block}' +
    'details.adder summary{list-style:none;display:inline-flex;align-items:center;padding:6px 13px;border:1px dashed oklch(0.82 0.02 40);border-radius:999px;font-size:13px;font-weight:600;color:var(--accent);cursor:pointer;user-select:none}' +
    'details.adder summary::-webkit-details-marker{display:none}' +
    'details.adder summary:hover{background:oklch(0.97 0.02 40);border-color:var(--accent)}' +
    'details.adder form{margin:10px 0 2px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}' +
    'details.adder-filled summary{border:none;background:var(--accent);color:#fff;border-radius:8px;padding:7px 14px;box-shadow:0 1px 2px rgba(178,92,67,0.25)}' +
    'details.adder-filled summary:hover{background:var(--accent);filter:brightness(1.06)}' +
    'input[type=text]{padding:8px 12px;border:1px solid oklch(0.90 0.004 75);border-radius:8px;font-size:13px;font-family:inherit;width:240px;max-width:100%;background:#fff;color:inherit}' +
    'input[type=text]:focus{outline:none;border-color:var(--accent)}' +
    '.btn{display:inline-flex;align-items:center;padding:7px 14px;border:none;border-radius:8px;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;color:#fff !important}' +
    'a.btn:hover{text-decoration:none}' +
    '.btn:hover{filter:brightness(1.06)}' +
    '.btn-accent{background:var(--accent);box-shadow:0 1px 2px rgba(178,92,67,0.25)}' +
    '.btn-approve{background:#1e8e3e}' +
    '.btn-reject{background:#d93025}' +
    '.list{max-height:420px;overflow-y:auto;margin:0 -8px;padding:0 8px}' +
    '.row{display:flex;align-items:center;gap:12px;padding:9px 8px;border-radius:9px}' +
    '.row:hover{background:oklch(0.975 0.004 75)}' +
    '.avatar{width:32px;height:32px;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;flex-shrink:0}' +
    '.row-main{display:inline-flex;align-items:baseline;gap:10px;min-width:0}' +
    '.row-main .email{font-size:14px;color:oklch(0.32 0.01 60);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.row-main .del{font-size:12.5px;font-weight:600;color:oklch(0.62 0.01 60);text-decoration:underline;text-underline-offset:2px;flex-shrink:0}' +
    '.row-main .del:hover{color:var(--accent)}' +
    '.p-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 8px;border-radius:9px}' +
    '.p-row:hover{background:oklch(0.975 0.004 75)}' +
    '.p-info{min-width:0}' +
    '.p-name{font-size:14px;font-weight:600;color:oklch(0.30 0.01 60)}' +
    '.p-name a{color:inherit}.p-name a:hover{color:var(--accent);text-decoration:none}' +
    '.p-meta{font-size:12.5px;color:oklch(0.58 0.01 60);line-height:1.5}' +
    '.p-actions{display:flex;gap:8px;flex-shrink:0}' +
    '.muted{color:oklch(0.58 0.01 60);font-size:13px}'
  );
}

function pendingCard(url, senders) {
  let body;
  if (senders.length === 0) {
    body =
      '<div class="all-clear"><div class="badge"><div class="tick"></div></div>' +
      '<span>Nothing pending. Enjoy the quiet inbox.</span></div>';
  } else {
    body =
      '<p class="hint">Click a sender&#39;s name to read their held mail in Gmail.</p>' +
      senders
        .map(function (sender) {
          return (
            '<div class="p-row"><div class="p-info">' +
            '<div class="p-name"><a target="_blank" rel="noopener" href="' + gmailSearchUrl(sender.email) + '">' +
            escapeHtml(sender.name) + '</a></div>' +
            '<div class="p-meta">' + escapeHtml(sender.email) + ' &middot; ' + sender.count + ' held &middot; ' +
            escapeHtml(sender.latestSubject) + '</div>' +
            '</div><div class="p-actions">' +
            '<a class="btn btn-approve" href="' + actionUrl(url, 'approve', sender.email) + '">👍 Approve</a>' +
            '<a class="btn btn-reject" href="' + actionUrl(url, 'reject', sender.email) + '">👎 Reject</a>' +
            '</div></div>'
          );
        })
        .join('');
  }

  return (
    '<div class="card"><div class="card-head"><div class="card-title">' +
    '<h2>Awaiting review</h2><span class="count">' + senders.length + '</span>' +
    '</div></div>' + body + '</div>'
  );
}

function exemptionsCard(url) {
  return (
    '<div class="card"><div class="card-title"><h2>Exemptions</h2></div>' +
    '<div class="help">' +
    '<div>Not all emails are equal. You may have priority clients whose emails should not be ' +
    'screened. You can add their domains to “Exempted domains”.</div>' +
    '<div>Similarly, emails containing OTPs are time-sensitive and should not be screened. ' +
    'You can use “Exempted keywords” to match these emails.</div>' +
    '<div class="callout">Please note that an exemption can allow an email to be delivered, but it ' +
    'does not approve the sender. If you have explicitly rejected a sender, that rejection still ' +
    'takes priority. In that case, the email will not be delivered even if its subject contains ' +
    'an exempted keyword or it comes from an exempted domain.</div>' +
    '</div>' +
    exemptionBlock(url, 'domains', 'Exempted domains', 'Any email address from these domains will not be held for screening and will be delivered to your inbox. Matching is case-insensitive.') +
    exemptionBlock(url, 'keywords', 'Exempted keywords', 'Emails with subjects containing any of these keywords will skip screening and be delivered directly to your inbox. Keyword matching is case-insensitive.') +
    '</div>'
  );
}

function exemptionBlock(url, type, title, hint) {
  const chips = getExemptions(type)
    .map(function (value) {
      return (
        '<span class="chip">' + escapeHtml(value) +
        '<a href="' + exemptionUrl(url, 'remove-exemption', type, value) + '" title="Remove">&times;</a>' +
        '</span>'
      );
    })
    .join('');

  return (
    '<div class="subsection"><h3>' + title + '</h3>' +
    '<p class="hint">' + hint + '</p>' +
    '<div class="chips">' + chips +
    '<details class="adder"><summary>Add</summary>' +
    '<form method="get" action="' + url + '">' +
    '<input type="hidden" name="action" value="add-exemption">' +
    '<input type="hidden" name="type" value="' + type + '">' +
    '<input type="text" name="value" required> ' +
    '<button type="submit" class="btn btn-accent">Add</button>' +
    '</form></details>' +
    '</div></div>'
  );
}

// Approved and rejected sender lists share one card layout; only the
// approved card carries the Add control.
function sendersCard(url, title, emails, withAdder, hint) {
  const rows =
    emails.length === 0
      ? '<p class="muted">none yet</p>'
      : emails
          .map(function (email, index) {
            return (
              '<div class="row">' + avatarHtml(email, index) +
              '<div class="row-main"><span class="email">' + escapeHtml(email) + '</span>' +
              '<a class="del" href="' + actionUrl(url, 'clear', email) + '">Delete</a>' +
              '</div></div>'
            );
          })
          .join('');

  const adder = withAdder
    ? '<details class="adder adder-filled"><summary>Add</summary>' +
      '<form method="get" action="' + url + '">' +
      '<input type="hidden" name="action" value="approve">' +
      '<input type="text" name="sender" required> ' +
      '<button type="submit" class="btn btn-accent">Approve</button>' +
      '</form></details>'
    : '';

  return (
    '<div class="card"><div class="card-head"><div class="card-title">' +
    '<h2>' + title + '</h2><span class="count">' + emails.length + '</span>' +
    '</div>' + adder + '</div>' +
    (hint ? '<p class="hint">' + hint + '</p>' : '') +
    '<div class="list">' + rows + '</div></div>'
  );
}

// Pastel avatar with the sender's initial, cycling the design palette.
function avatarHtml(email, index) {
  const palette = [
    ['oklch(0.93 0.045 40)', 'oklch(0.46 0.09 40)'],
    ['oklch(0.93 0.04 95)', 'oklch(0.46 0.07 95)'],
    ['oklch(0.93 0.038 155)', 'oklch(0.44 0.07 155)'],
    ['oklch(0.93 0.038 255)', 'oklch(0.46 0.07 255)'],
    ['oklch(0.93 0.04 330)', 'oklch(0.46 0.07 330)'],
  ];
  const colors = palette[index % palette.length];
  const initial = (String(email).charAt(0) || '?').toUpperCase();
  return (
    '<div class="avatar" style="background:' + colors[0] + ';color:' + colors[1] + '">' +
    escapeHtml(initial) + '</div>'
  );
}

function actionUrl(base, action, email) {
  return base + '?action=' + action + '&sender=' + encodeURIComponent(email);
}

function exemptionUrl(base, action, type, value) {
  return base + '?action=' + action + '&type=' + type + '&value=' + encodeURIComponent(value);
}

function gmailSearchUrl(email) {
  return 'https://mail.google.com/mail/u/0/#search/' + encodeURIComponent('from:' + email);
}
