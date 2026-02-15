import { getConversations } from "@/actions/conversations";
import { MessagesInbox } from "@/components/chat/messages-inbox";
import { getTranslations } from "next-intl/server";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string }>;
}) {
  const t = await getTranslations();
  const { conversation: activeConversationId } = await searchParams;
  const conversations = await getConversations();

  return (
    <div className="flex h-[calc(100vh-4rem-1px)] flex-col lg:h-[calc(100vh-1px)]">
      <div className="border-b px-6 py-6">
        <p className="mb-1 text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
          {t("inbox.title")}
        </p>
        <h1 className="text-3xl font-bold tracking-tight">{t("nav.messages")}</h1>
      </div>

      <MessagesInbox
        conversations={conversations}
        activeConversationId={activeConversationId}
      />
    </div>
  );
}
