"use client";

import { useEffect, useRef } from "react";

const VERTEX_SRC = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

// A real-time lit flow field, not a static texture — and specifically
// curl noise, not a plain domain-warped fbm: curl noise is the divergence-
// free vector field you get from rotating the gradient of a scalar
// potential 90°, which is what actually produces closed swirling eddies
// (the "marbled ink" spirals) instead of generic drifting clouds. The
// sample coordinate gets advected through that field a few times so the
// swirls compound into the bold, ribbon-like bands liquid metal/marble
// renders show, rather than fine busy grain. Height's gradient becomes a
// surface normal, lit like a real 3D bump map (diffuse + tight specular);
// output alpha rises only at the highlight bands, so flat areas are fully
// transparent and the page's real --background shows through everywhere
// else.
const FRAGMENT_SRC = `
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uColorSilver;
uniform vec3 uColorGlint;
uniform float uIntensity;

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

// Divergence-free curl of an fbm potential field — the source of the
// closed spiral eddies, not just wavy drift.
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
  // A smaller scale multiplier than the first pass here (was 1.8) means
  // fewer, bigger features — one or two sweeping ribbon-like forms with
  // real black negative space between them, rather than a busy field of
  // small eddies. Matches real liquid-metal photography better: those
  // shots read as one bold gesture, not all-over marbled noise.
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0) * 1.0;

  float t = uTime * 0.03;
  vec2 drift = vec2(t, -t * 0.6);

  // Advect through the curl field repeatedly — each pass compounds the
  // swirl, turning gentle waves into wound-up spiral bands. Fewer passes
  // and a gentler push than the busier first attempt, so ribbons stay
  // broad and smooth instead of winding into many small eddies.
  vec2 flow = p;
  for (int i = 0; i < 2; i++) {
    flow += curl(flow * 0.6 + drift) * 0.35;
  }

  float h = fbm(flow * 0.9 + drift * 0.5);

  // heightScale amplifies the finite-difference slope before it becomes a
  // normal — fbm's own output only varies gently over this sample
  // distance, so without this the surface is nearly flat everywhere and
  // no dot product ever gets close enough to 1.0 for a high specular
  // exponent to survive (pow(0.87, 120) is effectively zero — that's the
  // bug a first pass here had: a "correct-looking" shader that was
  // mathematically always transparent).
  float e = 0.01;
  float heightScale = 7.0;
  float hx = (fbm(flow * 0.9 + vec2(e, 0.0) + drift * 0.5) - h) * heightScale;
  float hy = (fbm(flow * 0.9 + vec2(0.0, e) + drift * 0.5) - h) * heightScale;
  vec3 normal = normalize(vec3(-hx / e, -hy / e, 0.85));

  vec3 lightDir = normalize(vec3(0.45, 0.75, 0.55));
  float diff = max(dot(normal, lightDir), 0.0);
  // A wide-ish threshold — the diffuse term is the shape's actual black
  // "body" now (uColorGlint below is solid near-black, not a grey tint),
  // so it needs real coverage to read as a bold gesture, not thin bands.
  diff = smoothstep(0.3, 0.75, diff);

  vec3 viewDir = vec3(0.0, 0.0, 1.0);
  vec3 halfV = normalize(lightDir + viewDir);
  float ndh = max(dot(normal, halfV), 0.0);
  float specTight = pow(ndh, 34.0);
  float specWide = pow(ndh, 8.0) * 0.3;
  float spec = specTight * 2.2 + specWide;

  // uColorGlint is the broad diffuse body fill — solid black, not grey,
  // per reference (the mid-tone "grey" area of a real liquid-metal photo
  // should render as black here). uColorSilver is reserved for the tight
  // specular catches only, so highlights still read as bright white glints
  // on top of that black body instead of the whole shape going pale.
  vec3 col = uColorSilver * spec + uColorGlint * pow(diff, 1.8) * 0.85;
  float a = clamp(spec + pow(diff, 1.8) * 0.85, 0.0, 1.0) * uIntensity;

  gl_FragColor = vec4(col * a, a);
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    // eslint-disable-next-line no-console -- diagnostic for a background
    // decoration that fails silent-and-invisible otherwise
    console.error("LiquidMetalCanvas shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function LiquidMetalCanvas({
  className,
  intensity = 1,
}: {
  className?: string;
  intensity?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false });
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
      console.error("LiquidMetalCanvas program link error:", gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    // A lost GL context (GPU driver reset, backgrounded mobile tab) would
    // otherwise just freeze the animation forever with no error — allow
    // the browser to attempt its own restore instead.
    function onContextLost(e: Event) {
      e.preventDefault();
    }
    canvas.addEventListener("webglcontextlost", onContextLost);

    // One oversized triangle covering the whole clip space — cheaper than
    // a quad (no shared-edge seam, no extra vertices).
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

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const uResolution = gl.getUniformLocation(program, "uResolution");
    const uTime = gl.getUniformLocation(program, "uTime");
    const uColorSilver = gl.getUniformLocation(program, "uColorSilver");
    const uColorGlint = gl.getUniformLocation(program, "uColorGlint");
    const uIntensity = gl.getUniformLocation(program, "uIntensity");

    gl.uniform3f(uColorSilver, 1.0, 1.0, 1.0);
    gl.uniform3f(uColorGlint, 0.04, 0.04, 0.045);
    gl.uniform1f(uIntensity, intensity);

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
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
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
  }, [intensity]);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}
