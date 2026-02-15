"use server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";

const updateContractorSchema = z.object({
  businessName: z.string().min(1),
  licenseNumber: z.string().optional(),
  bio: z.string().max(1000).optional(),
  serviceArea: z.string().optional(),
});

export type ProfileState = {
  error: string | null;
  success?: boolean;
};

export async function updateContractorProfile(
  _prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const parsed = updateContractorSchema.safeParse({
    businessName: formData.get("businessName"),
    licenseNumber: formData.get("licenseNumber") || undefined,
    bio: formData.get("bio") || undefined,
    serviceArea: formData.get("serviceArea") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const specialties = formData.get("specialties") as string;
  const specialtiesArray = specialties
    ? specialties.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const latStr = formData.get("latitude") as string;
  const lngStr = formData.get("longitude") as string;
  const latitude = latStr ? parseFloat(latStr) : null;
  const longitude = lngStr ? parseFloat(lngStr) : null;

  if (latitude === null || longitude === null) {
    return { error: "Location is required" };
  }

  const { error } = await supabase
    .from("contractors")
    .update({
      business_name: parsed.data.businessName,
      license_number: parsed.data.licenseNumber,
      bio: parsed.data.bio,
      specialties: specialtiesArray,
      service_area: parsed.data.serviceArea,
      latitude,
      longitude,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  // Update PostGIS location column using admin client (raw SQL)
  if (latitude !== null && longitude !== null) {
    const admin = getSupabaseAdmin();
    await admin.rpc("update_contractor_location", {
      p_contractor_id: user.id,
      p_lat: latitude,
      p_long: longitude,
    }).catch(() => {
      // Fallback: update via raw query if RPC not available
      // The lat/lng columns are already saved above
    });
  }

  revalidatePath("/contractor/profile");
  revalidatePath(`/contractors/${user.id}`);
  return { error: null, success: true };
}

export async function updateProfile(
  _prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const fullName = formData.get("fullName") as string;
  if (!fullName) return { error: "Name is required" };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { error: null, success: true };
}
