# Formula 1 Dashboard

A customizable F1 companion app: live timing, race analytics, standings, news, a widget-based home dashboard, plus sim-racing telemetry from the F1 game (F1 24/25) via a local UDP relay and an Expo mobile app.

Built with Next.js (App Router), React, TypeScript, Tailwind CSS, and shadcn/ui. Data comes from the [OpenF1 API](https://openf1.org).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests (`src/**/*.test.ts`) |
| `npm run relay` | Start the F1 game telemetry relay (see below) |

## Architecture

### Data flow

All OpenF1 data goes through one server-side implementation, `getOpenF1()` in `src/lib/api/openf1-server.ts`:

- **Server components** (e.g. `/standings`, `/calendar`) call `getOpenF1()` directly and stream HTML with Suspense — no client fetch for the initial render.
- **Client components** use the `useOpenF1()` SWR hook (`src/hooks/use-openf1.ts`), which hits the proxy route `/api/openf1/[...path]` — a thin wrapper around the same `getOpenF1()`.

Caching is layered:

1. **Redis (Upstash)** on the server — shared across users, keyed per endpoint + query. Policy per endpoint lives in `src/lib/api/cache-policy.ts` (the single source of truth; unit-tested).
2. **HTTP `Cache-Control`** headers on the proxy responses (CDN/browser).
3. **In-memory + localStorage** on the client (`src/lib/api/cache.ts`) with per-endpoint TTLs from `src/lib/api/endpoints.ts`.

Empty responses are cached for max 30s at every layer so "no data yet" doesn't stick for hours.

### Home dashboard

The home page is a drag-and-drop widget grid (`src/components/dashboard/dashboard-grid.tsx`, react-grid-layout). Widgets are registered in `WIDGET_REGISTRY` and **loaded lazily via `next/dynamic`** — only widgets in the user's saved layout are downloaded. Layouts persist to localStorage.

To add a widget: create it in `src/components/dashboard/widgets/`, then add a `lazyWidget(...)` entry and a registry entry in `dashboard-grid.tsx`.

### Other API routes

- `/api/rss` — F1 news feeds
- `/api/youtube` — latest channel videos (`YOUTUBE_CHANNEL_ID`)
- `/api/setups` — F1 25 game car setups
- `/api/tracks/[circuitKey]` — track history
- `/api/mapbox/*` — token + static map proxy (`MAPBOX_TOKEN`, optional `MAPBOX_ALLOWED_ORIGINS`)

## Game telemetry (sim racing)

`npm run relay` starts `scripts/telemetry-relay.js`, which listens for F1 game UDP telemetry on port **20777** and rebroadcasts it as WebSocket on port **20978** for the `/game-telemetry` page and the mobile app. At session end it builds a final-classification summary; set `DISCORD_WEBHOOK_URL` to post it to Discord. `run-relay.command` (macOS) / `run-relay.bat` (Windows) are double-click launchers.

## Mobile app (`mobile/`)

An Expo/React Native app (`f1-game-telemetry`) with live game telemetry, lap history, and circuit detail screens. It has its own `package.json`:

```bash
cd mobile && npm install && npm start
```

## Environment variables

Create `.env.local` (all optional — the app degrades gracefully):

| Variable | Purpose |
| --- | --- |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Server-side Redis cache ([console.upstash.com](https://console.upstash.com), free tier is enough). Without them, API routes fall back to uncached fetches. `KV_REST_API_URL`/`KV_REST_API_TOKEN` also work (Vercel KV). |
| `MAPBOX_TOKEN` | Mapbox maps (calendar, track pages) |
| `MAPBOX_ALLOWED_ORIGINS` | Restrict the token endpoint to specific origins |
| `YOUTUBE_CHANNEL_ID` | YouTube widget/page |
| `DISCORD_WEBHOOK_URL` | Telemetry relay session summaries |

On Vercel, set the same variables under Project → Settings → Environment Variables.

## Testing

Unit tests cover the data-shaping layer (cache policy, endpoint/query builders):

```bash
npm test
```
