"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/actions/messages";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Send, AlertTriangle } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  filtered_content: string | null;
  is_flagged: boolean;
  created_at: string;
  profiles?: { full_name: string } | null;
}

interface ChatPanelProps {
  projectId: string;
}

export function ChatPanel({ projectId }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
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
        .from("messages")
        .select("id, sender_id, content, filtered_content, is_flagged, created_at, profiles(full_name)")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      setMessages((data as unknown as Message[]) ?? []);
    }
    init();
  }, [projectId, supabase]);

  // Subscribe to new messages
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `project_id=eq.${projectId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from("messages")
            .select("id, sender_id, content, filtered_content, is_flagged, created_at, profiles(full_name)")
            .eq("id", (payload.new as { id: string }).id)
            .single();

          if (data) {
            setMessages((prev) => [...prev, data as unknown as Message]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, supabase]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim()) return;
    setIsSending(true);

    try {
      const result = await sendMessage(projectId, input.trim());
      setInput("");

      if (result.isFlagged) {
        toast.warning(
          "To stay protected by our $1M Guarantee and Escrow, keep all payments and talk on ConstructShield.",
          {
            duration: 6000,
            icon: <AlertTriangle className="h-4 w-4" />,
          }
        );
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send message"
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex h-80 flex-col">
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-3 py-2">
          {messages.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No messages yet. Start the conversation!
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
                    {(msg.profiles as { full_name: string } | null)?.full_name ?? "User"}
                  </span>
                  <span>{formatRelativeTime(msg.created_at)}</span>
                  {msg.is_flagged && (
                    <Badge
                      variant="destructive"
                      className="h-4 px-1 text-[10px]"
                    >
                      Filtered
                    </Badge>
                  )}
                </div>
                <div
                  className={`mt-1 max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    isMine
                      ? "bg-brand-600 text-white"
                      : "bg-muted"
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

      <div className="flex gap-2 border-t pt-3">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
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
