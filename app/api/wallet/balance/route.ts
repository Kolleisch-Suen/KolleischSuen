import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidHiveAccountName } from "@/src/lib/hive/account";
import { TOKEN_SYMBOL } from "@/src/lib/config";

/**
 * Return the (simulated) KISS balance of a claimed wallet. The wallet page calls
 * this to render the balance as euros. Read-only; no key material is returned.
 */
export async function GET(req: Request) {
  const account = new URL(req.url).searchParams.get("account") ?? "";
  if (!isValidHiveAccountName(account)) {
    return NextResponse.json({ error: "Invalid account name." }, { status: 400 });
  }

  const wallet = await prisma.customer_wallet.findFirst({
    where: { account: { hive_account: account } },
    include: { account: true },
  });
  if (!wallet) {
    return NextResponse.json({ error: "Wallet not found." }, { status: 404 });
  }

  return NextResponse.json({
    account: wallet.account.hive_account,
    balance: Number(wallet.balance),
    symbol: TOKEN_SYMBOL,
  });
}
