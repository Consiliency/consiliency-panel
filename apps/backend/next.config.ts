import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // All route handlers are server-side only
  experimental: {
    // after() API for async post-response processing
  },
};

export default nextConfig;
