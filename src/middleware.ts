import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isStagingEnvironment } from "@/lib/staging";
import { getPublicSupabaseAuthCookieName, getServerSupabaseUrl } from "@/lib/supabase/url";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  if (isStagingEnvironment()) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }

  const pathname = request.nextUrl.pathname;
  const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/internal") || pathname.startsWith("/review");
  const isAuthRoute = pathname === "/login" || pathname === "/signup";

  if (!isProtected && !isAuthRoute) {
    return response;
  }

  const supabase = createServerClient(
    getServerSupabaseUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { name: getPublicSupabaseAuthCookieName() },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          if (isStagingEnvironment()) {
            response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
          }
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user) {
    const { data: profile } = await supabase.from('profiles').select('account_status').eq('id', user.id).maybeSingle();
    if (!profile || profile.account_status !== 'active') {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL('/login?error=account_inactive', request.url));
    }
    const role = user.app_metadata?.role as string | undefined;
    const isInternalUser = role === "admin" || role === "buzl_member";

    // Importer routes: /admin/businesses/import and /internal/*
    const isImportRoute = pathname === "/admin/businesses/import" || pathname.startsWith("/internal");
    const isReviewRoute = pathname.startsWith('/review/businesses');

    if (isReviewRoute) {
      const { data: reviewProfile } = await supabase.from('profiles').select('permission_preset').eq('id', user.id).maybeSingle();
      const canReview = role === 'admin' || (role === 'buzl_member' && reviewProfile?.permission_preset === 'listing_manager');
      if (!canReview) return NextResponse.redirect(new URL(role === 'buzl_member' ? '/admin/businesses/import' : '/dashboard', request.url));
    } else if (isImportRoute) {
      if (!isInternalUser) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } else if (pathname.startsWith("/admin")) {
      // General admin routes require admin role
      if (role !== "admin") {
        const dest = role === "buzl_member" ? "/admin/businesses/import" : "/dashboard";
        return NextResponse.redirect(new URL(dest, request.url));
      }
    }

    if (isAuthRoute) {
      let dest = "/dashboard";
      if (role === "admin") {
        dest = "/admin/businesses";
      } else if (role === "buzl_member") {
        dest = "/admin/businesses/import";
      }
      return NextResponse.redirect(new URL(dest, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
