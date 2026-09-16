import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `standalone` lets `bun run start` serve the self-contained server bundle.
  output: "standalone",
  // Type errors must fail the build — never ship red.
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
};

export default nextConfig;
