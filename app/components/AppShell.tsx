import Link from "next/link";
import { ReactNode } from "react";
import Logo from "./Logo";

const links = [
  ["/", "Créer"],
  ["/characters", "Personnages"],
  ["/generate", "Générer"],
  ["/results", "Résultats"],
] as const;

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 bg-ink/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Logo />
            <div>
              <div className="text-sm font-black tracking-wide">DARK ROMANCE</div>
              <div className="text-[10px] uppercase tracking-[.24em] text-orchid">Promo Studio</div>
            </div>
          </Link>
          <nav className="hidden gap-1 md:flex">
            {links.map(([href, label]) => (
              <Link key={href} href={href} className="rounded-xl px-3 py-2 text-sm text-white/70 hover:text-white">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
