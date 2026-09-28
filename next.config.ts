import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `standalone` lets `bun run start` serve the self-contained server bundle.
  output: "standalone",
  // Type errors must fail the build — never ship red.
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  // r30: the live's project form accepts up to 30 photos (its own modal
  // counter displays (N/30)); the clone carries the same photos as data
  // URLs inside the Server Action payload, and 30 client-downscaled
  // photos (each up to MAX_PHOTO_DATA_URL_LENGTH = 400k chars) can
  // exceed Next's default 1 MB action body cap — the live never hits a
  // limit because its photos upload to S3 outside the form save. The
  // 12mb cap covers the full pinned contract (30 x 400k + JSON slack).
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
  // r28: the dev-tools indicator badge (36x36, fixed bottom-left) renders
  // into every dev-mode capture and pixel-diffs against the live, which
  // carries no badge. The dev overlay still works on runtime errors.
  devIndicators: false,
};

export default nextConfig;
