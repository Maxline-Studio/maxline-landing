import type { NextConfig } from "next";

/**
 * Content-Security-Policy en mode REPORT-ONLY (ne bloque rien, signale seulement
 * les violations dans la console). Objectif : valider que la politique couvre
 * tous les usages réels AVANT de la passer en mode bloquant (header CSP).
 *
 * Domaines runtime réels :
 *  - Supabase (auth/DB/storage)        → connect-src *.supabase.co
 *  - Cloudflare R2 (upload + lecture)  → connect/media/img *.r2.cloudflarestorage.com
 *  - Stripe : 100 % serveur (checkout = redirection externe) → rien à autoriser ici
 *  - Polices : next/font les sert en self (pas de Google Fonts externe)
 *
 * 'unsafe-inline'/'unsafe-eval' sur script-src restent nécessaires tant que Next
 * n'est pas câblé avec une CSP par nonce (sinon hydratation cassée). C'est
 * précisément ce que le report-only permet d'observer avant durcissement.
 */
const cspReportOnly = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.r2.cloudflarestorage.com https://*.supabase.co",
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
            key: "Content-Security-Policy-Report-Only",
            value: cspReportOnly,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
