import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `standalone` lets `bun run start` serve the self-contained server bundle.
  output: "standalone",
  // Type errors must fail the build — never ship red.
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  // r28: the dev-tools indicator badge (36x36, fixed bottom-left) renders
  // into every dev-mode capture and pixel-diffs against the live, which
  // carries no badge. The dev overlay still works on runtime errors.
  devIndicators: false,
};

export default nextConfig;
