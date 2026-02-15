"use server";

import { createClient } from "@/lib/supabase/server";

export type NearbyContractor = {
  id: string;
  business_name: string;
  verified: boolean;
  subscription_tier: string;
  specialties: string[] | null;
  service_area: string | null;
  bio: string | null;
  reputation_score: number;
  latitude: number | null;
  longitude: number | null;
  dist_meters: number;
  is_active_nearby: boolean;
  full_name: string;
};

export async function searchNearbyContractors(
  lat: number,
  lng: number,
  radiusMeters: number = 50000
) {
  const supabase = await createClient();

  // Call PostGIS function to get nearby contractors with distances
  const { data: nearbyData, error: rpcError } = await supabase.rpc(
    "find_nearby_contractors",
    {
      user_lat: lat,
      user_long: lng,
      search_radius_meters: radiusMeters,
    }
  );

  if (rpcError) throw new Error(rpcError.message);

  const nearby = (nearbyData ?? []) as {
    id: string;
    business_name: string;
    dist_meters: number;
    is_active_nearby: boolean;
  }[];

  if (nearby.length === 0) return [];

  // Fetch full contractor details for the nearby results
  const ids = nearby.map((c) => c.id);

  const { data: contractors } = await supabase
    .from("contractors")
    .select(
      "id, business_name, verified, subscription_tier, specialties, service_area, bio, reputation_score, latitude, longitude, profiles(full_name)"
    )
    .in("id", ids);

  const contractorMap = new Map(
    ((contractors ?? []) as unknown as {
      id: string;
      business_name: string;
      verified: boolean;
      subscription_tier: string;
      specialties: string[] | null;
      service_area: string | null;
      bio: string | null;
      reputation_score: number;
      latitude: number | null;
      longitude: number | null;
      profiles: { full_name: string };
    }[]).map((c) => [c.id, c])
  );

  // Merge distance data with full contractor data, preserving distance sort order
  return nearby
    .map((n) => {
      const c = contractorMap.get(n.id);
      if (!c) return null;
      return {
        id: c.id,
        business_name: c.business_name,
        verified: c.verified,
        subscription_tier: c.subscription_tier,
        specialties: c.specialties,
        service_area: c.service_area,
        bio: c.bio,
        reputation_score: c.reputation_score ?? 0,
        latitude: c.latitude,
        longitude: c.longitude,
        dist_meters: n.dist_meters,
        is_active_nearby: n.is_active_nearby,
        full_name: c.profiles?.full_name ?? "Unknown",
      } as NearbyContractor;
    })
    .filter(Boolean) as NearbyContractor[];
}

export async function getNearbyCount(lat: number, lng: number) {
  const supabase = await createClient();

  const [contractorsResult, projectsResult] = await Promise.all([
    supabase.rpc("find_nearby_contractors", {
      user_lat: lat,
      user_long: lng,
      search_radius_meters: 8000, // ~5 miles
    }),
    supabase.rpc("find_nearby_active_projects", {
      user_lat: lat,
      user_long: lng,
      search_radius_meters: 8000,
    }),
  ]);

  return {
    contractors: ((contractorsResult.data as unknown[]) ?? []).length,
    activeProjects: ((projectsResult.data as unknown[]) ?? []).length,
  };
}

export async function getNearbyActiveProjects(lat: number, lng: number) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("find_nearby_active_projects", {
    user_lat: lat,
    user_long: lng,
    search_radius_meters: 5000,
  });

  if (error) return [];

  const projects = (data ?? []) as {
    id: string;
    title: string;
    dist_meters: number;
    contractor_id: string;
  }[];

  if (projects.length === 0) return [];

  // Fetch contractor names for each project
  const contractorIds = [...new Set(projects.map((p) => p.contractor_id).filter(Boolean))];

  const { data: contractors } = await supabase
    .from("contractors")
    .select("id, business_name")
    .in("id", contractorIds);

  const contractorMap = new Map(
    ((contractors ?? []) as { id: string; business_name: string }[]).map(
      (c) => [c.id, c.business_name]
    )
  );

  return projects.map((p) => ({
    id: p.id,
    title: p.title,
    distMeters: p.dist_meters,
    contractorName: contractorMap.get(p.contractor_id) ?? "A contractor",
  }));
}
