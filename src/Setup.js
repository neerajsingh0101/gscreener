// One-time installation and removal.
//
// Run setup() from the script editor after pasting the files in. It is
// idempotent — re-running it repairs labels, the filter and triggers without
// touching your approve/reject lists.

function setup() {
  const self = Gmail.Users.getProfile('me').emailAddress.toLowerCase();
  setConfig('selfEmail', self);
  setVerdict(self, VERDICT.approved); // your own mail (incl. the digest) is never screened

  const labelIds = ensureLabels();
  ensureFilter(labelIds.triage);
  ensureTriggers();
  ensureDefaultExemptions();
  migrateEmailExemptionsToApproved();
  setConfig('lastSentScan', String(Math.floor(Date.now() / 1000)));

  Logger.log('Gscreener installed for %s.', self);
  Logger.log('From now on, mail from unknown senders is held under %s.', LABELS.pending);
  Logger.log('Next: Deploy > New deployment > Web app (Execute as me / Only myself) to enable the dashboard and the digest buttons.');
}

function ensureLabels() {
  const existing = {};
  (Gmail.Users.Labels.list('me').labels || []).forEach(function (label) {
    existing[label.name] = label.id;
  });

  function ensure(name, hidden) {
    if (existing[name]) return existing[name];
    return Gmail.Users.Labels.create(
      {
        name: name,
        labelListVisibility: hidden ? 'labelHide' : 'labelShow',
        messageListVisibility: 'show',
      },
      'me'
    ).id;
  }

  const ids = {
    triage: ensure(LABELS.triage, true),
    pending: ensure(LABELS.pending, false),
    rejected: ensure(LABELS.rejected, false),
  };
  setConfig('labelTriage', ids.triage);
  setConfig('labelPending', ids.pending);
  setConfig('labelRejected', ids.rejected);
  return ids;
}

// One catch-all filter: every incoming email skips the inbox and lands in the
// triage label. The screener then delivers, holds or rejects it within
// POLL_MINUTES. "larger:1" matches every email ever sent.
function ensureFilter(triageLabelId) {
  const filters = Gmail.Users.Settings.Filters.list('me').filter || [];
  const exists = filters.some(function (f) {
    return f.action && (f.action.addLabelIds || []).indexOf(triageLabelId) !== -1;
  });
  if (exists) return;

  const created = Gmail.Users.Settings.Filters.create(
    {
      criteria: { query: 'larger:1' },
      action: { removeLabelIds: ['INBOX'], addLabelIds: [triageLabelId] },
    },
    'me'
  );
  setConfig('filterId', created.id);
}

// Seeds each exemption list on first install only — a list the user has
// touched (even emptied) is never overwritten.
function ensureDefaultExemptions() {
  EXEMPTION_TYPES.forEach(function (type) {
    if (props().getProperty('x:' + type) === null) {
      saveExemptions(type, DEFAULT_EXEMPTIONS[type]);
    }
  });
}

// Older versions had a third exemption list of individual email addresses.
// Exempting an address is the same as approving the sender, so fold any
// leftover entries into the approved senders list and drop the old property.
// Explicit rejections are never overwritten.
function migrateEmailExemptionsToApproved() {
  const stored = props().getProperty('x:emails');
  if (stored === null) return;
  JSON.parse(stored).forEach(function (email) {
    if (!getVerdict(email)) setVerdict(normalizeEmail(email), VERDICT.approved);
  });
  props().deleteProperty('x:emails');
}

function ensureTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    const handler = trigger.getHandlerFunction();
    if (handler === 'screenNewMail' || handler === 'sendDigest') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  ScriptApp.newTrigger('screenNewMail').timeBased().everyMinutes(POLL_MINUTES).create();
  ScriptApp.newTrigger('sendDigest').timeBased().atHour(DIGEST_HOUR).everyDays(1).create();
}

// Turns screening off: removes the filter and triggers and releases all held
// (pending) mail back to the inbox. Labels, rejected mail and your
// approve/reject lists are kept so nothing is lost.
function uninstall() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    ScriptApp.deleteTrigger(trigger);
  });

  const triageId = getConfig('labelTriage');
  (Gmail.Users.Settings.Filters.list('me').filter || []).forEach(function (f) {
    if (f.action && (f.action.addLabelIds || []).indexOf(triageId) !== -1) {
      Gmail.Users.Settings.Filters.remove('me', f.id);
    }
  });

  releaseAllHeldMail();
  Logger.log('Uninstalled: filter and triggers removed, held mail released to the inbox.');
  Logger.log('Labels and sender verdicts were kept. Delete the %s labels and Script Properties for a clean slate.', 'Gscreener');
}

function releaseAllHeldMail() {
  [getConfig('labelTriage'), getConfig('labelPending')].forEach(function (labelId) {
    if (!labelId) return;
    batchMove(listMessageIds({ labelIds: [labelId] }), ['INBOX'], [labelId]);
  });
}
