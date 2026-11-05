# snow-mock-ui

A clickable mock of a ServiceNow-style CSM agent workspace. It is built for recording Genesys Cloud + ServiceNow demo videos: a customer chats, later calls, gets routed to a human agent by Genesys predictive routing, and the call screen-pops in the workspace.

It is plain HTML/CSS/JS with no build step, so GitHub Pages serves it as is.

## Scenes

Open the site with `?scene=` or press the number keys:

| Key | Scene | What happens |
| --- | --- | --- |
| 1 | `chat` (default) | Agent starts Offline. Set status to **Available** and a chat from the customer rings in the inbox. Accept it, click the AI suggested replies, use **Check Inventory**, then **End chat** to generate the chat summary. |
| 2 | `call` | Agent is on a chat with a second customer. After 4 seconds, the customer's phone call rings in the same inbox. |
| 3 | `call-live` | Jumps straight to the accepted call (screen pop). |
| 4 | `home` | Agent home page: schedule and adherence, evaluations, scorecard, leaderboard. |

Call flow: the live transcript streams by itself and pauses until the agent does the matching step.
1. Open **Customer Order > Product** or **Initiate pickup > Check store availability** to see in-store stock.
2. **Initiate pickup**, then **Next**, then **Create request**.
3. **Compose > Email**. Now Assist drafts the pickup confirmation; click **Send**.
4. **Add bonus points** (next best action). The points balance and history update.
5. Hang up. The wrap-up code and the Agent Copilot call summary fill in. Click **Save**.

## Presenter controls

Press `` ` `` (backtick) or click the bottom-left corner of the screen to open a hidden panel with scene jumps, brand switching, and:

- `I`: ring the next work item now
- `M`: advance the customer's next chat message or transcript line, even past a pause
- `R`: reset the current scene

Add `?auto=0` to stop work items ringing on their own (then use `I`).

## Branding

Every name, color, logo, order, product, store and price comes from `brands.js`. To add a customer:

1. Copy the `northwind` block in `brands.js`, give it a new key such as `acme`, and change the values. Anything you leave out falls back to the Haven & Hill defaults.
2. Open the site with `?brand=acme`.

`logo.image` takes a URL or a `data:` URI for a square logo; without it, `logo.text` is shown in the top-left mark. Chat lines, the call transcript, the email and the AI summaries are generated from these fields in `scenario.js`.

Example: `?brand=northwind&scene=call`

### Built-in brands

| `?brand=` | Brand | Story |
| --- | --- | --- |
| `haven` (default) | Haven & Hill (furniture retailer) | Missing ottoman, store pickup, bonus points |
| `northwind` | Northwind Outdoors (sample) | Same retail story, different names and colors |
| `ohiotax` | Ohio Department of Taxation | Refund held for identity verification, agent verifies by phone, releases the refund, switches it to direct deposit |

A brand with `vertical: 'tax'` uses the tax-agency story in `tax.js` instead of the retail one. Any brand can be copied and edited, and old brands keep working.

This is an original mock built for demos. It is not affiliated with ServiceNow or Genesys, and it does not use their code or assets.
