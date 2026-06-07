# Makezaa Rebranding Plan

## Goal
Repurpose the AwsamUi-jp_Makezaa template into a real Makezaa company site while preserving the template UI, animations, responsive layout, and dark theme.

## Source Audit: makezaa.com
Key gaps identified from the live site:
- Generic / templated copy instead of client-facing Makezaa services
- Mismatch between US-market framing and actual BD-based operations
- Missing real projects section
- Placeholder testimonial instead of client proof

## Constraints
- Keep template UI intact: bento cards, cursor effects, animations, dark theme
- Phase 0 and Phase 1 only for now
- Device responsive required: 2-col mobile, 3-col md, 4-col lg
- Use GitHub Pages as hosting target
- Git identity: XDR-SAM / tdxfarhan@gmail.com

## Phases

### Phase 0 — Rebrand Shell
Replace template branding with Makezaa identity without changing layout or components.

| Status | Task | File(s) |
|--------|------|---------|
| ✅ | Update site metadata | `app/layout.tsx` |
| ✅ | Replace navigation links | `components/landing/navigation.tsx` |
| ✅ | Replace hero headline + CTAs | `components/landing/hero-section.tsx` |
| ✅ | Replace metrics/stats | `components/landing/metrics-section.tsx` |
| ✅ | Replace pricing | `components/landing/pricing-section.tsx` |
| ✅ | Replace testimonials | `components/landing/testimonials-section.tsx` |
| ✅ | Replace team/values | `components/landing/developers-section.tsx` |
| ✅ | Replace trust signals | `components/landing/security-section.tsx` |
| ✅ | Replace CTA | `components/landing/cta-section.tsx` |
| ✅ | Replace footer | `components/landing/footer-section.tsx` |

### Phase 0.5 — Service Expansion
Add AWS and AI agent deployment expertise to the services grid.

| Status | Task | File(s) |
|--------|------|---------|
| ✅ | Add 4th service card: AWS & Agent Deployment | `components/landing/features-section.tsx` |
| ✅ | Add AWS tooling integrations | `components/landing/integrations-section.tsx` |
| ✅ | Fix logo text from COMPUTE to MAKEZAA | `components/landing/navigation.tsx` |

### Phase 1 — Core Pages & Content Quality
Update section meaning and messaging quality so the site reads as a real agency site.

| Status | Task | Notes |
|--------|------|-------|
| ✅ | Process section rewrite | `components/landing/how-it-works-section.tsx` |
| ⏳ | Projects section | Still needs real project data |
| ⏳ | Testimonials refresh | Replace remaining placeholder content |
| ⏳ | About section | Needs Makezaa-specific story |

### Phase 2 — New Routes
Add standalone pages for major sections.

| Status | Task | Target |
|--------|------|--------|
| ⏳ | `/services` | Detailed service pages |
| ⏳ | `/projects` | Case study / portfolio listings |
| ⏳ | `/blog` | Agency content and updates |
| ⏳ | `/about` | Company story, team, mission |
| ⏳ | `/contact` | Contact form and lead capture |

### Phase 3 — Agent-First & Machine-Readable
Make the site friendly to AI crawlers, assistants, and automated workflows.

| Status | Task | Notes |
|--------|------|-------|
| ⏳ | JSON-LD metadata | Organization, services, contact |
| ⏳ | Sitemap + robots | Search engine and agent discovery |
| ⏳ | Machine-readable endpoints | Structured service/project data |

### Phase 4 — Backend
Add backend without changing the live frontend shell.

| Status | Task | Notes |
|--------|------|-------|
| ⏳ | Supabase setup | Auth, DB, storage |
| ⏳ | Token API system | Secure access for automations |
| ⏳ | CMS hooks | Content updates without redeploy |

### Phase 5 — Automation & Growth
Lead generation, deployment, and monitoring.

| Status | Task | Notes |
|--------|------|-------|
| ⏳ | Lead capture form | Connected to Supabase |
| ⏳ | Contact notifications | Telegram / email alerts |
| ⏳ | Deployment pipeline | Auto deploy on push |

## Current State

- Repo: `https://github.com/XDR-SAM/AwsamUi-jp_Makezaa`
- Branch: `main`
- Last commit: `74ff58e Fix site logo: COMPUTE -> MAKEZAA`
- Working directory: `/home/ubuntu/repo-inspect`

## Rules
- Author all commits as `XDR-SAM` using the saved GitHub token
- Preserve template animations and responsive classes
- Use clear commit messages tied to this plan
- Do not add reusable abstractions or shared component libraries
- Do not break existing bento card layout or dark theme

## How to Track Progress
Update the `Status` column in the tables above as work is done.
