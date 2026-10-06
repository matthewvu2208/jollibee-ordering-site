# Jollibee ordering concept

Vietnamese ordering website built with Vinext, React, Cloudflare D1 and the Sites starter. Product names, reference prices and original images are sourced from official Jollibee Vietnam pages; per-product citations are in `lib/catalog.ts` and shown in the product dialog. Snapshot checked 2026-09-29. Brand imagery remains the property of its owners. This is an independent demonstration, not an official restaurant ordering channel.

## Implemented
- Delivery, timed pickup and table reservation; explicit review and confirmation.
- Twelve catalog items, category/search, quantity controls, order totals computed on the server.
- Vietnamese scripted chat: a single open greeting, customer-led menu selection until “Mình chọn xong”, one question per turn, contextual short answers, pauses while customers choose, multi-slot requests, add/remove items, address/time/people/notes changes, ingredient uncertainty response.
- D1 orders with per-user ownership, idempotent creation, version-checked edits and cancellations. Accepted demo orders are locked.
- Account-backed taste preferences, delete/disable controls, support requests with draft/chat context, feedback.
- Online payment and refunds are **simulated only**. No financial transaction occurs.
- Mobile cart/chat shortcuts, keyboard controls, reduced-motion handling and browser WebMCP read/stage tools.

## Connection boundaries
No POS, payment gateway, shipper, Grab/ShopeeFood API, live promotions, menu inventory, distance/geocoding, customer-service agent is connected. The OpenAI adapter is implemented but requires a server-side API key; it has not been validated against the live provider. See `docs/BAT-AI.md`. Districts 1–5 are demo locations, not confirmed branch addresses or table availability. Delivery fee 15,000 VND and 30–45 minute ETA are labeled samples. Requests are saved as demo records; they are not delivered to Jollibee. Refund requests have no real money and no promised processing SLA.

## Local run
Node >=22.13.0. Run `npm run install:ci`, then `npm run dev`. Open the printed loopback URL. Local sign-in is `/signin-with-chatgpt?return_to=/`; hosted sign-in is owned by Sites.

For a fresh local database, build with the Sites build helper (or `npm run build`), then run:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_mighty_silverclaw.sql
```

Do not replay an already-applied migration. Production schema is applied by Sites during publication.

## Validation
TypeScript check and production build; API tests cover all three service modes, authoritative pricing, duplicate submission, quantity validation, stale version, accepted-order lock, preference persistence/deletion and support/feedback. Scripted intent tests cover multi-slot pickup/table, item changes, allergy routing and invalid dates. UI delivery confirmation and table chat verified. Responsive layout checked at 320, 375, 414 and 768 pixels with no horizontal overflow; all 12 product images loaded. WebMCP staging and invalid-product rejection verified.

Test files: `tests/api-check.py` (local-only fake data); `tests/order-check.mjs` and `tests/chat-check.mjs`. Compile `lib/order.ts` and `lib/chat.ts` into `.sites-runtime/order-test.mjs` and `.sites-runtime/chat-test.mjs` with esbuild before running the chat tests. Conversation tests cover each service flow, short replies, waiting, questions without cart changes, skipping known information, invalid dates, and keeping food quantities/phone numbers out of addresses.

## Sites publication
Project id is preserved in `.openai/hosting.json`. Site registration initially succeeded; current connector returns `project_not_found` for that exact id, and no owned sites are listed. No successful public/private deployment has been confirmed. Restore access to the original Site before running the Sites publishing workflow; do not replace the id or create a duplicate without resolving the service state.

## Public Cloudflare demo

The standalone Cloudflare deployment supports separate guest sessions, all three demo service modes and optional OpenAI conversation. Session signatures prevent callers from choosing another visitor's identity. See [Cloudflare deployment](docs/CLOUDFLARE.md). The original Sites identity remains preserved; this deployment does not depend on restored Sites access. [Try the demo](https://jollibee-chatbot-demo.matthewvu2208.workers.dev). This publication uses scripted conversation; OpenAI is intentionally not enabled.

## AI conversation setup
Optional server-side OpenAI Responses integration with conversational history and validated draft patches. No order/payment tools are exposed to the model. UI explicitly distinguishes configured AI, scripted demo and provider failure. API credentials are never sent to the browser. Setup: [Bật AI](docs/BAT-AI.md). Contract tests: `tests/ai-chat-check.mjs` (bundle `lib/ai-chat.ts` to `.sites-runtime/ai-chat-test.mjs` with esbuild first); mocks are not live-model evaluation.
