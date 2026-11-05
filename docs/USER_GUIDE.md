# SNOW Mock UI: User Guide

This guide covers hosting the mock ServiceNow taxpayer workspace, running a demo, popping it from Genesys Cloud, and making it your own: new taxpayers, your own cell phone, agents, branding and data.

All data in the app is fictional. The app is not affiliated with ServiceNow, Genesys or any state agency.

**Contents**

1. [What it is](#1-what-it-is)
2. [Hosting on Render](#2-hosting-on-render)
3. [Running locally](#3-running-locally)
4. [A tour of the workspace](#4-a-tour-of-the-workspace)
5. [Running a demo](#5-running-a-demo)
6. [Screen pops](#6-screen-pops)
7. [Genesys Cloud setup](#7-genesys-cloud-setup)
8. [Customizing](#8-customizing)
9. [Data, resets and persistence](#9-data-resets-and-persistence)
10. [Troubleshooting](#10-troubleshooting)
11. [Reference](#11-reference)

---

## 1. What it is

A small Node.js web server plus a single-page app that looks like a ServiceNow CSM Configurable Workspace set up for a state department of taxation. Agents sign in as a persona, take screen-popped calls from Genesys Cloud, and work the caller's record: verify identity, release refunds, take payments, set up payment plans, re-send notices, create cases and wrap up.

Key points:

- **No dependencies, no build.** Node 18 or newer runs `server.js` directly.
- **Data lives on the server, in memory.** The browser, a Genesys data action and a screen pop all see the same records. Data is reseeded from code on every restart, once a day, and on demand (see [section 9](#9-data-resets-and-persistence)).
- **Branding is configuration.** The default is the Ohio Department of Taxation. Other agencies are entries in `lib/brands.js`.

Where things are in the repo:

| Path | What it holds |
|---|---|
| `server.js` | The web server, API, screen-pop push, and env var handling |
| `lib/seed.js` | All demo data: agents, taxpayers, returns, notices, cases, knowledge articles |
| `lib/brands.js` | Agency branding: names, forms, area codes, cities, logo, colors |
| `public/` | The workspace app (`index.html`, `js/app.js`, `js/ai.js`, `css/app.css`) |
| `public/api-docs.html` | API reference, served at `/api-docs.html` |
| `genesys/` | Genesys Cloud data action definitions to import |
| `public/retail/` | The original Haven & Hill retail guided demo, served at `/retail/` |
| `render.yaml`, `Dockerfile` | Hosting config |

---

## 2. Hosting on Render

### First deploy

1. Sign in at <https://render.com> with your GitHub account.
2. Choose **New > Blueprint** and pick the `jchadcole/snow-mock-ui` repository.
3. Render reads `render.yaml` and creates a free web service named `snow-mock-ui`. Click **Apply**.
4. When the deploy finishes, open the URL Render shows, normally `https://snow-mock-ui.onrender.com`.
5. Check `https://YOUR-HOST/api/health`. It returns `"status": "ok"`, the active brand and the date the data was seeded.

`render.yaml` sets three environment variables for you: `BRAND=ohiotax`, a randomly generated `API_KEY`, and `FRAME_ANCESTORS=*`. You can see and change them under the service's **Environment** tab.

### Updating

Render redeploys automatically whenever `main` changes. Changing an environment variable in the Render dashboard also restarts the service.

### Environment variables

| Variable | Default | What it does |
|---|---|---|
| `BRAND` | `ohiotax` | Agency branding used when the server starts. Must be an id from `lib/brands.js`. |
| `API_KEY` | (none) | When set, `/api/screenpop` and `/api/taxpayers/lookup` require it as `x-api-key`, `Authorization: Bearer`, or `?apiKey=`. The workspace's own pages don't need it. |
| `DEMO_PHONES` | (none) | Adds real phone numbers to demo taxpayers. See [8.1](#81-map-your-cell-phone-to-a-taxpayer). |
| `RESET_DAILY` | on | Set to `false` to stop the automatic daily reseed. |
| `PUBLIC_URL` | from request | Base URL used in `popUrl` values returned by the API, e.g. `https://snow-mock-ui.onrender.com`. Only needed behind an unusual proxy. |
| `FRAME_ANCESTORS` | `*` | Which sites may show the app in an iframe. `*` allows all Genesys Cloud regions. To restrict, list origins separated by spaces, e.g. `https://apps.mypurecloud.com https://apps.usw2.pure.cloud`. |
| `GENESYS_REGION` | `mypurecloud.com` | Optional. Genesys Cloud region domain for the server-side conversation lookup. |
| `GENESYS_CLIENT_ID`, `GENESYS_CLIENT_SECRET` | (none) | Optional. A Client Credentials OAuth client that can read conversations. Lets a pop find the caller from only a `conversationId`. |

### Free plan behavior

Free Render services go to sleep after about 15 minutes with no traffic and take 30 to 60 seconds to wake. Because data is in memory, **waking up also reseeds the data**. Before a recording, open the site a minute early and then use **Settings > Reset demo data** so you start from a clean state. A paid instance does not sleep.

### Other hosts

The included `Dockerfile` runs anywhere that runs containers. Expose port 8080 or set `PORT`.

---

## 3. Running locally

```bash
git clone https://github.com/jchadcole/snow-mock-ui.git
cd snow-mock-ui
node server.js                 # http://localhost:8080
PORT=3000 node server.js       # another port
npm run dev                    # restarts on code changes (node --watch)
```

Environment variables work the same way locally:

```bash
BRAND=pinecrest DEMO_PHONES="3175551234=tp-1001" node server.js
```

Genesys Cloud cannot reach `localhost`, so for an end-to-end Genesys test use the Render URL (or a tunnel such as ngrok).

---

## 4. A tour of the workspace

### Signing in

The sign-in page lists the demo agents. Click one; there is no password. The choice is remembered in that browser.

| Persona | Name | Role | Email (Ohio brand) |
|---|---|---|---|
| `agent` | Richie Barnes | Taxpayer Services Agent | `richie.barnes@tax.ohio.example` |
| `business` | Dana Whitfield | Business Tax Specialist | `dana.whitfield@tax.ohio.example` |
| `supervisor` | Morgan Lee | Contact Center Supervisor | `morgan.lee@tax.ohio.example` |

If a screen pop URL arrives and nobody is signed in, the app signs in the `agent` persona automatically (or the one named with `?persona=`).

### Layout

- **Left rail**: Home, lists, knowledge, the **Genesys** page (phone icon), and the inbox.
- **Top bar**: global search, the active-call chip with its timer, presence, and your avatar (opens **Settings**).
- **Home**: open cases, today's schedule and adherence, queue stats, recent interactions, plus Insights, Scorecard and Schedule tabs.
- **Taxpayer record**: tabs for Overview, Returns, Refunds, Balances & payments, Notices, Cases, Identity, Activity and Profile.
- **Interaction column** (right side, during a call): caller card, timer, hold and mute, identity badge, Genesys details (queue, intent, conversation ID), outcomes, live transcript, and **Log call & wrap up**.
- **Recommendations**: next best actions based on the record (held refund, balance due, response due, delinquent return, POA, interpreter, offset), with a matching knowledge article.
- **Now Assist**: a rule-based assistant that answers from the record and the knowledge base. It does not call a real AI service.

### Settings (click your avatar)

| Setting | What it does |
|---|---|
| Genesys Cloud agent email | Push screen pops addressed to this email open in this browser. Defaults to the persona's email. Set it to your real Genesys agent email when pops come from Genesys. |
| Ring pushed calls in the inbox | On: a push pop rings in the inbox with Accept / Decline and a 30 second countdown. Off: it opens straight away. |
| Open the record automatically | With ringing off, opens the record as soon as the pop arrives. Otherwise shows a toast with Open / Dismiss. |
| Brand | Switch agency. Switching reseeds all data with that agency's names, forms and area codes. |
| Reset demo data | Restores every record to its starting state and closes open tabs. |
| Switch user | Back to the sign-in page. |

Settings are stored in the browser (localStorage), so each browser keeps its own.

---

## 5. Running a demo

### Before you record

1. Open the site a minute ahead so a sleeping Render instance wakes up.
2. Sign in as **Richie Barnes** (or open a pop URL, which signs him in).
3. **Settings > Reset demo data**.
4. If Genesys will push the pop, check that the agent email in Settings matches the Genesys agent who will answer, and that the Genesys page shows **Listening for screen pops**.
5. Use a browser window sized for the recording, and close tabs you don't want on screen.

### The main story: Charlotte Gong, (614) 555-0184

Charlotte's $1,284 refund is on hold for identity verification, and the Identity Confirmation Quiz letter went to her old address and came back undeliverable. She spoke to Richie by chat four days ago.

1. **The call pops.** From Genesys, or from the Genesys page in the app (pick Charlotte, intent "Refund status", then **Push screen pop** or **Open pop URL**). Her record opens with the call card and the **Transcript** tab.
2. **Verify identity.** Open **Verify identity** (from the identity badge, the Identity tab or the recommendations). The dialog lists four knowledge-based questions with the expected answers shown for the presenter: date of birth (April 12, 1989), SSN last 4 (4471), prior-year AGI, and the address on the return. Mark each **Matched** (or use **Mark all matched**) and click **Verify**. Marking any answer **No match** fails the check.
3. **Release the refund.** The release is blocked until identity is verified. The refund gets a release ID and an expected date.
4. **Switch to direct deposit.** Enter any 9-digit routing number and an account number. The expected date moves up.
5. **Email a confirmation.** Compose email drafts a message to `c.gong@gmail.com`; send it.
6. **Wrap up.** **Log call & wrap up** shows an AI-style summary. Pick a wrap-up code, keep case CS0001042 linked with **Resolve the linked case** ticked, and click **Save and end interaction**. The interaction appears in Activity.

The transcript is scripted. Each agent line waits for the matching action (verify, release, direct deposit, email), so the conversation keeps pace with what you do on screen.

### Other callers

| Number | Taxpayer | What to show |
|---|---|---|
| (614) 555-0142 | Marcus Johnson | Billing notice balance of $2,341.18. Take a payment or set up a payment plan (intent "Make a payment" or "Payment plan" opens Balances). |
| (216) 555-0131 | Raj and Priya Patel | Shared home phone. Two matches, so the agent picks the taxpayer. |
| (937) 555-0163 | Linda Okafor | W-2 Request for Information due soon. Extend the due date or re-send the notice. |
| (614) 555-0199 | Riverbend Brewing Co. LLC | Business caller. Delinquent sales tax return and an estimated assessment (sign in as Dana Whitfield). |
| (513) 555-0155 | Elena Ruiz, CPA, for Thomas Reed | Authorized representative with a power of attorney, asking about an amended return. |
| (216) 555-0161 | Anika Choudhury | Estimated payment still posting. |
| (330) 555-0177 | Maria Delgado | Spanish speaker; refund partly offset to child support. |
| any other | none | No match, so the agent creates a new contact. |

Only Charlotte has a scripted transcript. Other calls show the interaction details instead.

### Retail demo

The original Haven & Hill retail guided demo (Charlotte Gong and the ottoman) is at `/retail/`. Press the backtick key (`` ` ``) there to open its presenter panel. It is a separate, browser-only demo and doesn't use the server data or the settings above.

---

## 6. Screen pops

There are two ways to pop a record. Both create the call card and start an interaction.

### 6.1 By URL

Open `https://YOUR-HOST/pop?...` in the agent's browser, a Genesys Script web page, or an Interaction Widget.

```
https://YOUR-HOST/pop?phone=6145550184&conversationId=abc-123&queue=Individual%20Income%20Tax&intent=Refund%20status
```

| Parameter | Meaning |
|---|---|
| `phone` (or `ani`, `callerId`) | Caller's number in any format: `6145550184`, `(614) 555-0184`, `tel:+16145550184`. The last 10 digits are matched against every phone on every taxpayer. |
| `taxpayerId` | Open this taxpayer directly, e.g. `tp-1001`. Takes priority over `phone`. |
| `returnId` | Find the taxpayer by a return ID, e.g. one the bot collected. |
| `last4`, `lastName` | SSN/FEIN last 4 and last name. With `phone`, `last4` narrows a shared phone to one person. |
| `conversationId` (or `gcConversationId`, `interactionId`) | Genesys conversation ID. Shown on the call card and saved with the wrap-up. If no phone is given and the server has Genesys credentials, the caller's number is looked up from Genesys. |
| `queue`, `intent`, `direction`, `mediaType` | Shown on the call card. `mediaType` is `voice`, `chat` or `message`. |
| `customerName` | Shown when there is no match. |
| `tab` | Open on a specific tab: `overview`, `returns`, `refunds`, `balances`, `notices`, `cases`, `identity`, `activity`, `profile`. |
| `embed=1` | Compact layout for an iframe. Turned on automatically when the app is framed; `embed=0` turns it off. |
| `agent` | Sets this browser's agent email for push pops (same as Settings). |
| `persona` | `agent`, `business` or `supervisor`: who to sign in if nobody is. |
| `brand` | Switches agency **and reseeds all data**. Leave it out of pop URLs used during a demo, or the demo resets on every call. |

If you don't pass `tab`, the intent decides: "pay", "plan", "balance" or "bill" opens **Balances**; "notice" or "letter" opens **Notices**; anything else opens **Overview**.

Results: one match opens the record, several matches show a picker, and no match offers **New contact** with the phone filled in. Unfilled Genesys placeholders such as `{{Call.Ani}}` are ignored, so a template that isn't fully wired up won't break the pop.

### 6.2 By push (API)

`POST /api/screenpop` looks up the caller and sends the pop to every open workspace whose agent email matches, over Server-Sent Events. Depending on Settings, it rings in the inbox or opens directly.

```bash
curl -X POST https://YOUR-HOST/api/screenpop \
  -H "Content-Type: application/json" -H "x-api-key: $API_KEY" \
  -d '{"phone":"tel:+16145550184","agent":"richie.barnes@tax.ohio.example","conversationId":"abc-123","queue":"Individual Income Tax","intent":"Refund status","mediaType":"voice"}'
```

| Field | Meaning |
|---|---|
| `phone` | Caller's number (or use `taxpayerId`, `returnId`, `last4`, `accountNumber`) |
| `agent` | The agent email set in Settings of the browser that should pop. The persona's user id (`u-1`) also works. `*` pops every open browser. |
| `conversationId`, `queue`, `intent`, `mediaType`, `direction`, `customerName`, `tab` | Same as the URL parameters |

The response contains the lookup result plus `screenPopId` and `deliveredTo`, the number of browsers that received it. `deliveredTo: 0` means no open browser is listening for that agent email.

A green dot and **Listening for screen pops** on the Genesys page mean the browser is connected.

### 6.3 Testing without Genesys

The **Genesys** page (phone icon on the left rail) has a simulator. Pick a caller, queue, media type, intent and target agent, then:

- **Push screen pop (API)** calls `POST /api/screenpop`, as a Genesys data action would.
- **Open pop URL** navigates to `/pop?...`, as a Script web page would.

It also shows the URL templates for your host and the last 50 pops received.

---

## 7. Genesys Cloud setup

Pick the pattern that suits the demo. You can combine them.

| Pattern | What the audience sees | What to configure |
|---|---|---|
| Script web page | The record inside the Genesys agent desktop | A Script with a Web Page component |
| Interaction Widget | The record in a tab of the Genesys interaction | An Interaction Widget integration |
| Push to a separate browser | ServiceNow on its own screen pops when the agent answers | The Push Screen Pop data action, called from a Script or flow |
| Bot / IVR lookup | The virtual agent knows the refund status before transferring | The Lookup data action in Architect |

### 7.1 Import the data actions

1. In Genesys Cloud Admin, go to **Integrations** and add a **Web Services Data Actions** integration. Name it, for example, "SNOW Tax Mock".
2. On its **Credentials** tab, choose **User Defined** and add one field named `apiKey`, with the value of `API_KEY` from Render (service > **Environment**). Activate the integration.
3. Go to **Integrations > Actions > Import**, choose a file from the repo's `genesys/` folder, and pick your new integration. Import each file:

   | File | Use | Inputs | Outputs |
   |---|---|---|---|
   | `lookup-taxpayer-by-phone.json` | Bot or IVR lookup before routing | `phone` | `found`, `count`, `taxpayerId`, `fullName`, `firstName`, `language`, `identityStatus`, `refundStatus`, `refundAmount`, `refundHold`, `balanceDue`, `openCaseNumber`, `representative`, `popUrl` |
   | `push-screen-pop.json` | Pop the agent's browser | `phone`, `agentEmail`, plus optional `conversationId`, `queue`, `mediaType`, `intent`, `taxpayerId` | `found`, `count`, `taxpayerId`, `fullName`, `popUrl`, `deliveredTo` |
   | `log-interaction.json` | Write a call record to the taxpayer's Activity | `taxpayerId`, plus `direction`, `subject`, `note`, `wrapCode`, `conversationId`, `queue`, `durationSec` | `activityId` |

4. Each file points at `https://snow-mock-ui.onrender.com`. If your host is different, edit the **Request URL Template** on the action's **Setup** tab.
5. Use **Test** on each action (for example, phone `+16145550184`), then **Publish**.

### 7.2 Bot or IVR lookup (Architect)

In the inbound call or bot flow, call **Lookup Taxpayer by Phone** with `Call.Ani`. Save the outputs to flow variables and use them:

- Say "I see your refund of {refundAmount} is on hold for identity verification" when `refundStatus` is "On hold".
- Set participant data (for example `taxpayerId`, `intent`, `refundStatus`) before **Transfer to ACD**, so the Script and the agent can use it.
- Route on `language` (Maria Delgado is Spanish) or on `found`.

### 7.3 Script web page

In a Genesys Script, add a **Web Page** component with this source (variables in `{{ }}` are Script variables):

```
https://YOUR-HOST/pop?phone={{Call.Ani}}&conversationId={{Scripter.Interaction ID}}&queue={{Scripter.Queue Name}}&agent={{Scripter.Agent Email}}&intent={{Intent}}&embed=1
```

`Intent` is a Script variable you create and fill from participant data set by the flow. Drop any parameter you don't use. To show a taxpayer the bot already identified, use `taxpayerId={{taxpayerId}}` instead of `phone`.

Assign the Script to the queue (or set it in the flow), and the record pops inside the agent desktop when the agent answers.

### 7.4 Interaction Widget

Add an **Interaction Widget** integration with this Application URL:

```
https://YOUR-HOST/pop?conversationId={{gcConversationId}}&embed=1
```

The widget only passes the conversation ID, so the server has to look up the caller's number from Genesys. Create an OAuth client in Genesys (**Admin > OAuth**, grant type **Client Credentials**, with a role that can view conversations), then set `GENESYS_CLIENT_ID`, `GENESYS_CLIENT_SECRET` and `GENESYS_REGION` (for example `usw2.pure.cloud`) in Render. `/api/health` shows `"genesysLookup": true` when it's configured.

### 7.5 Push to a separate browser

This is the "screen pop in ServiceNow" moment from the demo video: Genesys on one screen and the ServiceNow workspace on another.

1. Open the workspace in its own browser window and sign in as the agent.
2. In **Settings**, set the agent email to the Genesys user's email (or open the site once with `?agent=you@example.com`).
3. In the Genesys Script, add an action on **Script load** (which runs when the agent answers) that calls **Push Screen Pop** with `phone = {{Call.Ani}}`, `agentEmail = {{Scripter.Agent Email}}` and `conversationId = {{Scripter.Interaction ID}}`. You can also call it from the flow or from a Process Automation trigger.
4. When the agent answers, the workspace rings in the inbox (or opens directly if ringing is off in Settings).

### 7.6 Wrap-up back to the record

The workspace's own **Log call & wrap up** writes the activity for you. To log from Genesys instead, call **Log Interaction** at wrap-up with the `taxpayerId` from the lookup.

---

## 8. Customizing

Customizations fall into two kinds:

- **Environment variables** in Render (like `DEMO_PHONES`): change them in the dashboard; the service restarts in about a minute.
- **Code changes** in `lib/seed.js`, `lib/brands.js` or `public/`: edit the file (on GitHub, use the pencil icon), commit to `main`, and Render redeploys in a few minutes. Locally, restart `node server.js` or use `npm run dev`.

Edits you make in the app (new contacts, payments, address changes) only last until the next reset. To make something permanent, put it in `lib/seed.js`.

### 8.1 Map your cell phone to a taxpayer

To call the Genesys number from your own phone and have Charlotte pop, set `DEMO_PHONES` in Render (service > **Environment**):

```
DEMO_PHONES=3175551234=tp-1001
```

The format is `yourNumber=taxpayerId`. Separate several mappings with commas:

```
DEMO_PHONES=3175551234=tp-1001,3175559876=tp-1002,+1 (317) 555-4321=tp-2001
```

- The number can be in any format; only the last 10 digits matter. Don't use commas or `=` inside it.
- Your number is added to the taxpayer as a primary "Mobile (demo)" phone, and the seeded number still works.
- Two people can share one number by mapping it to two taxpayers; the pop then shows the picker.
- Because the mapping uses the taxpayer ID, it keeps working after a brand switch (which changes the seeded area codes).
- It survives resets and restarts, because it is reapplied every time data is seeded.

Taxpayer IDs:

| ID | Taxpayer |
|---|---|
| `tp-1001` | Charlotte Gong (main story) |
| `tp-1002` | Marcus Johnson |
| `tp-1003` | Raj Patel |
| `tp-1004` | Priya Patel |
| `tp-1005` | Linda Okafor |
| `tp-2001` | Riverbend Brewing Co. LLC |
| `tp-1007` | Thomas Reed (his CPA, Elena Ruiz, calls from his "Representative" phone) |
| `tp-1008` | Anika Choudhury |
| `tp-1009` | Maria Delgado |

To check it worked, open `https://YOUR-HOST/api/taxpayers/lookup?phone=3175551234&apiKey=YOUR_KEY`. It should return `"found": true` and the taxpayer's name.

### 8.2 Add or change agents

Agents are the `users` list near the top of `lib/seed.js`:

```js
const users = [
  { id: 'u-1', name: 'Richie Barnes', role: 'Taxpayer Services Agent', persona: 'agent', email: `richie.barnes@${brand.emailDomain}`, group: 'Individual Income Tax' },
  ...
];
```

| Field | Notes |
|---|---|
| `id` | Unique, e.g. `u-4`. Push pops can target it as `agent`. |
| `name`, `role`, `group` | Shown on the sign-in page, home page and wrap-ups. `group` should be one of the `groups` listed just below `users`. |
| `persona` | Used by `?persona=` on pop URLs. Keep it unique if you want to pop straight into that agent. |
| `email` | The persona's default agent email for push pops. Use a real address (for example your Genesys login) to avoid changing it in Settings every time: `email: 'chad@example.com'`. |

Cases are assigned by agent name (`assignedTo: 'Richie Barnes'` in the `cases` list), and Charlotte's earlier chat names Richie in her activity history and transcript. If you rename Richie, search `lib/seed.js` for "Richie Barnes" and update those too. Also, `public/js/ai.js` uses the signed-in agent's first name in the transcript automatically.

The other names on the Home page leaderboard and scorecard (Allen Robinson, Gabriela Duran, Daniel Navarro) are fixed text in `public/js/app.js`; search for "Allen Robinson" to change them.

### 8.3 Add or edit taxpayers

Taxpayers are created by the `taxpayer({...})` calls in `lib/seed.js`. The easiest way to add one is to copy an existing block that's close to what you want, then change it.

A minimal individual:

```js
taxpayer({
  id: 'tp-1010', firstName: 'Jordan', lastName: 'Miller', tin: '***-**-1234', dob: '1990-06-01', filingStatus: 'Single',
  phones: [{ type: 'Mobile', number: ph(0, '0110'), primary: true }],
  email: 'jordan.miller@example.com', address: addr('100 High St.', 0),
  flags: ['Refund on hold'],
  returns: [
    { id: `RTN${TY % 100}012345`, taxYear: TY, form: F.individual, taxType: T.individual, filed: date(-30), method: 'e-File', status: 'Processing',
      refund: { amount: 500.00, status: 'Processing', method: 'Direct deposit' }, balanceDue: 0,
      steps: steps([['Return received', 'Complete', -30], ['Return processed', 'In progress', null]]) },
  ],
});
```

Helpers you can use inside `seed.js`:

| Helper | Meaning |
|---|---|
| `ph(i, '0110')` | Phone number using the brand's i-th area code: `ph(0, '0110')` is (614) 555-0110 for Ohio. Or write a literal number, e.g. `'(317) 555-1234'`. |
| `addr('100 High St.', i)` | Address in the brand's i-th city, with state, ZIP and county filled in. |
| `date(-30)` | 30 days before the day the data is seeded (`date(5)` is 5 days from now). Dates are relative so notices and due dates always look current. |
| `day(-4, '13:20')` | Date and time, for activities and cases. |
| `TY` | The most recent tax year (last year). |
| `F.individual`, `T.individual`, etc. | The brand's form numbers and tax type names, so the record matches the branding. |
| `steps([[name, status, dayOffset], ...])` | Processing steps shown on a return. Status words drive the color: Complete/Verified/Scheduled show green, Undeliverable/Missed red, Pending/Hold/Progress/Requested amber. |

Fields on a taxpayer (anything you leave out gets a sensible default):

| Field | Notes |
|---|---|
| `id` | Unique. Use `tp-` plus a number not already used. This is what `DEMO_PHONES` and `?taxpayerId=` refer to. |
| `type` | `Individual` (default) or `Business`. Businesses also need `businessName` and usually `dba`, `contact`, `accounts`. |
| `firstName`, `lastName`, `tin`, `dob`, `filingStatus`, `spouse` | Identity details. `tin` is shown masked as written; its last 4 digits are used by `?last4=` and the identity check. |
| `phones` | List of `{ type, number, primary }`. Any of them matches a screen pop. |
| `email`, `address`, `previousAddress`, `schoolDistrict`, `language`, `preferredContact`, `portalEnrolled` | Profile. `language: 'Spanish'` triggers the interpreter recommendation. |
| `flags` | Badges on the record, e.g. `'Refund on hold'`, `'Balance due'`, `'Response due'`, `'POA on file'`. Several drive recommendations. |
| `identity` | `{ status: 'Verified' }` by default. Use `{ status: 'Hold', reason: '...' }` to require verification before a refund can be released. |
| `returns` | Returns, each with an optional `refund` (`amount`, `status`, `method`, `hold`) and `steps`. A refund with `status: 'On hold'` gets the **Release** action. |
| `assessments` | Balances owed: `assessed`, `penalty`, `interest`, `paid`, `balance`, `due`. A positive `balance` enables payments and payment plans. |
| `payments`, `paymentPlan` | Payment history and an existing plan. |
| `notices` | Letters: `letter`, `type`, `date`, `status`, `due`, and optionally `amount` and `returnId`. |
| `bank` | `{ type, last4, bank }` for direct deposit. |
| `representative` | `{ name, firm, phone, form, expires, scope }` for a POA. Add the rep's number to `phones` with type `Representative` so their calls match. |
| `activities` | History shown on the Activity tab. |

To give a new taxpayer an open case, add an entry to the `cases` list further down (copy one and set `taxpayerId`, a unique `id` and `number`).

**Editing an existing taxpayer**: find their block by name and change the values, for example Charlotte's refund amount (`refund: { amount: 1284.00, ...}`) or her email. Charlotte's scripted transcript in `public/js/ai.js` reads her name, refund amount, tax year and form from the record, but some lines mention specifics (her date of birth, "4471", "Old Mill Road", "Neil Avenue", chatting "four days ago"). If you change those details in `seed.js`, update the matching lines in the `transcript` function in `public/js/ai.js` too. The transcript only runs for `tp-1001`.

**Adding a taxpayer during a demo**: when a pop finds no match, **New contact** creates a taxpayer from the form. It lasts until the next reset.

### 8.4 Add or change branding

Agencies are defined in `lib/brands.js`. The default, `ohiotax`, is the base: any field a brand leaves out is taken from it.

To add an agency, copy the `pinecrest` block, give it a new key and `id`, and change the values:

```js
  indianatax: {
    id: 'indianatax',
    agency: 'Indiana Department of Revenue',
    shortName: 'Indiana DOR',
    state: 'Indiana', stateAbbr: 'IN',
    emailDomain: 'dor.in.example',
    supportLine: '(800) 555-0170',
    portal: 'INTIME',
    refundTool: 'Check My Refund',
    forms: { individual: 'IT-40', amended: 'IT-40X', schoolDistrict: 'County', sales: 'ST-103', cat: 'Business Tax', poa: 'POA-1' },
    taxTypes: { individual: 'Individual Income Tax', schoolDistrict: 'County Income Tax', sales: 'Sales and Use Tax', cat: 'Business Tax' },
    areaCodes: ['317', '219', '260', '812', '765', '574'],
    cities: [['Indianapolis', '46204', 'Marion'], ['Gary', '46402', 'Lake'], ['Fort Wayne', '46802', 'Allen'], ['Evansville', '47708', 'Vanderburgh'], ['Lafayette', '47901', 'Tippecanoe'], ['South Bend', '46601', 'St. Joseph']],
    schoolDistricts: ['Indianapolis Public Schools', 'Gary Community Schools', 'Fort Wayne Community Schools'],
    timeZone: 'America/Indiana/Indianapolis',
    logo: { image: 'https://example.com/logo.png', wordTop: 'Indiana', wordBottom: 'Department of Revenue' },
    theme: { nav: '#1f2a44', navText: '#ffffff', accent: '#2b5aa8', accentSoft: '#e7eef9', highlight: '#c8102e', railTop: '#1f2a44', railBottom: '#c8102e' }
  },
```

| Field | Where it shows |
|---|---|
| `id` | Used by `BRAND`, `?brand=` and Settings. Must match the object's key. |
| `agency`, `shortName`, `workspaceName` | Sign-in page, header, browser tab title, emails. |
| `state`, `stateAbbr` | Addresses and wording such as "prior-year Ohio AGI". |
| `emailDomain` | Agent email addresses. |
| `supportLine`, `portal`, `refundTool` | Knowledge articles, notices and the Now Assist answers. |
| `forms`, `taxTypes` | Form numbers and tax type names on returns, notices and accounts. |
| `areaCodes`, `cities`, `schoolDistricts` | Seeded phone numbers and addresses. Keep at least six area codes and cities so every taxpayer gets one. Changing area codes changes the demo numbers; `DEMO_PHONES` mappings still work. |
| `timeZone` | The agency's "today", which sets relative dates and the daily reset. |
| `logo.image` | URL of a horizontal logo, shown on a white badge. Leave empty for a text wordmark. You can also put an image file in `public/img/` and use `'/img/yourlogo.png'`. |
| `logo.wordTop`, `logo.wordBottom` | Two-line text wordmark, used when there is no image or it fails to load. |
| `theme.nav`, `theme.navText` | Header background and text. |
| `theme.accent`, `theme.accentSoft` | Buttons, links, selected tabs, and light highlight backgrounds. |
| `theme.highlight` | Alert accents. |
| `theme.railTop`, `theme.railBottom` | The left rail's gradient. |

After the change is deployed, choose the brand in any of these ways:

- **Settings > Brand** in the app (reseeds the data).
- `https://YOUR-HOST/?brand=indianatax` (reseeds the data).
- Set `BRAND=indianatax` in Render to make it the default after restarts and resets.

Matching a real agency: take colors from their website (a browser's color picker or the page's CSS), and use a logo you have permission to use. The Ohio colors are approximations of tax.ohio.gov and the Ohio logo is loaded from tax.ohio.gov.

**Don't delete brands.** Add new ones alongside the existing ones so earlier demos keep working.

### 8.5 Edit other data

All in `lib/seed.js`:

| Data | Where |
|---|---|
| Case assignment groups | The `groups` list under `users` |
| Cases | The `cases` list. `number` is the CS number shown; `assignedTo` is an agent name; `state` is New, Work in progress, Awaiting info or Resolved. |
| Knowledge articles | The `kb` list: `id`, `title`, `category`, `summary`, `body`. Recommendations and Now Assist search these. |

The Genesys page simulator's queue and intent lists, and the Home page schedule and queue figures, are in `public/js/app.js`.

### 8.6 Change data during a demo

Everything the app does goes through the API, so you can also set up a scenario with `curl` before recording. For example, add a phone to a taxpayer:

```bash
curl -X PATCH https://YOUR-HOST/api/taxpayers/tp-1002 -H "Content-Type: application/json" \
  -d '{"phones":[{"type":"Mobile","number":"3175551234","primary":true},{"type":"Mobile","number":"6145550142"}]}'
```

Changes like this last until the next reset. See `/api-docs.html` for every endpoint.

---

## 9. Data, resets and persistence

The server keeps all data in memory and builds it fresh from `lib/seed.js`:

| When | What happens |
|---|---|
| Server start or restart (including a Render deploy, an env var change, or waking from sleep) | Data is reseeded |
| The first request on a new day in the brand's time zone | Data is reseeded, unless `RESET_DAILY=false` |
| **Settings > Reset demo data**, or `POST /api/admin/reset` | Data is reseeded |
| Brand switch (Settings, `?brand=`) | Data is reseeded with the new brand |

Reseeding brings back the original state, re-dates everything relative to today, and reapplies `DEMO_PHONES`. Anything done in the app since then (payments, released refunds, new contacts, notes) is gone. There is no database, so permanent changes go in `lib/seed.js`.

Browser-side settings (signed-in persona, agent email, ringing, open tabs) are saved in the browser and are not affected by a reset, except that reset closes open tabs.

---

## 10. Troubleshooting

| Symptom | Check |
|---|---|
| Site takes a minute to load | The free Render instance was asleep. Open it a minute before you need it. |
| My data changes disappeared | The service restarted, slept, crossed midnight or was reset. See [section 9](#9-data-resets-and-persistence). |
| Push pop doesn't appear | The response's `deliveredTo` is 0: the agent email in the request doesn't match Settings in any open browser. Check the Genesys page says **Listening for screen pops**, and match the emails (case doesn't matter). |
| Pop says "No taxpayer found" | The number isn't on any taxpayer. Check the last 10 digits, or add it with `DEMO_PHONES`. Test with `/api/taxpayers/lookup?phone=...`. |
| My cell phone doesn't match | Format is `number=taxpayerId` (equals sign, not colon), with no commas inside the number. The service must restart after the change, which Render does automatically. |
| Data action returns 401 | The integration's `apiKey` credential doesn't match `API_KEY` in Render. |
| Data action fails to reach the host | The Request URL Template still points to `snow-mock-ui.onrender.com` but your service has a different URL. |
| Record is blank inside Genesys | Check `FRAME_ANCESTORS` is `*` or includes your Genesys apps domain. |
| Interaction Widget opens with no caller | The widget only sends the conversation ID. Set the `GENESYS_*` variables ([7.4](#74-interaction-widget)) or pass `phone` too. |
| Logo shows as text | The logo URL failed to load; the text wordmark is the fallback. Host the image in `public/img/` instead. |
| "Release" is refused | Verify the taxpayer's identity first. |
| Demo resets on every pop | Remove `brand=` from the pop URL. |

---

## 11. Reference

- **API reference**: `https://YOUR-HOST/api-docs.html`
- **Health check**: `https://YOUR-HOST/api/health` (version, brand, date seeded, whether Genesys lookup is configured)
- **Genesys page** in the app: URL templates for your host, a call simulator and recent pops
- **README**: [../README.md](../README.md)
