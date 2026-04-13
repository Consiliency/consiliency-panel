import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mark BAML's native .node binary as external so webpack doesn't bundle it.
  // baml_client/index.ts lives outside apps/backend, so we also add a webpack
  // externals function to catch @boundaryml/* imports regardless of importer path.
  serverExternalPackages: ["@boundaryml/baml"],
  webpack(config, { isServer }) {
    if (isServer && Array.isArray(config.externals)) {
      config.externals.push(
        (
          { request }: { request?: string },
          callback: (err?: Error | null, result?: string) => void
        ) => {
          if (request?.startsWith("@boundaryml/")) {
            return callback(null, `commonjs ${request}`);
          }
          callback();
        }
      );
    }
    return config;
  },
};

export default nextConfig;
