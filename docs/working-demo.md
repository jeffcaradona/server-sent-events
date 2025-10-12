# Working Demo Walkthrough

This document explains how the working demo delivers a streamed clock to the
browser using Server-Sent Events (SSE), the lifecycle of both server and client,
and the architectural choices that lean on small functional units while
accepting imperative glue where it keeps things straightforward.

## Quick Start

1. Install Node.js 22 or newer.
2. Install dependencies: `npm install`
3. Run the development server: `npm run start:dev`
4. Open `http://localhost:3000/time` and watch the browser console for updates.

## High-Level Flow

1. The browser requests `/time`, which renders `src/views/time.ejs`.
2. That page loads `public/javascripts/time.js`, which creates the SSE client.
3. The client subscribes to `/sse/time`, handled by
   `src/controllers/sseSendTimeController.js`.
4. The server emits an initial timestamp and keeps streaming every three seconds.
5. When the server plans to shut down, it broadcasts a `shutdown` event so
   clients can disconnect cleanly.

The sequence diagram at `docs/diagrams/sse-lifecycle.mmd` captures this flow.

## Server Lifecycle

- **Connection setup** — `time()` in
  `src/controllers/sseSendTimeController.js` sets the required headers, flushes
  them, and stores the response object in an in-memory `clients` array so we can
  broadcast later.
- **Heartbeat** — each connected client receives an immediate timestamp followed
  by a periodic update every three seconds. The interval is scoped per response
  so it is easy to tear down on disconnect.
- **Cleanup** — the controller listens for `req.on('close')`, clears the
  interval, and removes the client from the `clients` array. The helper
  `broadcastShutdown()` walks the active clients, emits a `{ type: "shutdown" }`
  payload, and then ends the response. The in-memory array is truncated at the
  end to avoid stale references.

## Client Lifecycle

The browser logic lives in `public/javascripts/sse-client.js` and
`public/javascripts/time.js`. The Mermaid flow chart in
`docs/diagrams/time-client-flow.mmd` illustrates the control flow.

- `createSSEClient` accepts a URL, a logger, and an `eventHandler`. It immediately
  opens an `EventSource` and wires up handlers for `onopen`, `onmessage`, and
  `onerror`.
- The `eventHandler` returns an array of side-effect functions. The caller
  (`time.js`) supplies `getTimeEventEffects`, which pattern-matches on the
  payload and returns the effects to run.
- During shutdown, one of the effects closes the connection so the browser does
  not keep retrying against a server that is intentionally going away.

## Functional Emphasis With Pragmatic State

- **Functional units** — `createSSEClient` and `getTimeEventEffects` isolate pure
  decisions from side-effects. Event parsing happens in `parseSSEData`, which
  returns a tagged result instead of throwing.
- **Controlled imperative state** — We still keep an in-memory `clients` array
  on the server to track active streams, and we rely on `express-session` with a
  file store in development. These are straightforward places where a mutable
  container keeps the code easy to reason about.
- **Composable effects** — Returning an array of functions means it is trivial to
  add logging, DOM updates, or metrics without rewriting control flow. When we
  need to call imperative browser APIs (like `event.target.close()`), we do so
  inside these effect closures.

## Supporting Decisions

- **Sessions** — Even though the demo does not yet rely on session data, keeping
  `express-session` configured mirrors a real-world setup and makes it easy to
  expand later.
- **Logging** — Winston (`src/utils/logger.js`) and Morgan provide structured
  logs that make it easier to observe the lifecycle during development and when
  the server shuts down.
- **Shutdown Hooks** — `bin/www` forwards `SIGINT`/`SIGTERM` to the shared
  `shutdown()` helper in `src/app.js`, which in turn calls `broadcastShutdown()`
  to notify all SSE clients before exiting.

## Next Steps

- Add DOM updates in `time.js` so the streamed data is visible without relying
  on the console.
- Extend the SSE channel with domain events (e.g., job progress) to exercise the
  type-based handling path used in `getTimeEventEffects`.
