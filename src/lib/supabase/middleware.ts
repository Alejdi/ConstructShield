import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users away from protected routes
  if (
    !user &&
    (request.nextUrl.pathname.startsWith("/client") ||
      request.nextUrl.pathname.startsWith("/contractor") ||
      request.nextUrl.pathname.startsWith("/admin") ||
      request.nextUrl.pathname.startsWith("/settings"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Protect admin routes: only admin role can access
  if (user && request.nextUrl.pathname.startsWith("/admin")) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = (profileData as { role: string } | null)?.role;
    if (role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = role === "contractor" ? "/contractor" : "/client";
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated users away from auth pages
  if (
    user &&
    (request.nextUrl.pathname.startsWith("/login") ||
      request.nextUrl.pathname.startsWith("/signup"))
  ) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = (profileData as { role: string } | null)?.role;
    const url = request.nextUrl.clone();
    url.pathname =
      role === "admin"
        ? "/admin"
        : role === "contractor"
          ? "/contractor"
          : "/client";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
