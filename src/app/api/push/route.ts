import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { subscription } = body as {
    subscription: {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };
  };

  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  // Upsert: if this endpoint already exists, update it
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: "endpoint" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Enable push in notification preferences
  const { data: existing } = await supabase
    .from("notification_preferences")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    await supabase
      .from("notification_preferences")
      .update({ push_enabled: true })
      .eq("user_id", user.id);
  } else {
    await supabase
      .from("notification_preferences")
      .insert({ user_id: user.id, push_enabled: true });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { endpoint } = body as { endpoint: string };

  if (!endpoint) {
    return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
  }

  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .eq("user_id", user.id);

  // Check if user has any remaining subscriptions
  const { data: remaining } = await supabase
    .from("push_subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  // If no subscriptions left, disable push in preferences
  if (!remaining || remaining.length === 0) {
    await supabase
      .from("notification_preferences")
      .update({ push_enabled: false })
      .eq("user_id", user.id);
  }

  return NextResponse.json({ ok: true });
}
