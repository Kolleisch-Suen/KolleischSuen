# Agent Notes for KolleischSuen

This repository is a small high-school IT project for replacing paper school-fair tickets with a minimal Hive-backed token payment flow. Keep the implementation practical, auditable, and easy for non-technical operators to use during a busy fair.

## Project Context

- App: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4.
- Current state: bare `create-next-app` skeleton plus a README describing the intended payment flows.
- Teaching goal: this is intentionally a "full Monty" school project, including PostgreSQL and Prisma even where static files would be enough.
- Domain: internal school-fair voucher system, not a general payment processor.
- Blockchain: Hive mainnet with Hive-Engine token transfers through `custom_json`.
- Core roles: cashier, customer, vendor, organizer.
- Account provisioning is out of scope for this app. Assume customer Hive accounts already exist or are provided by a separate process.
- Local database: PostgreSQL database `ksuen`; connection string is in `.env.local`, which is gitignored.

## Core Implementation Direction

- Keep Hive-specific code out of UI components. Prefer `src/lib/hive/*`, `src/lib/payments/*`, and `src/config/*` as outlined in `README.md`.
- Use local PostgreSQL with Prisma as part of the teaching goal. Static files would be enough for some configuration, but this project should teach relational modeling, migrations, seed scripts, and basic admin CRUD.
- First useful screens should be role-specific:
  - `/cashier`: issue event tokens to customer accounts.
  - `/vendor`: generate payment request QR codes.
  - `/customer`: load local wallet, scan/open request, confirm transfer.
  - `/organizer`: read-only reconciliation and export/copy summary.
- Treat the cashier flow as the most sensitive UI. Make amount, recipient, token symbol, and confirmation state explicit.
- Treat the customer payment confirmation as the most important trust moment. Vendor, amount, token, and memo should be prominent before signing.
- Use versioned payment request payloads. The initial README shape is the current contract:

```json
{
  "v": 1,
  "chain": "hive",
  "engine": "hive-engine",
  "symbol": "TOKEN",
  "to": "vendor-account",
  "amount": "1.000",
  "memo": "booth or order reference"
}
```

## Security Rules

- Never log, commit, transmit, or persist private keys except in the explicitly intended local browser wallet storage.
- Lesson from Innopay: signing and broadcasting Hive transactions should happen server-side through an API route, not directly in the customer's browser.
- Do not send private keys to arbitrary services. If a customer key must be used for signing, submit it only to the local app's signing API route over HTTPS, use it in memory for that request, and never store or log it.
- If localStorage is used to hold temporary customer wallet material, provide a clear "forget wallet" action.
- Validate Hive account names, token symbols, token amounts, payment request versions, recipient accounts, and memos before building or signing transactions.
- Do not use production fair token/accounts for tests without explicit user confirmation.

## Reference Repositories

Use these sibling folders before inventing new Hive/Hive-Engine code:

### `..\..\OffChain\ocl-governance`

Most relevant for direct reuse in this project.

- `src/lib/hive.ts`
  - `@hiveio/dhive` client setup with multiple public Hive nodes.
  - Account existence and account history helpers.
  - Base transaction construction.
  - `broadcastCustomJson(...)` for active-auth `custom_json`.
  - Formatting helpers for Hive/HBD amounts.
- `src/lib/hive-engine.ts`
  - Hive-Engine RPC URL and request pattern.
  - `buildTokenTransferPayload(to, symbol, quantity, memo)`.
  - `getBalance(account, symbol)` and batch balance fetching.
  - Retry/logging pattern for Hive-Engine RPC calls.
- `src/app/api/cron/scan-transfers/route.ts`
  - Good reference for strict memo parsing and route-specific validators.
- `scripts/set-cursor.ts`, `scripts/list-our-accounts.ts`
  - Useful examples for operational Hive scripts.

For KolleischSuen, the main extract should be a smaller client-side/server-safe version of Hive client, Hive-Engine token transfer payload builders, balance queries, and transaction broadcast helpers.

### `..\..\innopay-full\innopay`

Useful as broader Innopay ecosystem reference. Copy ideas carefully because it is much larger and includes account creation, Stripe, debts, restaurants, and server-side custody assumptions that this project does not currently need.

- `services/hive.ts`
  - Hive account creation/key generation patterns.
  - Existing Hive-Engine EURO token transfer implementation.
  - `custom_json` operation shape for Hive-Engine transfers:
    - `id: "ssc-mainnet-hive"`
    - `required_auths: [senderAccount]`
    - JSON payload with `contractName: "tokens"`, `contractAction: "transfer"`.
