"use server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { notify } from "@/lib/notifications";
import { filterMessage } from "@/lib/chat/filter";

export async function sendMessage(projectId: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");
  if (!content.trim()) throw new Error("Message cannot be empty");

  const filterResult = filterMessage(content);

  const { error } = await supabase.from("messages").insert({
    project_id: projectId,
    sender_id: user.id,
    content,
    filtered_content: filterResult.filteredContent,
    is_flagged: filterResult.isFlagged,
    flag_reason: filterResult.flagReason,
  });

  if (error) throw new Error(error.message);

  // Notify the other party in the project
  const admin = getSupabaseAdmin();
  const { data: projData } = await admin
    .from("projects")
    .select("client_id, contractor_id, title")
    .eq("id", projectId)
    .single();

  const proj = projData as {
    client_id: string;
    contractor_id: string | null;
    title: string;
  } | null;

  if (proj) {
    const recipientId =
      proj.client_id === user.id ? proj.contractor_id : proj.client_id;
    if (recipientId) {
      const { data: senderProfile } = await admin
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
        body: `${senderName} sent a message in ${proj.title}`,
        actionUrl: "/messages",
      }).catch(() => {});
    }
  }

  return {
    isFlagged: filterResult.isFlagged,
    flagReason: filterResult.flagReason,
  };
}
