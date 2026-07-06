// Gmail Screener — settings and shared helpers.
//
// Everything a user might want to tweak lives in the two constants below.
// State (label ids, sender verdicts) is kept in Script Properties, entirely
// inside your own Google account.

const DIGEST_HOUR = 8; // 0-23, in the script's time zone (appsscript.json)
const POLL_MINUTES = 1; // how often new mail is screened: 1, 5, 10, 15 or 30

const LABELS = {
  triage: '@Screener/Triage', // transient queue fed by the Gmail filter (hidden)
  pending: '@Screener/Pending', // mail from senders awaiting your verdict
  rejected: '@Screener/Rejected', // mail from senders you rejected
};

const VERDICT = { approved: 'approved', rejected: 'rejected' };

function props() {
  return PropertiesService.getScriptProperties();
}

function getConfig(key) {
  return props().getProperty('cfg:' + key);
}

function setConfig(key, value) {
  props().setProperty('cfg:' + key, String(value));
}

function senderKey(email) {
  return 's:' + normalizeEmail(email);
}

function getVerdict(email) {
  return props().getProperty(senderKey(email)); // 'approved' | 'rejected' | null
}

function setVerdict(email, verdict) {
  props().setProperty(senderKey(email), verdict);
}

function clearVerdict(email) {
  props().deleteProperty(senderKey(email));
}

function allVerdicts() {
  const all = props().getProperties();
  const result = { approved: [], rejected: [] };
  Object.keys(all).forEach(function (key) {
    if (key.indexOf('s:') !== 0) return;
    const email = key.slice(2);
    if (all[key] === VERDICT.approved) result.approved.push(email);
    else if (all[key] === VERDICT.rejected) result.rejected.push(email);
  });
  result.approved.sort();
  result.rejected.sort();
  return result;
}

// "Neeraj Singh <a@b.com>" -> "a@b.com"
function normalizeEmail(raw) {
  const match = String(raw).match(/<([^>]+)>/);
  return (match ? match[1] : String(raw)).trim().toLowerCase();
}

// "\"Neeraj Singh\" <a@b.com>" -> "Neeraj Singh", falling back to the address
function displayName(fromHeader) {
  const name = String(fromHeader).replace(/<[^>]*>/, '').replace(/"/g, '').trim();
  return name || normalizeEmail(fromHeader);
}

// A To/Cc/Bcc header can hold several addresses, some inside quoted names.
function extractAddresses(headerValue) {
  const matches = String(headerValue).match(/[^\s<>,;"']+@[^\s<>,;"']+/g) || [];
  return matches.map(function (email) {
    return email.trim().toLowerCase();
  });
}

function headerValue(message, name) {
  const headers = (message.payload && message.payload.headers) || [];
  for (let i = 0; i < headers.length; i++) {
    if (headers[i].name.toLowerCase() === name.toLowerCase()) return headers[i].value;
  }
  return null;
}

// Lists every message id matching the given Gmail API params, across pages.
function listMessageIds(params) {
  const ids = [];
  let pageToken = null;
  do {
    const request = { maxResults: 500 };
    Object.keys(params).forEach(function (key) {
      request[key] = params[key];
    });
    if (pageToken) request.pageToken = pageToken;
    const response = Gmail.Users.Messages.list('me', request);
    (response.messages || []).forEach(function (message) {
      ids.push(message.id);
    });
    pageToken = response.nextPageToken;
  } while (pageToken);
  return ids;
}

function batchMove(ids, addLabelIds, removeLabelIds) {
  for (let i = 0; i < ids.length; i += 1000) {
    Gmail.Users.Messages.batchModify(
      {
        ids: ids.slice(i, i + 1000),
        addLabelIds: addLabelIds,
        removeLabelIds: removeLabelIds,
      },
      'me'
    );
  }
}

function webAppUrl() {
  try {
    return ScriptApp.getService().getUrl(); // null until the web app is deployed
  } catch (e) {
    return null;
  }
}

function sendHtmlEmail(to, subject, htmlBody) {
  const mime =
    'To: ' + to + '\r\n' +
    'Subject: ' + subject + '\r\n' +
    'Content-Type: text/html; charset=UTF-8\r\n' +
    '\r\n' +
    htmlBody;
  const raw = Utilities.base64EncodeWebSafe(mime, Utilities.Charset.UTF_8);
  return Gmail.Users.Messages.send({ raw: raw }, 'me').id;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

// --- Exemptions -------------------------------------------------------------
// Three user-managed lists that bypass screening: sender domains, sender
// addresses, and subject keywords. Matching mail is delivered immediately but
// the sender is NOT added to the approved list — their next non-matching
// email is screened normally. An explicit rejection always wins.

const EXEMPTION_TYPES = ['domains', 'emails', 'keywords'];

// Seeded once by setup() on first install; freely removable from the dashboard.
const DEFAULT_EXEMPTIONS = {
  domains: ['github.com', 'stripe.com'],
  emails: ['notifications@github.com'],
  keywords: ['login code', 'otp'],
};

function getExemptions(type) {
  return JSON.parse(props().getProperty('x:' + type) || '[]');
}

function saveExemptions(type, values) {
  props().setProperty('x:' + type, JSON.stringify(values));
}

function addExemption(type, value) {
  const values = getExemptions(type);
  if (values.indexOf(value) === -1) {
    values.push(value);
    values.sort();
    saveExemptions(type, values);
  }
}

function removeExemption(type, value) {
  saveExemptions(
    type,
    getExemptions(type).filter(function (v) {
      return v !== value;
    })
  );
}

// "https://GitHub.com/foo", "@github.com" or "github.com." -> "github.com"
function normalizeDomain(raw) {
  return String(raw)
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, '')
    .replace(/[\/?#].*$/, '')
    .replace(/^@/, '')
    .replace(/\.$/, '');
}

// Returns why this email bypasses screening ('domain', 'email' or 'keyword'),
// or null if it doesn't. Expects a normalized sender address.
function exemptionMatch(fromEmail, subject) {
  const domain = fromEmail.split('@')[1] || '';
  const domainHit = getExemptions('domains').some(function (exempt) {
    return domain === exempt || domain.endsWith('.' + exempt);
  });
  if (domainHit) return 'domain';

  if (getExemptions('emails').indexOf(fromEmail) !== -1) return 'email';

  const subjectLower = String(subject || '').toLowerCase();
  const keywordHit = getExemptions('keywords').some(function (keyword) {
    return subjectLower.indexOf(keyword) !== -1; // keywords are stored lowercase
  });
  return keywordHit ? 'keyword' : null;
}
