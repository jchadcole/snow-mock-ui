# Mock ServiceNow CSM workspace for a state tax agency (Genesys Cloud demos)

A self-contained web app that looks and works like a ServiceNow CSM Configurable Workspace set up for a state department of taxation, with the APIs Genesys Cloud needs to screen pop a caller's taxpayer record. Default branding is the **Ohio Department of Taxation**; other agencies are a config entry away. Every taxpayer, number and amount is fictional (phones use the 555-01xx range). Not affiliated with or endorsed by ServiceNow, Genesys or any state agency.

No dependencies and no build step: Node 18 or newer runs it.

```
node server.js          # http://localhost:8080
PORT=3000 node server.js
```

## What works

- **Sign in** as a persona: Richie Barnes (Taxpayer Services Agent), Dana Whitfield (Business Tax Specialist) or Morgan Lee (Supervisor).
- **Home**: my open cases, schedule and adherence, queue stats, recent interactions, Insights / Scorecard / Schedule tabs.
- **Inbox** with presence. Pushed Genesys interactions ring here with Accept / Decline and a countdown.
- **Taxpayer record** with tabs for Overview, Returns (processing steps), Refunds, Balances & payments, Notices, Cases, Identity, Activity and Profile.
- **Active interaction column** with the call card, timer, hold / mute, an identity badge, Genesys details (queue, intent, conversation ID), outcomes, a live transcript for the main caller, and **Log call & wrap up** (AI summary, wrap-up code, link and resolve a case).
- **Working actions**:
  - Verify identity (knowledge-based questions), release a held refund, switch it to direct deposit, trace a refund.
  - Take a payment, set up a payment plan.
  - Re-send or extend a notice, view the letter.
  - Update the mailing address (re-sends returned mail), compose an AI-drafted email, log a contact.
  - Create, update, work-note and resolve cases.
- **Recommendations panel**: next best actions driven by the record (held refund, balance due, response due, delinquent return, POA, interpreter, offset), plus a matching knowledge article.
- **Now Assist** panel (rule-based answers from the record and the knowledge base), global search, lists, knowledge base, and new contact for unknown callers.
- **Genesys page** (phone icon on the rail): simulate a call by push or by URL, see the URL templates, and view recent pops.
- **Settings** (click the avatar):
  - Agent email used for push pops, ring in inbox or open directly, and the brand switch.
  - Reset demo data and switch user.

All changes are saved on the server, so a pop from Genesys, a data action and the browser all see the same data. Data reseeds on restart, daily (`RESET_DAILY=false` to stop that), and from Settings > Reset demo data.

## Demo callers (Ohio brand)

| Number | Taxpayer | Story |
|---|---|---|
| (614) 555-0184 | Charlotte Gong | **Main story.** Refund of $1,284 on hold for identity verification, and the quiz letter came back undeliverable. Verify, release, switch to direct deposit, email a confirmation, wrap up. The scripted transcript advances as you act. |
| (614) 555-0142 | Marcus Johnson | Billing notice balance: take a payment or set up a payment plan |
| (216) 555-0131 | Raj and Priya Patel | Shared phone: two matches, picker |
| (937) 555-0163 | Linda Okafor | W-2 request for information due soon: extend the due date |
| (614) 555-0199 | Riverbend Brewing Co. LLC | Business: delinquent sales tax return, estimated assessment |
| (513) 555-0155 | Elena Ruiz, CPA (for Thomas Reed) | Authorized representative, amended return |
| (216) 555-0161 | Anika Choudhury | Estimated payment still posting |
| (330) 555-0177 | Maria Delgado | Spanish speaker, refund partly offset to child support |
| (419) 555-0124 | Tom Harper | **Pilot virtual agent stories** (see below): 2025 refund held while received documentation is reviewed; notice 1234 for a 2024 balance he already paid by check |
| any other | none | New contact |

`DEMO_PHONES` adds your own test phone to a demo taxpayer, comma-separated, as either `6145550184:+13175551234` (seeded number : your number) or `3175551234=tp-1001` (your number = taxpayer ID).

## Pilot virtual agent scenarios (Tom Harper)

The virtual agent ("Pilot") runs in Genesys Cloud. This app only shows what ServiceNow would show.

