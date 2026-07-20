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
  setConfig('version', VERSION);

  Logger.log('Gscreener installed for %s.', self);
  Logger.log('From now on, mail from unknown senders is held under %s.', LABELS.pending);
  Logger.log('Next: Deploy > New deployment > Web app (Execute as me / Only myself) to enable the dashboard and the digest buttons.');
}

function ensureLabels() {
  const existing = {};
  (Gmail.Users.Labels.list('me').labels || []).forEach(function (label) {
    existing[label.name] = label.id;
  });

  // The screener labels are plumbing — you review pending mail from the daily
  // digest and dashboard, not by clicking a label — so all three are hidden
  // from the Gmail sidebar. Visibility is enforced on every run, so re-running
  // setup() re-hides them even if they were created (or shown) earlier.
  function ensure(name) {
    if (existing[name]) {
      Gmail.Users.Labels.patch({ labelListVisibility: 'labelHide' }, 'me', existing[name]);
      return existing[name];
    }
    return Gmail.Users.Labels.create(
      { name: name, labelListVisibility: 'labelHide', messageListVisibility: 'show' },
      'me'
    ).id;
  }

  const ids = {
    triage: ensure(LABELS.triage),
    pending: ensure(LABELS.pending),
    rejected: ensure(LABELS.rejected),
  };
  setConfig('labelTriage', ids.triage);
  setConfig('labelPending', ids.pending);
  setConfig('labelRejected', ids.rejected);
  return ids;
}

// One catch-all filter: every incoming email skips the inbox and lands in the
// triage label. The screener then delivers, holds or rejects it within
// POLL_MINUTES. "larger:1" matches every email; "-from:me" excludes your own
// mail, so your outgoing messages stay in Sent and the self-addressed digest
// lands in your inbox directly — neither is ever screened. (Gmail evaluates
// filters against sent mail too; without this, your own sent mail was routed
// through triage and then delivered back to your inbox as an approved sender.)
const FILTER_QUERY = 'larger:1 -from:me';

function ensureFilter(triageLabelId) {
  const filters = Gmail.Users.Settings.Filters.list('me').filter || [];
  const triageFilters = filters.filter(function (f) {
    return f.action && (f.action.addLabelIds || []).indexOf(triageLabelId) !== -1;
  });

  // Already have the right filter? Nothing to do.
  if (triageFilters.some(function (f) { return (f.criteria || {}).query === FILTER_QUERY; })) return;

  // Remove any stale-criteria triage filters (e.g. the old bare "larger:1" that
  // also swept up your own sent mail) so re-running setup migrates cleanly
  // without stacking duplicates.
  triageFilters.forEach(function (f) { Gmail.Users.Settings.Filters.remove('me', f.id); });

  const created = Gmail.Users.Settings.Filters.create(
    {
      criteria: { query: FILTER_QUERY },
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

// Turns screening off without touching your mail. Deletes the time-based
// triggers and the catch-all Gmail filter, so new mail flows straight to your
// inbox again and nothing new is held in Triage. The three Gscreener labels,
// every email already under them, and your approve/reject lists are all left
// exactly as they are.
//
// Run this BEFORE deleting the Apps Script project. The filter is a Gmail-level
// object that outlives the project, so a project deleted while the filter still
// exists would keep pulling every new email into the hidden Triage label with
// nothing left to sort it.
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

  Logger.log('Uninstalled: triggers and the catch-all filter removed. New mail now goes straight to your inbox.');
  Logger.log('Kept as-is: the Gscreener labels, every email under them, and your approve/reject lists.');
  Logger.log('Next: delete this Apps Script project, then revoke access at myaccount.google.com/connections.');
}
