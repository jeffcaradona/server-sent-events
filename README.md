# Server-Sent Events Demo

An Express 5 application that demonstrates how to stream time updates to the
browser with Server-Sent Events (SSE) while keeping the client-side code mostly
functional with small, explicit side-effects.

## Prerequisites

- Node.js 22 or newer
- npm 10+

## Getting Started

```bash
npm install
npm run start:dev
```

The development server runs on `http://localhost:3000`. The SSE demo lives at
`/time`.

### Environment Variables

Copy `.env.example` to `.env` if you want to override defaults such as `PORT` or
`SESSION_SECRET`. When `SESSION_SECRET` is omitted a secure value is generated at
runtime for development.

## Available Scripts

- `npm start` — start the server in production mode
- `npm run start:prod` — run the production build with `NODE_ENV=production`
- `npm run start:dev` — run with nodemon and verbose logging
- `npm run start:inspect` — run with the Node inspector enabled

## Project Layout

- `src/` — Express app, controllers, routes, and utilities
- `public/` — static assets served to the browser (bootstrap, JS modules)
- `docs/` — project documentation, walkthroughs, and Mermaid diagrams
- `sessions/` — local development session store directory

## What to Look At

- `src/controllers/sseSendTimeController.js` streams timestamp updates and keeps
  track of open connections to broadcast shutdown messages.
- `public/javascripts/sse-client.js` and `public/javascripts/time.js` build the
  client in a functional style: event handlers describe effects, and the runtime
  executes them.
- `bin/www` wires OS signals into the app shutdown flow so SSE clients can
  disconnect gracefully.

## Documentation

- [Working demo walkthrough](docs/working-demo.md)
- [Diagrams](docs/diagrams/) (Mermaid)

We favour functional programming at the boundaries (parsing, composing effects)
and keep small mutable pockets (session handling, SSE client registry) where it
keeps the implementation simple. See the documentation above for more detail on
those decisions and the SSE lifecycle.
