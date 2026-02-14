import { mux } from "./client";

export async function createDirectUpload(params: {
  corsOrigin: string;
  passthrough?: string;
}) {
  const upload = await mux.video.uploads.create({
    cors_origin: params.corsOrigin,
    new_asset_settings: {
      playback_policy: ["public"],
      passthrough: params.passthrough,
    },
  });

  return {
    uploadId: upload.id,
    uploadUrl: upload.url,
  };
}

export async function getPlaybackId(assetId: string): Promise<string | null> {
  const asset = await mux.video.assets.retrieve(assetId);
  return asset.playback_ids?.[0]?.id ?? null;
}
