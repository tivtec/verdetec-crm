import type { NextConfig } from "next";

const DEV_WATCH_IGNORED_PATTERNS = [
  "**/.dev-server.log",
  "**/.dev-server.log.*",
  "**/*.log",
];

const nextConfig: NextConfig = {
  turbopack: {},
  webpack(config, { dev }) {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: DEV_WATCH_IGNORED_PATTERNS,
      };
    }

    return config;
  },
};

export default nextConfig;
