"use server";

import { createClient } from "@/lib/supabase/server";

export type NearbyJob = {
  id: string;
  title: string;
  description: string | null;
  total_budget: number;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  client_id: string;
  client_name: string;
  bid_count: number;
  thumbnail_url: string | null;
  dist_meters: number;
};

export async function searchNearbyJobs(
  lat: number,
  lng: number,
  radiusMeters: number = 50000
): Promise<NearbyJob[]> {
  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  // Call PostGIS function to get nearby bidding projects with distances
  const { data: nearbyData, error: rpcError } = await supabase.rpc(
    "find_nearby_bidding_projects",
    {
      user_lat: lat,
      user_long: lng,
      search_radius_meters: radiusMeters,
    }
  );

  if (rpcError) throw new Error(rpcError.message);

  const nearby = (nearbyData ?? []) as {
    id: string;
    title: string;
    total_budget: number;
    dist_meters: number;
    client_id: string;
    created_at: string;
  }[];

  if (nearby.length === 0) return [];

  // Fetch full project details for the nearby results
  const ids = nearby.map((p) => p.id);

  const { data: projects } = await supabase
    .from("projects")
    .select(
      "id, title, description, total_budget, address, latitude, longitude, created_at, client_id, profiles!projects_client_id_fkey(full_name), bids(count), project_images(storage_path)"
    )
    .in("id", ids);

  type ProjectRow = {
    id: string;
    title: string;
    description: string | null;
    total_budget: number;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    created_at: string;
    client_id: string;
    profiles: { full_name: string } | null;
    bids: { count: number }[];
    project_images: { storage_path: string }[];
  };

  const projectMap = new Map(
    ((projects ?? []) as unknown as ProjectRow[]).map((p) => [p.id, p])
  );

  // Merge distance data with full project data, preserving distance sort order
  return nearby
    .map((n) => {
      const p = projectMap.get(n.id);
      if (!p) return null;
      return {
        id: p.id,
        title: p.title,
        description: p.description,
        total_budget: p.total_budget,
        address: p.address,
        latitude: p.latitude,
        longitude: p.longitude,
        created_at: p.created_at,
        client_id: p.client_id,
        client_name: p.profiles?.full_name ?? "Anonymous",
        bid_count: p.bids?.[0]?.count ?? 0,
        thumbnail_url: p.project_images?.[0]
          ? `${supabaseUrl}/storage/v1/object/public/project-images/${p.project_images[0].storage_path}`
          : null,
        dist_meters: n.dist_meters,
      } as NearbyJob;
    })
    .filter(Boolean) as NearbyJob[];
}
