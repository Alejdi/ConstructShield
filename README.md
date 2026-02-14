# ConstructShield

A high-trust construction marketplace that prevents fraud through video-verified milestone payments and an escrow system.

## Tech Stack

- **Frontend:** Next.js 16.1 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui
- **Backend/Database:** Supabase (Auth, PostgreSQL, Realtime, Storage)
- **Payments:** Stripe Connect (Express) for escrow and multi-party fund routing
- **Video:** Mux API for video processing and hosting
- **Validation:** Zod

## Getting Started

```bash
npm install
cp .env.example .env.local
# Fill in your Supabase, Stripe, and Mux credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Environment Variables

See `.env.example` for the required environment variables.
