# Standing Spec: Local Tech News App

## Purpose
Build and maintain a local-first tech news dashboard that aggregates credible technology stories from multiple online sources into one fast, minimal, readable interface.

## Architecture Principles
- Use source adapters for RSS/API fetching, a normalization layer for one article model, a service layer for aggregation/cache/filtering, clean Express routes, and a React UI that consumes only backend contracts.
- Keep dependencies directional: UI -> API -> services -> adapters.
- Register sources through configuration and adapter factories.
- Prefer small pure functions for normalization, deduplication, filtering, and sorting.
- Fail softly: one broken source must not collapse the whole feed.

## Engineering Framework
- Follow Clean Architecture-lite with domain models first and adapters at the edge.
- Follow SOLID where useful: single-purpose adapters, open source registration, aggregation against a common adapter interface.
- Validate external data, use timeouts, and treat missing fields as expected.

## Core Functionality
- Aggregate tech news from RSS feeds and keyless public APIs.
- Normalize all articles into `id`, `title`, `summary`, `url`, `source`, `sourceType`, `publishedAt`, `imageUrl`, and `tags`.
- Provide a unified feed, search, source/category filters, newest/top sorting, manual refresh, and clear loading/empty/error/stale states.

## Technical Standards
- React + Vite frontend.
- Node.js + Express backend.
- Backend handles external fetching to avoid browser CORS issues.
- In-memory cache for v1.
- Backend folders: `sources`, `services`, `domain`, `routes`.
- Frontend folders: `api`, `components`, `hooks`, `features/news`.

## UI Standards
- First screen is the news dashboard.
- Modern, editorial, minimal, and scan-friendly.
- Responsive desktop/mobile layout.
- Compact controls for source, category, search, sort, and refresh.
- No oversized decorative hero sections and no cards inside cards.

## Quality Bar
- Runs locally with `npm install` and `npm run dev`.
- Backend continues working when individual sources fail.
- API responses are predictable and documented in code.
- Verification covers source fetching, normalization, deduplication, cache behavior, filtering/searching, and responsive UI basics.
