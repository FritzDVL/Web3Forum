# Lens Forum

A Next.js 14 decentralized forum application built on the Lens Protocol, using Supabase for data persistence and ConnectKit/Wagmi for wallet connectivity.

## Architecture

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Radix UI components (shadcn/ui)
- **Blockchain**: Lens Protocol (mainnet/testnet), Wagmi, Viem, ConnectKit
- **Backend**: Supabase (PostgreSQL)
- **State**: Zustand, TanStack Query
- **Editor**: Tiptap rich text editor
- **Package manager**: pnpm

## Running the App

The app runs on port 5000 via the "Start application" workflow:

```
pnpm run dev
```

This starts Next.js on `0.0.0.0:5000` for Replit preview compatibility.

## Environment Variables (Secrets)

The following secrets must be configured in Replit Secrets:

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL (from Supabase dashboard > Settings > API) |
| `SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `PRIVATE_KEY` | Server-side private key for signing transactions |
| `NEXT_PUBLIC_LENSFORUM_ENV` | Set to `mainnet` or `testnet` (defaults to mainnet if unset) |

## Key Directories

- `app/` — Next.js App Router pages and layouts
- `components/` — Shared UI components
- `lib/` — Utility functions, Supabase client, env helpers
- `hooks/` — Custom React hooks
- `stores/` — Zustand state stores
- `fragments/` — GraphQL-style data fragments
- `types/` — TypeScript types including Supabase-generated types
- `supabase/` — Supabase migrations and config
- `config/` — App-level configuration
