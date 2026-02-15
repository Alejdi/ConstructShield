"use client";

import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Settings } from "lucide-react";
import Image from "next/image";
import { MobileNav } from "./mobile-nav";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useTranslations } from "next-intl";
import type { UserRole } from "@/lib/types/database";

interface TopbarProps {
  fullName: string;
  avatarUrl: string | null;
  role: UserRole;
  userId: string;
}

export function Topbar({ fullName, avatarUrl, role, userId }: TopbarProps) {
  const t = useTranslations();
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <MobileNav role={role} />
        <Image
          src="/images/logo.png"
          alt="ConstructShield"
          width={32}
          height={32}
          className="lg:hidden"
        />
      </div>

      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <NotificationBell userId={userId} />
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarUrl ?? undefined} alt={fullName} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm md:inline">{fullName}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <a href="/settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {t("nav.settings")}
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut()}
            className="flex items-center gap-2 text-danger-red"
          >
            <LogOut className="h-4 w-4" />
            {t("auth.signOut")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </header>
  );
}
