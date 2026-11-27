export function Wordmark({ tone = "dark", compact = false }: { tone?: "dark" | "light"; compact?: boolean }) {
  const ink = tone === "light" ? "#f2f2ee" : "#1b1e23";
  return (
    <span className="inline-flex items-center gap-2.5" style={{ color: ink }}>
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden>
        {/* Three fanned chips. */}
        <g transform="rotate(-18 4 22)">
          <rect x="4" y="4" width="8" height="18" fill="#3B5A8E" />
        </g>
        <g transform="rotate(-6 9 22)">
          <rect x="9" y="4" width="8" height="18" fill="#D69A2D" />
        </g>
        <rect x="14" y="4" width="8" height="18" fill="#B04A3A" />
        <circle cx="18" cy="19" r="1.6" fill={tone === "light" ? "#1f5a50" : "#f2f2ee"} />
      </svg>
      {!compact && <span className="text-[1.0625rem] font-extrabold tracking-[-0.01em]">Spend Sense</span>}
    </span>
  );
}
