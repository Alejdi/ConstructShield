"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { sendDirectMessage } from "@/actions/conversations";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Send, AlertTriangle } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface DirectMessage {
  id: string;
  sender_id: string;
  content: string;
  filtered_content: string | null;
  is_flagged: boolean;
  created_at: string;
  profiles?: { full_name: string } | null;
}

interface ConversationChatProps {
  conversationId: string;
  otherPartyName: string;
}

export function ConversationChat({
  conversationId,
  otherPartyName,
}: ConversationChatProps) {
  const t = useTranslations();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Load initial messages and current user
  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      const { data } = await supabase
        .from("direct_messages")
        .select(
          "id, sender_id, content, filtered_content, is_flagged, created_at, profiles(full_name)"
        )
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      setMessages((data as unknown as DirectMessage[]) ?? []);
    }
    init();
  }, [conversationId, supabase]);

  // Subscribe to new messages
  useEffect(() => {
    const channel = supabase
      .channel(`dm-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from("direct_messages")
            .select(
              "id, sender_id, content, filtered_content, is_flagged, created_at, profiles(full_name)"
            )
            .eq("id", (payload.new as { id: string }).id)
            .single();

          if (data) {
            setMessages((prev) => [...prev, data as unknown as DirectMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim()) return;
    setIsSending(true);

    try {
      const result = await sendDirectMessage(conversationId, input.trim());
      setInput("");

      if (result.isFlagged) {
        toast.warning(
          t("chat.escrowWarning"),
          {
            duration: 6000,
            icon: <AlertTriangle className="h-4 w-4" />,
          }
        );
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("chat.sendFailed")
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Conversation with
        </p>
        <p className="font-semibold">{otherPartyName}</p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-6">
        <div className="space-y-3 py-4">
          {messages.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {t("chat.noMessages")}
            </p>
          )}
          {messages.map((msg) => {
            const isMine = msg.sender_id === currentUserId;
            const displayContent = msg.is_flagged
              ? msg.filtered_content || msg.content
              : msg.content;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {(msg.profiles as { full_name: string } | null)
                      ?.full_name ?? t("chat.user")}
                  </span>
                  <span>{formatRelativeTime(msg.created_at)}</span>
                  {msg.is_flagged && (
                    <Badge
                      variant="destructive"
                      className="h-4 px-1 text-[10px]"
                    >
                      {t("chat.filtered")}
                    </Badge>
                  )}
                </div>
                <div
                  className={`mt-1 max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    isMine ? "bg-foreground text-background" : "bg-muted"
                  }`}
                >
                  {displayContent}
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="flex gap-2 border-t px-6 py-4">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("chat.placeholder")}
          rows={1}
          className="min-h-[40px] resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button
          onClick={handleSend}
          disabled={isSending || !input.trim()}
          size="icon"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
