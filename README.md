# Casa — Household Finance Tracker

A mobile-first household finance application for quickly recording and reviewing shared income, expenses, and transfers. It is designed for a two-person household, uses EUR throughout, and treats bank accounts, cash, and savings as equivalent money sources (`fuentes`).

The same React application can run as:

- A responsive web application in a desktop or mobile browser.
- A native Android application through Capacitor.
- An iOS application through Capacitor when built on macOS.

## Features

- Email and password authentication with an optional email whitelist.
- Persistent Supabase sessions.
- Local demo mode when Supabase is not configured.
- Fast, touch-friendly operation selector for:
  - Income (`Ingreso`)
  - Expense (`Gasto`)
  - Transfer (`Transferencia`)
- Amount input with automatic focus for fast entry.
- Default source selection per user.
- Transfers between registered sources.
- Shared-source responsibility tracking.
- Household categories and dependent subcategories.
- Dashboard with:
  - Total available balance.
  - Balance distribution by source.
  - Monthly income versus expenses.
  - Source filtering.
  - Expense breakdown by category.
- Responsive layouts and mobile safe-area support.

## Domain terminology

### Sources (`fuentes`)

A source is any container holding money, such as a bank account, physical cash, or savings account. An empty `owner` value means that the source is shared by the household.

### Operations (`operaciones`)

The application uses the term **operation** rather than transaction. An operation is one of:

- `income`: increases the selected source balance.
- `expense`: decreases the selected source balance.
- `transfer`: decreases the origin source and increases the destination source by the same amount.

Operation amounts are always stored as positive numbers. All monetary values use EUR (€).

### Categories

The seeded categories are:

- `HOGAR`: nómina, comida, alquiler, suscripciones, internet, luz
- `TRANSPORTE`: gasolina, transporte público, avión
- `ACTIVIDADES`: gimnasio, cerámica, yoga, baloncesto
- `OCIO`: hostelería, cine, otro
- `EXTRA`: regalos, bizum, proyectos, peluquería, ropa, salud, coche
- `DESCONOCIDO`: no subcategories

Transfers do not use a category or subcategory and are stored with `desconocido` as their category identifier.

## Technology stack

- Vite
- React 18
- TypeScript
- Tailwind CSS
- Capacitor 7
- Supabase
- Lucide React
- Recharts

## Project structure

```text project-structure
src/
├── components/          Shared UI components
├── data/                Seeded category data
├── features/
│   ├── app/             Application state and navigation
│   ├── auth/            Login view
│   ├── dashboard/       Charts and financial summary
│   ├── operations/      Operation selector and entry form
│   └── settings/        User defaults and logout
├── hooks/               Shared React hooks
├── services/            Supabase client and data API
├── types/               Domain TypeScript interfaces
├── App.tsx              Top-level view switcher
├── index.css            Tailwind and global styles
└── main.tsx             React entry point
```

This project currently uses a small view switcher rather than a URL router. Authenticated launches start on the operation selector to keep manual entry as fast as possible.

## Prerequisites

### Web development

Install:

- Node.js 20 or newer
- npm
- Git

### Android development

In addition to the web prerequisites, install:

- Android Studio
- Android SDK and SDK Platform Tools
- A configured Android emulator, or an Android device with USB debugging enabled
- A compatible Java/JDK version managed or recommended by Android Studio

## Install from source

Clone the repository and enter its directory:

```bash terminal
git clone https://github.com/Franm99/ControlFinanciero.git
cd ControlFinanciero
```

Install dependencies:

```bash terminal
npm install
```

Run the development server:

```bash terminal
npm run dev
```

Open the local URL printed by Vite, normally:

```text browser
http://localhost:5173/
```

## Environment configuration

Create a `.env.local` file in the project root when connecting the application to Supabase:

```dotenv .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ALLOWED_EMAILS=person1@example.com,person2@example.com
```

Environment values beginning with `VITE_` are included in the frontend bundle. Use only the Supabase anonymous/publishable key here. **Never place a Supabase service-role key in this file.**

Restart the development server after changing environment variables.

### Email whitelist

`VITE_ALLOWED_EMAILS` is a comma-separated list. Email comparison is case-insensitive and surrounding spaces are removed.

If the list is present, only listed addresses can proceed to Supabase authentication. For real security, enforce the same restriction in Supabase and with Row Level Security; a frontend environment variable alone is not a security boundary.

## Local demo mode

