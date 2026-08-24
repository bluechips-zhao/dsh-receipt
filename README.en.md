<p align="center"><a href="./README.md">中文</a> · English</p>

# dsh-receipt — Conversation usage receipt plugin

Adds a "receipt" to the DeepSeek Harness Web GUI: a receipt button in each
conversation's header bar. Clicking it opens that conversation's usage receipt
(receipt-style) showing:

- **Per-model breakdown**: model name, call count, input / cache-read /
  cache-write / output / reasoning tokens, subtotal cost;
- **Totals**: call count, total tokens, model time, conversation span;
- **Cost**: amortized from the model pricing table (default ¥, currency symbol
  is configurable);
- **Printed-at**: the timestamp of the last event that was counted.

The data is folded from the session log by a host-side `receipt` projection
unit (reusing `assistant/message` usage and model attribution) and refreshed in
real time via `session/projection` frames. The UI only renders; it issues no RPC.

## Installation

Install from GitHub (no local build required):

```sh
# Run from your DeepSeek Harness checkout (when the web profile matches the GUI's profile)
pnpm dsh plugin --profile web add github:bluechips-zhao/dsh-receipt
```

After installing, **restart the GUI** (the receipt button appears on the right of
the session header; open a conversation and click "Receipt").

> The repo **commits the built `lib/`** (`exports` point to `lib/index.js` and
> `lib/client.js`), so users install a ready-to-run artifact without building.
> If you rename this repo or move it to another namespace, update the
> `github:bluechips-zhao/dsh-receipt` segment above accordingly.

## Build (maintainers)

Only **plugin authors/maintainers** need to build; regular users install the
`lib/` artifact directly.

Prerequisites: a local DeepSeek Harness checkout that has been `pnpm install`ed
and built (`node_modules/.bin/tsc` and `tsdown` available). This plugin's build
depends on that checkout's `harness` platform module table and `lightningcss`,
so create two junctions inside this repo:

```powershell
# Inside the dsh-receipt directory; adjust paths to your own machine layout
New-Item -ItemType Junction -Path node_modules -Target "$env:USERPROFILE\.dsh\profiles\node_modules"
New-Item -ItemType Junction -Path harness     -Target "<your DeepSeek Harness checkout path>"
```

Then:

```sh
pnpm run build      # tsc host + client type-check & output, tsdown emits lib/index.js + lib/client.js
```

Artifact contract: `lib/index.js` (host plugin entry), `lib/client.js` (browser
bundle, `window.__ModuleLoader__.load` wrapper), `lib/types/**` (types). The goal
of a build is to keep `lib/` in sync with `src/`; after changing `src/`, rebuild
and commit `lib/` before publishing.

## Configuration (pricing)

By default the plugin only bundles DeepSeek's long-term public classic model
prices; other models show "unpriced" and cost 0. **Configure prices to match
your actual bill**: override `config` (a full-section replacement) on the
`dsh-receipt` row in the profile's `cordis.patch.yml`:

```yaml
# In your profile's cordis.patch.yml (e.g. <DSH_HOME>/profiles/web/cordis.patch.yml)
- id: dsh-receipt
  config:
    currency: ¥
    pricing:
      deepseek-chat: { input: 2, cacheRead: 0.5, output: 8 }        # currency per 1M tokens
      deepseek-reasoner: { input: 4, cacheRead: 1, output: 16 }
      deepseek-v4-flash: { input: 1.5, cacheRead: 0.05, output: 4.5 }   # DeepSeek-V4 off-peak
      deepseek-official/deepseek-v4-pro: { input: 4.5, cacheRead: 0.15, output: 13.5 }
      # deepseek-v4-flash-vision-exp shares the price of deepseek-v4-flash above; no need to add it.
```

- Price unit: **currency amount per 1M tokens**; fields: `input` / `cacheRead` /
  `cacheWrite` / `output` / `reasoning`, missing ones count as 0.
