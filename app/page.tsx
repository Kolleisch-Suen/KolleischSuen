import Link from "next/link";

const roles = [
  {
    href: "/cashier",
    title: "Cashier",
    description: "Take euros and hand out a wallet QR code.",
  },
  {
    href: "/wallet",
    title: "My wallet",
    description: "See your balance after scanning a code.",
  },
  {
    href: "/vendor",
    title: "Vendor",
    description: "Create a payment request (coming soon).",
    disabled: true,
  },
  {
    href: "/organizer",
    title: "Organizer",
    description: "Reconcile the fair (coming soon).",
    disabled: true,
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 p-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">KolleischSuen</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          School-fair token payments. Choose your role.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {roles.map((role) => (
          <Link
            key={role.href}
            href={role.disabled ? "#" : role.href}
            aria-disabled={role.disabled}
            className={`rounded-xl border p-5 transition-colors ${
              role.disabled
                ? "pointer-events-none border-zinc-200 opacity-50 dark:border-zinc-800"
                : "border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
            }`}
          >
            <h2 className="text-lg font-semibold">{role.title}</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {role.description}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
