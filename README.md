# Daily Tech News

A local-first tech news dashboard that aggregates credible stories from RSS feeds and keyless public APIs.

## Run locally

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

## Scripts

- `npm run dev` starts the Express API and Vite UI.
- `npm run server` starts only the API on `http://localhost:3001`.
- `npm run client` starts only the UI.
- `npm test` runs backend service tests.

## Architecture

- `server/src/domain`: normalized domain models and helpers.
- `server/src/sources`: source adapters and source registry.
- `server/src/services`: aggregation, cache, filtering, sorting, deduplication.
- `server/src/routes`: Express API routes.
- `client/src/api`: backend API client.
- `client/src/hooks`: data fetching hooks.
- `client/src/features/news`: news dashboard feature.
- `client/src/components`: reusable UI components.
