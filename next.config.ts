import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/desktop-tutorial",
  images: { unoptimized: true },
};

export default nextConfig;
