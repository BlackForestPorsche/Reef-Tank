"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Droplets,
  Fish,
  LayoutGrid,
  Lightbulb,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Glance", icon: LayoutGrid },
  { href: "/feed", label: "Feed", icon: Fish },
  { href: "/outlets", label: "Outlets", icon: Droplets },
  { href: "/lights", label: "Lights", icon: Lightbulb },
  { href: "/settings", label: "Setup", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const kiosk =
    pathname.startsWith("/hub") ||
    pathname.startsWith("/panel") ||
    pathname.startsWith("/android");

  if (kiosk) {
    return <div className="min-h-full">{children}</div>;
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col md:max-w-2xl">
      <main className="flex-1 px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))]">
        {children}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-[#07131c]/90 backdrop-blur-xl">
        <div className="mx-auto grid max-w-lg grid-cols-5 px-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2 md:max-w-2xl">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] tracking-wide",
                  active ? "text-teal-200" : "text-white/45",
                )}
              >
                <Icon className={cn("size-5", active && "stroke-[2.25]")} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
