"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { markAllAsRead } from "@/actions/notifications";
import { NotificationItem } from "./notification-item";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, CheckCheck, BellOff } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { NotificationType } from "@/lib/types/database";

interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  action_url: string | null;
  read: boolean;
  created_at: string;
}

interface NotificationBellProps {
  userId: string;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const t = useTranslations();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();

  // Load initial notifications
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      const items = (data ?? []) as unknown as Notification[];
      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.read).length);
    }
    load();
  }, [userId, supabase]);

  // Subscribe to new notifications via Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev].slice(0, 50));
          setUnreadCount((prev) => prev + 1);

          // Show toast for the new notification
          toast(newNotification.title, {
            description: newNotification.body,
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  const handleMarkAllRead = useCallback(async () => {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const handleItemRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-[0.2em]">
            {t("notifications.title")}
          </p>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <CheckCheck className="h-3 w-3" />
              {t("notifications.markAllRead")}
            </button>
          )}
        </div>

        {/* Notification list */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12">
            <BellOff className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">
              {t("notifications.noNotifications")}
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  id={notification.id}
                  type={notification.type}
                  title={notification.title}
                  body={notification.body}
                  actionUrl={notification.action_url}
                  read={notification.read}
                  createdAt={notification.created_at}
                  onRead={() => handleItemRead(notification.id)}
                />
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Footer */}
        <div className="border-t px-4 py-2">
          <Link
            href="/notifications"
            className="block text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("notifications.viewAll")}
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