- Key precedence: exact model id, then `provider/model` composite key, then the
  **same-price alias** base model (no cross-provider merge is performed).
- **Same-price alias**: `deepseek-v4-flash-vision-exp` shares the price of
  `deepseek-v4-flash` via the built-in `PRICING_ALIASES` mapping; configuring
  `deepseek-v4-flash` automatically applies to vision-exp (if you configure
  vision-exp separately, its own price wins).
- `currency` only affects the displayed symbol; config changes take effect
  **immediately** via the profile config HMR, no restart needed.

### DeepSeek-V4 peak/off-peak pricing notes (official pricing page)

DeepSeek-V4 uses **time-of-day pricing**. The official
[Models & Pricing](https://api-docs.deepseek.com/quick_start/pricing/) page
footnote (1) defines:

- **Peak hours**: Beijing time **Mon–Fri** 9:00–12:00 and 14:00–18:00
  (two windows).
- **Off-peak**: any time outside those windows, **including all day Sat & Sun**.
- The off-peak price is **half** the peak price (i.e. peak = off-peak × 2).

| Model | Window | Input (cache miss) | Input (cache hit) | Output |
|---|---|---|---|---|
| deepseek-v4-flash | Off-peak (incl. weekends all day) | ¥1.5 | ¥0.05 | ¥4.5 |
| deepseek-v4-flash | Weekday peak 9:00–12:00, 14:00–18:00 | ¥3.0 | ¥0.10 | ¥9.0 |
| deepseek-v4-pro | Off-peak (incl. weekends all day) | ¥4.5 | ¥0.15 | ¥13.5 |
| deepseek-v4-pro | Weekday peak 9:00–12:00, 14:00–18:00 | ¥9.0 | ¥0.30 | ¥27.0 |
| deepseek-v4-flash-vision-exp | Off-peak (incl. weekends all day) | ¥1.5 | ¥0.05 | ¥4.5 |
| deepseek-v4-flash-vision-exp | Weekday peak 9:00–12:00, 14:00–18:00 | ¥3.0 | ¥0.10 | ¥9.0 |

The receipt currently bills at a **single price** (we recommend configuring the
off-peak price, which covers weekend all day and weekday off-peak hours); the
actual weekday peak-hour cost is ~2x the receipt amount, while weekends match
the receipt amount exactly. Precise time-of-day billing could be added in a
later version (folding by step timestamp, distinguishing weekday from weekend).

## Verification

```sh
# Projection/folding logic unit assertions (no dependency scripts; native type-stripping)
node --experimental-strip-types scripts/verify-projection.ts

# GUI end-to-end check (optional: needs the dsh web running on localhost:3080 and
# a Playwright Chromium; paths are configured via env vars, see the top of scripts/gui-check.mjs)
$env:RECEIPT_PLAYWRIGHT = '<DSH repo>/node_modules/.pnpm/playwright@<ver>/node_modules/playwright/index.js'
$env:RECEIPT_CHROMIUM    = '<your chromium.exe path>'
node scripts/gui-check.mjs

# Confirm the config layer is included in the composition
pnpm dsh --profile web --dump-config | findstr dsh-receipt
```

## Implementation notes

- Host half: the `receipt` projection unit in `src/projection.ts` — pure
  synchronous folding, state is plain JSON (persistable cache), `view` computes
  cost from the pricing table captured at registration; replacement semantics
  match `tokenUsage` (chunk sample → message final value within a step, whole
  step replaces without double-counting).
- Client half: the "Receipt" button in `conversation.session.header.actions` +
  the receipt overlay in `shell.overlay`; open state is coordinated through a
  plugin-internal module-level store, and data is read from
  `projectionValues.receipt` on the `useSessions` row (real-time frame driven).
- Dependencies all go through peer / profile fallback
  (`$DSH_HOME/profiles/node_modules`); Cordis / React / schemastery runtime
  identity is not duplicated.
