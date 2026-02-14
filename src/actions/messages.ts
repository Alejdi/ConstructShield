"use server";

import { createClient } from "@/lib/supabase/server";
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

  return {
    isFlagged: filterResult.isFlagged,
    flagReason: filterResult.flagReason,
  };
}
