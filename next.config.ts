import type { NextConfig } from "next";

/**
 * Content-Security-Policy en mode BLOQUANT (durcie après observation du
 * report-only). Bloque tout chargement hors des origines listées : protège
 * contre l'injection de scripts/iframes externes, l'exfiltration (connect-src)
 * et le clickjacking (frame-ancestors).
 *
 * Domaines runtime réels (audités sur le code + la prod) :
 *  - Supabase (auth/DB/storage)        → connect-src + img *.supabase.co (pas de
 *    websocket Realtime utilisé → https suffit)
 *  - Cloudflare R2 (upload + lecture)  → connect/media/img *.r2.cloudflarestorage.com
 *  - Avatars Google OAuth              → img *.googleusercontent.com (photo de profil)
 *  - Stripe / Anthropic / Groq         → 100 % serveur (server actions + redirection
 *    checkout externe) → rien à autoriser côté client
 *  - Polices : next/font les sert en self (pas de Google Fonts externe)
 *
 * 'unsafe-inline' (script + style) reste nécessaire : JSON-LD inline + bootstrap
 * d'hydratation Next + styles inline (animations) tant qu'on n'a pas câblé une CSP
 * par nonce. 'unsafe-eval' conservé par prudence (durcissement nonce = itération
 * dédiée future). Le reste de la politique est strict.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.r2.cloudflarestorage.com https://*.supabase.co https://*.googleusercontent.com",
  "media-src 'self' blob: https://*.r2.cloudflarestorage.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://*.r2.cloudflarestorage.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Content-Security-Policy",
            value: csp,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
