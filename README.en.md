<p align="center"><a href="./README.md">中文</a> · English</p>

# dsh-receipt — Conversation usage receipt plugin

Adds a "receipt" to the DeepSeek Harness Web GUI: a receipt button in each
conversation's header bar. Clicking it opens that conversation's usage receipt
(receipt-style) showing:
<img width="768" height="203" alt="image" src="https://github.com/user-attachments/assets/4755029b-18d6-4faa-b4f3-b2c14970ca48" />

- **Per-model breakdown**: model name, call count, input / cache-read /
  cache-write / output / reasoning tokens, subtotal cost;
- **Totals**: call count, total tokens, model time, conversation span;
- **Cost**: amortized from the model pricing table (default ¥, currency symbol
  is configurable);
- **Printed-at**: the timestamp of the last event that was counted.
<img width="772" height="811" alt="image" src="https://github.com/user-attachments/assets/87c1d5e1-3b21-4d9b-bf52-28852f51eef3" />

The data is folded from the session log by a host-side `receipt` projection
unit (reusing `assistant/message` usage and model attribution) and refreshed in
real time via `session/projection` frames. The UI only renders; it issues no RPC.

## Installation

Install from GitHub (no local build required):

```sh
# Run from your DeepSeek Harness checkout (when the web profile matches the GUI's profile)
pnpm dsh plugin --profile web add github:bluechips-zhao/dsh-receipt
```

> If you're not comfortable with the command line, just paste this repo link
> `https://github.com/bluechips-zhao/dsh-receipt` to your AI assistant (e.g.
> DeepSeek Harness / any other AI) and let it run the `dsh plugin` install steps
> below for you.

After installing, **restart the GUI** (the receipt button appears on the right of
the session header; open a conversation and click "Receipt").

### Discover more plugins

This plugin is published under the GitHub
[`dsh-plugin`](https://github.com/topics/dsh-plugin) topic, where official and
community plugin repos can be browsed. For a visual, app-store-like experience,
also check out the community-maintained
[DSH-Plugin Hub](https://dsh-plugin.org) (a third-party site, not operated by
DeepSeek).

> The repo **commits the built `lib/`** (`exports` point to `lib/index.js` and
> `lib/client.js`), so users install a ready-to-run artifact without building.
> If you rename this repo or move it to another namespace, update the
> `github:bluechips-zhao/dsh-receipt` segment above accordingly.

## Dependencies, permissions, and compatibility

- **External dependencies**: no external service, no network request, no command
  execution. At runtime the plugin only reads the host-side `receipt` projection and
  `useSessions` row data; every dependency goes through peer / profile fallback
  (`$DSH_HOME/profiles/node_modules`) and never duplicates the Cordis / React /
  schemastery runtime identity.
- **Permissions**: the runtime code (`lib/index.js`, `lib/client.js`) registers one
  projection unit and two slot seats — it does **not** touch the filesystem, read
  credentials, or spawn a subprocess. The host half injects only
  `sessionProjections`; the client half injects only `sessions` / `slots` / `locale`.
- **Build-time signals**: `tsdown.config.ts` uses `node:fs` to read and check emitted
  artifacts, and `scripts/*` read a few environment variables. Both belong to the
  build and self-check toolchain and are not published (`files` ships `lib/` and the
  docs only). A static scan that counts them as permission signals is reading the
  build surface, not the runtime surface.
- **Compatibility**: Node.js `^22.19.0 || >=24`; the per-version DSH declaration
  lives in `package.json` under `dsh.compatibility.dshReleases` (currently verified
  on `0.1.5-rc.1`).
- **Known bounds**: costs are a local estimate from the configured pricing table, not
  a billing record; models missing from the table render as unpriced; peak/off-peak
  is decided from the sample event time (local clock).

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

The plugin bundles DeepSeek's published **off-peak (trough) prices** for the
current lineup — `deepseek-flash` (V4.1-Flash) and `deepseek-v4-pro`, plus the
historical classic models; anything else shows "unpriced" and costs 0. Time-of-day
(peak/off-peak) billing is folded automatically from each sample's time (next
section). To override a default, replace `config` (a full-section replacement) on
the `dsh-receipt` row in the profile's `cordis.patch.yml`:

