import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "media.formula1.com" },
      { protocol: "https", hostname: "www.formula1.com" },
      { protocol: "https", hostname: "formula1.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "flagcdn.com" },
      { protocol: "https", hostname: "www.autosport.com" },
      { protocol: "https", hostname: "cdn.motorsport.com" },
      { protocol: "https", hostname: "www.motorsport.com" },
      { protocol: "https", hostname: "the-race.com" },
      { protocol: "https", hostname: "www.racefans.net" },
      { protocol: "https", hostname: "**.wp.com" },
    ],
  },
};

export default nextConfig;
