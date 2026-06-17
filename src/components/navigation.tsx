"use client";

import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/workout", label: "Workout" },
  { href: "/food", label: "Food" },
  { href: "/checkin", label: "Check-In" },
  { href: "/progress", label: "Progress" },
];

export function Nav() {
  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-6 h-14">
          <Link href="/dashboard" className="font-bold text-primary">🐚 Maingain</Link>
          <div className="flex gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}
                className="px-3 py-2 text-sm text-muted hover:text-foreground rounded transition">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
