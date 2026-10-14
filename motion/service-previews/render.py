"""Render Makezaa service films from the measured reference card trajectories.

Timing, sizes and positions come from the saved per-frame tracks. The rendered
canvas starts black: all card textures are Makezaa portfolio images, and the
Shopify bag is the official SVG rasterized without changing its proportions.
"""
from pathlib import Path
import argparse
import json
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "artifacts/studio-motion/tools"))
import cv2
import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw

HERE = Path(__file__).parent
PORTFOLIO = ROOT / "motion/studio-reel"
OUT = ROOT / "public/studio/makezaa"
PROJECTS = json.loads((PORTFOLIO / "portfolio.json").read_text())
# Main images first, then every supplemental project capture.
FILES = [p["file"] for p in PROJECTS] + [f for p in PROJECTS for f in p.get("extraFiles", [])]
IMAGES = [cv2.imread(str(PORTFOLIO / f)) for f in FILES]
LOGO = cv2.imread(str(HERE / "assets/shopify-bag.png"), cv2.IMREAD_UNCHANGED)
if any(im is None for im in IMAGES) or LOGO is None:
    raise RuntimeError("Missing portfolio or logo assets")

def texture(image, width, height):
    ih, iw = image.shape[:2]
    aspect = width / height
    if iw / ih > aspect:
        cw = min(iw, max(1, round(ih * aspect)))
        left = (iw - cw) // 2
        crop = image[:, left:left + cw]
    else:
        ch = min(ih, max(1, round(iw / aspect)))
        crop = image[:ch]
    return cv2.resize(crop, (width, height), interpolation=cv2.INTER_AREA)

def logo_tile(width, height):
    tile = np.zeros((height, width, 3), np.uint8)
    scale = min(width * .62 / LOGO.shape[1], height * .68 / LOGO.shape[0])
    logo = cv2.resize(LOGO, (max(1, round(LOGO.shape[1] * scale)), max(1, round(LOGO.shape[0] * scale))), interpolation=cv2.INTER_AREA)
    x = (width - logo.shape[1]) // 2
    y = (height - logo.shape[0]) // 2
    alpha = logo[:, :, 3:4].astype(np.float32) / 255
    tile[y:y + logo.shape[0], x:x + logo.shape[1]] = np.round(logo[:, :, :3] * alpha).astype(np.uint8)
    return tile

def frame_at(mode, poses, frame_index):
    canvas = np.zeros((1350, 1080, 3), np.uint8)
    # Large foreground tiles occlude small background tiles, as in the source.
    for pose in sorted(poses, key=lambda p:p["box"][2] * p["box"][3]):
        x, y, w, h = [round(v) for v in pose["box"]]
        if w < 2 or h < 2 or w > 2500 or h > 2500:
            continue
        index = pose["id"]
        if mode == "shopify" and index % 5 == 3:
            image = logo_tile(w, h)
        else:
            # The two existing WordPress projects lead the WordPress reel.
            order = [7, 0, 4, 1, 6, 3, 5, 2, 8, 9, 10, 11, 12]
            project = order[index % len(order)] if mode == "wordpress" else index % len(IMAGES)
            image = texture(IMAGES[project], w, h)
        x1, y1 = max(x, 0), max(y, 0)
        x2, y2 = min(x + w, 1080), min(y + h, 1350)
        if x2 > x1 and y2 > y1:
            canvas[y1:y2, x1:x2] = image[y1-y:y2-y, x1-x:x2-x]
    return canvas

def render(mode, stills_only=False):
    data = json.loads((HERE / f"{mode}-tracks.json").read_text())
    frames = data["frames"]
    fps = data["fps"]
    filename = f"service-{mode}-preview.mp4"
    indices = [min(frames - 1, round(t * fps)) for t in [0, 1, 2, 3, 5, 7, 9, 10] if t < frames / fps]
    if mode == "shopify": indices += [round(12 * fps), frames - 1]
    sheet = Image.new("RGB", (1080, ((len(indices) + 3) // 4) * 360), "#222")
    draw = ImageDraw.Draw(sheet)
    for i, index in enumerate(indices):
        image = frame_at(mode, data["tracks"][index], index)
        im = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB)).resize((270, 338))
        sx, sy = i % 4 * 270, i // 4 * 360
        sheet.paste(im, (sx, sy)); draw.text((sx + 6, sy + 341), f"{index/fps:.2f}s", fill="white")
    sheet.save(ROOT / f"artifacts/studio-motion/service-{mode}-render.jpg", quality=94)
    if stills_only: return
    command = [imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", "1080x1350", "-r", str(fps), "-i", "-", "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(OUT / filename)]
    encoder = subprocess.Popen(command, stdin=subprocess.PIPE)
    for index, poses in enumerate(data["tracks"]):
        image = frame_at(mode, poses, index)
        if index == 0:
            Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB)).resize((540, 675)).save(OUT / f"service-{mode}-poster.webp", quality=88)
        encoder.stdin.write(image.tobytes())
        if index % 120 == 0: print(mode, index, "/", frames, flush=True)
    encoder.stdin.close()
    if encoder.wait(): raise RuntimeError("Encoding failed")
    return {"file": filename, "width":1080, "height":1350, "frames":frames, "fps":fps, "duration":frames/fps, "bytes":(OUT/filename).stat().st_size}

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--stills", action="store_true")
    parser.add_argument("--mode", choices=["wordpress", "shopify", "both"], default="both")
    args = parser.parse_args()
    modes = ["wordpress", "shopify"] if args.mode == "both" else [args.mode]
    results = {mode:render(mode, args.stills) for mode in modes}
    if not args.stills:
        info = HERE / "render-info.json"
        previous = json.loads(info.read_text()) if info.exists() else {}
        previous.update(results)
        info.write_text(json.dumps(previous, indent=2) + "\n")
        print(json.dumps(results, indent=2))
