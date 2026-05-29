import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Tous les paths sauf :
     * - _next/static (assets)
     * - _next/image (image optimizer)
     * - favicon.ico, *.png, etc.
     * - api/subscribe (route waitlist publique, pas de session nécessaire)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
