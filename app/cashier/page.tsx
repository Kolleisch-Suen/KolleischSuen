"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface IssueResult {
  amount: number;
  symbol: string;
  claimUrl: string;
  qrDataUrl: string;
  expiresAt: string;
}

export default function CashierPage() {
  const [amount, setAmount] = useState("20");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IssueResult | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Countdown for the active QR code so the cashier knows when it expires.
  useEffect(() => {
    if (!result) return;
    const tick = () => {
      const remaining = Math.max(
        0,
        Math.round((new Date(result.expiresAt).getTime() - Date.now()) / 1000),
      );
      setSecondsLeft(remaining);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [result]);

  async function issue() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/cashier/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setResult(data as IssueResult);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  const expired = result != null && secondsLeft <= 0;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-8">
      <div>
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          ← Home
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Cashier</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Enter the euro amount the customer paid, then let them scan the code.
        </p>
      </div>

      <div className="flex items-end gap-3">
        <label className="flex-1">
          <span className="mb-1 block text-sm font-medium">Amount (€)</span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-2xl tabular-nums dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <button
          onClick={issue}
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-6 py-3 text-lg font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "…" : "Generate"}
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {result && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-zinc-200 p-6 text-center dark:border-zinc-800">
          <p className="text-lg font-semibold">
            {result.amount.toFixed(2)} € · {result.symbol}
          </p>
          <div className={expired ? "opacity-30" : ""}>
            <Image
              src={result.qrDataUrl}
              alt="Scan to claim wallet"
              width={256}
              height={256}
              unoptimized
            />
          </div>
          {expired ? (
            <p className="font-medium text-red-600">
              Expired — press Generate again.
            </p>
          ) : (
            <p className="text-sm text-zinc-500">
              Scan within <span className="tabular-nums">{secondsLeft}s</span>
            </p>
          )}
        </div>
      )}
    </main>
  );
}
