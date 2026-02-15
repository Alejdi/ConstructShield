"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { markAllAsRead } from "@/actions/notifications";
import { NotificationItem } from "./notification-item";
import { CheckCheck } from "lucide-react";
import type { NotificationType } from "@/lib/types/database";

type NotificationRow = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  action_url: string | null;
  read: boolean;
  created_at: string;
};

interface NotificationsClientProps {
  groups: { label: string; items: NotificationRow[] }[];
}

export function NotificationsClient({ groups: initialGroups }: NotificationsClientProps) {
  const t = useTranslations();
  const [groups, setGroups] = useState(initialGroups);
  const hasUnread = groups.some((g) => g.items.some((n) => !n.read));

  const handleMarkAllRead = useCallback(async () => {
    await markAllAsRead();
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        items: g.items.map((n) => ({ ...n, read: true })),
      }))
    );
  }, []);

  const handleItemRead = useCallback((id: string) => {
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        items: g.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
      }))
    );
  }, []);

  return (
    <div className="space-y-6">
      {/* Mark all as read */}
      {hasUnread && (
        <div className="flex justify-end">
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            {t("notifications.markAllRead")}
          </button>
        </div>
      )}

      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {group.label}
          </p>
          <div className="divide-y border">
            {group.items.map((notification) => (
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
        </div>
      ))}
    </div>
  );
}
