/**
 * Decorative SVG sparkles in the Storytale style — 4-point and 8-point stars.
 * Used as page accents around hero illustrations.
 */
export function FourStar({
  className,
  fill = "#FFCB47",
  stroke = "#1A1A2E",
}: {
  className?: string;
  fill?: string;
  stroke?: string;
}) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20 2 L23 17 L38 20 L23 23 L20 38 L17 23 L2 20 L17 17 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EightStar({
  className,
  fill = "#FF6B35",
  stroke = "#1A1A2E",
}: {
  className?: string;
  fill?: string;
  stroke?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M32 2 L36 24 L58 12 L46 32 L62 36 L46 40 L58 60 L36 48 L32 62 L28 48 L6 60 L18 40 L2 36 L18 32 L6 12 L28 24 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Sparkles({ className }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 ${className ?? ""}`}>
      <FourStar
        className="absolute left-[10%] top-[12%] h-8 w-8 animate-twinkle"
        fill="#FFCB47"
      />
      <EightStar
        className="absolute right-[14%] top-[20%] h-12 w-12 animate-twinkle [animation-delay:600ms]"
        fill="#FF6B35"
      />
      <FourStar
        className="absolute left-[35%] bottom-[10%] h-6 w-6 animate-twinkle [animation-delay:1.2s]"
        fill="#7BD389"
      />
      <FourStar
        className="absolute right-[28%] bottom-[18%] h-7 w-7 animate-twinkle [animation-delay:1.8s]"
        fill="#7DD3FC"
      />
    </div>
  );
}
