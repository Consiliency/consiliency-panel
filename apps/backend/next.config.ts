import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // All route handlers are server-side only
  // Mark BAML's native .node binary as external so webpack doesn't try to bundle it
  serverExternalPackages: ["@boundaryml/baml"],
};

export default nextConfig;