When `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is missing, the application runs in local demo mode.

Use any valid email and any non-empty password, for example:

```text demo-credentials
Email: demo@casa.es
Password: demo
```

Demo mode provides sample sources and stores the demo login email in browser local storage. Operations and balance changes are held in React state and are lost when the page is refreshed. Demo mode is intended only for UI evaluation and local development.

## Supabase setup

The frontend expects these tables:

- `sources`
- `operations`
- `user_settings`

The TypeScript domain definitions are in `src/types/index.ts`. Database columns should match their snake-case fields.

The service layer in `src/services/supabase.ts` expects these database RPC functions:

- `add_operation(operation_data)`
- `update_operation(operation_id, operation_data)`
- `delete_operation(operation_id)`
- `combine_operations(operation_ids, new_operation_data)`

These functions should run inside database transactions so operation writes and source balance changes are atomic. They must apply the following effects:

| Operation | Origin source | Destination source |
| --- | ---: | ---: |
| Income | `+ amount` | — |
| Expense | `- amount` | — |
| Transfer | `- amount` | `+ amount` |

Updating an operation should first reverse its previous balance effect and then apply the new effect. Deleting should reverse the existing effect. Combining should reverse all selected operations, remove or archive them according to the backend policy, and apply the new summary operation once.

Before using real household data:

1. Enable Supabase email/password authentication.
2. Create both household users.
3. Create the required tables and RPC functions.
4. Enable Row Level Security on all exposed tables.
5. Add policies limiting access to members of the same household.
6. Ensure users cannot change balances directly outside the atomic RPC functions.
7. Add both user emails to `VITE_ALLOWED_EMAILS`.
8. Test insert, update, delete, and transfer rollback behavior in a non-production project.

## Build the web application

Create an optimized production build:

```bash terminal
npm run build
```

The generated application is placed in `dist/`.

Preview the production build locally:

```bash terminal
npm run preview
```

The `dist/` directory can be deployed to a static host such as Netlify, Vercel, Cloudflare Pages, or a conventional web server. Configure the same `VITE_*` variables in the hosting provider before building.

## Test on a phone over Wi-Fi

The Vite configuration exposes the development server to the local network.

1. Connect the computer and phone to the same Wi-Fi network.
2. Start Vite:

```bash terminal
npm run dev
```

3. Open the `Network` URL printed by Vite on the phone, for example:

```text browser
http://192.168.1.50:5173/
```

If no network URL appears, find the computer's IPv4 address on Windows:

```powershell terminal
ipconfig
```

Use that address with port `5173`. If the phone cannot connect, confirm that the network does not isolate devices and that local firewall settings allow the development server.

To stop a development server running in another terminal on Windows, locate and stop its Node process:

```powershell terminal
Get-Process node | Stop-Process
```

## Run as an Android application

### 1. Add the Android native project

This step is required once per clone if the `android/` directory does not exist:

```bash terminal
npm run build
npx cap add android
```

### 2. Synchronize the web application

Build the frontend and copy it into the Android project:

```bash terminal
npm run build
npx cap sync android
```

The package script below can also synchronize all installed Capacitor platforms after building:

```bash terminal
npm run cap:sync
```

### 3. Open Android Studio

```bash terminal
npx cap open android
```

Allow Android Studio to finish Gradle synchronization and install any requested SDK components.

### 4. Run on a physical Android device

1. On the phone, enable Developer Options.
2. Enable USB debugging.
3. Connect the phone with a data-capable USB cable.
4. Approve the debugging authorization prompt on the phone.
5. Select the device in Android Studio.
6. Press **Run**.

Alternatively, create an Android Virtual Device in Android Studio's Device Manager and run the application on the emulator.

### 5. Apply frontend changes to Android

After changing React, TypeScript, or CSS files, rebuild and synchronize again:

```bash terminal
npm run build
npx cap sync android
```

Then run the application again from Android Studio.

### Android release preparation

Before distributing the app:

1. Replace the default app ID or name in `capacitor.config.ts` if necessary.
2. Configure an application icon and splash screen.
3. Confirm production Supabase environment values.
4. Test authentication persistence and offline/error states on a real device.
5. Increment Android version information.
6. Generate and securely store a release signing key.
7. Build a signed Android App Bundle from Android Studio.
8. Upload the bundle through Google Play Console and complete its required privacy and data-safety declarations.

Do not commit signing keys, passwords, `.env.local`, or Supabase service-role credentials.

## Optional iOS build

Native iOS builds require macOS with Xcode. Browser testing on an iPhone does not require Xcode.

On a Mac, add and open the native project:

```bash terminal
npm run build
npx cap add ios
npx cap sync ios
npx cap open ios
```

Select a development team and signing profile in Xcode, then run on an iPhone or simulator.

## Available scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server with hot reload. |
| `npm run build` | Type-check and create the production web build. |
| `npm run preview` | Preview the production web build locally. |
| `npm run cap:sync` | Synchronize the built web assets with installed Capacitor platforms. |

## Development workflow

A typical web development cycle is:

```bash terminal
npm install
npm run dev
```

A typical Android development cycle after the platform has been added is:

```bash terminal
npm run build
npx cap sync android
npx cap open android
```

Before committing changes, verify the production build:

```bash terminal
npm run build
```

## Security and data notes

- Financial data is sensitive. Use Row Level Security and household-scoped policies in production.
- Source balances should only be modified by trusted atomic database functions.
- The client-side email whitelist improves user experience but does not replace backend authorization.
- Never expose the Supabase service-role key in a Vite application.
- Use HTTPS for deployed web applications.
- Define backup and recovery procedures before relying on the application for financial records.
- Review how account deletion, data export, retention, and privacy requests will be handled before public distribution.

## Troubleshooting

### Login accepts any password

Supabase is not configured, so the application is running in demo mode. Add valid Supabase environment variables and restart Vite to use real authentication.

### Environment changes are not applied

Stop and restart `npm run dev`. Vite reads environment files when the process starts.

### Android still shows an older UI

Rebuild and synchronize before running again:

```bash terminal
npm run build
npx cap sync android
```

### Android platform does not exist

Add it once:

```bash terminal
npx cap add android
```

### Phone cannot reach the Vite development server

Verify that the computer and phone share the same network, use the Network URL rather than `localhost`, and check whether the network isolates wireless clients.

### Production build warning about bundle size

Recharts and its dependencies can make the initial JavaScript bundle relatively large. The warning does not prevent building. Route-level lazy loading and manual Vite chunks can be added later if initial-load performance becomes an issue.
