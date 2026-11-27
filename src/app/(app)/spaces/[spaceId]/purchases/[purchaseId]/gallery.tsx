"use client";

import { ImageOff } from "lucide-react";
import { useState } from "react";

export function Gallery({ photoIds, alt }: { photoIds: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  if (photoIds.length === 0) {
    return (
      <div className="grid aspect-square place-items-center bg-[#e6e6e1] text-ink-3">
        <span className="flex flex-col items-center gap-2 text-[0.875rem]">
          <ImageOff size={28} strokeWidth={1.5} aria-hidden /> No photo yet
        </span>
      </div>
    );
  }
  const current = photoIds[Math.min(active, photoIds.length - 1)];
  return (
    <div className="flex flex-col gap-1.5">
      <a href={`/api/files/${current}`} target="_blank" rel="noreferrer" className="block bg-[#e6e6e1]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/api/files/${current}`} alt={alt} className="aspect-square w-full object-contain" />
      </a>
      {photoIds.length > 1 && (
        <ul className="grid grid-cols-5 gap-1.5">
          {photoIds.map((id, i) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Photo ${i + 1}`}
                aria-current={i === active ? "true" : undefined}
                className={`block w-full outline-offset-2 ${i === active ? "outline-2 outline-ink" : "opacity-70 hover:opacity-100"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/files/${id}?size=thumb`} alt="" className="aspect-square w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
