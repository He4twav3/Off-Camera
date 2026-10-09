import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { adminNeedsMfa } from "@/lib/admin-mfa-gate";
import { DOOR_COOKIE, doorPath } from "@/lib/admin-door";

// Routes that require a signed-in user. Everything recruiting-related
// (profile-setup, jobs, applications) lands under /dashboard/recruiting/*
// once it exists (see the merge plan's Phase 3), so this one prefix
// already covers it — no separate top-level entries needed.
const PROTECTED_PREFIXES = ["/dashboard", "/brand"];
const ADMIN_PREFIX = "/admin";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Do not remove — this refreshes the auth token on every request.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  // Whole path segments only: "/brand" must not also catch the public "/brands".
  const isProtected = PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
  const isAdminRoute = path.startsWith(ADMIN_PREFIX);

  if (!user && (isProtected || isAdminRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // Signed in people may still open /login and the sign-up pages: this team uses a different
  // email for each role, so they need to be able to switch accounts without logging out first.
  // Signing in as someone else simply replaces the current session.

  // Signed in: the landing page is never a destination, whichever logo or
  // link points at "/". The only way back to it is logging out, which
  // lives in settings. Send them to their own home instead.
  if (user && path === "/") {
    const { data: isAdmin } = await supabase.rpc("is_admin");
    let home = "/dashboard";
    if (isAdmin) {
      home = "/admin";
    } else {
      const { data: brand } = await supabase
        .from("brand_accounts")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (brand) home = "/brand";
    }
    const url = request.nextUrl.clone();
    url.pathname = home;
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user && isAdminRoute) {
    // Admin status comes from the DB allowlist via is_admin(), the same
    // function the RLS policies use — so the gate here and the gate in
    // Postgres can never drift apart.
    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (!isAdmin) {
      // Someone who has just used the secret address but is signed in with a non-admin account is
      // shown which account that is (and how to switch). Anyone else: /admin doesn't exist.
      const door = doorPath(process.env as { ADMIN_DOOR_PATH?: string; VERCEL_ENV?: string });
      if (door && request.cookies.get(DOOR_COOKIE)?.value === door) {
        const url = request.nextUrl.clone();
        url.pathname = "/whoami";
        url.search = "";
        return NextResponse.redirect(url);
      }
      return new NextResponse("Not found", { status: 404 });
    }

    // Every admin page needs the two-step code (see lib/admin-mfa-gate.ts); the
    // Security page itself is exempt so an admin can always set it up.
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (adminNeedsMfa(path, aal?.currentLevel, process.env.ADMIN_REQUIRE_MFA)) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/security";
      url.search = "";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
