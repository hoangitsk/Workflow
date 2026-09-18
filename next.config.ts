import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ["firebase-admin"],
  outputFileTracingIncludes: {
    "/api/production-map": ["./index.html"],
  },
};

export default nextConfig;
