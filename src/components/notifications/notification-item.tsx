"use client";

import { useRouter } from "next/navigation";
import { markAsRead } from "@/actions/notifications";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Gavel,
  CheckCircle,
  XCircle,
  DollarSign,
  Hammer,
  FileVideo,
  Banknote,
  MessageSquare,
  FolderCheck,
  Star,
  AlertTriangle,
} from "lucide-react";
import type { NotificationType } from "@/lib/types/database";

const NOTIFICATION_ICONS: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  bid_received: Gavel,
  bid_accepted: CheckCircle,
  bid_rejected: XCircle,
  milestone_funded: DollarSign,
  milestone_started: Hammer,
  milestone_proof: FileVideo,
  milestone_released: Banknote,
  message_received: MessageSquare,
  project_completed: FolderCheck,
  review_received: Star,
  dispute_opened: AlertTriangle,
};

interface NotificationItemProps {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  actionUrl: string | null;
  read: boolean;
  createdAt: string;
  onRead?: () => void;
}

export function NotificationItem({
  id,
  type,
  title,
  body,
  actionUrl,
  read,
  createdAt,
  onRead,
}: NotificationItemProps) {
  const router = useRouter();
  const Icon = NOTIFICATION_ICONS[type] ?? MessageSquare;

  async function handleClick() {
    if (!read) {
      markAsRead(id).catch(() => {});
      onRead?.();
    }
    if (actionUrl) {
      router.push(actionUrl);
    }
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
        !read && "bg-muted/30"
      )}
    >
      <div className="mt-0.5 flex-shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={cn("text-sm", !read && "font-semibold")}>{title}</p>
          {!read && (
            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-foreground" />
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{body}</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground/60">
          {formatRelativeTime(createdAt)}
        </p>
      </div>
    </button>
  );
}
