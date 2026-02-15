"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Menu,
  LayoutDashboard,
  PlusCircle,
  Search,
  Settings,
  UserCircle,
  CreditCard,
  MessageSquare,
  Briefcase,
  Tag,
  Crown,
  Bell,
  Users,
  AlertTriangle,
  DollarSign,
} from "lucide-react";

interface MobileNavProps {
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

export function MobileNav({ role }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations();
  const links =
    role === "admin"
      ? adminLinks
      : role === "contractor"
        ? contractorLinks
        : clientLinks;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">{t("nav.toggleMenu")}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="flex h-16 flex-row items-center gap-3 px-6">
          <Image
            src="/images/logo.png"
            alt="ConstructShield"
            width={28}
            height={28}
          />
          <SheetTitle className="text-xs font-bold uppercase tracking-[0.3em]">
            {t("common.constructshield")}
          </SheetTitle>
        </SheetHeader>
        <nav className="space-y-0.5 px-3">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
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
        </nav>
      </SheetContent>
    </Sheet>
  );
}