**1. Refund status, contained by Pilot.** Pilot authenticates Tom with SSN and date of birth. It then explains that his 2025 refund of $842.17 (direct deposit, return received Apr 14) is held while supporting documentation is reviewed. The documentation has been received, so nothing needs to be resent. No agent is involved. Genesys posts the session (`POST /api/bot-sessions`, outcome `Contained`). The record then shows a **contained virtual agent interaction** in Activity, with Pilot's summary and a **View Pilot transcript** button.
- For Pilot's lookup, use `GET /api/taxpayers/lookup?ssn=900556789&dob=1978-03-22`. These are demo values: SSN 900-55-6789, DOB 03/22/1978. The response includes `refundStatus`, `refundAmount`, `refundMethod`, `returnReceived`, `returnStatus` and `documentationStatus`.

**2. Notice for a payment already made, transferred to an agent.** Pilot collects notice 1234, tax year 2024, $2,200, and a check mailed July 1. It shares the Respond to a Letter or Notice link, and Tom asks for a live agent. Genesys posts the session (outcome `Transferred`), then screen pops with the same `conversationId`. The agent sees:
- a **Pilot handoff card** with intent, confidence, collected details and the shared link;
- **Pilot's transcript**, then a "Transferred to" divider and the live call transcript.

The agent verifies Tom and finds his check in **Unapplied payments (suspense)**. One click on **Apply payment** clears the balance and resolves the notice. The agent can then email a confirmation and wrap up.

Without Genesys you can use:
- **Genesys page > Pilot virtual agent handoffs**: sends the same sample sessions Genesys would post.
- **`/pop?scenario=notice-paid`**: opens the transfer pop directly.

Import `genesys/log-bot-session.json` to post real Pilot sessions. Its `transcript` input takes one `Speaker: text` line per utterance.

## Screen pops from Genesys Cloud

**By URL** (Script web page, Interaction Widget, or the agent's browser):

```
https://YOUR-HOST/pop?phone={{Call.Ani}}&conversationId={{Scripter.Interaction ID}}&queue={{Scripter.Queue Name}}&intent={{Intent}}&embed=1
```

You can also pass `taxpayerId`, `returnId` or `last4` in place of `phone`. `tab=refunds|balances|notices|...` picks the tab; otherwise the intent decides. `embed=1` gives a compact layout for an iframe.

**By push**: `POST /api/screenpop` with `{phone, agent, conversationId, queue, intent, mediaType}`. Every open workspace whose agent email (Settings) matches gets the pop over Server-Sent Events.

**Data actions**: import the JSON files in [`genesys/`](genesys/) into a Web Services Data Actions integration, then change the host to yours.
- `lookup-taxpayer-by-phone.json`: for the bot or IVR, returns refund status, balance and identity status before routing.
- `push-screen-pop.json`
- `log-interaction.json`
- `log-bot-session.json`: Pilot's session (contained or transferred) with summary, details and transcript

Full reference: `/api-docs.html` on the running app.

## Hosting on Render (free)

1. On https://render.com, sign in with GitHub and choose **New > Blueprint**.
2. Pick `jchadcole/snow-mock-ui`. Render reads `render.yaml` and creates the `snow-mock-ui` web service.
3. When it is live, open `https://snow-mock-ui.onrender.com` (or the URL Render shows). The generated `API_KEY` is under the service's **Environment** tab. Genesys data actions send it as `x-api-key`. The built-in Genesys page doesn't need it.

Free instances sleep after 15 minutes idle; open the URL a minute before a recording. A `Dockerfile` is included for any other host.

| Env var | Purpose |
|---|---|
| `BRAND` | Default agency (`ohiotax`, `pinecrest`) |
| `API_KEY` | Required on `/api/screenpop` and `/api/taxpayers/lookup` when set |
| `FRAME_ANCESTORS` | Who may iframe the app (default `*`) |
| `PUBLIC_URL` | Base URL used in `popUrl` responses |
| `DEMO_PHONES` | Remap seeded phones to real test numbers |
| `RESET_DAILY` | `false` keeps data across days |
| `GENESYS_REGION`, `GENESYS_CLIENT_ID`, `GENESYS_CLIENT_SECRET` | Optional: look up the caller from a `conversationId` alone |

## Branding

Agencies live in [`lib/brands.js`](lib/brands.js):
- Name, workspace name, portal and tools, form numbers and tax types.
- Area codes and cities used in the seed data.
- Logo, with a text wordmark fallback.
- Colors.

To add one, copy a block, change the values and redeploy. Then pick it in Settings > Brand, with `?brand=<id>`, or with the `BRAND` env var. Switching reseeds the data with that agency's names. The Ohio colors are approximations of tax.ohio.gov, and the logo is loaded from tax.ohio.gov with a text fallback.

## Retail guided demo

The original Haven & Hill retail demo (the scripted Charlotte Gong ottoman story, with brands `haven`, `northwind` and `ohiotax`) is still at **`/retail/`**. Its presenter panel opens with the backtick key.
