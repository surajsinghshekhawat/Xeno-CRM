"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  LayoutDashboard,
  Megaphone,
  ShoppingBag,
  Users,
} from "lucide-react";
import { BRAND } from "@xeno/shared";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/data/customers", label: "Customers", icon: Users },
  { href: "/data/orders", label: "Orders", icon: ShoppingBag },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/campaigns/new", label: "AI Console", icon: Bot },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          XenoCRM
        </p>
        <h1 className="mt-1 text-lg font-semibold text-neutral-900">
          {BRAND.name}
        </h1>
        <p className="mt-1 text-xs text-neutral-500">{BRAND.tagline}</p>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : href === "/campaigns"
                ? pathname === "/campaigns" ||
                  (pathname.startsWith("/campaigns/") &&
                    !pathname.startsWith("/campaigns/new"))
                : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
