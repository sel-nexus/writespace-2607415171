# WriteSpace

WriteSpace is a static, browser-local blog demo built with Vite, React 18, React Router, and Tailwind CSS. Visitors can preview the product, create a demo account, read posts, write and manage their own plain-text posts, and use administrator tools. Posts, accounts, and sessions live only in the current browser's `localStorage`; they are not shared across browsers or devices.

## Requirements

- Node.js 20 or newer
- npm

## Install and run

From the repository root:

```sh
cd frontend
npm install
npm run dev
```

Vite prints the local development URL. For a production bundle and local preview:

```sh
npm run build
npm run preview
```

## Demo account

- Username: `admin`
- Password: `admin`

This built-in client-side account is for demonstration only. Do not use a real password or store sensitive data in WriteSpace.

## Tests

Run the unit and component tests:

```sh
cd frontend
npm test
```

Run browser journeys after Playwright Chromium is available:

```sh
cd frontend
npm run test:e2e
```

Playwright configuration starts the Vite app for the browser suite. E2E test artifacts and screenshots are written under Playwright's test output folder and are ignored by Git.

## Data and security limitations

- Posts, user records, and the active session use `writespace_posts`, `writespace_users`, and `writespace_session` in browser `localStorage`.
- Account passwords are stored as plain text. Authentication and route/ownership checks are entirely client-side, so they are not a security boundary.
- Data remains in this browser only and can be cleared by browser settings, private browsing, storage limits, or device loss.
- A visible warning and temporary in-memory fallback are used when browser storage is unavailable; in-memory changes do not survive leaving the page.
- The public latest-post preview shows only posts available in the current browser, not posts shared by other visitors.

## Deploy to Vercel

Import the repository and set the Vercel **Root Directory** to `frontend`. Keep the root `vercel.json` rewrite configuration so direct client-side route access resolves to `index.html`. Do not add Vercel build or output overrides to that file; Vercel's project root controls the frontend build.

## Static container

The `frontend/Dockerfile` builds the Vite bundle and serves it with nginx. From the repository root:

```sh
docker build -t writespace-static ./frontend
docker run --rm -p 8080:80 writespace-static
```

The container serves the SPA at `/`, falls back to the client app for routes, and exposes `/healthz`.

## Product contract

See [`PLAN.md`](PLAN.md) for the implementation decisions and inventory. The application intentionally has no backend, API, server database, remote identity provider, or cross-device synchronization.
