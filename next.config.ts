import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@astro/core"],
  allowedDevOrigins: ["pv-91e8820c3a7e-91e1e442-e72d-4326-b6ea-e79c74c16968.style.dev"],

  // API keys belong to the ASTRO developer portal now. The old Bleek portal
  // routes stay as redirects so bookmarks and docs do not dead-end.
  async redirects() {
    return [
      { source: "/developers", destination: "/astro", permanent: false },
      { source: "/developers/:path*", destination: "/astro", permanent: false },
    ];
  },
};

export default nextConfig;
