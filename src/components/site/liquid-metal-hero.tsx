"use client";

import { useEffect, useRef } from "react";

const VERTEX_SRC = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

// A single contained liquid-metal panel — its own dark backdrop, one bold
// flowing form (not a tiled field), animated very slowly. Reuses the same
// curl-noise-lit approach as the sitewide field did, but composited
// opaquely (this panel supplies its own dark ground, it isn't meant to
// show a page background through it) and tuned for one large coherent
// shape: a much lower noise frequency than a full-page field needs, so
// only one or two "features" ever fit inside the panel at all.
const FRAGMENT_SRC = `
precision highp float;
uniform vec2 uResolution;
uniform float uTime;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    v += amp * noise(p);
    p = p * 2.0 + vec2(7.3, 2.1);
    amp *= 0.55;
  }
  return v;
}

vec2 curl(vec2 p) {
  float e = 0.06;
  float n1 = fbm(p + vec2(0.0, e));
  float n2 = fbm(p - vec2(0.0, e));
  float n3 = fbm(p + vec2(e, 0.0));
  float n4 = fbm(p - vec2(e, 0.0));
  float dx = (n1 - n2) / (2.0 * e);
  float dy = (n3 - n4) / (2.0 * e);
  return vec2(dy, -dx);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  float aspect = uResolution.x / uResolution.y;
  // A much lower frequency than the (now removed) full-page field used —
  // this needs one or two big coherent folds filling the panel, not many
  // small repeated ones.
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0) * 0.55;

  // Very slow — this is a decorative hero panel, not an ambient background;
  // it should read as barely-there motion, felt more than seen.
  float t = uTime * 0.006;
  vec2 drift = vec2(t, -t * 0.6);

  vec2 flow = p;
  for (int i = 0; i < 2; i++) {
    flow += curl(flow * 0.6 + drift) * 0.35;
  }

  float h = fbm(flow * 0.9 + drift * 0.5);

  float e = 0.01;
  float heightScale = 7.0;
  float hx = (fbm(flow * 0.9 + vec2(e, 0.0) + drift * 0.5) - h) * heightScale;
  float hy = (fbm(flow * 0.9 + vec2(0.0, e) + drift * 0.5) - h) * heightScale;
  vec3 normal = normalize(vec3(-hx / e, -hy / e, 0.85));

  vec3 lightDir = normalize(vec3(0.45, 0.75, 0.55));
  float diff = max(dot(normal, lightDir), 0.0);
  diff = smoothstep(0.15, 0.85, diff);

  vec3 viewDir = vec3(0.0, 0.0, 1.0);
  vec3 halfV = normalize(lightDir + viewDir);
  float ndh = max(dot(normal, halfV), 0.0);
  float specTight = pow(ndh, 40.0);
  float specWide = pow(ndh, 8.0) * 0.3;
  float spec = specTight * 2.4 + specWide;

  // Dark base ground (near-black, a touch lighter toward the upper right,
  // echoing the reference), then the lit metal surface painted on top —
  // opaque throughout, this panel is its own self-contained image.
  vec3 bgDark = vec3(0.03, 0.03, 0.035);
  vec3 bgLight = vec3(0.14, 0.14, 0.15);
  float bgMix = clamp(uv.x * 0.5 + (1.0 - uv.y) * 0.5, 0.0, 1.0);
  vec3 ground = mix(bgDark, bgLight, bgMix);

  vec3 metal = vec3(0.05, 0.05, 0.055) + vec3(1.0) * spec;
  float shapeMix = clamp(diff * 1.05, 0.0, 1.0);
  vec3 col = mix(ground, metal, shapeMix);
  col += vec3(1.0) * spec * 0.9;

  gl_FragColor = vec4(col, 1.0);
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    // eslint-disable-next-line no-console
    console.error("LiquidMetalHero shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/**
 * A single, contained, very-slowly-animating liquid-metal panel — its own
 * dark backdrop and one bold flowing form, not a page-wide effect. Meant
 * to sit as a decorative visual (e.g. in the Hero), the way a photo or
 * illustration would, rather than behind real content.
 */
export function LiquidMetalHero({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
    if (!gl) return;

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SRC);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      // eslint-disable-next-line no-console
      console.error("LiquidMetalHero program link error:", gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    function onContextLost(e: Event) {
      e.preventDefault();
    }
    canvas.addEventListener("webglcontextlost", onContextLost);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, "uResolution");
    const uTime = gl.getUniformLocation(program, "uTime");

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let width = 0;
    let height = 0;

    function resize() {
      if (!canvas || !gl) return;
      width = Math.floor(canvas.clientWidth * dpr);
      height = Math.floor(canvas.clientHeight * dpr);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
        gl.uniform2f(uResolution, width, height);
      }
    }

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    let rafId = 0;
    let visible = document.visibilityState === "visible";

    function draw(time: number) {
      if (!gl) return;
      gl.uniform1f(uTime, time / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function loop(time: number) {
      if (!visible) return;
      draw(time);
      rafId = requestAnimationFrame(loop);
    }

    function onVisibilityChange() {
      visible = document.visibilityState === "visible";
      if (visible && !reduceMotion) {
        rafId = requestAnimationFrame(loop);
      }
    }

    if (reduceMotion) {
      draw(0);
    } else {
      rafId = requestAnimationFrame(loop);
      document.addEventListener("visibilitychange", onVisibilityChange);
    }

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}
