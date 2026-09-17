# Links

A [NYT Connections](https://www.nytimes.com/games/connections)-style puzzle game for a small group of friends to create and share their own puzzles. No accounts, no backend — a puzzle's entire content lives in the URL itself.

See [`reference/gameDescription.md`](reference/gameDescription.md) for the original spec, and the [Game Design Document](https://claude.ai/artifact/RA9cYRYt4gM81vunann8a6) for the full design.

## Stack

- [Vite](https://vitejs.dev/) + vanilla TypeScript (no framework — two screens, no routing complexity)
- [lz-string](https://github.com/pieroxy/lz-string) to compress a puzzle into a URL-safe fragment
- No backend. Puzzles round-trip entirely through the URL.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Outputs a static site to `dist/`.

## Deploying to Cloudflare Pages

1. Push this repo to GitHub.
2. In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**, select this repo.
3. Build settings:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Deploy. Every push to `main` will auto-deploy.
5. **Workers & Pages → your project → Custom domains** — add the domain you already manage in this Cloudflare account and follow the prompts (DNS records are added automatically since the domain is in the same account).

## How puzzle sharing works

A puzzle (title, author, date, and its 4 groups of 4) is serialized to JSON, compressed with lz-string, and placed in the URL hash: `#/play/<encoded>`. Opening that link decodes and reconstructs the puzzle entirely client-side — nothing is stored server-side. See `src/encode.ts`.
