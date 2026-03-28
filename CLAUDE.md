# Concept Canvas

Speech-to-diagram web app. Speaker talks, AI interprets, interactive diagram builds on canvas.

## Commands

- `npm run dev` — starts client (3000) + server (3001) concurrently
- `npm run build` — builds all workspaces
- `npx -w client tsc --noEmit` — type-check client
- `npx -w client vite build` — build client only
- `npm test` — run tests (once configured)

## Architecture

**Separation of concerns**: Claude handles semantic interpretation only. The app handles all visual rendering.

- `shared/types.ts` — canonical TypeScript types shared by client and server
- `client/` — Vite + React 19 + React Flow + Lucide + Zustand + Tailwind v4
- `server/` — Express API proxy for Claude calls
- Vite proxies `/api/*` to Express in dev mode

## Code Style

- TypeScript strict mode, no `any`
- ES modules everywhere (`import`/`export`, not `require`)
- React functional components only
- Tailwind utility classes for styling (no CSS modules, no styled-components)
- Lucide React for all icons — import individually, not the whole library
- File naming: PascalCase for components (`Canvas.tsx`), camelCase for utilities (`layout.ts`)
- Imports: use `.tsx` extension for component imports, `.ts` for non-JSX

## Key Types (shared/types.ts)

- 6 EntityTypes: actor, object, process, concept, environment, event
- 6 RelationshipTypes: flows_into, causes, contains, interacts_with, transforms_into, opposes
- 8 StructuralModes: auto, process, cycle, cause_effect, system, timeline, containment, problem
- DiagramSpec is Claude's output format — entities, relationships, build order, icon names
- Claude does NOT return layout coordinates, colours, line styles, or animation data

## Visual Design

- Dark theme: bg `#0a0a0f`, surface `#141420`, border `#2a2a3a`
- Modern and bold, like an animated infographic — not wireframe-y or corporate
- Generous spacing, subtle fade/slide animations
- Every canvas element must be interactive (click, hover, drag) at all times

## Git

- Commit messages: `type: brief description` (e.g., `feat: add step navigation`)
- Work on `main` branch for now
- Always type-check before committing: `npx -w client tsc --noEmit`

## Don'ts

- Don't put visual/layout logic in Claude's prompt — that's the app's job
- Don't use CSS-in-JS or CSS modules — use Tailwind
- Don't import the entire Lucide icon library — import icons individually
- Don't add features not in the product brief without asking
