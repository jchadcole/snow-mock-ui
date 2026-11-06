# Changelog

All notable changes to the SNOW Mock UI. Versions follow [semantic versioning](https://semver.org): MAJOR for a rebuild or breaking change to URLs, APIs or data actions; MINOR for new screens, scenarios or brands; PATCH for fixes. Each release is tagged `vX.Y.Z` in git.

## 3.2.0 (2026-11-06)

### Added
- **Saved taxpayers.** Taxpayers you add with New contact, `POST /api/taxpayers` or Import are kept after:
  - server restarts and redeploys;
  - the daily reseed;
  - Reset demo data.
- Where they are stored:
  - on the server, in `$DATA_DIR/saved-taxpayers.json` (default `./data`);
  - in the browser, which sends back any the server lost. That covers Render's free plan, which has no disk;
  - optionally in the repo, as `data/custom-taxpayers.json`.
- Settings > **Saved taxpayers** lists them, with Open, Delete, Export (a JSON file) and Import.
- APIs: `GET /api/custom-taxpayers` (export and storage info), `POST /api/custom-taxpayers` (import), and `DELETE /api/taxpayers/{id}` (only for taxpayers you added). `/api/health` reports the storage.

### Changed
- New taxpayer IDs are now stable (`tp-c…`), so a saved taxpayer keeps the same ID after a restart.
- Saving a profile change (address, phones, email, name) on a saved taxpayer updates the saved copy. Demo actions such as payments and identity checks still reset with the demo data.

## 3.1.0 (2026-11-06)

### Changed
- Every screen pop line is now worded from the selected taxpayer's record, with nothing fixed to Tom or Charlotte. That covers:
  - the Pilot handoff card, summary and transcript;
  - the Agent Assist suggestions;
  - the internal transcript;
  - the v2 live transcripts.
  The wording uses the caller's name, SSN last 4, date of birth, refund, notice number and amount, and check dates. For a business, the caller is the contact on file.
- Agent Assist picks its script from the call's Pilot scenario, or else from the record: suspense payment, refund held for identity, documentation review, information request, balance due or refund.

### Added
- The **Pilot virtual agent handoffs** card on the Genesys page has a **Caller** picker. You can run both Pilot scenarios for any taxpayer. Pop URLs take `taxpayerId` too, for example `/pop?scenario=notice-paid&taxpayerId=tp-1002`.
- For the notice story, a taxpayer with no open billing notice or mailed check gets demo ones added (amounts from the balance), so **Apply suspense payment** works for anyone.
- `GET /api/bot-scenarios?taxpayerId=`, and `taxpayerId` in `POST /api/bot-scenarios/{id}/run`.

## 3.0.2 (2026-11-05)

### Changed
- The top left corner shows the ServiceNow wordmark, as in the template. You can change it with `ui.platformLogo` (text or image) in `lib/brands.js`.
- The agency logo (Ohio by default, still configurable per brand) moved to the left of the search box. It is hidden on screens narrower than 1350 px.

## 3.0.1 (2026-11-05)

### Fixed
- Removed three test screenshots (50-login.png, 51-settings.png, 52-notes.png) that were committed to the repository root by mistake.

## 3.0.0 (2026-11-05)

The workspace now follows the CSM/FSM Configurable Workspace recording ("snow from Ryan") as its template. Colors, menus, panels, icons and positions match the recording; names, numbers and text come from the brand config and the demo data.

### Changed
- Calls now open an **interaction record** (IMS number) instead of the taxpayer record. To get the v2 behavior, set Settings > Screen pops open > The taxpayer record, or add `view=taxpayer` to a pop URL.
- Shell restyled to the template: top bar (All, Favorites, History, Workspaces, the workspace pill, Search with a scope menu, chat, help, phone, bell, avatar), a left rail with Home, Lists, Inbox and History, and the light blue tab bar.
- Template colors are the default. Brand colors are still available with `ui.palette: 'brand'` in `lib/brands.js` or Settings > Color scheme.
- Inbox: status **On Queue** with a settings gear, and work items show the IMS number, a 0:55 **Time to accept** countdown, and **Reject** / **Accept**.
- The Genesys page moved from the rail to the phone icon in the top bar. Knowledge is under the help icon.

### Added
- Interaction screen with every click from the recording:
  - Call card: Connecting, then **Active call** with a timer, location and number, REC menu, mute (Unmute yourself), hold, keypad, transfer, flag and hang-up. After the call: Call ended, Phone is not available, The call has ended.
  - **Customer History** grouped by day, with search, filter and last-30-days buttons. It lists calls, cases, virtual agent sessions and notices, and each entry opens its record.
  - Interaction form: Number, State, Type, Assigned to, Account, Contact (preview and lookup), Verified (opens identity verification), Short description, and the Internal Transcript after wrap-up, with the "GenesysUE has modified this field value" chip.
  - Header buttons that change with state: Genesys Schedule Callback, Create Incident, Close, Create Case and a more menu (open the taxpayer, verify identity, apply a suspense payment, refund details, email, view the Pilot transcript, copy the number). After closing: Create Incident, Create Case, Save.
  - **Agent Assist**: Related Search Results, Loading, Search knowledge, the **Transfer Summary** from the Pilot session, a "New Suggestion" pill, caller and agent utterances with knowledge cards and highlighted answers, Relevant / Irrelevant thumbs, the article feedback list after hang-up (Provide Feedback, Dismiss), and Awaiting Conversation.
  - **Wrap up** dock with a timer, required wrap up code, notes and **Submit & close**.
  - Out of Adherence toast with a close button. The text is configurable and it can be turned off.
  - Right utility rail: Learning, Attachments, Record details, Agent Assist, Script and Images.
- Configurable text in a new `ui` block per brand (record title, accept seconds, adherence toast, presence list, wrap up codes, assist speed, transfer summary wording).
- Agent Assist scripts per scenario or taxpayer in `lib/assist.js`. They advance on a timer; press `]` to show the next line now.
- APIs: `GET/POST /api/ims`, `GET/PATCH /api/ims/:id`, `POST /api/ims/:id/close`, `GET /api/assist`, `POST /api/incidents`.
- Interactions list (History icon on the rail), and knowledge articles KB0020427 and KB0020428.

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
