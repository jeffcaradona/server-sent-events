/**
 * Functional time.js: SSE client with enhanced functional paradigms.
 * - Dependencies are parameterized.
 * - Pure functions return instructions/data, not performing side effects.
 * - One top-level runner dispatches effects.
 */

function createEventSourceFactory({ url }) {
  return () => new EventSource(url);
}

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

// Returns an array of "effects" to perform, based on event data
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

// Wire up everything via dependency injection and effect dispatch
function runSSEClient({ url, logger }) {
  const createEventSource = createEventSourceFactory({ url });

  const evtSource = createEventSource();

  evtSource.onmessage = (event) => {
    getTimeEventEffects({ event, logger }).forEach((effect) => effect());
  };

  evtSource.onopen = () => logger.log("EventSource initialized and ready!");
  evtSource.onerror = (err) =>
    logger.error("Connection error or server offline.", err);
}

document.addEventListener("DOMContentLoaded", () => {
  runSSEClient({
    url: "/sse/time",
    logger: console, // inject a logger, could be swapped for testing
  });
});
