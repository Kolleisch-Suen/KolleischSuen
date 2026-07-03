import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { parseEuroAmount } from "@/src/lib/payments/amounts";
import { computeExpiry, generateClaimSecret } from "@/src/lib/claim/token";
import {
  ACTIVE_EVENT_SLUG,
  CLAIM_TTL_SECONDS,
  TOKEN_SYMBOL,
  resolveBaseUrl,
} from "@/src/lib/config";

/**
 * Cashier issues a euro amount. We reserve one wallet from the pool, "deposit"
 * the equivalent KISS (1:1, simulated) onto it, mint a single-use claim token,
 * and return a QR code encoding the claim URL.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const rawAmount =
    body && typeof body === "object"
      ? String((body as Record<string, unknown>).amount ?? "")
      : "";
  const amount = parseEuroAmount(rawAmount);
  if (!amount.ok) {
    return NextResponse.json({ error: amount.error }, { status: 400 });
  }

  const event = await prisma.event.findUnique({
    where: { slug: ACTIVE_EVENT_SLUG },
  });
  if (!event) {
    return NextResponse.json(
      { error: `Active event "${ACTIVE_EVENT_SLUG}" not found. Run: npm run db:seed` },
      { status: 500 },
    );
  }

  const cashier = await prisma.event_account.findFirst({
    where: { event_id: event.id, role: "cashier", is_active: true },
    select: { account_id: true },
  });
  if (!cashier) {
    return NextResponse.json(
      {
        error: `No active cashier account for event "${ACTIVE_EVENT_SLUG}". Run: npm run db:seed`,
      },
      { status: 500 },
    );
  }

  const now = new Date();
  const expiresAt = computeExpiry(now, CLAIM_TTL_SECONDS);
  const secret = generateClaimSecret();

  // Reserve an available wallet and mint the token atomically so two concurrent
  // cashier clicks can never hand out the same wallet.
  const reserved = await prisma.$transaction(async (tx) => {
    const wallet = await tx.customer_wallet.findFirst({
      where: { event_id: event.id, status: "available" },
      orderBy: { created_at: "asc" },
    });
    if (!wallet) return null;

    await tx.customer_wallet.update({
      where: { id: wallet.id },
      data: { status: "reserved", reserved_at: now, balance: amount.canonical },
    });

    await tx.claim_token.create({
      data: {
        token: secret,
        event_id: event.id,
        wallet_id: wallet.id,
        amount: amount.canonical,
        symbol: TOKEN_SYMBOL,
        expires_at: expiresAt,
      },
    });

    // Append-only ledger row for the issuance. In v1 the "broadcast" is
    // simulated and settles instantly, so we record it as confirmed with no
    // hive_tx_id. A real build would insert `broadcast` here, then update to
    // `confirmed`/`failed` after verifying on-chain (see AGENTS.md).
    await tx.token_transfer.create({
      data: {
        event_id: event.id,
        kind: "cashier_issue",
        status: "confirmed",
        from_account_id: cashier.account_id,
        to_account_id: wallet.account_id,
        symbol: TOKEN_SYMBOL,
        quantity: amount.canonical,
        memo: "Simulated cashier issue",
        broadcast_at: now,
        confirmed_at: now,
      },
    });
    return wallet;
  });

  if (!reserved) {
    return NextResponse.json(
      { error: "No wallets available in the pool. Run: npm run db:seed:wallets" },
      { status: 503 },
    );
  }

  const claimUrl = `${resolveBaseUrl(req.url)}/claim?token=${secret}`;
  const qrDataUrl = await QRCode.toDataURL(claimUrl, { width: 320, margin: 2 });

  return NextResponse.json({
    amount: amount.euros,
    symbol: TOKEN_SYMBOL,
    token: secret,
    claimUrl,
    qrDataUrl,
    expiresAt: expiresAt.toISOString(),
  });
}
