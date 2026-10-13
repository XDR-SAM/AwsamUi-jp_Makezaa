# KOTA local clone

Original: https://madebykota.com/

Run `START.cmd` or run `python serve.py` in this folder, then open
http://127.0.0.1:8765/ . No npm installation or build is required.
The server uses loopback only and supports video seeking with byte ranges.
It also supports Framer CMS requests for multiple ranges through the `range`
query parameter, so template details and client-side navigation use local data.

## Files

- `index.html`: home page. Media, executable scripts and CSS are separate files.
- `products/` and `docs/`: all other 11 public pages listed in the source sitemap.
- `assets/framerusercontent.com/images/`: images and responsive image variants.
- `assets/framerusercontent.com/assets/`: original fonts and other resources.
- `assets/framerusercontent.com/sites/`: original Framer/React/Motion modules.
- `assets/framerusercontent.com/cms/`: original binary CMS data.
- `assets/stream.mux.com/`: downloaded MP4 video files.
- `assets/styles/`: extracted CSS files.
- `assets/scripts/`: extracted scripts and local asset/hydration adapters.
- `original/`: untouched source HTML and script backups.
- `asset-manifest.json`: original asset URLs, paths, sizes and source hashes.
- `capture-report.json` and `validation-report.json`: capture and local-reference checks.

Original rendering, typography, responsive breakpoints, scrolling, hover effects,
loader, motion components and client-side navigation are retained. Component
styles are loaded from CSS files before React hydration. Some style nodes are
then created by the original runtime, as they are on the published site.

The source has one unavailable Mux video (HTTP 404), listed in
`download-failures.json`. External destinations (social links, third-party
template previews/purchases and contact delivery) remain external services.
No contact message or purchase is submitted during verification.

To recapture the public source: `python mirror.py`, then `python finalize.py`.
To verify local asset paths: `python validate.py`.