```yaml
# In your profile's cordis.patch.yml (e.g. <DSH_HOME>/profiles/web/cordis.patch.yml)
- id: dsh-receipt
  config:
    currency: ¥
    pricing:
      # The three entries below are built in; shown here as override examples.
      # Unit: currency per 1M tokens, quoting the off-peak (trough) price.
      deepseek-flash: { input: 1, cacheRead: 0.02, output: 4 }
      deepseek-v4-pro: { input: 4.5, cacheRead: 0.15, output: 13.5 }
      deepseek-chat: { input: 2, cacheRead: 0.5, output: 8 }
```

- Price unit: **currency amount per 1M tokens**; fields: `input` / `cacheRead` /
  `cacheWrite` / `output` / `reasoning`, missing ones count as 0.
- Key precedence: exact model id, then `provider/model` composite key, then the
  **same-price alias** base model (no cross-provider merge is performed).
- **Same-price alias**: the retired names `deepseek-v4-flash` and
  `deepseek-v4-flash-vision-exp` are still callable and are served by
  DeepSeek-V4.1-Flash at Flash prices, so the built-in `PRICING_ALIASES` maps both
  to `deepseek-flash` (configure a retired name separately and its own price wins).
- `currency` only affects the displayed symbol; config changes take effect
  **immediately** via the profile config HMR, no restart needed.

### Time-of-day (peak/off-peak) pricing notes (official pricing page)

Current DeepSeek models use **time-of-day pricing**. The official
[Models & Pricing](https://api-docs.deepseek.com/quick_start/pricing/) page
footnote (3) defines:

- **Peak hours**: Beijing time **Mon–Fri** 9:00–12:00 and 14:00–18:00
  (two windows).
- **Off-peak**: any time outside those windows, **including all day Sat & Sun**.
- The off-peak price is **half** the peak price (peak = off-peak × 2, matching the
  built-in `peakMultiplier: 2`).

| Model | Window | Input (cache miss) | Input (cache hit) | Output |
|---|---|---|---|---|
| `deepseek-flash` (V4.1-Flash) | Off-peak (incl. weekends all day) | ¥1 | ¥0.02 | ¥4 |
| `deepseek-flash` | Weekday peak 9:00–12:00, 14:00–18:00 | ¥2.0 | ¥0.04 | ¥8.0 |
| `deepseek-v4-pro` (V4-Pro-0813) | Off-peak (incl. weekends all day) | ¥4.5 | ¥0.15 | ¥13.5 |
| `deepseek-v4-pro` | Weekday peak 9:00–12:00, 14:00–18:00 | ¥9.0 | ¥0.30 | ¥27.0 |

The receipt folds peak/off-peak from each step sample's timestamp: the built-in
prices are the **off-peak** ones, samples inside a weekday peak window are charged
`peakMultiplier` (default 2), and weekends are always off-peak. The receipt amount
is therefore already time-of-day accurate — no manual doubling. Change the windows
or the multiplier through `peakHours` / `peakMultiplier`.

**Naming and retirement notes (official footnotes 1 and 2)**: use `deepseek-flash`
as the model name; the retired names `deepseek-v4-flash` and
`deepseek-v4-flash-vision-exp` are still callable but are served by V4.1-Flash at
Flash prices (aliases built in). From **2026-09-14 12:00 Beijing time** until V4.1
Pro ships, every `deepseek-v4-pro` request is routed to V4.1-Flash and billed at
**Flash prices** — after that date the real bill will be lower than a receipt
computed at V4-Pro rates, so either change that entry to the Flash price or drop it
and let the built-in alias apply.

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
  match `tokenUsage` (a repeated sample for one step replaces the previous one
  without double-counting — usage lands with `assistant/message`, and the current
  event map has no `assistant/chunk`).
- Client half: the "Receipt" button in `conversation.session.header.actions` +
  the receipt overlay in `shell.overlay`; open state is coordinated through a
  plugin-internal module-level store, and data is read from
  `projectionValues.receipt` on the `useSessions` row (real-time frame driven).
- Dependencies all go through peer / profile fallback
  (`$DSH_HOME/profiles/node_modules`); Cordis / React / schemastery runtime
  identity is not duplicated.
