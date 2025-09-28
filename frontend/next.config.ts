// frontend/next.config.ts
import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL ?? "https://celcol-production-testing.up.railway.app";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: process.env.SKIP_ESLINT === "1",
  },
  async rewrites() {
    return [
      // El front llama /api/...  →  backend sin /api
      { source: "/api/:path*",     destination: `${BACKEND_URL}/:path*` },
      // 👇 Nuevo: proxy directo para /auth/* (especialmente /auth/callback)
      { source: "/auth/:path*",    destination: `${BACKEND_URL}/auth/:path*` },
      { source: "/uploads/:path*", destination: `${BACKEND_URL}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
