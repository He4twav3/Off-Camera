const FILLS = {
  soft: "var(--toy-soft)",
  base: "var(--toy-base)",
  strong: "var(--toy-strong)",
  deep: "var(--toy-deep)",
} as const;

type MascotProps = {
  variant?: keyof typeof FILLS;
  className?: string;
};

const STROKE = "var(--ink)";

/** Round, friendly blob with a raised-arm wave — the "hello" mascot. */
export function MascotWave({ variant = "soft", className }: MascotProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-hidden
    >
      <path
        d="M22,60 C10,54 8,38 18,26 C28,14 46,10 60,14 C76,19 88,32 86,50 C84,68 70,82 52,84 C36,86 20,78 16,66 C15,63 17,61 22,60 Z"
        fill={FILLS[variant]}
        stroke={STROKE}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      {/* raised arm */}
      <path
        d="M20,58 C10,54 4,44 8,36"
        fill="none"
        stroke={STROKE}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <circle cx="42" cy="46" r="3.4" fill={STROKE} />
      <circle cx="64" cy="44" r="3.4" fill={STROKE} />
      <path
        d="M42,60 C49,67 57,67 64,59"
        fill="none"
        stroke={STROKE}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Pac-man-style wedge-mouth character — mid-bite, a little mischievous. */
export function MascotChomp({ variant = "base", className }: MascotProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-hidden
    >
      <path
        d="M50,50 L85,28 A38,38 0 1 0 85,72 Z"
        fill={FILLS[variant]}
        stroke={STROKE}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <circle cx="50" cy="28" r="3.4" fill={STROKE} />
    </svg>
  );
}

/** 8-point burst — vertices from a true alternating-radius star polygon. */
export function MascotSpiky({ variant = "strong", className }: MascotProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-hidden
    >
      <polygon
        points="50,8 58,30 80,20 70,42 92,50 70,58 80,80 58,70 50,92 42,70 20,80 30,58 8,50 30,42 20,20 42,30"
        fill={FILLS[variant]}
        stroke={STROKE}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <circle cx="43" cy="48" r="3.2" fill={STROKE} />
      <circle cx="61" cy="48" r="3.2" fill={STROKE} />
      <path
        d="M43,60 C49,65 55,65 61,60"
        fill="none"
        stroke={STROKE}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </svg>
  );
}
