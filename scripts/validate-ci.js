/**
 * Automated CI/CD Validation Script — VTU Student Super App
 * Validates project configuration, environment variables, security boundaries, and app integrity.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

function fail(msg) {
  console.error(`\x1b[31m[CI VALIDATION FAILED]\x1b[0m ${msg}`);
  process.exit(1);
}

function pass(msg) {
  console.log(`\x1b[32m[CI VALIDATION PASSED]\x1b[0m ${msg}`);
}

console.log('--- Starting VTU Student Super App CI/CD Validation ---');

// 1. Validate package.json
const pkgPath = path.join(ROOT_DIR, 'package.json');
if (!fs.existsSync(pkgPath)) {
  fail('package.json not found in root directory.');
}
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
if (!pkg.name || !pkg.version) {
  fail('package.json must contain name and version.');
}
pass(`Package: ${pkg.name}@${pkg.version}`);

// 2. Validate app.json
const appJsonPath = path.join(ROOT_DIR, 'app.json');
if (!fs.existsSync(appJsonPath)) {
  fail('app.json not found in root directory.');
}
const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8')).expo;
if (!appConfig) {
  fail('app.json must contain an "expo" object.');
}

// Check Android package identifier
if (appConfig.android?.package !== 'com.vtu.studentapp') {
  fail(`Expected Android package 'com.vtu.studentapp', got '${appConfig.android?.package}'`);
}
pass(`Android Package ID verified: ${appConfig.android.package}`);

// Check iOS bundle identifier
if (appConfig.ios?.bundleIdentifier !== 'com.vtu.studentapp') {
  fail(`Expected iOS bundleIdentifier 'com.vtu.studentapp', got '${appConfig.ios?.bundleIdentifier}'`);
}
pass(`iOS Bundle ID verified: ${appConfig.ios.bundleIdentifier}`);

// Check scheme
if (appConfig.scheme !== 'vtuapp') {
  fail(`Expected scheme 'vtuapp', got '${appConfig.scheme}'`);
}
pass(`URL Scheme verified: ${appConfig.scheme}`);

// 3. Security Check: Ensure no sensitive keys are prefixed with EXPO_PUBLIC_
const forbiddenPatterns = [
  'DATABASE_URL',
  'POSTGRES',
  'REDIS_PASSWORD',
  'JWT_SECRET',
  'JWT_ACCESS',
  'PRIVATE_KEY',
  'SERVICE_ACCOUNT_KEY',
  'SMTP_PASSWORD',
  'MAIL_PASSWORD',
];

const envVars = Object.keys(process.env);
for (const envKey of envVars) {
  for (const pattern of forbiddenPatterns) {
    if (envKey.includes(pattern) && envKey.startsWith('EXPO_PUBLIC_')) {
      fail(`Security breach: Secret '${envKey}' must not be exposed with EXPO_PUBLIC_ prefix!`);
    }
  }
}
pass('Client environment variable security check passed: No private secrets exposed');

// 4. Validate Environment Isolation & API URL
const appEnv = process.env.EXPO_PUBLIC_APP_ENV || 'development';
const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (appEnv === 'production' || appEnv === 'preview') {
  if (!apiUrl || !apiUrl.startsWith('https://')) {
    fail(`In '${appEnv}' environment, EXPO_PUBLIC_API_URL must be a valid HTTPS URL. Got: '${apiUrl}'`);
  }
  pass(`Production/Preview API URL verified (${appEnv}): ${apiUrl}`);
} else if (appEnv === 'test') {
  pass(`Test environment active (${appEnv}). API URL: ${apiUrl || 'http://localhost:5001/api/v1'}`);
} else {
  pass(`Development environment active. API URL: ${apiUrl || 'Local / Metro bundler default'}`);
}

console.log('--- All Quality Gate Validation Checks Passed Successfully ---');
process.exit(0);
