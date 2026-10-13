"use client";
import { useEffect, useRef, useState } from "react";
import { studioAssets } from "@/lib/studio-assets";

const vertex = `#version 300 es
in vec2 position; out vec2 v_uv;
void main(){v_uv=position*0.5+0.5;gl_Position=vec4(position,0.0,1.0);}`;
const header = `#version 300 es
precision highp float; precision highp int;
in vec2 v_uv; out vec4 fragColor;
uniform vec2 u_resolution;
uniform float u_time,u_pixelRatio,u_angle,u_bend,u_contour,u_motionMode,u_scale,u_seed,u_speed,u_turbAmp,u_turbFreq,u_turbIter,u_waveFreq;
uniform vec4 u_colorBack; uniform vec4 u_colors[16]; uniform int u_colors_length;
uniform sampler2D u_image_heightmap,u_push_buffer;
`;

export default function ChromeMark() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const target = canvas.current;
    const gl = target?.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
    });
    if (!target || !gl) return;
    let disposed = false;
    let frame = 0;
    let observer: ResizeObserver | undefined;
    let program: WebGLProgram | undefined;
    const resources: WebGLTexture[] = [];
    const shaders: WebGLShader[] = [];
    let buffer: WebGLBuffer | undefined;
    const controller = new AbortController();
    const init = async () => {
      const response = await fetch("/studio/shaders/chrome.frag", {
        signal: controller.signal,
      });
      if (!response.ok) return;
      const fragment = await response.text();
      const image = new Image();
      image.src = studioAssets.chromeMask;
      await image.decode();
      if (disposed) return;
      const compile = (kind: number, source: string) => {
        const shader = gl.createShader(kind)!;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          gl.deleteShader(shader);
          return null;
        }
        shaders.push(shader);
        return shader;
      };
      const v = compile(gl.VERTEX_SHADER, vertex),
        f = compile(gl.FRAGMENT_SHADER, header + fragment);
      if (!v || !f) return;
      program = gl.createProgram()!;
      gl.attachShader(program, v);
      gl.attachShader(program, f);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
      gl.useProgram(program);
      buffer = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW,
      );
      const position = gl.getAttribLocation(program, "position");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      const w = 256,
        h = 384,
        source = document.createElement("canvas");
      source.width = w;
      source.height = h;
      const ctx = source.getContext("2d")!;
      ctx.drawImage(image, 0, 0, w, h);
      const pixels = ctx.getImageData(0, 0, w, h).data;
      const distance = new Float32Array(w * h);
      for (let i = 0; i < distance.length; i++)
        distance[i] = pixels[i * 4 + 3] > 127 ? 1000 : 0;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x;
          if (x) distance[i] = Math.min(distance[i], distance[i - 1] + 1);
          if (y) distance[i] = Math.min(distance[i], distance[i - w] + 1);
        }
      for (let y = h - 1; y >= 0; y--)
        for (let x = w - 1; x >= 0; x--) {
          const i = y * w + x;
          if (x < w - 1)
            distance[i] = Math.min(distance[i], distance[i + 1] + 1);
          if (y < h - 1)
            distance[i] = Math.min(distance[i], distance[i + w] + 1);
        }
      const heightmap = new Uint8Array(w * h * 4);
      for (let i = 0; i < distance.length; i++) {
        heightmap[i * 4] = Math.min(255, distance[i] * 7);
        heightmap[i * 4 + 2] = pixels[i * 4 + 3];
        heightmap[i * 4 + 3] = 255;
      }
      const texture = (
        unit: number,
        width: number,
        height: number,
        data: Uint8Array,
        name: string,
      ) => {
        const t = gl.createTexture()!;
        resources.push(t);
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          width,
          height,
          0,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          data,
        );
        gl.uniform1i(gl.getUniformLocation(program!, name), unit);
      };
      texture(0, w, h, heightmap, "u_image_heightmap");
      texture(1, 1, 1, new Uint8Array(4), "u_push_buffer");
      const values = {
        u_angle: 20,
        u_bend: 0.24,
        u_contour: 0.8,
        u_motionMode: 0,
        u_scale: 1.2,
        u_seed: 6,
        u_speed: 0.6,
        u_turbAmp: 0.21,
        u_turbFreq: 1.15,
        u_turbIter: 7,
        u_waveFreq: 2.4,
      };
      for (const [name, value] of Object.entries(values))
        gl.uniform1f(gl.getUniformLocation(program, name), value);
      gl.uniform4f(gl.getUniformLocation(program, "u_colorBack"), 0, 0, 0, 0);
      gl.uniform1i(gl.getUniformLocation(program, "u_colors_length"), 4);
      gl.uniform4fv(
        gl.getUniformLocation(program, "u_colors[0]"),
        new Float32Array([
          10 / 255,
          10 / 255,
          10 / 255,
          1,
          74 / 255,
          74 / 255,
          74 / 255,
          1,
          176 / 255,
          176 / 255,
          176 / 255,
          1,
          1,
          1,
          1,
          1,
        ]),
      );
      const resize = () => {
        const r = target.getBoundingClientRect();
        const dpr = Math.min(devicePixelRatio, 2);
        target.width = Math.round(r.width * dpr);
        target.height = Math.round(r.height * dpr);
        gl.viewport(0, 0, target.width, target.height);
        gl.uniform2f(
          gl.getUniformLocation(program!, "u_resolution"),
          target.width,
          target.height,
        );
        gl.uniform1f(gl.getUniformLocation(program!, "u_pixelRatio"), dpr);
      };
      observer = new ResizeObserver(resize);
      observer.observe(target);
      resize();
      setReady(true);
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const render = (time: number) => {
        if (disposed) return;
        gl.uniform1f(gl.getUniformLocation(program!, "u_time"), time / 1000);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        if (!reduced) frame = requestAnimationFrame(render);
      };
      frame = requestAnimationFrame(render);
    };
    init().catch(() => {});
    return () => {
      disposed = true;
      controller.abort();
      cancelAnimationFrame(frame);
      observer?.disconnect();
      resources.forEach((t) => gl.deleteTexture(t));
      shaders.forEach((s) => gl.deleteShader(s));
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
    };
  }, []);
  return (
    <span className="chrome-mark" aria-hidden="true">
      <img
        src={studioAssets.chromeFallback}
        alt=""
        style={{ opacity: ready ? 0 : 1 }}
      />
      <canvas ref={canvas} style={{ opacity: ready ? 1 : 0 }} />
    </span>
  );
}
