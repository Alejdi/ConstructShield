"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { getOrCreateConversation } from "@/actions/conversations";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";

interface MessageButtonProps {
  contractorId: string;
}

export function MessageButton({ contractorId }: MessageButtonProps) {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setIsLoading(true);
    try {
      const conversationId = await getOrCreateConversation(contractorId);
      router.push(`/messages?conversation=${conversationId}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("chat.sendFailed")
      );
      setIsLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="group inline-flex items-center gap-3 border border-foreground/30 px-8 py-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-50"
    >
      <MessageSquare className="h-4 w-4" />
      {isLoading ? t("common.loading") : t("chat.sendMessage")}
    </button>
  );
}
