/**
 * Functional time.js: SSE client for time events
 * - Contains only time-specific event handling logic
 * - Uses generic SSE client for connection management
 */

import { createSSEClient } from './sse-client.js';

// Returns a {status, payload} object
function parseSSEData(event) {
  try {
    const data = JSON.parse(event.data);
    if (typeof data !== "object" || data === null) {
      return { status: "invalid", payload: null };
    }
    return { status: "ok", payload: data };
  } catch (err) {
    return { status: "invalid", payload: null, error: err };
  }
}

// Returns an array of "effects" to perform, based on time event data
function getTimeEventEffects({ event, logger }) {
  const { status, payload, error } = parseSSEData(event);

  if (status !== "ok") {
    return [
      () => logger.error("Invalid event data received."),
      ...(error ? [() => logger.error("Parse error:", error)] : []),
    ];
  }

  switch (payload.type) {
    case "error":
      return [
        () => logger.error("Server error:", payload.message || "Unknown error"),
      ];
    case "shutdown":
      return [
        () => logger.log("Server is shutting down. Closing connection."),
        () => event.target.close(),
      ];
    default:
      if (typeof payload.utc === "string") {
        return [
          () => {
            const local = new Date().toLocaleString();
            logger.log(`Server UTC: ${payload.utc} | Browser Local: ${local}`);
          },
        ];
      } else {
        return [() => logger.warn("Unexpected event data format:", payload)];
      }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Create SSE client with time-specific event handler
  const client = createSSEClient({
    url: "/sse/time",
    logger: console,
    eventHandler: getTimeEventEffects, // Pass the time-specific handler
  });

  // Set up cleanup
  client.setupCleanup();
});
