# Links

A [NYT Connections](https://www.nytimes.com/games/connections)-style puzzle game for a small group of friends to create and share their own puzzles.

See [`reference/gameDescription.md`](reference/gameDescription.md) for the original spec, and the [Game Design Document](https://claude.ai/artifact/RA9cYRYt4gM81vunann8a6) for the full design.

## Stack

- [Vite](https://vitejs.dev/) + vanilla TypeScript (no framework — a handful of screens, no routing complexity)
- A small Cloudflare Worker (`worker/index.ts`) backed by Workers KV for puzzle storage and short links
- [lz-string](https://github.com/pieroxy/lz-string), used only for the local self-test flow (`#/test/<encoded>`) and to keep old long-form `#/play/<encoded>` links working

## Local development

```bash
npm install
npm run dev
```

`vite dev` runs the Worker locally too (via Miniflare), including a local, on-disk simulation of KV — no Cloudflare account needed for development.

## Build

```bash
npm run build
```

Outputs the static client to `dist/client/` and the Worker bundle to `dist/links/`.

## Deploying to Cloudflare Workers

This project deploys as a Worker with static assets (not classic Pages) — Cloudflare's git-connected "Workers & Pages → Connect to Git" flow handles the build and deploy automatically via `wrangler deploy`.

**One-time setup before the first deploy:**

1. Create the KV namespace this project needs:
   ```bash
   npx wrangler login
   npx wrangler kv namespace create PUZZLES
   ```
2. Copy the `id` it prints into `wrangler.jsonc`'s `kv_namespaces[0].id`, replacing the placeholder, and commit that change.
3. Push to GitHub — the connected Cloudflare project will build and deploy on push to `main`.
4. **Workers & Pages → your project → Custom domains** — add your domain if not already attached.

## How puzzle sharing works

- **Sharing a puzzle** (Share button in self-test): the puzzle JSON is POSTed to `/api/puzzles`, the Worker stores it in KV under a random 7-character code, and the returned link is `https://<domain>/p/<code>` — short and opaque regardless of puzzle content, which is what fixed links breaking when pasted into iMessage/SMS. Opening that link fetches `/api/puzzles/<code>` and renders the puzzle; nothing about its content is ever in the URL.
- **Self-testing your own puzzle** (`#/test/<encoded>`) stays fully client-side — the puzzle is compressed with lz-string into the URL hash, no server round-trip, since it's never shared.
- **Old long-form links** (`#/play/<encoded>`) still decode client-side for backward compatibility with anything already shared before this change.

See `worker/index.ts` for the API, and `src/api.ts` / `src/encode.ts` on the client side.
