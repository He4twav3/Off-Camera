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
 *  - anything else (transparent, dark)                -> shown as is
 * If the picture can't be read, it is shown as is.
 *
 * `fill`: the logo is the whole banner. A full picture fills it top to bottom and the space at the sides takes the
 * picture's own background colour, so it reads as one piece and nothing is cropped; any other logo sits centred
 * with some room around it.
 */
export function LogoImage({ src, className, fill = false }: { src: string; className?: string; fill?: boolean }) {
  const [look, setLook] = useState<Look | null>(null);
  // A full picture's background colour, read from its corners, for the space around it in a banner.
  const [edge, setEdge] = useState<string | null>(null);

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
        if (!opaqueLight) {
          if (!corners.every(([, , , a]) => a > 240)) return setLook("plain");
          const avg = (k: number) => Math.round(corners.reduce((n, c) => n + c[k], 0) / corners.length);
          setEdge(`rgb(${avg(0)} ${avg(1)} ${avg(2)})`);
          return setLook("photo");
        }
        let colourful = 0;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] < 200) continue;
          if (Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]) > 40) colourful++;
        }
        setLook(colourful / (size * size) > 0.04 ? "tile" : "invert");
      } catch {
        setLook("plain");
      }
    };
    if (img.complete && img.naturalWidth > 0) decide();
    else img.addEventListener("load", decide, { once: true });
  }, []);

  if (fill && look === "photo") {
    return (
      <>
        <div aria-hidden className="absolute inset-0" style={{ background: edge ?? undefined }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={inspect} src={src} crossOrigin="anonymous" alt="" className="relative size-full object-contain" />
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
