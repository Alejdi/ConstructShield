import { createClient } from "@/lib/supabase/server";
import { createDirectUpload } from "@/lib/mux/uploads";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, referenceId } = await request.json();

  const passthrough = JSON.stringify({
    type,
    referenceId,
    userId: user.id,
  });

  const upload = await createDirectUpload({
    corsOrigin: process.env.NEXT_PUBLIC_APP_URL!,
    passthrough,
  });

  return NextResponse.json(upload);
}
