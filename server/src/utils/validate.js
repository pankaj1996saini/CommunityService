const HttpError = require('./httpError');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const str = (v) => (typeof v === 'string' ? v.trim() : '');

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Throws a 400 with a { field: message } map if anything is in it.
function failIfErrors(errors) {
  if (Object.keys(errors).length) {
    throw new HttpError(400, Object.values(errors)[0], errors);
  }
}

// keeps only digits, returns '' if it isn't a plausible phone number
function cleanPhone(v) {
  const digits = str(v).replace(/\D/g, '');
  return digits;
}

module.exports = { EMAIL_RE, str, escapeRegex, failIfErrors, cleanPhone };
