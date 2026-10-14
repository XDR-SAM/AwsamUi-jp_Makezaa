# Makezaa service previews

Two silent ambient H.264 films replace the WordPress Websites and Shopify Commerce service media. Other service films retain their current assignments. The original timing and 1080 × 1350 canvas are kept:

| Film | Frames | Duration |
| --- | --- | --- |
| WordPress | 336 | 11.1444 s |
| Shopify | 480 | 15.9444 s |

The direction uses the installed `explainer-high-energy` motion-graphics skill, with the owner's explicit reference overriding its default soundtrack, HUD, typography, duration and scene structure. These are project-image replacements of measured source card motion, rather than a newly timed promotional montage.

## Assets

Images are shared with `../studio-reel/assets/`; `../studio-reel/portfolio.json` records their actual published Makezaa project names and source URLs. All eight primary project captures and five supplemental captures are available to the renderer. The commerce field uses the full image pool. Images show our portfolio work; they do not assert that each depicted project was built with Shopify or WordPress.

The official green Shopify bag is downloaded from [Shopify's brand-assets page](https://www.shopify.com/brand-assets). Its SVG URL is `https://cdn.shopify.com/shopifycloud/brochure/assets/brand-assets/shopify-logo-shopping-bag-full-color-66166b2e55d67988b56b4bd28b63c271e2b9713358cb723070a92bde17ad7d63.svg`. `assets/shopify-bag.png` is a proportional 256px-high raster conversion. Logo tiles retain the original proportions and colors and have clear space around them.

## Motion and rebuild

`trace.py` reads the captured reference films in `public/studio/stream.mux.com/`. WordPress uses `BP0200Otu1K9wAS3EYw00ewY7oNNy4gBzZiQqh758BrbsQ/1080p.mp4`; Shopify uses `SJ2mU2IfrQe3jkt22bmriMiit7Xl00El9gNpFXisIZ2w/1080p.mp4`. WordPress rectangle bounds correct per-frame optical-flow estimates. Shopify uses absolute SIFT feature matches against a catalog of visible card views, corrected with visible rectangle bounds. Initial partially visible commerce cards have measured starting bounds, calibrated when their complete borders appear. The tracks are saved so rendering is deterministic and does not repeat the estimation step.

`render.py` starts every frame on a black canvas and fills the card bounds with Makezaa imagery. No captured template pixels are included in the new renders. Small background cards in the commerce field periodically become Shopify bag tiles. Screenshots are cropped to fill each source card; their original aspect ratio is preserved.

These raster captures replace the screen imagery. They do not recreate the reference templates' internal interactive UI. Estimates for partly obscured, dark or clipped cards can differ slightly from their source borders; the tracked card-field reconstruction is not a claim of pixel-identical output.

Use Python with OpenCV, NumPy, Pillow and imageio-ffmpeg:

```sh
python motion/service-previews/trace.py wordpress shopify
python motion/service-previews/render.py --stills
python motion/service-previews/render.py
```

In this workspace, these dependencies are in the ignored `artifacts/studio-motion/tools/` directory. Final output metadata is in `render-info.json`; matching poster images are written alongside the MP4s in `public/studio/makezaa/`. `frame-review.html` offers both clips with scrub controls. The website continues using `AmbientVideo` for visibility-based playback, looping and reduced-motion handling.
