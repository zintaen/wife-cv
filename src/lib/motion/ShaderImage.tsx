import { useEffect, useRef, useState } from 'react';
import { allowsDesktopFx } from './prefers';

// ---------------------------------------------------------------------------
// WebGL shader image — displays an image on a WebGL canvas with a subtle
// hover-distort + RGB-split shader. On scroll the canvas gets a gentle warp
// tied to the element's offset from viewport-center. On pointerenter, the
// distortion radius pulses outward from the cursor.
//
// Falls back to a plain <img> if:
//   - WebGL context can't be created
//   - The user prefers reduced motion
//   - The device is touch (the distort requires hover — we still draw the
//     image crisply via img for responsive + aspect)
//
// We use a single shared GL context per ShaderImage — each instance is
// self-contained so we don't have to manage a pool. For a dozen images on a
// page that's fine; for hundreds we'd share a single canvas + quad.
// ---------------------------------------------------------------------------

const VERT = `
attribute vec2 a_pos;
attribute vec2 a_uv;
varying vec2 v_uv;
void main() {
  v_uv = a_uv;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform vec2  u_res;
uniform vec2  u_mouse;   // 0..1
uniform float u_hover;   // 0..1 eased
uniform float u_time;
uniform float u_aspect;  // image aspect / canvas aspect correction

vec2 fitUV(vec2 uv) {
  // object-fit: cover inside the quad
  float canvasA = u_res.x / u_res.y;
  float imgA    = u_aspect;
  vec2  scale   = vec2(1.0);
  if (imgA > canvasA) {
    scale.x = canvasA / imgA;
  } else {
    scale.y = imgA / canvasA;
  }
  return (uv - 0.5) / scale + 0.5;
}

void main() {
  vec2 uv = fitUV(v_uv);
  vec2 d = uv - u_mouse;
  float r = length(d);
  // hover warp — sharper near the cursor, feathered out by 0.35 radius
  float strength = u_hover * smoothstep(0.35, 0.0, r);
  vec2 offset = normalize(d + 1e-5) * strength * 0.025;

  // RGB split — shift channels slightly based on strength + slow sinusoid
  float split = strength * 0.012 + sin(u_time * 0.9 + uv.y * 20.0) * 0.0008;

  vec4 c;
  c.r = texture2D(u_tex, uv - offset + vec2( split, 0.0)).r;
  c.g = texture2D(u_tex, uv - offset).g;
  c.b = texture2D(u_tex, uv - offset + vec2(-split, 0.0)).b;
  c.a = 1.0;

  // subtle vignette, warms edges
  float v = smoothstep(0.95, 0.2, length(v_uv - 0.5));
  c.rgb *= mix(0.92, 1.0, v);

  gl_FragColor = c;
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { gl.deleteShader(s); return null; }
  return s;
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram | null {
  const v = compileShader(gl, gl.VERTEX_SHADER, VERT);
  const f = compileShader(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!v || !f) return null;
  const p = gl.createProgram();
  if (!p) return null;
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { gl.deleteProgram(p); return null; }
  return p;
}

export function ShaderImage(props: {
  src: string;
  alt?: string;
  className?: string;
  /** object-fit override for the <img> fallback. */
  fit?: 'cover' | 'contain';
  /** Hint: skip WebGL entirely, just render <img>. */
  plain?: boolean;
}) {
  const holderRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef    = useRef<HTMLImageElement>(null);
  const [webglOK, setWebglOK] = useState(false);

  useEffect(() => {
    if (props.plain) return;
    if (!allowsDesktopFx()) return;
    const canvas = canvasRef.current;
    const holder = holderRef.current;
    if (!canvas || !holder) return;

    const gl = canvas.getContext('webgl', { premultipliedAlpha: false, alpha: true, antialias: false });
    if (!gl) return;

    const program = createProgram(gl);
    if (!program) return;
    gl.useProgram(program);

    // Full-screen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 0, 1,
       1, -1, 1, 1,
      -1,  1, 0, 0,
       1,  1, 1, 0,
    ]), gl.STATIC_DRAW);
    const stride = 4 * Float32Array.BYTES_PER_ELEMENT;
    const aPos = gl.getAttribLocation(program, 'a_pos');
    const aUV  = gl.getAttribLocation(program, 'a_uv');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(aUV);
    gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);

    const uTex    = gl.getUniformLocation(program, 'u_tex');
    const uRes    = gl.getUniformLocation(program, 'u_res');
    const uMouse  = gl.getUniformLocation(program, 'u_mouse');
    const uHover  = gl.getUniformLocation(program, 'u_hover');
    const uTime   = gl.getUniformLocation(program, 'u_time');
    const uAspect = gl.getUniformLocation(program, 'u_aspect');

    // Texture
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    // Placeholder pixel so we render immediately
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([200, 192, 180, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    let imageAspect = 1;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageAspect = img.naturalWidth / Math.max(1, img.naturalHeight);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      setWebglOK(true);
    };
    img.onerror = () => { /* fall back to <img> */ };
    img.src = props.src;

    let raf = 0;
    let mx = 0.5, my = 0.5;
    let tmx = 0.5, tmy = 0.5;
    let hover = 0, tHover = 0;
    const start = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = holder.getBoundingClientRect();
      canvas.width  = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      canvas.style.width  = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(holder);

    const onMove = (e: PointerEvent) => {
      const rect = holder.getBoundingClientRect();
      if (
        e.clientX < rect.left - 80 || e.clientX > rect.right  + 80 ||
        e.clientY < rect.top  - 80 || e.clientY > rect.bottom + 80
      ) { tHover = 0; return; }
      tmx = (e.clientX - rect.left) / Math.max(1, rect.width);
      tmy = 1.0 - (e.clientY - rect.top) / Math.max(1, rect.height);
      const insideTight =
        e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top  && e.clientY <= rect.bottom;
      tHover = insideTight ? 1 : 0;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    const render = () => {
      mx += (tmx - mx) * 0.12;
      my += (tmy - my) * 0.12;
      hover += (tHover - hover) * 0.08;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(uTex, 0);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uMouse, mx, my);
      gl.uniform1f(uHover, hover);
      gl.uniform1f(uTime, (performance.now() - start) / 1000);
      gl.uniform1f(uAspect, imageAspect);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('pointermove', onMove);
      ro.disconnect();
      cancelAnimationFrame(raf);
      gl.deleteProgram(program);
      gl.deleteBuffer(buf);
      gl.deleteTexture(tex);
      const ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext();
      setWebglOK(false);
    };
  }, [props.src, props.plain]);

  const plainFallback = props.plain || !allowsDesktopFx();

  return (
    <div ref={holderRef} className={'mx-shader' + (props.className ? ' ' + props.className : '')}>
      <img
        ref={imgRef}
        src={props.src}
        alt={props.alt ?? ''}
        className="mx-shader__img"
        style={{ objectFit: props.fit ?? 'cover', opacity: plainFallback ? 1 : (webglOK ? 0 : 1) }}
        loading="lazy"
      />
      {plainFallback ? null : (
        <canvas
          ref={canvasRef}
          className="mx-shader__canvas"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
