"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { saveWallet } from "@/src/lib/payments/walletStorage";

function ClaimInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");
  const [error, setError] = useState<string | null>(null);
  // Guard against React StrictMode double-invoke consuming the single-use token.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!token) {
      setError("No claim code found in the link.");
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Could not claim this code.");
          return;
        }
        saveWallet({
          account: data.account,
          activeKey: data.activeKey,
          symbol: data.symbol,
        });
        router.replace("/wallet");
      } catch {
        setError("Could not reach the server.");
      }
    })();
  }, [token, router]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-8 text-center">
      {error ? (
        <>
          <h1 className="text-2xl font-bold text-red-600">Cannot claim</h1>
          <p className="text-zinc-600 dark:text-zinc-400">{error}</p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold">Claiming your wallet…</h1>
          <p className="text-zinc-600 dark:text-zinc-400">One moment.</p>
        </>
      )}
    </main>
  );
}

export default function ClaimPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading…</div>}>
      <ClaimInner />
    </Suspense>
  );
}
