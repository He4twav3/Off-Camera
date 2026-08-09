const CENTER = { x: 50, y: 46 };
const WREATH_RADIUS = 33;

// Two symmetric arcs of tick marks, with gaps left at the top (shield
// peak) and bottom (banner). Angle 0 = straight up; SVG rotate() is
// clockwise, so these sweep down the right side, and mirror down the left.
const RIGHT_ARC = [25, 45, 65, 90, 115, 135, 155];
const LEFT_ARC = RIGHT_ARC.map((deg) => -deg);

/**
 * Off Camera's brand crest — a heraldic badge in the vein of a vintage
 * club/academy emblem: shield, laurel-tick wreath, a camera-off mark at
 * the center, and a banner plaque. Monoline, flat-filled, ink-outlined —
 * no gradients, matching the "toybox sticker" illustration system.
 */
export function CrestEmblem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 112" className={className} aria-hidden>
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
      {/* Camera-off mark — the medallion behind it is an opaque bright
          metal fill (--ink), so this needs an opaque dark stroke to read
          as debossed, not --card, which is a near-transparent glass wash
          now and would barely show up against solid silver. */}
      <rect x="37" y="39" width="26" height="16" rx="3" fill="none" stroke="var(--background)" strokeWidth={2.75} />
      <rect x="45" y="35" width="8" height="5" rx="1" fill="none" stroke="var(--background)" strokeWidth={2.75} />
      <circle cx="50" cy="47" r="5.5" fill="none" stroke="var(--background)" strokeWidth={2.75} />
      <line x1="33" y1="31" x2="67" y2="59" stroke="var(--background)" strokeWidth={3} strokeLinecap="round" />

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
        OFF CAMERA
      </text>

      {/* Sits on the cover wrapper's own dark background, so this needs a
          bright, opaque fill — --card is a translucent glass wash now and
          would be nearly invisible here. */}
      <text
        x="50"
        y="103"
        textAnchor="middle"
        className="font-heading"
        fill="var(--foreground)"
        fontSize="7"
        fontWeight={600}
        letterSpacing="1"
      >
        EST. 2024
      </text>
    </svg>
  );
}
