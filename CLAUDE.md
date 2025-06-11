# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
```bash
pnpm dev          # Start development server (http://localhost:5173)
pnpm build        # Build for production
pnpm preview      # Preview production build
```

### Testing
```bash
pnpm test         # Run all tests (E2E + unit)
pnpm test:unit    # Run unit tests only
pnpm test:e2e     # Run E2E tests only
pnpm vitest       # Run unit tests in watch mode
```

### Database
```bash
pnpm db:push      # Push schema changes to database
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open Drizzle Studio for database management
```

### Code Quality
```bash
pnpm lint         # Run ESLint and Prettier checks
pnpm format       # Format code with Prettier
pnpm check        # Run SvelteKit sync and svelte-check
```

## Architecture Overview

### Tech Stack
- **Framework**: SvelteKit v2 with Svelte 5 (uses new `onclick` syntax, not `on:click`)
- **UI Components**: shadcn-svelte with Tailwind CSS v4
- **Database**: Neon Serverless Postgres with Drizzle ORM
- **Deployment**: Netlify with serverless functions

### Key Architectural Decisions

1. **API Protection**: The `/api/pixels` endpoint checks origin headers to prevent direct API access in production. Test suite bypasses this with `x-test-suite: playwright-e2e` header.

2. **Privacy Implementation**:
   - Tracking pixel serves a 1x1 transparent PNG (not GIF)
   - No cookies used anywhere in the application

3. **Browser Fingerprinting**: Only collected from users creating pixels (with consent via ToS), not from email recipients. Uses FingerprintJS library.

4. **Rate Limiting**: In-memory rate limiting (10 pixels per minute per IP) to prevent abuse.

### Database Schema

Three main tables:
- `pixels`: Core pixel metadata (UUID primary key, label, expiration, public stats flag)
- `pixelEvents`: Tracking events with hashed IPs, user agents, location data
- `pixelCreators`: Stores fingerprint data of pixel creators (not email recipients)

Important: Several fields use `text` type instead of `varchar` to handle variable-length fingerprint hashes.

### API Endpoints

- `POST /api/pixels`: Creates tracking pixel (requires browser fingerprint data)
- `GET /api/track/[id]`: Returns 1x1 PNG, records tracking event
- `GET /api/stats/[id]`: Returns aggregated statistics

### Component Patterns

- All UI components are in `/src/lib/components/ui/` (shadcn-svelte pattern)
- Server-side logic organized in `/src/lib/server/`
- Uses Svelte 5 syntax: `onclick` not `on:click`, `{@render children?.()}` for slots

### Environment Configuration

- Development: Uses `DATABASE_URL` from `.env`
- Production: Uses `NETLIFY_DATABASE_URL` (automatically set by Netlify)
- The database connection logic checks both variables

### Testing Approach

- Unit tests: Vitest with mocked dependencies
- E2E tests: Playwright with test database
- Component tests: Testing Library for Svelte
- Database tests are skipped in CI (no test database)

### Geolocation

Uses `geoip-lite` package for local IP geolocation to avoid external API dependencies and rate limits.