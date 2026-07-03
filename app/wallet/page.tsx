"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatKissAsEuros } from "@/src/lib/payments/amounts";
import {
  forgetWallet,
  loadWallet,
  type StoredWallet,
} from "@/src/lib/payments/walletStorage";

export default function WalletPage() {
  const [wallet, setWallet] = useState<StoredWallet | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">(
    "loading",
  );

  useEffect(() => {
    const stored = loadWallet();
    if (!stored) {
      setStatus("empty");
      return;
    }
    setWallet(stored);

    (async () => {
      try {
        const res = await fetch(
          `/api/wallet/balance?account=${encodeURIComponent(stored.account)}`,
        );
        const data = await res.json();
        if (!res.ok) {
          setStatus("error");
          return;
        }
        setBalance(data.balance);
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    })();
  }, []);

  function forget() {
    forgetWallet();
    setWallet(null);
    setBalance(null);
    setStatus("empty");
  }

  if (status === "empty") {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-2xl font-bold">No wallet yet</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Scan a code from the cashier to load your wallet.
        </p>
        <Link href="/" className="text-emerald-600 hover:underline">
          Back to home
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="w-full rounded-2xl bg-emerald-600 p-8 text-white shadow-lg">
        <p className="text-sm uppercase tracking-wide opacity-80">Balance</p>
        <p className="mt-2 text-5xl font-bold tabular-nums">
          {status === "ready" && balance != null
            ? formatKissAsEuros(balance)
            : status === "error"
              ? "—"
              : "…"}
        </p>
        {wallet && (
          <p className="mt-4 text-sm opacity-90">
            Account <span className="font-mono">{wallet.account}</span>
          </p>
        )}
      </div>

      {status === "error" && (
        <p className="text-red-600">Could not load the balance.</p>
      )}

      <button
        onClick={forget}
        className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
      >
        Forget this wallet
      </button>
      <Link href="/" className="text-sm text-zinc-500 hover:underline">
        ← Home
      </Link>
    </main>
  );
}