- `services/payment-processor.ts`
  - Payment workflow sequencing, debt fallback ideas, and operational logging style.
  - Do not blindly port the restaurant/HBD/debt flow unless the KolleischSuen data model grows to need it.
- `prisma/schema.prisma`
  - Reference for account, transaction id, debt/payment ledger, and spoke account data modeling.
  - Prefer a much smaller data model here unless reconciliation requires persistence.
- `lib/credential-session.ts` and `app/user/*`
  - Reference for browser credential handoff/localStorage, but avoid inheriting unnecessary complexity.
- Root `AGENTS.md`, `SPOKE-DOCUMENTATION.md`, and `PROJECT-OVERVIEW.md`
  - Useful ecosystem context, but Innopay spoke rules are not automatically KolleischSuen requirements.

### `..\..\innopay-full\millewee`

Best reference for the modern Prisma/Next spoke shape, but it is intentionally larger than KolleischSuen needs.

- `prisma/schema.prisma`
  - Use as style reference for Prisma model naming and simple admin/session/transfer tables.
  - Do not copy dishes/drinks/schedules unless the fair app grows into menu management.
- `prisma.config.ts`
  - Prisma 7 config pattern using `.env.local`, `POSTGRES_URL`, and `SHADOW_DATABASE_URL`.
- `lib/prisma.ts`
  - Prisma singleton with `@prisma/adapter-pg`.
- `scripts/seed.ts`
  - Seed-script pattern: load `.env.local`, create Prisma client, seed known rows, disconnect.
  - KolleischSuen should use a tiny seed script with initial booths: `Nourriture`, `Boissons`, `Crémant`.
- `app/api/transfers/sync-from-merchant-hub/route.ts`
  - Reference only. KolleischSuen should not integrate with Innopay merchant-hub unless explicitly requested.

## Data Model Starting Point

Use PostgreSQL/Prisma even when files would be sufficient, because the project is also meant to teach relational modeling and migrations. Start with these concepts:

- `EventConfig`: token symbol, fair name/date, cashier account, known vendor accounts, decimal precision.
- `Booth`: display name, Hive account, sort order, active flag. Initial seed rows: `Nourriture`, `Boissons`, `Crémant`.
- `WalletSession`: customer account and local signing key material stored only in the browser.
- `PaymentRequest`: version, chain, engine, symbol, recipient, amount, memo.
- `TokenTransfer`: sender, recipient, symbol, quantity, memo, Hive transaction id, status, timestamp.
- `CashierIssue`: cashier to customer token issuance, amount, memo, transaction id.
- `SettlementSummary`: issued totals, vendor received totals, variance/refunds/corrections.

Keep persisted records append-only where possible. Blockchain transaction ids should be unique when stored.

## Transfer Verification Architecture

Decision as of 2026-06-04: keep KolleischSuen separate from the full Innopay hub/spoke machinery.

- Do not integrate with `merchant-hub`.
- Do not use HAFSQL polling for v1.
- On cashier issuance or customer payment:
  1. Submit the requested transfer to a local Next.js API route that validates the request, builds, signs, and broadcasts the Hive-Engine `tokens.transfer` `custom_json` server-side.
  2. Immediately insert a `token_transfer` row with status such as `broadcast` and the returned `hive_tx_id`.
  3. Wait a few seconds for Hive-Engine indexing.
  4. Query Hive-Engine directly to verify the transfer/balance effect.
  5. Update the same `token_transfer` row to `confirmed` or `failed`.
- Organizer reconciliation can read from local `token_transfer` rows first, then optionally refresh from Hive-Engine.
- If polling is needed later, build a small local poller/API route that queries Hive/Hive-Engine directly. Keep Redis streams, consumer groups, ACK semantics, and merchant-hub out unless the user explicitly chooses to adopt them.

Suggested stripped-down Prisma concepts:

- `event_config`: fair name, token symbol, precision, cashier account, active flag.
- `booth`: booth name, Hive account, sort order, active flag. Seed initial booths `Nourriture`, `Boissons`, `Crémant`.
- `payment_request`: generated QR request, booth, amount, symbol, memo, payload JSON.
- `token_transfer`: append-style ledger row for cashier issues, customer payments, refunds, and corrections; include unique `hive_tx_id`, status, from/to accounts, optional booth, symbol, quantity, memo, request payload, errors, and timestamps.

## Development Notes

- Use PowerShell commands in docs and handoff notes.
- Prefer `rg` for code search.
- Use focused unit tests first for payment request parsing, amount validation, account validation, and Hive-Engine payload builders.
- Do not run broad production-like blockchain operations during development. Build payloads and validation first, then test with low-risk accounts/tokens.
- Existing untracked or user-created files should be left alone unless they are part of the requested change.
