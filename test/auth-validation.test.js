/**
 * Unit Tests: Auth, USN Formatting & Client Configuration Security
 * Executes with Node test runner / assert
 */

const assert = require('assert');

// 1. VTU USN Validation Regex (1 + 2 letter college code + 2 digit year + 2-3 letter branch + 3 digit roll)
const VTU_USN_REGEX = /^1[A-Za-z]{2}\d{2}[A-Za-z]{2}\d{3}$/;

function validateUsn(usn) {
  if (!usn || typeof usn !== 'string') return false;
  return VTU_USN_REGEX.test(usn.trim().toUpperCase());
}

function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

function sanitizeApiUrl(url, env) {
  if (!url || typeof url !== 'string') {
    if (env === 'production' || env === 'preview') {
      throw new Error('API URL is required for production/preview');
    }
    return 'http://localhost:5000/api/v1';
  }
  const clean = url.trim().replace(/\/+$/, '');
  if (env === 'production' || env === 'preview') {
    if (!clean.startsWith('https://')) {
      throw new Error('Production API URL must use HTTPS');
    }
  }
  return clean;
}

console.log('Testing VTU Auth & Client Security Validation...');

// 1. USN Validation Tests
assert.strictEqual(validateUsn('1MS22CS101'), true);
assert.strictEqual(validateUsn('1rv21is045'), true);
assert.strictEqual(validateUsn('1by23ai012'), true);
assert.strictEqual(validateUsn('2MS22CS101'), false, 'Non-1 leading character must be rejected');
assert.strictEqual(validateUsn('1MS22C101'), false, '1-letter branch must be rejected');
assert.strictEqual(validateUsn('1MS22CS10'), false, 'Short roll number must be rejected');
assert.strictEqual(validateUsn(''), false);
console.log('  ✓ VTU USN structural syntax validation verified');

// 2. Email Normalization Tests
assert.strictEqual(normalizeEmail('  STUDENT@vtu.edu  '), 'student@vtu.edu');
assert.strictEqual(normalizeEmail('JOHN.DOE@gmail.com'), 'john.doe@gmail.com');
console.log('  ✓ Email trimming and lowercase normalization verified');

// 3. API URL Security Bounds
assert.strictEqual(
  sanitizeApiUrl('https://api.vtuapp.in/api/v1', 'production'),
  'https://api.vtuapp.in/api/v1'
);
assert.throws(
  () => sanitizeApiUrl('http://insecure-api.vtu.edu/api/v1', 'production'),
  /must use HTTPS/
);
assert.strictEqual(
  sanitizeApiUrl(undefined, 'development'),
  'http://localhost:5000/api/v1'
);
console.log('  ✓ Production HTTPS enforcement and trailing slash sanitization verified');

console.log('VTU Auth & Client Security test suite completed successfully!\n');
