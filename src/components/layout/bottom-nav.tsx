"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types/database";
import {
  LayoutDashboard,
  PlusCircle,
  Settings,
  UserCircle,
  MessageSquare,
  Briefcase,
  Users,
  AlertTriangle,
  DollarSign,
  Bell,
  Search,
  ShieldCheck,
} from "lucide-react";

interface BottomNavProps {
  role: UserRole;
}

const clientLinks = [
  { href: "/client", labelKey: "nav.home", icon: LayoutDashboard },
  { href: "/messages", labelKey: "nav.messages", icon: MessageSquare },
  { href: "/contractors", labelKey: "nav.findContractors", icon: Search },
  { href: "/marketplace/jobs", labelKey: "nav.market", icon: Briefcase },
  { href: "/notifications", labelKey: "nav.notifications", icon: Bell },
];

const contractorLinks = [
  { href: "/contractor", labelKey: "nav.home", icon: LayoutDashboard },
  { href: "/messages", labelKey: "nav.messages", icon: MessageSquare },
  { href: "/contractor/profile", labelKey: "nav.profile", icon: UserCircle },
  { href: "/marketplace/services", labelKey: "nav.market", icon: Briefcase },
  { href: "/notifications", labelKey: "nav.notifications", icon: Bell },
];

const adminLinks = [
  { href: "/admin", labelKey: "nav.home", icon: LayoutDashboard },
  { href: "/admin/users", labelKey: "nav.users", icon: Users },
  { href: "/admin/disputes", labelKey: "nav.disputes", icon: AlertTriangle },
  { href: "/client", labelKey: "nav.clientView", icon: Briefcase },
  { href: "/marketplace/jobs", labelKey: "nav.market", icon: Search },
];

// When admin is browsing client pages, show client nav with admin link
const adminClientViewLinks = [
  { href: "/admin", labelKey: "nav.adminPanel", icon: ShieldCheck },
  { href: "/client", labelKey: "nav.home", icon: LayoutDashboard },
  { href: "/contractors", labelKey: "nav.findContractors", icon: Search },
  { href: "/marketplace/jobs", labelKey: "nav.market", icon: Briefcase },
  { href: "/notifications", labelKey: "nav.notifications", icon: Bell },
];

function isAdminBrowsingClient(pathname: string) {
  return (
    pathname.startsWith("/client") ||
    pathname.startsWith("/contractors") ||
    pathname.startsWith("/marketplace")
  );
}

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const t = useTranslations();

  const adminInClientView = role === "admin" && isAdminBrowsingClient(pathname);

  const links = adminInClientView
    ? adminClientViewLinks
    : role === "admin"
      ? adminLinks
      : role === "contractor"
        ? contractorLinks
        : clientLinks;

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
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {t(link.labelKey)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
