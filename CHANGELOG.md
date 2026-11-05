# Changelog

All notable changes to the SNOW Mock UI. Versions follow [semantic versioning](https://semver.org): MAJOR for a rebuild or breaking change to URLs, APIs or data actions; MINOR for new screens, scenarios or brands; PATCH for fixes. Each release is tagged `vX.Y.Z` in git.

## 2.2.0 (2026-11-05)

### Added
- Versioning. The release version comes from `package.json`, and the build is the short git commit.
- The version and build appear on the sign-in page, in the footer flag, and in Settings.
- **Release notes** in Settings shows this changelog.
- `GET /api/version` and `GET /api/changelog`. `/api/health` and `/api/config` now report `version` and `commit`.
- Script and style URLs carry the version, so browsers load fresh files after each deploy.

## 2.1.0 (2026-11-05)

### Added
- Pilot virtual agent use cases for **Tom Harper**, (419) 555-0124:
  - **Refund status, contained by Pilot.** The record logs a contained virtual agent interaction with Pilot's summary and transcript.
  - **Notice for a payment already made, transferred.** The screen pop shows Pilot's handoff card (intent, confidence, collected details, shared link) and Pilot's transcript before the live call. The agent applies the check held in suspense, which clears the balance and resolves notice 1234.
- `POST /api/bot-sessions`, `GET /api/bot-sessions`, sample sessions (`/api/bot-scenarios`), and `/pop?scenario=notice-paid`.
- SSN and date of birth lookup (`/api/taxpayers/lookup?ssn=&dob=`), with refund method, return received, processing and documentation status.
- Unapplied (suspense) payments, with **Apply payment**.
- Data action `genesys/log-bot-session.json`.
- Knowledge articles KB0020425 (documentation review) and KB0020426 (notice for a payment already made).

### Changed
- `DEMO_PHONES` accepts `seededNumber:yourNumber` as well as `yourNumber=taxpayerId`.
- The Genesys page sends sample Pilot sessions. The bot itself runs in Genesys Cloud.

## 2.0.0 (2026-11-05)

### Changed
- Rebuilt as a working state tax agency workspace on the same architecture as the Oracle Health mock: a zero-dependency Node server with seeded data in memory and an API. Hosting moves from GitHub Pages to Render (`render.yaml`, Dockerfile).
- Ohio Department of Taxation is the default brand. Brands stay switchable (`lib/brands.js`, Settings, `?brand=`, `BRAND`).

### Added
- Nine demo taxpayers covering refunds, balances, notices, business tax, POA, a shared phone and a Spanish speaker.
- Taxpayer record tabs, cases, knowledge, inbox with Accept / Decline, Now Assist and recommendations.
- Working actions: verify identity, release refund, direct deposit, payments, payment plans, notices, address, email, wrap-up.
- Screen pops by URL (`/pop?phone=`) and by push (`POST /api/screenpop` over Server-Sent Events), plus Genesys data actions for lookup, push and logging.

### Moved
- The original guided retail demo (Haven & Hill) now lives at `/retail/`.

## 1.1.0 (2026-11-05)

### Added
- Ohio Department of Taxation brand with a guided refund and identity verification story.

## 1.0.0 (2026-11-05)

### Added
- First release: a static ServiceNow-style CSM Configurable Workspace mock of the Haven & Hill demo video (Charlotte Gong, missing ottoman). It has brand config and presenter scenes.
