/**
 * Inline SVG illustration of "RouteGuardian" — a stylized character with
 * a thin outline holding a glowing lantern, drawn in the Storytale palette.
 *
 * Inline SVG (rather than a Storytale PNG asset) keeps the repo self-
 * contained and license-clean. Recolour the constants below to reskin.
 */
export function GuardianMascot({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Big orange star background */}
      <path
        d="M160 30 L188 130 L290 110 L210 175 L260 260 L160 215 L60 260 L110 175 L30 110 L132 130 Z"
        fill="#FF6B35"
        stroke="#1A1A2E"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Cloak */}
      <path
        d="M155 110 C 95 130, 90 250, 130 290 L 220 290 C 245 230, 240 145, 200 115 Z"
        fill="#4F3CC9"
        stroke="#1A1A2E"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Hood */}
      <path
        d="M155 90 C 130 95, 130 130, 150 145 L 215 145 C 230 130, 225 95, 200 90 Z"
        fill="#4F3CC9"
        stroke="#1A1A2E"
        strokeWidth="3"
      />
      {/* Face */}
      <ellipse cx="180" cy="125" rx="22" ry="20" fill="#FFCB47" stroke="#1A1A2E" strokeWidth="3" />
      {/* Mask */}
      <rect x="158" y="120" width="44" height="14" rx="6" fill="#7DD3FC" stroke="#1A1A2E" strokeWidth="3" />
      {/* Eyes */}
      <circle cx="170" cy="127" r="2" fill="#1A1A2E" />
      <circle cx="190" cy="127" r="2" fill="#1A1A2E" />
      {/* Lantern handle (held in left hand) */}
      <path
        d="M120 165 C 110 170, 100 175, 105 195"
        stroke="#1A1A2E"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <rect x="92" y="190" width="32" height="42" rx="4" fill="#FBF6E9" stroke="#1A1A2E" strokeWidth="3" />
      {/* Lantern flame */}
      <circle cx="108" cy="211" r="9" fill="#FFCB47" stroke="#1A1A2E" strokeWidth="3" />
      {/* Hand on lantern */}
      <ellipse cx="116" cy="178" rx="14" ry="10" fill="#7DD3FC" stroke="#1A1A2E" strokeWidth="3" />
      {/* Pants */}
      <path d="M140 250 L 145 295 L 165 295 L 165 260 Z" fill="#7BD389" stroke="#1A1A2E" strokeWidth="3" strokeLinejoin="round" />
      <path d="M195 260 L 195 295 L 215 295 L 220 250 Z" fill="#7BD389" stroke="#1A1A2E" strokeWidth="3" strokeLinejoin="round" />
      {/* Shoes */}
      <ellipse cx="155" cy="298" rx="18" ry="8" fill="#FF8FA3" stroke="#1A1A2E" strokeWidth="3" />
      <ellipse cx="207" cy="298" rx="18" ry="8" fill="#FF8FA3" stroke="#1A1A2E" strokeWidth="3" />
      {/* Sparkles */}
      <path d="M50 60 L55 75 L70 80 L55 85 L50 100 L45 85 L30 80 L45 75 Z" fill="#FFCB47" stroke="#1A1A2E" strokeWidth="2" strokeLinejoin="round" />
      <path d="M270 220 L274 232 L286 236 L274 240 L270 252 L266 240 L254 236 L266 232 Z" fill="#FFCB47" stroke="#1A1A2E" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
