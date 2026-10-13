# Makezaa studio visual migration

Makezaa's public website now uses the captured KOTA visual language in native Next.js components. The content, services, portfolio, editorial data and enquiry forms belong to Makezaa. The original cloned Framer application remains in `kota-clone/` as a reference; it is not embedded or loaded by the main website.

## Route mapping

| Reference surface | Makezaa surface |
| --- | --- |
| Home | `/` with Makezaa's existing eight-service catalog |
| Products / product detail | `/projects` and `/projects/[slug]` using published CMS projects |
| Blog / article | `/blog` and `/blog/[slug]` using published CMS posts |
| Contact / booking | `/contact`, `/#book-meeting`, and the existing `/api/contact` handler |

Existing home anchors, legacy redirects, admin routes, authentication, agent APIs, CMS fetching, sanitized article content, metadata and structured data are retained. Administration keeps a scoped readable palette; its workflows are unchanged.

## Media and motion

- 437 captured media/font files live separately in `public/studio/`. `asset-provenance.json` records their source URLs. `scripts/prepare-studio-assets.py` prepares them from the clone manifest.
- `lib/studio-assets.ts` supplies named local paths; local Lausanne fonts are loaded through Next's font loader.
- The hero background uses the original generated Makezaa collage in `public/studio/makezaa/hero-background.webp`. Its brief and generation provenance are recorded in `docs/assets/makezaa-hero-background.md`; preparation scripts retain this replacement. The hero film has a separate poster reference, allowing the background to change independently.
- The original chrome fragment shader runs through a native WebGL2 adapter, with a captured image fallback.
- Motion, GSAP and Lenis implement the intro, letter reveals, text scrub, counter, parallax, sticky services and circular project/editorial showcases. The hero film keeps one video element while its viewport rectangle grows into the reel, preserving playback time. Circular showcases use vertical scene wipes, matching background/caption transitions and numbered rings. Native CSS handles menu, hover and FAQ transitions.
- The original laptop film is placed in the separate “Let’s get started” CTA scene, using the captured desktop and phone variants. Footer lettering is clear of video layers; the existing meeting form remains below the CTA.
- Projects follow the reference Templates catalog: centered filters, a three-column desktop image grid, small title/category captions and an alternate preview on hover when the CMS contains another image. Internal project navigation uses native View Transitions, sharing the selected card image with the opening detail cover. Browsers without this API and reduced-motion users retain normal navigation.
- Project details open with a full-screen cover and a thumbnail-controlled gallery. Additional CMS images rise into rounded, scaled previews over the blurred cover; the Project Info drawer contains the project's actual summary and technology. The reference testimonial position contains Makezaa's full sanitized project details, followed by four related projects in staggered scrolling columns. Gallery media is deduplicated from the cover and CMS content; all additional project images and the full project content remain available. Gallery state resets when navigating between projects.
- Reduced-motion preferences, route cleanup, offscreen video pausing and mobile layouts are supported. Published Makezaa project and article covers take precedence over decorative reference images.
- The intro uses the captured alternating X offsets, 1000px Y entrances, 0.5–1.5s stagger, original spring settings and 3.25s exit delay. Desktop/tablet/phone image sizes and separate phone artwork follow the reference. Hero parallax starts at the page top with zero image offset.

## Run and verify

```sh
npm install
npm run dev -- --hostname 127.0.0.1 --port 3000
npx tsc --noEmit
npm run build
npm run test:auth
npm run test:agents
node scripts/verify-studio.mjs
```

The HTTP verification script expects port 3000. It checks public routes, real project/article pages, existing redirects and home anchors, native rendering, missing local assets, and an empty contact request rejected before persistence. It does not create a customer message or meeting request. Browser verification covers desktop/mobile layout, project filtering, shared-image detail navigation, multi-image thumbnail scrolling, the information drawer, related project navigation, article rendering, the showreel modal, FAQ disclosure and route transitions.

Vercel installs with pnpm and a frozen lockfile. When changing dependencies, update and commit both lockfiles; verify `pnpm install --frozen-lockfile` before pushing. The animation dependencies and their transitive packages are recorded in `pnpm-lock.yaml` as well as `package-lock.json`.

Preview screenshots and the HTTP report are saved in the ignored `artifacts/studio-redesign/` directory. This migration does not publish a production deployment.
