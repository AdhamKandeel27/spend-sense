"use client";

import { ImageOff } from "lucide-react";
import { useCallback, useState } from "react";

/** A purchase photo thumbnail that falls back to a placeholder if the file is missing. */
export function Thumb({ photoId, alt, className = "" }: { photoId: string | null; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  // An image can fail before hydration attaches onError; catch that case on mount.
  const ref = useCallback((img: HTMLImageElement | null) => {
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);
  if (!photoId || failed) {
    return (
      <div className={`grid place-items-center bg-[#e6e6e1] text-ink-3 ${className}`}>
        <ImageOff size={22} strokeWidth={1.5} aria-hidden />
        <span className="sr-only">{photoId ? "Photo unavailable" : "No photo"}</span>
      </div>
    );
  }
  return (
    // Private, authenticated files: served by our own route, so no next/image optimiser.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={`/api/files/${photoId}?size=thumb`}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`block bg-[#e6e6e1] object-cover ${className}`}
    />
  );
}
