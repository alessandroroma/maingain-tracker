"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/workout", label: "Workout" },
  { href: "/food", label: "Food" },
  { href: "/foods", label: "Foods" },
  { href: "/checkin", label: "Check-In" },
  { href: "/checkin-history", label: "History" },
  { href: "/progress", label: "Progress" },
];

export function Nav() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-4 h-14">
          <Link href="/dashboard" className="font-bold text-primary shrink-0">🐚 Maingain</Link>
          <div className="flex gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}
                className="px-3 py-2 text-sm text-muted hover:text-foreground rounded transition whitespace-nowrap">
                {item.label}
              </Link>
            ))}
          </div>
          <button onClick={signOut} title="Sign out"
            className="ml-auto text-muted hover:text-foreground transition text-sm shrink-0">
            ⎋
          </button>
        </div>
      </div>
    </nav>
  );
}
