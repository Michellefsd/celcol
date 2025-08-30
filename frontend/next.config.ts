// frontend/next.config.ts
import type { NextConfig } from "next";

// Usamos una env para el backend. En Vercel: BACKEND_URL=https://celcol-production.up.railway.app
// En local (archivo .env.local): BACKEND_URL=http://localhost:3001
const BACKEND_URL = process.env.BACKEND_URL ?? "https://celcol-production.up.railway.app";

const nextConfig: NextConfig = {
  // Omití cortar el build por ESLint solo si ponés SKIP_ESLINT=1 (staging)
  eslint: {
    ignoreDuringBuilds: process.env.SKIP_ESLINT === "1",
  },
  async rewrites() {
    return [
      { source: "/api/:path*",     destination: `${BACKEND_URL}/:path*` },
      { source: "/uploads/:path*", destination: `${BACKEND_URL}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
