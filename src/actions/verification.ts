"use server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/actions/admin";
import { revalidatePath } from "next/cache";
import { notify } from "@/lib/notifications";
import { z } from "zod/v4";

export type VerificationState = {
  error: string | null;
  success: boolean;
};

const clientVerificationSchema = z.object({
  documentType: z.enum(["passport", "drivers_license", "national_id"]),
  storagePath: z.string().min(1),
});

const contractorVerificationSchema = z.object({
  taxId: z.string().trim().min(5, "Tax ID must be at least 5 characters").max(50),
});

export async function submitClientVerification(
  _prevState: VerificationState,
  formData: FormData
): Promise<VerificationState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized", success: false };

  const admin = getSupabaseAdmin();

  // Verify user is a client
  const { data: profileData } = await admin
    .from("profiles")
    .select("role, verification_status")
    .eq("id", user.id)
    .single();

  const profile = profileData as {
    role: string;
    verification_status: string;
  } | null;

  if (!profile || profile.role !== "client") {
    return { error: "Only clients can submit ID documents", success: false };
  }

  if (profile.verification_status === "approved") {
    return { error: "Already verified", success: false };
  }

  if (profile.verification_status === "pending") {
    return { error: "Verification already pending", success: false };
  }

  const parsed = clientVerificationSchema.safeParse({
    documentType: formData.get("documentType"),
    storagePath: formData.get("storagePath"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, success: false };
  }

  // Validate storage path belongs to this user
  if (!parsed.data.storagePath.startsWith(`${user.id}/`)) {
    return { error: "Invalid document path", success: false };
  }

  await admin
    .from("profiles")
    .update({
      verification_status: "pending",
      id_document_path: parsed.data.storagePath,
      id_document_type: parsed.data.documentType,
      verification_rejected_reason: null,
      verification_submitted_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  // Notify all admins
  const { data: admins } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "admin");

  const adminList = (admins ?? []) as { id: string }[];
  for (const a of adminList) {
    notify({
      userId: a.id,
      type: "verification_submitted",
      title: "New Verification Request",
      body: `A client has submitted an ID document for verification`,
      actionUrl: `/admin/users/${user.id}`,
    }).catch(() => {});
  }

  revalidatePath("/settings");
  return { error: null, success: true };
}

export async function submitContractorVerification(
  _prevState: VerificationState,
  formData: FormData
): Promise<VerificationState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized", success: false };

  const admin = getSupabaseAdmin();

  // Verify user is a contractor
  const { data: profileData } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const profile = profileData as { role: string } | null;

  if (!profile || profile.role !== "contractor") {
    return { error: "Only contractors can submit Tax ID", success: false };
  }

  const { data: contractorData } = await admin
    .from("contractors")
    .select("verification_status")
    .eq("id", user.id)
    .single();

  const contractor = contractorData as { verification_status: string } | null;

  if (contractor?.verification_status === "approved") {
    return { error: "Already verified", success: false };
  }

  if (contractor?.verification_status === "pending") {
    return { error: "Verification already pending", success: false };
  }

  const parsed = contractorVerificationSchema.safeParse({
    taxId: formData.get("taxId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, success: false };
  }

  await admin
    .from("contractors")
    .update({
      tax_id: parsed.data.taxId,
      verification_status: "pending",
      verification_rejected_reason: null,
      verification_submitted_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  // Notify all admins
  const { data: admins } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "admin");

  const adminList = (admins ?? []) as { id: string }[];
  for (const a of adminList) {
    notify({
      userId: a.id,
      type: "verification_submitted",
      title: "New Verification Request",
      body: `A contractor has submitted their Tax ID for verification`,
      actionUrl: `/admin/users/${user.id}`,
    }).catch(() => {});
  }

  revalidatePath("/settings");
  return { error: null, success: true };
}

export async function approveVerification(userId: string) {
  await requireAdmin();
  const admin = getSupabaseAdmin();

  const { data: profileData } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  const profile = profileData as { role: string } | null;
  if (!profile) throw new Error("User not found");

  const now = new Date().toISOString();

  if (profile.role === "contractor") {
    await admin
      .from("contractors")
      .update({
        verification_status: "approved",
        verification_reviewed_at: now,
      })
      .eq("id", userId);
  } else {
    await admin
      .from("profiles")
      .update({
        verification_status: "approved",
        verification_reviewed_at: now,
      })
      .eq("id", userId);
  }

  notify({
    userId,
    type: "verification_approved",
    title: "Identity Verified",
    body: "Your identity verification has been approved. You now have full platform access.",
    actionUrl: "/settings",
  }).catch(() => {});

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
}

export async function rejectVerification(userId: string, reason: string) {
  await requireAdmin();

  if (!reason || reason.trim().length === 0) {
    throw new Error("Rejection reason is required");
  }

  const admin = getSupabaseAdmin();

  const { data: profileData } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  const profile = profileData as { role: string } | null;
  if (!profile) throw new Error("User not found");

  const now = new Date().toISOString();

  if (profile.role === "contractor") {
    await admin
      .from("contractors")
      .update({
        verification_status: "rejected",
        verification_rejected_reason: reason.trim(),
        verification_reviewed_at: now,
      })
      .eq("id", userId);
  } else {
    await admin
      .from("profiles")
      .update({
        verification_status: "rejected",
        verification_rejected_reason: reason.trim(),
        verification_reviewed_at: now,
      })
      .eq("id", userId);
  }

  notify({
    userId,
    type: "verification_rejected",
    title: "Verification Rejected",
    body: `Your identity verification was rejected: ${reason.trim()}`,
    actionUrl: "/settings",
  }).catch(() => {});

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
}

export async function getDocumentSignedUrl(userId: string): Promise<string> {
  await requireAdmin();
  const admin = getSupabaseAdmin();

  const { data: profileData } = await admin
    .from("profiles")
    .select("id_document_path")
    .eq("id", userId)
    .single();

  const profile = profileData as { id_document_path: string | null } | null;
  if (!profile?.id_document_path) throw new Error("No document found");

  const { data, error } = await admin.storage
    .from("id-documents")
    .createSignedUrl(profile.id_document_path, 300);

  if (error || !data) throw new Error("Failed to generate URL");
  return data.signedUrl;
}
