"""Put the approved hero preview into the existing laptop scene.

The device, hands and backdrop stay outside the display mask. Both exports
decode the same 449 hero frames; no cuts or speed changes are introduced.
"""
from pathlib import Path
import json
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "artifacts/studio-motion/tools"))
import cv2
import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw

OUT = ROOT / "public/studio/makezaa"
REFERENCE = ROOT / "public/studio/stream.mux.com"
SCENES = {
    "desktop": ("kvyETSxTWR4yWLgS7zJjL7W1my00PprfrISoZPY1rurM/1080p.mp4", (501, 147, 738, 491), 17),
    "mobile": ("YNpICY1QivEoEq1iioX6vJBCsjNEqt3jpRnJAh00TuHI/480p.mp4", (49, 142, 499, 332), 12),
}

def render(name, source, display, radius):
    reference = cv2.VideoCapture(str(REFERENCE / source))
    ok, backdrop = reference.read()
    reference.release()
    if not ok:
        raise RuntimeError(f"Could not read {source}")
    height, width = backdrop.shape[:2]
    hero = cv2.VideoCapture(str(OUT / "hero-preview.mp4"))
    fps = hero.get(cv2.CAP_PROP_FPS)
    expected = int(hero.get(cv2.CAP_PROP_FRAME_COUNT))
    x, y, screen_width, screen_height = display
    mask_image = Image.new("L", (screen_width, screen_height))
    ImageDraw.Draw(mask_image).rounded_rectangle(
        (0, 0, screen_width - 1, screen_height - 1), radius=radius, fill=255
    )
    visible_width = min(screen_width, width - x)
    mask = np.asarray(mask_image)[:, :visible_width, None].astype(np.float32) / 255
    output = OUT / f"laptop-preview-{name}.mp4"
    command = [
        imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error",
        "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{width}x{height}",
        "-r", str(fps), "-i", "-", "-an", "-c:v", "libx264",
        "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
        "-movflags", "+faststart", str(output),
    ]
    encoder = subprocess.Popen(command, stdin=subprocess.PIPE)
    count = 0
    try:
        while True:
            ok, frame = hero.read()
            if not ok:
                break
            # Contain the full 16:9 film within the original laptop display.
            ratio = min(screen_width / frame.shape[1], screen_height / frame.shape[0])
            film = cv2.resize(frame, (round(frame.shape[1] * ratio), round(frame.shape[0] * ratio)), interpolation=cv2.INTER_AREA)
            screen = np.zeros((screen_height, screen_width, 3), dtype=np.uint8)
            left = (screen_width - film.shape[1]) // 2
            top = (screen_height - film.shape[0]) // 2
            screen[top:top + film.shape[0], left:left + film.shape[1]] = film
            result = backdrop.copy()
            original = result[y:y + screen_height, x:x + visible_width]
            original[:] = np.round(screen[:, :visible_width] * mask + original * (1 - mask)).astype(np.uint8)
            if count == 0:
                Image.fromarray(cv2.cvtColor(result, cv2.COLOR_BGR2RGB)).save(OUT / f"laptop-poster-{name}.webp", quality=88)
            encoder.stdin.write(result.tobytes())
            count += 1
    finally:
        hero.release()
        encoder.stdin.close()
    if encoder.wait() or count != expected:
        raise RuntimeError(f"Incomplete {name} render: {count}/{expected}")
    return {"file": output.name, "width": width, "height": height, "fps": fps, "frames": count, "duration": count / fps, "screen": display}

if __name__ == "__main__":
    info = {name: render(name, *scene) for name, scene in SCENES.items()}
    (Path(__file__).parent / "laptop-render-info.json").write_text(json.dumps(info, indent=2) + "\n")
    print(json.dumps(info, indent=2))
