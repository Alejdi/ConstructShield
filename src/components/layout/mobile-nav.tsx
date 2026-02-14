"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Shield,
  Menu,
  LayoutDashboard,
  PlusCircle,
  Search,
  Settings,
  UserCircle,
  CreditCard,
} from "lucide-react";

interface MobileNavProps {
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

export function MobileNav({ role }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const links = role === "contractor" ? contractorLinks : clientLinks;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="flex h-16 flex-row items-center gap-2 border-b px-6">
          <Shield className="h-6 w-6 text-brand-600" />
          <SheetTitle className="text-lg font-bold text-brand-900">
            ConstructShield
          </SheetTitle>
        </SheetHeader>
        <nav className="space-y-1 p-4">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-foreground hover:bg-accent/50"
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
