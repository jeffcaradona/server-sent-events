import crypto from "node:crypto";
import logger from "../../utils/logger.js";

/**
 * SSE helper module
 *
 * Responsibilities
 * - Manage connected SSE clients (register, remove, broadcast).
 * - Preserve legacy SSE wire format (data: <json>\n\n).
 * - Provide small, well-documented, testable functions for formatting and
 *   safe serialization.
 *
 * Storage design (memory / leak considerations)
 * - clients: Map<clientId, { res, meta, createdAt }>
 *     - Holds the authoritative, strong reference to the Response object
 *       (so removing the Map entry releases the res object and its socket).
 * - resIndex: WeakMap<res, clientId>
 *     - A weak reverse lookup that does NOT keep the res object alive by itself.
 *     - Useful to look up the clientId when only the Response object is
 *       available (for example in a `res.once('close', ...)` handler).
 *
 * Important: WeakMap entries alone are NOT sufficient to prevent leaks. The
 * clients Map stores the res inside its value; you MUST delete the entry from
 * the clients Map when the connection closes (we do this in removeClient /
 * removeClientById). The WeakMap prevents the reverse lookup map from being
 * the single strong reference that would otherwise keep res alive.
 *
 * Security & robustness notes
 * - All payloads are serialized using JSON.stringify with a safe fallback.
 * - Writes are wrapped in try/catch; failing clients are removed to avoid
 *   holding resources indefinitely.
 * - Use server-side stable ids (for example `req.sessionID`) for client keys.
 *   Do NOT accept client-supplied ids from the network.
 * - Consider enabling a periodic prune task (cleanupStaleClients) to handle
 *   rare cases where a 'close' event doesn't fire.
 *
 * Usage example (Express):
 *
 *   import sseHelper from './modules/sse/sseHelper.js';
 *
 *   // in an express handler
 *   sseHelper.initResponse(res);
 *   const clientId = req.sessionID || sseHelper.addClient(res);
 *   sseHelper.addClient(clientId, res, { ip: req.ip });
 *   // send immediate message
 *   sseHelper.send(res, { utc: new Date().toISOString() });
 *
 * Contract summary (per function, high level)
 * - initResponse(res): sets SSE headers and flushes; pure side-effect on res.
 * - addClient(clientId,res,meta) -> clientId: registers a client and attaches
 *   a once('close') cleanup handler. Back-compatible addClient(res) returns
 *   a generated id.
 * - removeClient(res): removes the client registered for this res (if any)
 * - removeClientById(id): removes by id
 * - sendToClient(id,payload): targeted send
 * - send(res,payload): low-level write using safeSerialize
 * - broadcast(payload)/broadcastAndClose(payload): broadcast helpers
 * - cleanupStaleClients(maxAgeMs): prune ended or old connections
 */

// clients: Map<clientId, { res, meta }>
const clients = new Map();

// resIndex is a WeakMap so we don't accidentally prevent GC of response objects
// maps res -> clientId
const resIndex = new WeakMap();

const defaultHeaders = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
};

/**
 * Initialize an Express Response for SSE
 * @param {import('http').ServerResponse & { flushHeaders?: Function }} res
 * @returns {void}
 */
function initResponse(res) {
  res.set(defaultHeaders);
  // flushHeaders exists on Node/Express response to send headers immediately
  if (typeof res.flushHeaders === "function") res.flushHeaders();
}

/**
 * Add a client.
 * Preferred call: addClient(clientId, res, meta)
 * Backwards compatible: addClient(res) will generate a UUID-like id and store by that id.
 */
/**
 * Register a client.
 * Preferred signature: addClient(clientId, res, meta)
 * Backwards-compatible: addClient(res) -> generated clientId
 * @param {string|import('http').ServerResponse} arg1 - clientId or res
 * @param {import('http').ServerResponse} [maybeRes]
 * @param {Object} [maybeMeta]
 * @returns {string} clientId assigned
 */
