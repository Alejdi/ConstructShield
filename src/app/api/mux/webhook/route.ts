import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.text();
  const event = JSON.parse(body);

  const admin = getSupabaseAdmin();

  switch (event.type) {
    case "video.asset.ready": {
      const asset = event.data;
      const passthrough = JSON.parse(asset.passthrough || "{}");
      const playbackId = asset.playback_ids?.[0]?.id;

      if (!playbackId) break;

      if (passthrough.type === "proof") {
        await admin
          .from("milestones")
          .update({
            proof_video_url: `https://stream.mux.com/${playbackId}.m3u8`,
            proof_video_asset_id: asset.id,
          })
          .eq("id", passthrough.referenceId);
      }

      if (passthrough.type === "hype") {
        await admin
          .from("contractors")
          .update({
            hype_video_playback_id: playbackId,
            hype_video_asset_id: asset.id,
          })
          .eq("id", passthrough.referenceId);
      }

      break;
    }

    case "video.asset.errored": {
      console.error("Mux asset error:", event.data);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
