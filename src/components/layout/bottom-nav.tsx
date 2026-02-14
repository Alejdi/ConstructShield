"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types/database";
import {
  LayoutDashboard,
  PlusCircle,
  Search,
  Settings,
  UserCircle,
  CreditCard,
} from "lucide-react";

interface BottomNavProps {
  role: UserRole;
}

const clientLinks = [
  { href: "/client", label: "Home", icon: LayoutDashboard },
  { href: "/client/projects/new", label: "New", icon: PlusCircle },
  { href: "/contractors", label: "Find", icon: Search },
  { href: "/settings", label: "Settings", icon: Settings },
];

const contractorLinks = [
  { href: "/contractor", label: "Home", icon: LayoutDashboard },
  { href: "/contractor/profile", label: "Profile", icon: UserCircle },
  { href: "/contractor/onboarding", label: "Stripe", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const links = role === "contractor" ? contractorLinks : clientLinks;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background lg:hidden">
      <div className="flex items-center justify-around">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive =
            pathname === link.href ||
            (link.href !== "/client" &&
              link.href !== "/contractor" &&
              pathname.startsWith(link.href));

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-[10px] transition-colors",
                isActive
                  ? "text-brand-600 font-medium"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
