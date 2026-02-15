"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types/database";
import {
  LayoutDashboard,
  PlusCircle,
  HardHat,
  UserCircle,
  CreditCard,
  Settings,
  Search,
  MessageSquare,
  Briefcase,
  Tag,
  Crown,
  Bell,
  Users,
  AlertTriangle,
  DollarSign,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

interface SidebarProps {
  role: UserRole;
}

const clientLinks = [
  { href: "/client", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/messages", labelKey: "nav.messages", icon: MessageSquare },
  { href: "/notifications", labelKey: "nav.notifications", icon: Bell },
  { href: "/client/projects/new", labelKey: "nav.newProject", icon: PlusCircle },
  { href: "/contractors", labelKey: "nav.findContractors", icon: Search },
  { href: "/marketplace/jobs", labelKey: "nav.marketplace", icon: Briefcase },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
];

const contractorLinks = [
  { href: "/contractor", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/messages", labelKey: "nav.messages", icon: MessageSquare },
  { href: "/notifications", labelKey: "nav.notifications", icon: Bell },
  { href: "/contractor/profile", labelKey: "nav.myProfile", icon: UserCircle },
  { href: "/marketplace/services", labelKey: "nav.marketplace", icon: Briefcase },
  { href: "/contractor/services", labelKey: "nav.myServices", icon: Tag },
  { href: "/contractor/onboarding", labelKey: "nav.stripeConnect", icon: CreditCard },
  { href: "/contractor/subscription", labelKey: "nav.subscription", icon: Crown },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
];

const adminLinks = [
  { href: "/admin", labelKey: "nav.overview", icon: LayoutDashboard },
  { href: "/admin/users", labelKey: "nav.users", icon: Users },
  { href: "/admin/disputes", labelKey: "nav.disputes", icon: AlertTriangle },
  { href: "/admin/revenue", labelKey: "nav.revenue", icon: DollarSign },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
];

function isAdminBrowsingClient(pathname: string) {
  return (
    pathname.startsWith("/client") ||
    pathname.startsWith("/contractors") ||
    pathname.startsWith("/marketplace")
  );
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations();

  // When admin is browsing client/marketplace pages, show client nav with back link
  const adminInClientView = role === "admin" && isAdminBrowsingClient(pathname);

  const links = adminInClientView
    ? clientLinks
    : role === "admin"
      ? adminLinks
      : role === "contractor"
        ? contractorLinks
        : clientLinks;

  return (
    <aside className="hidden w-64 shrink-0 border-e bg-background lg:block">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center px-6">
          <span className="text-xs font-bold uppercase tracking-[0.3em]">
            {t("common.constructshield")}
          </span>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 pt-2">
          {/* Admin in client view: prominent back button */}
          {adminInClientView && (
            <Link
              href="/admin"
              className="mb-3 flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t("nav.backToAdmin")}
            </Link>
          )}
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
                  "flex items-center gap-3 px-3 py-2.5 text-xs font-medium uppercase tracking-[0.1em] transition-colors",
                  isActive
                    ? "border-s-2 border-foreground bg-foreground/5 text-foreground"
                    : "border-s-2 border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {t(link.labelKey)}
              </Link>
            );
          })}
          {/* Admin sidebar: prominent "Browse as Client" link */}
          {role === "admin" && !adminInClientView && (
            <>
              <div className="my-2 border-t" />
              <Link
                href="/client"
                className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {t("nav.clientView")}
              </Link>
            </>
          )}
        </nav>

        <div className="border-t px-6 py-4">
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            <HardHat className="h-3.5 w-3.5" />
            <span>{t("common.account", { role })}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
