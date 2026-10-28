# VTU Student Super App — Android CI/CD & Production Deployment Guide

## 1. Overview & Architecture

This document defines the production-grade Continuous Integration and Continuous Deployment (CI/CD) architecture for the **VTU Student Super App** (`com.vtu.studentapp`) built with Expo SDK 57, React Native 0.86, and Expo Application Services (EAS).

### Repository Structure

```
vt/
├── vtu-backend/                # NestJS Backend API Service
├── vtu_admin_pannel/           # Admin Dashboard Portal
└── vtu_app/                    # Expo Mobile Application Root
    ├── .eas/
    │   └── workflows/          # EAS Native CI/CD Workflows
    │       ├── development.yml # Develop branch -> Dev Client APK
    │       ├── testing.yml     # Staging branch -> QA Internal APK
    │       └── production.yml  # Main/Release branch -> Production Signed AAB
    ├── .github/
    │   └── workflows/
    │       └── eas-build.yml   # GitHub Actions automated build gate
    ├── docs/
    │   └── DEPLOYMENT_AND_CICD.md # This documentation
    ├── scripts/
    │   └── validate-ci.js      # Automated environment & config validation
    ├── src/
    │   └── infrastructure/
    │       └── api/client.ts   # Hardened environment-aware API client
    ├── app.json                # Native configuration & package identifiers
    ├── eas.json                # EAS multi-environment build profiles
    ├── package.json            # Scripts: start, tsc, lint, test
    └── .env.example            # Non-secret environment variable template
```

---

## 2. Environment & Build Matrix

| Environment | Git Branch | EAS Profile | EAS Environment | Android Artifact | API Endpoint | Distribution Channel |
|---|---|---|---|---|---|---|
| **Development** | `develop` | `development` | `development` | Debug APK / Dev Client | `https://vtu-backend-dev.voroa.app/api/v1` (or local LAN) | Internal dev team |
| **Testing / QA** | `staging` | `preview` | `preview` | Standalone APK | `https://vtu-backend-staging.voroa.app/api/v1` | QA Testers (EAS Internal) |
| **Production** | `main`, `release/*` | `production` | `production` | Signed AAB (`app-bundle`) | `https://api.vtuapp.in/api/v1` | Google Play Console (Internal Track) |

---

## 3. Quality Gates & Validation Rules

Before any binary build is permitted in EAS or GitHub Actions, the pipeline executes automated quality gates:

1. **Lockfile & Dependencies Integrity**: Clean install via `npm ci` (using `.npmrc` with `legacy-peer-deps=true` for React 19 compatibility).
2. **Configuration Integrity Gate (`npm test`)**: Runs `scripts/validate-ci.js`:
   - Validates package name is strictly `com.vtu.studentapp`.
   - Validates iOS bundle identifier is `com.vtu.studentapp`.
   - Validates URL scheme is `vtuapp`.
   - Ensures no secret credentials (passwords, JWT secrets, database URLs) are accidentally prefixed with `EXPO_PUBLIC_`.
   - Asserts that production and preview builds point to secure `https://` endpoints.
3. **TypeScript Static Compilation Gate (`npm run tsc`)**: Runs `tsc --noEmit` and halts the build on any compilation or type error.

---

## 4. Setup & Linking Commands

### A. Install EAS CLI & Authenticate
```bash
npm install -g eas-cli
eas login
```

### B. Link App to Expo Project
From within `vtu_app/`:
```bash
eas project:init
```
*(This links `slug: vtu-student-super-app` to your Expo organization and adds `extra.eas.projectId` to `app.json`).*

### C. Configure EAS Environment Variables
Configure `EXPO_PUBLIC_API_URL` independently in each EAS environment:

```bash
# Development
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://vtu-backend-dev.voroa.app/api/v1" --type string

# Preview / Staging
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://vtu-backend-staging.voroa.app/api/v1" --type string

# Production
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://api.vtuapp.in/api/v1" --type string
```

### D. Configure GitHub Actions Secrets
In your GitHub repository (`saqibmir580-png/vtu_app`) &rarr; **Settings** &rarr; **Secrets and variables** &rarr; **Actions**:
- `EXPO_TOKEN`: Personal access token generated from [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens).

---

## 5. Android Signing Credentials

EAS manages cryptographic credentials securely on Expo's remote HSM keystore:
- **Automatic Remote Credentials**:
  ```bash
  eas credentials
  ```
  Select **Android** &rarr; **Production** &rarr; Let EAS generate and manage your production upload keystore.
- **Google Play App Signing Integration**:
  When submitting the generated AAB to the Google Play Console for the first time, Google Play registers the EAS upload certificate and signs user-facing distribution APKs with Google's Play App Signing key.

---

## 6. Manual Build Commands

If you need to trigger builds manually from your terminal:

```bash
# Build internal Development APK
eas build --platform android --profile development

# Build internal QA APK (Staging backend)
eas build --platform android --profile preview

# Build signed Production AAB (Store release)
eas build --platform android --profile production
```

---

## 7. Google Play Submission & Release Process

Production submissions follow a strict promotion pipeline:

1. **Build Generated**: Pushing to `main` or `release/*` produces a signed `.aab` file.
2. **Submit to Internal Testing**:
   ```bash
   eas submit --platform android --profile production
   ```
   *(Submits to the **Internal Testing** track in Google Play Console with `releaseStatus: draft` or `completed`).*
3. **QA Verification**: Internal testers verify the build from the Play Store Internal track.
4. **Promotion**: Once approved by QA and the release engineer, promote the build from **Internal Testing** &rarr; **Closed Testing (Alpha/Beta)** &rarr; **Production Release** with staged rollout (e.g., 10% &rarr; 50% &rarr; 100%).

---

## 8. Rollback Procedure

If a critical issue is discovered in production:
1. **Google Play Console Rollback**:
   - In Google Play Console &rarr; **Release overview** &rarr; Halt the staged rollout immediately.
   - If a rollback APK/AAB is needed, increment the `versionCode` in EAS:
     ```bash
     eas build --platform android --profile production
     ```
   - Submit the patched release to Google Play.
2. **Backend API Isolation**:
   - If an API incompatibility causes mobile crashes, update the backend API without touching the mobile app (the app communicates with backward-compatible NestJS endpoints).

---

## 9. Security Principles Applied

- **Zero Private Secrets**: No private database passwords, Redis tokens, or JWT secrets are ever packaged into the client bundle.
- **Client Configuration Isolation**: Only non-sensitive public identifiers (`EXPO_PUBLIC_GOOGLE_CLIENT_ID`, `EXPO_PUBLIC_ANDROID_CLIENT_ID`, `EXPO_PUBLIC_API_URL`) are embedded in the bundle.
- **Fail-Fast Hardening**: `client.ts` strictly rejects missing or insecure HTTP API URLs in production/preview builds, eliminating silent localhost fallback bugs.
- **Branch Protection**: Production builds are restricted to `main` and `release/*` branches.
