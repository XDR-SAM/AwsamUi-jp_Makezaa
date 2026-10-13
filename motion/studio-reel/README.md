# Makezaa project reel

This is a motion-preserving retexture of the captured reference, rather than a newly timed montage. Published Makezaa project screenshots are kept separately in `assets/`; their source URLs and project paths are in `portfolio.json`.

## Outputs

| Asset | Length | Frames | Resolution |
| --- | --- | --- | --- |
| `public/studio/makezaa/hero-preview.mp4` | 14.9305 seconds | 449 | 1920 × 1080 |
| `public/studio/makezaa/studio-reel.mp4` | 23.9729 seconds | 720 | 1920 × 1080 |
| `public/studio/makezaa/hero-video-poster.webp` | First preview frame | — | 960 × 540 |

Both videos are H.264/yuv420p with fast-start metadata. The references contain no audio; these exports also remain silent. The website retains its existing ambient loop, one-element hero-to-reel morph, accessible modal controls and reduced-motion handling. The displayed reel duration is corrected to 24 seconds.

## Motion source and retained visuals

- Intro perspective is measured frame by frame with SIFT/RANSAC homographies, recorded in `intro-tracks.json`. Short tracking gaps of up to 10 frames are interpolated. An-Noor, Golden Touch and Eagle replace the three foreground project planes. Reference strips still appear behind those planes.
- The fast preview montage changes on the source's original five-frame boundaries.
- Full-reel cuts remain at the reference's original frame indices. Its background motion is retained directly from the reference frames, so it is not approximated with new fades or stock transitions.
- Creavia and Aurea are the two full template visuals intentionally retained in the long reel, within the owner's requested allowance. The short preview also retains its existing Creavia sequences and exposed background strips.
- Other viewport imagery uses the real Makezaa project captures. Scrolling is transferred by phase correlation to the screenshot strips; the raster screenshots do not recreate every interactive element of the source templates' live UI.
- The rendering workflow uses the installed `explainer-high-energy` skill's frame inspection approach. Reference timing overrides its default duration, HUD, soundtrack and scene structure.

## Rebuild and review

The reference videos already live in `public/studio/stream.mux.com/` and must remain present to rebuild. Runtime Python dependencies are OpenCV, NumPy, Pillow and imageio-ffmpeg; install them in a local environment before rendering. In this workspace, the dependencies installed for this job are in the ignored `artifacts/studio-motion/tools/` directory.

```sh
python motion/studio-reel/render.py
python motion/studio-reel/render.py --mode hero
python motion/studio-reel/render.py --mode reel
```

`render-info.json` records the output metadata. The viewport scroll samples are in `hero-viewport-tracks.json` and `reel-viewport-tracks.json`. The Python renderer has no wall-clock-dependent animation state; the measured tracks and source frame determine each result.

Open `frame-review.html` locally to compare the two versions and scrub to individual frames. It exposes `window.VIDEO` and deterministic `window.seek(t)` for frame review; `?render` hides the controls and uses the native 1920 × 1080 stage. Contact sheets are saved in the ignored `artifacts/studio-motion/` directory.
