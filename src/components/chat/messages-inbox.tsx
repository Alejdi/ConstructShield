"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn, formatRelativeTime } from "@/lib/utils";
import { ConversationChat } from "./conversation-chat";
import { MessageSquare, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ConversationSummary {
  id: string;
  otherPartyId: string;
  otherPartyName: string;
  businessName: string | null;
  lastMessage: {
    content: string;
    createdAt: string;
  } | null;
  lastMessageAt: string;
  createdAt: string;
}

interface MessagesInboxProps {
  conversations: ConversationSummary[];
  activeConversationId?: string;
}

export function MessagesInbox({
  conversations,
  activeConversationId,
}: MessagesInboxProps) {
  const t = useTranslations();
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | undefined>(
    activeConversationId
  );

  const activeConversation = conversations.find((c) => c.id === activeId);

  function handleSelectConversation(id: string) {
    setActiveId(id);
    router.replace(`/messages?conversation=${id}`, { scroll: false });
  }

  // Empty state
  if (conversations.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20">
        <MessageSquare className="h-12 w-12 text-muted-foreground/30" />
        <div className="text-center">
          <p className="font-semibold">{t("inbox.noConversations")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("inbox.browseContractors")}
          </p>
        </div>
        <Link
          href="/contractors"
          className="mt-2 border border-foreground px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] transition-colors hover:bg-foreground hover:text-background"
        >
          {t("inbox.findContractors")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Conversation List */}
      <div
        className={cn(
          "w-full shrink-0 overflow-y-auto border-r lg:w-80",
          activeId ? "hidden lg:block" : "block"
        )}
      >
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => handleSelectConversation(conv.id)}
            className={cn(
              "flex w-full flex-col gap-1 border-b px-6 py-4 text-left transition-colors hover:bg-muted/50",
              conv.id === activeId && "bg-foreground/5"
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">
                {conv.businessName || conv.otherPartyName}
              </p>
              {conv.lastMessage && (
                <span className="text-[10px] text-muted-foreground">
                  {formatRelativeTime(conv.lastMessage.createdAt)}
                </span>
              )}
            </div>
            {conv.businessName && (
              <p className="text-xs text-muted-foreground">
                {conv.otherPartyName}
              </p>
            )}
            {conv.lastMessage && (
              <p className="truncate text-xs text-muted-foreground">
                {conv.lastMessage.content}
              </p>
            )}
          </button>
        ))}
      </div>

      {/* Active Conversation */}
      <div
        className={cn(
          "flex flex-1 flex-col",
          activeId ? "block" : "hidden lg:flex"
        )}
      >
        {activeConversation ? (
          <>
            {/* Mobile back button */}
            <button
              onClick={() => setActiveId(undefined)}
              className="flex items-center gap-2 border-b px-4 py-3 text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-foreground lg:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("inbox.backToConversations")}
            </button>
            <ConversationChat
              conversationId={activeConversation.id}
              otherPartyName={
                activeConversation.businessName ||
                activeConversation.otherPartyName
              }
            />
          </>
        ) : (
          <div className="hidden flex-1 flex-col items-center justify-center gap-2 lg:flex">
            <MessageSquare className="h-10 w-10 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">
              {t("inbox.selectConversation")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
