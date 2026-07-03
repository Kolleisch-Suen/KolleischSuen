import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluateClaim } from "@/src/lib/claim/token";

const ERROR_STATUS: Record<string, { status: number; message: string }> = {
  not_found: { status: 404, message: "This code is not valid." },
  used: { status: 409, message: "This code has already been used." },
  expired: {
    status: 410,
    message: "This code has expired. Ask the cashier for a new one.",
  },
};

/**
 * A phone posts the claim secret it read from the QR code. We validate + consume
 * the token atomically (single use), mark the wallet claimed, and return the
 * account name + simulated active key for the phone to store locally.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const token =
    body && typeof body === "object"
      ? String((body as Record<string, unknown>).token ?? "")
      : "";
  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  const now = new Date();

  const outcome = await prisma.$transaction(async (tx) => {
    const claim = await tx.claim_token.findUnique({
      where: { token },
      include: { wallet: { include: { account: true } } },
    });
    if (!claim) return { error: "not_found" as const };

    const verdict = evaluateClaim({
      usedAt: claim.used_at,
      expiresAt: claim.expires_at,
      now,
    });
    if (!verdict.ok) return { error: verdict.reason };

    // Atomic single-use guard: only the first request flips used_at.
    const consumed = await tx.claim_token.updateMany({
      where: { id: claim.id, used_at: null },
      data: { used_at: now },
    });
    if (consumed.count === 0) return { error: "used" as const };

    await tx.customer_wallet.update({
      where: { id: claim.wallet_id },
      data: { status: "claimed", claimed_at: now },
    });

    return {
      ok: {
        account: claim.wallet.account.hive_account,
        activeKey: claim.wallet.active_key,
        balance: Number(claim.wallet.balance),
        symbol: claim.symbol,
      },
    };
  });

  if ("error" in outcome) {
    const mapped = ERROR_STATUS[outcome.error];
    return NextResponse.json(
      { error: mapped.message },
      { status: mapped.status },
    );
  }

  return NextResponse.json(outcome.ok);
}
