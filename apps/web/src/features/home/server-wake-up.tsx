"use client";

import { useEffect } from "react";
import { isServerAwake } from "@/lib/server-health.ts";

/**
 * Pings the server as soon as the home page loads, so a sleeping Render server
 * is often awake by the time the player clicks "Join". Renders nothing.
 */
export function ServerWakeUp() {
  useEffect(() => {
    void isServerAwake();
  }, []);
  return null;
}
