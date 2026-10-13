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
- The original chrome fragment shader runs through a native WebGL2 adapter, with a captured image fallback.
- GSAP and Lenis implement the intro, letter reveals, text scrub, counter, parallax, reel expansion, sticky services and horizontal project sequence. Native CSS handles menu, hover and FAQ transitions.
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

The HTTP verification script expects port 3000. It checks public routes, real project/article pages, existing redirects and home anchors, native rendering, missing local assets, and an empty contact request rejected before persistence. It does not create a customer message or meeting request. Browser verification covers desktop/mobile layout, project filtering and detail navigation, article rendering, the showreel modal, FAQ disclosure and route transitions.

Preview screenshots and the HTTP report are saved in the ignored `artifacts/studio-redesign/` directory. This migration does not publish a production deployment.
