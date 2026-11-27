"use client";

import { useEffect } from "react";

/** Lifts the floating Add button above a pinned footer (e.g. the running total). */
export function FootOffset({ height = "2.75rem" }: { height?: string }) {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--foot-offset", height);
    return () => {
      root.style.removeProperty("--foot-offset");
    };
  }, [height]);
  return null;
}
