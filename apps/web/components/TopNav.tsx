import Link from "next/link";
import { FourStar } from "./Sparkles";

const NAV_ITEMS = [
  { href: "/", label: "Overview" },
  { href: "/swap", label: "New swap" },
  { href: "/policies", label: "Policies" },
  { href: "/audit", label: "Audit log" },
];

export function TopNav() {
  return (
    <header className="border-b-2 border-ink/10 bg-cream-deep">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5 lg:px-10">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-10 w-10">
            <FourStar
              className="absolute inset-0 animate-twinkle"
              fill="#FF6B35"
            />
          </div>
          <span className="text-xl font-bold tracking-tight text-ink">
            RouteGuardian
          </span>
          <span className="ml-2 hidden rounded-full bg-purple-mist px-2.5 py-0.5 text-xs font-semibold text-purple-ink md:inline">
            Solana · Zerion CLI
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl px-3 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-purple-mist hover:text-purple-ink sm:px-4 sm:text-base"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
