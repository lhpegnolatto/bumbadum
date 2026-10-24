import { LOBBY_SLUG } from "@bumbadum/protocol";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev build's badge sits over the room's bottom-left buttons and would take e2e taps.
  ...(process.env.NEXT_PUBLIC_E2E === "1" && { devIndicators: false }),
  transpilePackages: [
    "@bumbadum/avatar",
    "@bumbadum/chat",
    "@bumbadum/world",
    "@bumbadum/protocol",
    "@bumbadum/radio",
    "@bumbadum/game-engine",
  ],
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
