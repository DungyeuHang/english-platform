# English Platform

A modern English-learning platform for language centers (admin / teacher / student).

> **Status:** Foundation only. Authentication, class management, quizzes, assignments,
> gamification and analytics are intentionally NOT implemented yet.

## Stack

- React + TypeScript + Vite
- Tailwind CSS (design tokens in `src/shared/styles/tokens.css`)
- React Router (feature-based route map in `src/app/router.tsx`)
- Firebase (Auth / Firestore / Storage) — behind an abstraction in `src/shared/lib/firebase`
- Vitest (unit) + Playwright (e2e)

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run typecheck` | Type-check the project |
| `npm test` | Run unit tests (Vitest) |
| `npm run build` | Type-check then build for production |
| `npm run preview` | Preview the production build |
| `npm run test:e2e` | Run Playwright end-to-end tests |
| `npm run test:e2e:install` | Install the Chromium browser for Playwright |

## Firebase configuration

Copy `.env.example` to `.env.local` and fill in your Firebase Web config values:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

The app boots even without these (Firebase is only initialized when configured).
UI code must not call the Firebase SDK directly — it should go through
`src/shared/lib/firebase`.

## Project structure

```
src/
├── app/           # Routing, layouts, providers
├── features/      # Feature-based modules (auth, admin, teacher, student, gamification)
├── shared/
│   ├── components/# Reusable UI components
│   ├── hooks/     # Shared hooks
│   ├── lib/       # Firebase abstraction, data access
│   ├── styles/    # Design tokens + global styles
│   └── utils/     # Pure helpers
└── test/          # Vitest setup
```

## Local Node runtime

This repository uses a portable Node.js runtime located in `.tools/` (gitignored) so
no system-wide Node installation is required. Invoke it via its full path, e.g.:

```powershell
$env:PATH = "$PWD\.tools\node-v22.23.2-win-x64;$env:PATH"
npm run dev
```

#### TEST
```powershell 
$env:PATH = 'D:\GitHub\english-platform\.tools\node-v22.23.2-win-x64;' + $env:PATH; Set-Location 'D:\GitHub\english-platform'; & 'D:\GitHub\english-platform\.tools\node-v22.23.2-win-x64\npm.cmd' run dev
```