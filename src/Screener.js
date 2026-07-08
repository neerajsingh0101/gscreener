// The screening loop (runs every POLL_MINUTES) and verdict actions.

function screenNewMail() {
  const triageId = getConfig('labelTriage');
  if (!triageId) throw new Error('Gscreener: run setup() first.');

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(0)) return; // a previous run is still working through a backlog

  try {
    autoApproveSentRecipients();
    triageNewMessages(triageId);
  } finally {
    lock.releaseLock();
  }
}

function triageNewMessages(triageId) {
  const ids = listMessageIds({ labelIds: [triageId] });
  if (ids.length === 0) return;

  const deliver = [];
  const hold = [];
  const reject = [];

  ids.forEach(function (id) {
    const message = Gmail.Users.Messages.get('me', id, {
      format: 'metadata',
      metadataHeaders: ['From', 'Subject'],
    });
    const from = headerValue(message, 'From');
    const email = from ? normalizeEmail(from) : null;
    const verdict = email ? getVerdict(email) : null;
    if (verdict === VERDICT.approved) deliver.push(id);
    else if (verdict === VERDICT.rejected) reject.push(id);
    else if (email && exemptionMatch(email, headerValue(message, 'Subject'))) deliver.push(id);
    else hold.push(id);
  });

  deliverToInbox(deliver, [triageId]);
  batchMove(hold, [getConfig('labelPending')], [triageId]);
  batchMove(reject, [getConfig('labelRejected')], [triageId]);
}

// Anyone you write to is someone you know: recipients of your outgoing mail
// are approved automatically (unless you already rejected them explicitly).
function autoApproveSentRecipients() {
  const since = Number(getConfig('lastSentScan') || 0);
  const now = Math.floor(Date.now() / 1000);
  // 5-minute overlap so a message on the boundary is never missed; verdict
  // writes are idempotent so scanning a message twice is harmless.
  const ids = listMessageIds({
    labelIds: ['SENT'],
    q: 'in:sent after:' + Math.max(0, since - 300),
  });

  ids.forEach(function (id) {
    const message = Gmail.Users.Messages.get('me', id, {
      format: 'metadata',
      metadataHeaders: ['To', 'Cc', 'Bcc'],
    });
    ['To', 'Cc', 'Bcc'].forEach(function (name) {
      const value = headerValue(message, name);
      if (!value) return;
      extractAddresses(value).forEach(function (email) {
        if (!getVerdict(email)) setVerdict(email, VERDICT.approved);
      });
    });
  });

  setConfig('lastSentScan', String(now));
}

// Thumbs up: deliver this sender from now on, and release their held mail.
// Callable from the web app or directly from the script editor.
function approveSender(email) {
  email = normalizeEmail(email);
  setVerdict(email, VERDICT.approved);
  const held = listMessageIds({
    labelIds: [getConfig('labelPending')],
    q: 'from:' + email,
  });
  deliverToInbox(held, [getConfig('labelPending')]);
  return held.length;
}

// Thumbs down: never deliver this sender again. Their held mail — and any
// future mail — goes to the rejected label. Nothing is deleted.
function rejectSender(email) {
  email = normalizeEmail(email);
  setVerdict(email, VERDICT.rejected);
  const held = listMessageIds({
    labelIds: [getConfig('labelPending')],
    q: 'from:' + email,
  });
  batchMove(held, [getConfig('labelRejected')], [getConfig('labelPending'), 'INBOX']);
  return held.length;
}

// Re-checks all held mail against the exemption lists and delivers whatever
// now matches. Called after an exemption is added, so exemptions apply
// retroactively to mail already waiting in the pending label.
function rescreenPending() {
  const pendingId = getConfig('labelPending');
  const release = [];

  listMessageIds({ labelIds: [pendingId] }).forEach(function (id) {
    const message = Gmail.Users.Messages.get('me', id, {
      format: 'metadata',
      metadataHeaders: ['From', 'Subject'],
    });
    const from = headerValue(message, 'From');
    if (!from) return;
    if (exemptionMatch(normalizeEmail(from), headerValue(message, 'Subject'))) {
      release.push(id);
    }
  });

  deliverToInbox(release, [pendingId]);
  return release.length;
}

