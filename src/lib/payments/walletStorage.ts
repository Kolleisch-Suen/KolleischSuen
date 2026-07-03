/**
 * Browser-only helpers for the temporary customer wallet held in localStorage.
 *
 * The stored `activeKey` is a SIMULATED credential in v1. Even so, the whole
 * point of this module is that keys live only on the customer's own device and
 * are never sent anywhere except back to our claim/broadcast API. A clear
 * "forget wallet" action is required (see AGENTS.md).
 */

export const WALLET_STORAGE_KEY = "ksuen.wallet.v1";

export interface StoredWallet {
  account: string;
  activeKey: string;
  symbol: string;
}

export function loadWallet(): StoredWallet | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(WALLET_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredWallet>;
    if (parsed.account && parsed.activeKey && parsed.symbol) {
      return parsed as StoredWallet;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveWallet(wallet: StoredWallet): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallet));
}

export function forgetWallet(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(WALLET_STORAGE_KEY);
}
