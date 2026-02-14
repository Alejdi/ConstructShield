"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types/database";
import {
  Shield,
  LayoutDashboard,
  FolderOpen,
  PlusCircle,
  HardHat,
  UserCircle,
  CreditCard,
  Settings,
  Search,
} from "lucide-react";

interface SidebarProps {
  role: UserRole;
}

const clientLinks = [
  { href: "/client", label: "Dashboard", icon: LayoutDashboard },
  { href: "/client/projects/new", label: "New Project", icon: PlusCircle },
  { href: "/contractors", label: "Find Contractors", icon: Search },
  { href: "/settings", label: "Settings", icon: Settings },
];

const contractorLinks = [
  { href: "/contractor", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contractor/profile", label: "My Profile", icon: UserCircle },
  { href: "/contractor/onboarding", label: "Stripe Connect", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const links = role === "contractor" ? contractorLinks : clientLinks;

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-sidebar lg:block">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <Shield className="h-6 w-6 text-brand-600" />
          <span className="text-lg font-bold text-brand-900">
            ConstructShield
          </span>
        </div>

        <nav className="flex-1 space-y-1 p-4">
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
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <HardHat className="h-4 w-4" />
            <span className="capitalize">{role} Account</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
