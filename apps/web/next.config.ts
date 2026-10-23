import { LOBBY_SLUG } from "@bumbadum/protocol";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@bumbadum/protocol", "@bumbadum/game-engine"],
  async redirects() {
    return [
      {
        // The lobby is the only room during the MVP (ADR-0008).
        source: `/r/:slug((?!${LOBBY_SLUG}$)[^/]+)`,
        destination: `/r/${LOBBY_SLUG}`,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
