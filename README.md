# BrowDesk

Private client management app for micropigmentation specialists. Built with React Native + Expo.

## Overview

BrowDesk helps micropigmentation artists manage their clients, procedures, before/after photos, appointments, and follow-ups — all from their phone. Designed with a premium, luxury aesthetic.

### Key Features

- **Client Management** — Create, edit, search, and view detailed client profiles with clinical data
- **Procedures** — Track procedures by type (brows, lips, eyes), technique, cost, and notes
- **Before/After Photos** — Capture and store photos linked to each procedure
- **Appointments & Follow-ups** — Schedule appointments with automatic follow-up reminders
- **Biometric Security** — Face ID unlock with PIN fallback
- **Offline-First** — Works without internet; syncs to cloud when connected
- **Local Notifications** — Reminders for upcoming appointments and pending follow-ups

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native + Expo SDK 54 |
| Language | TypeScript (strict) |
| Routing | Expo Router v4 (file-based) |
| Local DB | expo-sqlite + Drizzle ORM |
| Cloud | Supabase (PostgreSQL + Storage) |
| State | Zustand |
| Styling | NativeWind v4 (Tailwind CSS) |
| Auth | expo-local-authentication + expo-secure-store |
| Photos | expo-image-picker + expo-file-system |
| Notifications | expo-notifications (local) |

## Architecture

```
[App] → [SQLite (Drizzle ORM)] → [Sync Service] → [Supabase Cloud]
              ↑ source of truth              ↑ backup + multi-device
```

- **Writes** go to local SQLite first (instant, works offline)
- **Sync service** pushes unsynced records to Supabase when online
- **Photos** saved locally, uploaded to Supabase Storage in background

## Project Structure

```
browdesk/
├── app/                    # Screens (Expo Router file-based routing)
│   ├── _layout.tsx         # Root layout with DB initialization
│   ├── index.tsx           # Splash screen
│   ├── unlock.tsx          # Biometric/PIN unlock
│   ├── (tabs)/             # Bottom tab navigator
│   │   ├── index.tsx       # Home dashboard
│   │   ├── clients/        # Client list, detail, create
│   │   ├── agenda.tsx      # Appointments & follow-ups
│   │   └── settings.tsx    # App settings
│   └── procedures/         # Procedure forms (modal)
├── src/
│   ├── components/ui/      # Reusable UI components
│   ├── components/layout/  # Layout components (FAB, etc.)
│   ├── db/                 # SQLite schema & client
│   ├── hooks/              # Data hooks (useClients, useProcedures, etc.)
│   ├── services/           # Auth, sync, photos, notifications
│   ├── stores/             # Zustand state stores
│   ├── types/              # TypeScript interfaces
│   ├── theme/              # Colors & design tokens
│   ├── utils/              # Formatting helpers
│   └── constants/          # App constants
└── assets/                 # Images & fonts
```

## Getting Started

### Prerequisites

- Node.js 18+
- Expo Go app on your iPhone
- Supabase project (free tier works)

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npx expo start
```

Scan the QR code with your iPhone camera to open in Expo Go.

### Environment Variables

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Database Setup

Run the SQL migration in Supabase SQL Editor to create all required tables. The migration creates:

- `clients` — Client profiles with clinical data
- `procedures` — Procedure records linked to clients
- `photos` — Photo metadata linked to procedures
- `appointments` — Scheduled appointments
- `follow_ups` — Follow-up tracking
- `user_profile` — App user settings
- Row Level Security policies
- Storage bucket for photos
- Performance indexes

## Design

Premium aesthetic with a black, beige, and gold color palette:

| Token | Color | Usage |
|-------|-------|-------|
| `brand-black` | `#1A1A1A` | Primary backgrounds |
| `brand-dark` | `#2D2D2D` | Dark cards |
| `brand-beige` | `#F5F0EB` | Light backgrounds |
| `brand-gold` | `#C4A87C` | Accents, CTAs |
| `brand-gold-dark` | `#A68B5B` | Premium text |

## License

Private project. All rights reserved.
