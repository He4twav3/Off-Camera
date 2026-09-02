const CENTER = { x: 50, y: 46 };
const WREATH_RADIUS = 33;

// Two symmetric arcs of tick marks, with gaps left at the top (shield
// peak) and bottom (banner). Angle 0 = straight up; SVG rotate() is
// clockwise, so these sweep down the right side, and mirror down the left.
const RIGHT_ARC = [25, 45, 65, 90, 115, 135, 155];
const LEFT_ARC = RIGHT_ARC.map((deg) => -deg);

/**
 * On Camera's brand crest — a heraldic badge in the vein of a vintage
 * club/academy emblem: shield, laurel-tick wreath, a play mark at the
 * center, and a banner plaque. Monoline, flat-filled, ink-outlined — no
 * gradients, matching the "toybox sticker" illustration system.
 *
 * The center mark used to be a camera with a slash through it — a literal
 * "no camera" glyph, which fit the site's old faceless-only identity but
 * actively contradicts the current one (camera optional, not camera
 * banned). A play mark reads as "content" without taking a position on
 * format.
 */
export function CrestEmblem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 92" className={className} aria-hidden>
      {/* Shield */}
      <path
        d="M20,14 L80,14 C86,14 90,18 90,26 L90,46 C90,64 76,82 50,92 C24,82 10,64 10,46 L10,26 C10,18 14,14 20,14 Z"
        fill="var(--card)"
        stroke="var(--ink)"
        strokeWidth={3}
        strokeLinejoin="round"
      />

      {/* Laurel-tick wreath */}
      {[...LEFT_ARC, ...RIGHT_ARC].map((deg) => (
        <path
          key={deg}
          d="M-4,-2.5 L0,3.5 L4,-2.5"
          fill="none"
          stroke="var(--ink)"
          strokeWidth={2.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          transform={`translate(${CENTER.x},${CENTER.y}) rotate(${deg}) translate(0,-${WREATH_RADIUS})`}
        />
      ))}

      {/* Center medallion */}
      <circle
        cx={CENTER.x}
        cy={CENTER.y}
        r={25}
        fill="var(--ink)"
        stroke="var(--ink)"
        strokeWidth={3}
      />
      {/* Play mark */}
      <path
        d="M42,33 L42,61 L66,47 Z"
        fill="var(--card)"
        stroke="var(--card)"
        strokeWidth={3}
        strokeLinejoin="round"
      />

      {/* Banner plaque */}
      <polygon
        points="6,74 20,66 80,66 94,74 80,82 20,82"
        fill="var(--toy-base)"
        stroke="var(--ink)"
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <text
        x="50"
        y="77.5"
        textAnchor="middle"
        className="font-heading"
        fill="var(--toy-base-foreground)"
        fontSize="9"
        fontWeight={700}
        letterSpacing="0.5"
      >
        ON CAMERA
      </text>
    </svg>
  );
}
