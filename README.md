# KolleischSuen

KolleischSuen is a small school-fair payment project for replacing ad-hoc paper money with a minimal Hive-backed token payment flow.

The high school runs several fairs each year. At each fair, a central cashier currently exchanges euros for paper tickets. Customers then use those tickets at student and parent-run stalls for cakes, drinks, salads, and other items. This project keeps the same operational model, but replaces paper tickets with a Hive-Engine token held in temporary Hive wallets.

## Current State

This repository is currently a bare Next.js app skeleton generated with `create-next-app`.

Existing stack:

- Next.js 16 app router
- React 19
- TypeScript
- Tailwind CSS 4
- ESLint

The Hive, Hive-Engine, wallet, QR, cashier, customer, and vendor flows still need to be implemented.

## Blockchain Model

- Chain: Hive mainnet
- Client library: `@hiveio/dhive`
- Token layer: Hive-Engine L2
- Token operations: Hive `custom_json` operations targeting Hive-Engine
- Fees: Hive has zero transaction fees, so the system can use mainnet directly

Customer account provisioning is treated as a separate concern and is intentionally outside this plan. The app will assume that customer Hive accounts already exist or are supplied by a separate process.

## Core Roles

### Cashier

The cashier converts euros into event token balances.

Planned capabilities:

- Load or configure the cashier account.
- Enter a customer Hive account and amount.
- Broadcast a Hive-Engine token transfer from the cashier account to the customer account.
- Show transfer status and recent cashier transactions.
- Optionally support refunds or balance corrections.

### Customer

The customer uses a phone as a temporary event wallet.

Planned capabilities:

- Load wallet credentials into browser localStorage.
- View token balance.
- Scan or open a vendor payment request.
- Confirm the requested amount, vendor, and memo.
- Sign and broadcast the Hive-Engine transfer.
- Show payment success or failure in a way that is easy for stall operators to verify.

### Vendor

The vendor receives event token payments.

Planned capabilities:

- Configure a vendor Hive account.
- Generate QR payment requests for fixed or entered amounts.
- Include token symbol, amount, vendor account, and optional booth/order memo.
- Show recent received payments for reconciliation.

### Organizer

The organizer needs enough visibility to reconcile the fair.

Planned capabilities:

- Configure event token symbol and known vendor accounts.
- View cashier-issued totals.
- View vendor-received totals.
- Export or copy a simple settlement summary.

## Proposed App Structure

```text
app/
  page.tsx
  cashier/
    page.tsx
  customer/
    page.tsx
  vendor/
    page.tsx
  organizer/
    page.tsx

src/
  lib/
    hive/
      client.ts
      hiveEngine.ts
      balances.ts
      transactions.ts
      keys.ts
    payments/
      paymentRequest.ts
      walletStorage.ts
      amounts.ts
    config/
      eventConfig.ts
  components/
    qr/
    wallet/
    payments/
```

The exact paths can change as the implementation evolves, but the first implementation should keep Hive-specific code isolated from UI components.

## Implementation Plan

### 1. Project Setup

- Add `@hiveio/dhive`.
- Add a QR generation library for vendor payment requests.
- Add a QR scanning library for customer phones.
- Add small validation utilities for account names, token symbols, and token amounts.
- Replace the default starter page with a role selection screen.

Suggested PowerShell command:

```powershell
npm install @hiveio/dhive qrcode
```

The QR scanner dependency should be chosen after testing browser support on the phones likely to be used at the fairs.

### 2. Hive Client Layer

- Create a reusable `dhive.Client` configured for Hive mainnet.
- Define the Hive-Engine custom JSON contract id.
- Implement builders for Hive-Engine token transfer payloads.
- Implement a broadcast helper that signs with an active key and submits the operation.
- Keep private keys in memory only while signing.

The transfer payload should follow the Hive-Engine `tokens.transfer` contract shape:

```json
{
  "contractName": "tokens",
  "contractAction": "transfer",
  "contractPayload": {
    "symbol": "TOKEN",
    "to": "receiver",
    "quantity": "1.000",
    "memo": "optional memo"
  }
}
```

### 3. Payment Request Format

- Define a versioned JSON payment request payload.
- Encode it into QR codes for vendors.
- Parse and validate it on customer phones before signing.

Initial payload shape:

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

The app should reject unsupported versions, unknown symbols, invalid account names, invalid amounts, and malformed payloads.

### 4. Customer Wallet Storage

- Store the temporary customer account name and private key in localStorage.
- Provide a clear local "forget wallet" action.
- Avoid sending keys to any backend service.
- Consider encrypting localStorage with a short passphrase if the workflow remains simple enough for students and parents.

The first version can be fully client-side because signing can happen in the browser with `@hiveio/dhive`.

### 5. Cashier Flow

- Build a cashier page for issuing token balances to customer accounts.
- Validate amount and account name before signing.
- Broadcast Hive-Engine transfers.
- Show a clear confirmation containing transaction id, recipient, amount, and token symbol.

This page is the most sensitive part of the app and should be kept simple, explicit, and hard to misclick.

### 6. Vendor Flow

- Build a vendor page that generates payment request QR codes.
- Support a configured vendor account and manually entered amount.
- Show the QR code large enough to scan quickly from a customer phone.
- Add a received-payments view later by querying Hive-Engine history or an indexer.

### 7. Customer Payment Flow

- Build a customer page that displays the wallet balance and scan/pay action.
- Parse vendor QR payloads.
- Show a confirmation screen before broadcasting.
- Broadcast the token transfer.
- Show a success screen with transaction details.

The confirmation screen should be optimized for non-technical users: vendor, amount, and token symbol should be the prominent information.

### 8. Reconciliation

- Query balances and transfer history for the cashier and vendor accounts.
- Produce simple totals per vendor.
- Allow copy/export of the fair summary.

The first reconciliation view can be read-only and manually refreshed.

### 9. Testing Strategy

- Unit-test payment request parsing and amount validation.
- Unit-test Hive-Engine payload builders.
- Add integration tests around the cashier, vendor, and customer UI flows once the screens exist.
- Use a non-production token or low-risk test accounts during development before using the real fair token.

## Operational Notes

- This is an internal school-fair voucher system, not a general payment processor.
- Euros are collected by the central cashier outside the blockchain.
- The token represents event credit for the fair workflow.
- Hive private keys must never be logged, committed, or sent to a server.
- Browser localStorage is convenient but fragile; users can lose the wallet if they clear browser data or switch devices.

## Development

Install dependencies:

```powershell
npm install
```

Start the development server:

```powershell
npm run dev
```

Open:

```text
http://localhost:3000
```
