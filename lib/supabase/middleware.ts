import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./types";

/**
 * Logique du middleware d'authentification.
 *
 * - Refresh la session Supabase sur chaque request (sinon le token expire silencieusement).
 * - Si la route est protégée (/app/*) et qu'il n'y a pas de session, redirige vers /login.
 * - Si la route est /login ou /signup et qu'il y a une session, redirige vers /app/dashboard.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT : ne PAS exécuter du code entre createServerClient et getUser().
  // Sinon les cookies peuvent être désynchronisés et la session perdue.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Routes publiques : pas de redirection
  const publicRoutes = [
    "/",
    "/blog",
    "/legal",
    "/login",
    "/signup",
    "/reset-password",
    "/auth/callback",
    "/auth/confirm",
  ];
  const isPublic = publicRoutes.some(
    (r) => pathname === r || pathname.startsWith(r + "/"),
  );

  const isAppRoute = pathname.startsWith("/app");
  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/reset-password";

  // Route app sans session → redirect login
  if (isAppRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Route auth (login/signup) avec session → redirect dashboard
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/app/dashboard";
    return NextResponse.redirect(url);
  }

  // Logging silencieux pour debug (à activer si nécessaire)
  // console.log({ pathname, hasUser: !!user, isAppRoute, isAuthRoute });

  void isPublic; // future use

  return supabaseResponse;
}
