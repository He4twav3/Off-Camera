"use client";

import { useCallback, useState } from "react";

type Look = "plain" | "invert" | "tile" | "photo";

/**
 * A campaign logo on the dark card. Logos arrive in whatever shape the brand has: white
 * on transparent (shown as is), or black on a white square, which would sit on the dark
 * card as a hard white box. So the picture is looked at once it loads:
 *  - plain grey/black on an opaque light background  -> flipped to white on the dark card
 *  - a coloured logo on an opaque light background   -> shown on a soft white tile
 *  - a full picture (opaque, not a light square)       -> with `fill`, fills the whole banner
 *    (a flipped plain logo fills it too, as white on its black square)
 *  - anything else (transparent, dark)                -> shown as is
 * If the picture can't be read, it is shown as is.
 *
 * `fill`: the logo is the whole banner. A full picture fills it top to bottom and the space at the sides takes the
 * picture's own colours: each side continues the top-to-bottom gradient of the picture's edge next to it, and the
 * picture's edges fade into it, so it reads as one piece and nothing is cropped. Any other logo sits centred with
 * some room around it.
 */
export function LogoImage({ src, className, fill = false }: { src: string; className?: string; fill?: boolean }) {
  const [look, setLook] = useState<Look | null>(null);
  // A full picture's left and right edges as top-to-bottom gradients, to continue it across a banner's sides.
  const [edges, setEdges] = useState<{ left: string; right: string } | null>(null);

  const inspect = useCallback((img: HTMLImageElement | null) => {
    if (!img) return;
    const decide = () => {
      try {
        const size = 24;
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return setLook("plain");
        ctx.drawImage(img, 0, 0, size, size);
        const d = ctx.getImageData(0, 0, size, size).data;
        const px = (x: number, y: number) => {
          const i = (y * size + x) * 4;
          return [d[i], d[i + 1], d[i + 2], d[i + 3]];
        };
        const corners = [px(0, 0), px(size - 1, 0), px(0, size - 1), px(size - 1, size - 1)];
        const opaqueLight = corners.every(([r, g, b, a]) => a > 240 && (r + g + b) / 3 > 215);
        // An edge as a top-to-bottom gradient; `flip` for a logo shown inverted, so it matches what is on screen.
        const column = (x: number, flip: boolean) => {
          const stops: string[] = [];
          for (let y = 0; y < size; y += 2) {
            // A little in from the very edge, and two rows together, to smooth out noise.
            const c = [0, 1, 2].map((k) => (px(x, y)[k] + px(x, Math.min(y + 1, size - 1))[k]) >> 1).map((v) => (flip ? 255 - v : v));
            stops.push(`rgb(${c[0]} ${c[1]} ${c[2]}) ${Math.round((y / (size - 1)) * 100)}%`);
          }
          return `linear-gradient(to bottom, ${stops.join(", ")})`;
        };
        const edgesOf = (flip: boolean) => ({ left: column(1, flip), right: column(size - 2, flip) });
        if (!opaqueLight) {
          if (!corners.every(([, , , a]) => a > 240)) return setLook("plain");
          setEdges(edgesOf(false));
          return setLook("photo");
        }
        let colourful = 0;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] < 200) continue;
          if (Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]) > 40) colourful++;
        }
        if (colourful / (size * size) > 0.04) return setLook("tile");
        setEdges(edgesOf(true));
        setLook("invert");
      } catch {
        setLook("plain");
      }
    };
    if (img.complete && img.naturalWidth > 0) decide();
    else img.addEventListener("load", decide, { once: true });
  }, []);

  // A full picture, or a dark-on-white logo shown inverted (white on black): it fills the banner.
  if (fill && (look === "photo" || look === "invert")) {
    return (
      <>
        <div aria-hidden className="absolute inset-y-0 left-0 w-1/2" style={{ background: edges?.left }} />
        <div aria-hidden className="absolute inset-y-0 right-0 w-1/2" style={{ background: edges?.right }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={inspect} src={src} crossOrigin="anonymous" alt="" className={`relative h-full w-auto max-w-full object-contain [mask-image:linear-gradient(to_right,transparent,black_14%,black_86%,transparent)] ${look === "invert" ? "[filter:invert(1)]" : ""}`} />
      </>
    );
  }

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={inspect}
      src={src}
      crossOrigin="anonymous"
      alt=""
      onError={() => setLook("plain")}
      className={[
        className,
        "transition-opacity",
        look === null ? "opacity-0" : "opacity-100",
        look === "invert" ? "[filter:invert(1)] mix-blend-screen" : "",
        look === "tile" ? "rounded-2xl bg-white p-3" : "",
      ].join(" ")}
    />
  );
  return fill ? <div className="absolute inset-0 flex items-center justify-center p-5">{img}</div> : img;
}