function addClient(arg1, maybeRes, maybeMeta) {
  // Standardize meta shape for V8 optimization (monomorphic hidden class)
  const standardizeMeta = (meta = {}) => ({
    ip: meta.ip || null,
    userId: meta.userId || null,
    userAgent: meta.userAgent || null,
  });

  // Backwards-compatibility: if first arg is a res object
  if (!maybeRes) {
    const res = arg1;
    // generate a secure random id using crypto module (cryptographically strong)
    const randomSuffix = crypto.randomBytes(3).toString('hex'); // 6 hex chars (similar length to previous implementation)
    const clientId = `anon-${Date.now()}-${randomSuffix}`;
    clients.set(clientId, { 
      res, 
      meta: standardizeMeta({}), 
      createdAt: Date.now() 
    });
    resIndex.set(res, clientId);

    // Ensure we clean up if the connection closes. Use once so we don't
    // accidentally attach multiple handlers for the same response.
    try {
      res.once("close", () => {
        // removeClient will end the response if needed and delete maps
        removeClient(res);
      });
    } catch (e) {
      // ignore — defensive in case res is not an EventEmitter-like object
    }

    return clientId;
  }

  const clientId = arg1;
  const res = maybeRes;
  const meta = maybeMeta || {};
  // If this res was already registered for another clientId, remove previous
  // mapping so we don't leak the old client entry.
  const existing = resIndex.get(res);
  if (existing && existing !== clientId) {
    // Attempt to remove the old entry cleanly
    try {
      const old = clients.get(existing);
      if (old && old.res && !old.res.writableEnded) {
        // don't force-close here; just drop the mapping
      }
    } catch (e) {
      // ignore
    }
    clients.delete(existing);
  }

  clients.set(clientId, { 
    res, 
    meta: standardizeMeta(meta), 
    createdAt: Date.now() 
  });
  resIndex.set(res, clientId);

  try {
    res.once("close", () => {
      removeClient(res);
    });
  } catch (e) {
    // ignore
  }

  return clientId;
}

/**
 * Remove a client by response object. This will attempt to end the response
 * if it is still writable and delete both forward and reverse mappings.
 * @param {import('http').ServerResponse} res
 */
function removeClient(res) {
  const clientId = resIndex.get(res);
  if (clientId) {
    const entry = clients.get(clientId);
    if (entry) {
      try {
        if (!entry.res.writableEnded) entry.res.end();
      } catch (err) {
        // ignore
      }
    }
    clients.delete(clientId);
    // WeakMap doesn't provide delete in some older engines, but Node supports it.
    try {
      resIndex.delete(res);
    } catch (e) {
      // ignore
    }
  }
}

/**
 * Remove a client by its id (if present). Attempts to end the response and
 * removes both forward and reverse mappings.
 * @param {string} clientId
 */
function removeClientById(clientId) {
  const entry = clients.get(clientId);
  if (!entry) return;
  try {
    if (entry.res && !entry.res.writableEnded) entry.res.end();
  } catch (e) {
    // ignore
  }
  // delete from clients map
  clients.delete(clientId);
  // remove res->id mapping if present
  try {
    if (entry.res) resIndex.delete(entry.res);
  } catch (e) {
    // ignore
  }
}

/**
 * Send a payload to a specific client by clientId.
 * Returns true if the client was found and the send attempted, false
 * otherwise (and cleans up ended entries).
 * @param {string} clientId
 * @param {any} payload
 * @returns {boolean}
 */
function sendToClient(clientId, payload) {
  const entry = clients.get(clientId);
  if (!entry || !entry.res) return false;
  const { res } = entry;
  if (res.writableEnded) {
    // Clean up stale entry
    removeClientById(clientId);
    return false;
  }
  send(res, payload);
  return true;
}

/**
 * Prune stale or ended clients.
 * - removes entries whose res is ended/destroyed
 * - optionally removes entries older than maxAgeMs
 */
/**
 * Prune stale or ended clients.
 * - removes entries whose res is ended/destroyed
 * - optionally removes entries older than maxAgeMs
 * @param {number} [maxAgeMs]
 */