// --- Playing nicely with the user's own filters -----------------------------
// Gmail runs filters exactly once, at delivery, and offers no way to re-run
// them later. The user's filters DID run (their labels are applied normally),
// but any "Skip Inbox" action they took is invisible to us — the catch-all
// screener filter also removed INBOX. So before delivering mail to the inbox,
// re-check the user's own skip-inbox filters and leave matching mail archived
// instead of forcing it into the inbox.
function deliverToInbox(ids, removeLabelIds) {
  if (ids.length === 0) return;
  const skipQueries = userSkipInboxQueries();
  if (skipQueries.length === 0) {
    batchMove(ids, ['INBOX'], removeLabelIds);
    return;
  }

  const toInbox = [];
  const stayArchived = [];
  ids.forEach(function (id) {
    (matchesAnyFilter(id, skipQueries) ? stayArchived : toInbox).push(id);
  });
  batchMove(toInbox, ['INBOX'], removeLabelIds);
  batchMove(stayArchived, [], removeLabelIds);
}

// Search queries equivalent to the user's own skip-inbox filters. The
// screener's catch-all filter (the one that applies the triage label) is
// excluded.
function userSkipInboxQueries() {
  const triageId = getConfig('labelTriage');
  const queries = [];
  (Gmail.Users.Settings.Filters.list('me').filter || []).forEach(function (f) {
    const action = f.action || {};
    if ((action.addLabelIds || []).indexOf(triageId) !== -1) return;
    if ((action.removeLabelIds || []).indexOf('INBOX') === -1) return;
    const query = filterCriteriaQuery(f.criteria || {});
    if (query) queries.push(query);
  });
  return queries;
}

function filterCriteriaQuery(criteria) {
  const parts = [];
  if (criteria.from) parts.push('from:(' + criteria.from + ')');
  if (criteria.to) parts.push('to:(' + criteria.to + ')');
  if (criteria.subject) parts.push('subject:(' + criteria.subject + ')');
  if (criteria.query) parts.push('(' + criteria.query + ')');
  if (criteria.negatedQuery) parts.push('-(' + criteria.negatedQuery + ')');
  if (criteria.hasAttachment) parts.push('has:attachment');
  return parts.join(' ');
}

// Does this message match any of the given filter queries? Evaluated by
// Gmail's own search engine via rfc822msgid:, so operator semantics are
// exactly Gmail's.
function matchesAnyFilter(messageId, queries) {
  const message = Gmail.Users.Messages.get('me', messageId, {
    format: 'metadata',
    metadataHeaders: ['Message-ID'],
  });
  const rfcId = String(headerValue(message, 'Message-ID') || '').replace(/[<>]/g, '');
  if (!rfcId) return false;
  return queries.some(function (query) {
    const result = Gmail.Users.Messages.list('me', {
      q: 'rfc822msgid:' + rfcId + ' ' + query,
      maxResults: 1,
    });
    return (result.messages || []).length > 0;
  });
}

// Senders currently awaiting a verdict, newest activity first.
function pendingSenders() {
  const ids = listMessageIds({ labelIds: [getConfig('labelPending')] });
  const senders = {};

  ids.forEach(function (id) {
    const message = Gmail.Users.Messages.get('me', id, {
      format: 'metadata',
      metadataHeaders: ['From', 'Subject'],
    });
    const from = headerValue(message, 'From') || 'unknown';
    const email = normalizeEmail(from);
    if (!senders[email]) {
      senders[email] = { email: email, name: displayName(from), count: 0, latestSubject: '', latestAt: 0 };
    }
    const entry = senders[email];
    entry.count++;
    const at = Number(message.internalDate);
    if (at > entry.latestAt) {
      entry.latestAt = at;
      entry.latestSubject = headerValue(message, 'Subject') || '(no subject)';
    }
  });

  return Object.keys(senders)
    .map(function (email) {
      return senders[email];
    })
    .sort(function (a, b) {
      return b.latestAt - a.latestAt;
    });
}
