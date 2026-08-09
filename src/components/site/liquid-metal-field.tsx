/**
 * Generative "liquid metal" strokes — not a filled texture/photo, just
 * the flowing highlight lines themselves, transparent everywhere else, so
 * the page's actual solid --background still reads as a plain dark
 * surface with a few chrome streaks woven across it rather than a
 * wallpaper.
 *
 * The trick is feSpecularLighting's own output: per the SVG spec its
 * alpha channel is derived from how bright the specular highlight is at
 * each point, so flat/dark areas of the underlying turbulence come out
 * fully transparent for free — no separate luminance-to-alpha step
 * needed, just render feSpecularLighting's result directly with no
 * opaque backing rect. `tint` varies the highlight color per instance
 * (bright silver vs. the site's cool violet glint) so a couple of layers
 * stacked together read as genuinely different pours, not one texture
 * repeated.
 *
 * Static SVG — only a CSS `transform` animates on top of it elsewhere,
 * the filter itself never re-runs per frame.
 */
export function LiquidMetalField({
  seed = 7,
  tint = "#f4f5f8",
  angle = 235,
  exponent = 26,
  className,
}: {
  seed?: number;
  tint?: string;
  angle?: number;
  exponent?: number;
  className?: string;
}) {
  const id = `liquidStrokes-${seed}`;

  return (
    <svg
      aria-hidden
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1000 1000"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <filter
          id={id}
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.0016 0.006"
            numOctaves={3}
            seed={seed}
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation="1.6" result="smoothNoise" />
          <feSpecularLighting
            in="smoothNoise"
            surfaceScale={7}
            specularConstant={1.1}
            specularExponent={exponent}
            lightingColor={tint}
            result="spec"
          >
            <feDistantLight azimuth={angle} elevation={62} />
          </feSpecularLighting>
        </filter>
      </defs>
      <rect width="1000" height="1000" filter={`url(#${id})`} />
    </svg>
  );
}