function cleanupStaleClients(maxAgeMs = 1000 * 60 * 60) {
  const now = Date.now();
  for (const [clientId, entry] of Array.from(clients.entries())) {
    try {
      const res = entry.res;
      const age = now - (entry.createdAt || 0);
      if (!res || res.writableEnded || (maxAgeMs && age > maxAgeMs)) {
        removeClientById(clientId);
      }
    } catch (e) {
      // ignore per-entry errors
      removeClientById(clientId);
    }
  }
}

/**
 * Safely serialize a payload to JSON with a fallback on failure.
 * @param {any} data
 * @returns {string}
 */
function safeSerialize(data) {
  // Only allow plain objects, arrays, strings, numbers, booleans, null
  // This avoids sending functions, prototypes, or circular structures.
  try {
    return JSON.stringify(data);
  } catch (err) {
    logger.warn(`Failed to serialize SSE payload: ${err.message}`);
    return JSON.stringify({ error: "unserializable payload" });
  }
}

/**
 * Format payload to SSE wire format (pure function, no I/O).
 * V8 optimization: pure function, small, inlineable.
 * @param {any} payload
 * @returns {string} formatted SSE message
 */
function formatSSEMessage(payload) {
  return `data: ${safeSerialize(payload)}\n\n`;
}

/**
 * Write formatted message to a single client (isolated error handling).
 * Returns true if write succeeded, false if client should be removed.
 * 
 * V8 optimization: try-catch is isolated here so broadcast() can be inlined.
 * @param {import('http').ServerResponse} res
 * @param {string} formattedMessage
 * @returns {boolean}
 */
function writeToClient(res, formattedMessage) {
  try {
    if (res.writableEnded) return false;
    res.write(formattedMessage);
    return true;
  } catch (err) {
    logger.warn(`Failed to write to SSE client: ${err.message}`);
    return false;
  }
}

/**
 * Low-level send to a response object using the legacy SSE wire format
 * (data: <json>\n\n).
 * @param {import('http').ServerResponse} res
 * @param {any} payload
 */
function send(res, payload) {
  if (!res || res.writableEnded) return;
  const formatted = formatSSEMessage(payload);
  if (!writeToClient(res, formatted)) {
    // Best-effort: try to end the response and remove client
    try {
      res.end();
    } catch (e) {
      // ignore
    }
    removeClient(res);
  }
}

/**
 * Broadcast a payload to all connected clients (best-effort).
 * V8 optimization: format once, tight monomorphic loop with isolated error handling.
 * @param {any} payload
 */
function broadcast(payload) {
  const formatted = formatSSEMessage(payload); // Format once (V8 inlines this)
  const toRemove = []; // Defer removals to avoid mutation during iteration
  
  for (const [clientId, entry] of clients.entries()) {
    if (!writeToClient(entry.res, formatted)) {
      toRemove.push(clientId); // Cold path: collect failed clients
    }
  }
  
  // Remove failed clients (outside hot loop)
  for (const id of toRemove) {
    removeClientById(id);
  }
}

/**
 * Broadcast a payload to all clients and then close their responses.
 * Used for graceful shutdown notifications.
 * @param {any} payload
 */
function broadcastAndClose(payload) {
  const formatted = formatSSEMessage(payload);
  
  for (const { res } of clients.values()) {
    if (!res.writableEnded) {
      writeToClient(res, formatted);
      try {
        res.end();
      } catch (err) {
        logger.warn(`Failed to end SSE client: ${err.message}`);
      }
    }
  }
  clients.clear();
}

/**
 * Number of connected clients.
 * @returns {number}
 */
function getClientCount() {
  return clients.size;
}

export default {
  initResponse,
  addClient,
  removeClient,
  removeClientById,
  sendToClient,
  send,
  broadcast,
  broadcastAndClose,
  getClientCount,
  formatSSEMessage,
  // expose internals for testing/inspection only
  _clients: clients,
  _resIndex: resIndex,
  cleanupStaleClients,
};
