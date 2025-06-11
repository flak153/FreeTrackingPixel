# FreeTrackingPixel

A free, privacy-focused email tracking pixel service built with SvelteKit, shadcn-svelte, and Neon database.

## Features

- **100% Free**: No sign-up required, no credit card needed
- **Privacy First**: No cookies, no personal data stored
- **Anonymous Tracking**: Only counts and basic geographic info
- **Real-time Stats**: View opens and unique opens instantly
- **Beautiful UI**: Modern interface built with shadcn-svelte
- **Serverless**: Runs on Netlify with Neon database

## Tech Stack

- **Frontend**: SvelteKit + TypeScript
- **UI Components**: shadcn-svelte (Tailwind CSS)
- **Database**: Neon (Serverless Postgres)
- **ORM**: Drizzle
- **Hosting**: Netlify

## Getting Started

### Prerequisites

- Node.js 20+
- A Neon database account (free tier available at [neon.tech](https://neon.tech))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/FreeTrackingPixel.git
cd FreeTrackingPixel
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Add your Neon database URL to `.env`:
```env
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
```

5. Push the database schema:
```bash
npm run db:push
```

6. Start the development server:
```bash
npm run dev
```

## Deployment

The project is configured for Netlify deployment:

1. Push your code to GitHub
2. Connect your repository to Netlify
3. Add your `DATABASE_URL` environment variable in Netlify
4. Deploy!

## How It Works

1. **Generate a Pixel**: Users can create a tracking pixel with optional label and expiration
2. **Embed in Email**: Copy the HTML img tag and paste into email templates
3. **Track Opens**: When emails are opened, the pixel loads and records the event
4. **View Stats**: Access real-time statistics via a unique dashboard URL

## Privacy

- No personal data is collected or stored
- IP addresses are hashed for uniqueness detection only
- No cookies or tracking scripts
- All data is anonymous

## License

MIT License - see LICENSE file for details
