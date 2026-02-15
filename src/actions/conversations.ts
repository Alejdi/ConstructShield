"use server";

import { createClient } from "@/lib/supabase/server";
import { notify } from "@/lib/notifications";
import { filterMessage } from "@/lib/chat/filter";

export async function getConversations() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("conversations")
    .select(
      "id, client_id, contractor_id, last_message_at, created_at"
    )
    .or(`client_id.eq.${user.id},contractor_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false });

  if (error) throw new Error(error.message);

  // Fetch the other party's profile for each conversation + latest message preview
  const conversations = await Promise.all(
    (data ?? []).map(async (conv) => {
      const otherPartyId =
        conv.client_id === user.id ? conv.contractor_id : conv.client_id;

      const [profileResult, messageResult, contractorResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", otherPartyId)
          .single(),
        supabase
          .from("direct_messages")
          .select("content, is_flagged, filtered_content, created_at")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from("contractors")
          .select("business_name")
          .eq("id", conv.contractor_id)
          .single(),
      ]);

      const profile = profileResult.data as {
        full_name: string;
        avatar_url: string | null;
      } | null;
      const lastMessage = messageResult.data as {
        content: string;
        is_flagged: boolean;
        filtered_content: string | null;
        created_at: string;
      } | null;
      const contractor = contractorResult.data as {
        business_name: string;
      } | null;

      return {
        id: conv.id,
        otherPartyId,
        otherPartyName: profile?.full_name ?? "Unknown",
        businessName: contractor?.business_name ?? null,
        lastMessage: lastMessage
          ? {
              content: lastMessage.is_flagged
                ? lastMessage.filtered_content || lastMessage.content
                : lastMessage.content,
              createdAt: lastMessage.created_at,
            }
          : null,
        lastMessageAt: conv.last_message_at,
        createdAt: conv.created_at,
      };
    })
  );

  return conversations;
}

export async function getOrCreateConversation(contractorId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Check for existing conversation
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("client_id", user.id)
    .eq("contractor_id", contractorId)
    .single();

  if (existing) return existing.id as string;

  // Create new conversation
  const { data: created, error } = await supabase
    .from("conversations")
    .insert({
      client_id: user.id,
      contractor_id: contractorId,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  return (created as { id: string }).id;
}

export async function sendDirectMessage(
  conversationId: string,
  content: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");
  if (!content.trim()) throw new Error("Message cannot be empty");

  const filterResult = filterMessage(content);

  const { error: msgError } = await supabase.from("direct_messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content,
    filtered_content: filterResult.filteredContent,
    is_flagged: filterResult.isFlagged,
    flag_reason: filterResult.flagReason,
  });

  if (msgError) throw new Error(msgError.message);

  // Update conversation's last_message_at
  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);

  // Notify the other party
  const { data: convData } = await supabase
    .from("conversations")
    .select("client_id, contractor_id")
    .eq("id", conversationId)
    .single();

  const conv = convData as {
    client_id: string;
    contractor_id: string;
  } | null;

  if (conv) {
    const recipientId =
      conv.client_id === user.id ? conv.contractor_id : conv.client_id;

    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    const senderName =
      (senderProfile as { full_name: string } | null)?.full_name ?? "Someone";

    notify({
      userId: recipientId,
      type: "message_received",
      title: "New Message",
      body: `${senderName} sent you a message`,
      actionUrl: "/messages",
    }).catch(() => {});
  }

  return {
    isFlagged: filterResult.isFlagged,
    flagReason: filterResult.flagReason,
  };
}
