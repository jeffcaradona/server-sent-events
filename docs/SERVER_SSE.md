# Server-Sent Events (SSE) Helper Documentation

## Overview

This module manages SSE connections for Express, providing a secure, memory-safe, and V8-optimized way to broadcast events to browser clients.

- **Wire format:** `data: <json>\n\n`
- **Client management:** Uses `Map` and `WeakMap` to avoid memory leaks.
- **Security:** Only server-generated client IDs; safe serialization; robust cleanup.

## Architecture

- **Client Registry:**  
  - `Map<clientId, { res, meta, createdAt }>` holds strong references.
  - `WeakMap<res, clientId>` enables reverse lookup for cleanup.

- **Lifecycle:**  
  - On connection: headers set, client registered, cleanup handler attached.
  - On disconnect: client removed, resources released.
  - On broadcast: message sent to all, failed clients cleaned up.

## Usage Example

```js
import sseHelper from './modules/sse/sseHelper.js';

// In an Express route handler:
sseHelper.initResponse(res);
const clientId = req.sessionID || sseHelper.addClient(res);
sseHelper.addClient(clientId, res, { ip: req.ip });
sseHelper.send(res, { utc: new Date().toISOString() });
```

## API Reference

| Function                | Description                                      |
|-------------------------|--------------------------------------------------|
| `initResponse(res)`     | Sets SSE headers on response                     |
| `addClient(id, res, meta)` | Registers client, attaches cleanup handler    |
| `removeClient(res)`     | Removes client by response object                |
| `removeClientById(id)`  | Removes client by ID                             |
| `sendToClient(id, payload)` | Sends payload to specific client             |
| `send(res, payload)`    | Sends payload to response                        |
| `broadcast(payload)`    | Broadcasts payload to all clients                |
| `broadcastAndClose(payload)` | Broadcasts and closes all connections       |
| `getClientCount()`      | Returns number of connected clients              |
| `cleanupStaleClients(maxAgeMs)` | Prunes ended/old connections            |

## Security Notes

- Only server-generated IDs are used.
- All payloads are safely serialized.
- Stale/ended clients are cleaned up automatically.

## Diagrams

See [`sse.mmd`](sse.mmd) for lifecycle and broadcast flowcharts.
