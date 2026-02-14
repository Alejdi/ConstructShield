import { createClient } from "@/lib/supabase/server";
import {
  createConnectAccount,
  createAccountLink,
} from "@/lib/stripe/connect";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: contractorData } = await supabase
    .from("contractors")
    .select("stripe_connect_account_id")
    .eq("id", user.id)
    .single();

  const contractor = contractorData as {
    stripe_connect_account_id: string | null;
  } | null;

  let accountId = contractor?.stripe_connect_account_id;

  if (!accountId) {
    const account = await createConnectAccount(user.email!);
    accountId = account.id;

    await supabase
      .from("contractors")
      .update({ stripe_connect_account_id: accountId })
      .eq("id", user.id);
  }

  const accountLink = await createAccountLink(
    accountId,
    `${process.env.NEXT_PUBLIC_APP_URL}/contractor/onboarding?success=true`,
    `${process.env.NEXT_PUBLIC_APP_URL}/contractor/onboarding?refresh=true`
  );

  return NextResponse.json({ url: accountLink.url });
}
