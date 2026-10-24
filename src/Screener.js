// The screening loop (runs every POLL_MINUTES) and verdict actions.

function screenNewMail() {
  const triageId = getConfig('labelTriage');
  if (!triageId) throw new Error('Gscreener: run setup() first.');

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(0)) return; // a previous run is still working through a backlog

  try {
    autoApproveSentRecipients();
    triageNewMessages(triageId);
    sweepPendingPeriodically();
  } finally {
    lock.releaseLock();
  }
}

// A verdict releases the sender's held mail once, when it is given. If that
// release falls short — the side panel's 30-second limit killed it after the
// verdict was saved, or Gmail search had not yet indexed mail held moments
// before — the mail stayed held forever, while the side panel reported the
// sender as already approved. Every SWEEP_MINUTES, re-check all held mail
// against the verdicts so anything left behind is sorted within the hour.
function sweepPendingPeriodically() {
  const last = Number(getConfig('lastPendingSweep') || 0);
  if (Date.now() - last < SWEEP_MINUTES * 60 * 1000) return;
  rescreenPending();
  setConfig('lastPendingSweep', String(Date.now()));
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

  deliverToInbox(deliver, triageId);
  batchMove(hold, [getConfig('labelPending')], [triageId]);
  batchMove(reject, [getConfig('labelRejected')], [triageId]);
}

// Anyone you write to is someone you know: recipients of your outgoing mail
// are approved automatically (unless you already rejected them explicitly).
//
// Approving goes through releaseApproved, not a bare setVerdict, so mail of
// theirs already sitting in the pending label is released too. Writing only
// the verdict left that mail held, since triage looks only at the triage
// label. Someone who emailed you before you first wrote to them stayed
// pending until something revisited the pending label.
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
        if (!getVerdict(email)) releaseApproved(email);
      });
    });
  });

  setConfig('lastSentScan', String(now));
}

// Thumbs up: deliver this sender from now on, and release their held mail.
// Callable from the web app or directly from the script editor.
function approveSender(email) {
  return withVerdictLock(function () {
    return releaseApproved(email);
  });
}

// Thumbs down: never deliver this sender again. Their held mail — and any
// future mail — goes to the rejected label. Nothing is deleted.
function rejectSender(email) {
  return withVerdictLock(function () {
    email = normalizeEmail(email);
    setVerdict(email, VERDICT.rejected);
    const held = listMessageIds({
      labelIds: [getConfig('labelPending')],
      q: 'from:' + email,
    });
    batchMove(held, [getConfig('labelRejected')], [getConfig('labelPending'), 'INBOX']);
    return held.length;
  });
}

// The approval itself, for callers already holding the script lock.
function releaseApproved(email) {
  email = normalizeEmail(email);
  setVerdict(email, VERDICT.approved);
  const held = listMessageIds({
    labelIds: [getConfig('labelPending')],
    q: 'from:' + email,
  });
  deliverToInbox(held, getConfig('labelPending'));
  return held.length;
}

// A verdict given while screenNewMail is mid-batch could search the pending
// label before that batch was moved into it, missing the mail the batch was
// about to hold. Wait for the batch to finish first. The wait stays well
// inside the side panel's 30-second limit; if it runs out, the verdict goes
// ahead anyway and the periodic sweep picks up anything it missed.
function withVerdictLock(fn) {
  const lock = LockService.getScriptLock();
  const locked = lock.tryLock(15000);
  try {
    return fn();
  } finally {
    if (locked) lock.releaseLock();
  }
}

// Re-checks all held mail against the verdicts and exemption lists, and
// sorts whatever no longer belongs there: approved or exempted mail goes to
// the inbox, rejected mail to the rejected label. Runs every SWEEP_MINUTES,
// and after an exemption is added so exemptions apply retroactively.
function rescreenPending() {
  const pendingId = getConfig('labelPending');
  const release = [];
  const reject = [];

  listMessageIds({ labelIds: [pendingId] }).forEach(function (id) {
    const message = Gmail.Users.Messages.get('me', id, {
      format: 'metadata',
      metadataHeaders: ['From', 'Subject'],
    });
    const from = headerValue(message, 'From');
    if (!from) return;
    const email = normalizeEmail(from);
    const verdict = getVerdict(email);
    if (verdict === VERDICT.approved) release.push(id);
    else if (verdict === VERDICT.rejected) reject.push(id);
    else if (exemptionMatch(email, headerValue(message, 'Subject'))) release.push(id);
  });

  deliverToInbox(release, pendingId);
  batchMove(reject, [getConfig('labelRejected')], [pendingId]);
  return release.length;
}

// --- Playing nicely with the user's own filters -----------------------------
// Gmail runs filters exactly once, at delivery, and offers no way to re-run
// them later. The user's filters DID run (their labels are applied normally),
// but any "Skip Inbox" action they took is invisible to us — the catch-all
// screener filter also removed INBOX. So before delivering mail to the inbox,
// re-check the user's own skip-inbox filters and leave matching mail archived
// instead of forcing it into the inbox.
//
// `ids` all sit under `fromLabelId`, which is removed as they move. Each
// filter is one search scoped to that label — Gmail's own search engine, so
// operator semantics are exactly Gmail's. Checking message by message cost a
// search per message per filter, and a burst of a few dozen held emails ran
// an approval from the side panel past its 30-second limit, killing it after
// the verdict was saved but before any mail moved.
function deliverToInbox(ids, fromLabelId) {
  if (ids.length === 0) return;
  const skipQueries = userSkipInboxQueries();
  if (skipQueries.length === 0) {
    batchMove(ids, ['INBOX'], [fromLabelId]);
    return;
  }

  const filtered = {};
  skipQueries.forEach(function (query) {
    listMessageIds({ labelIds: [fromLabelId], q: query }).forEach(function (id) {
      filtered[id] = true;
    });
  });

  const toInbox = [];
  const stayArchived = [];
  ids.forEach(function (id) {
    (filtered[id] ? stayArchived : toInbox).push(id);
  });
  batchMove(toInbox, ['INBOX'], [fromLabelId]);
  batchMove(stayArchived, [], [fromLabelId]);
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
