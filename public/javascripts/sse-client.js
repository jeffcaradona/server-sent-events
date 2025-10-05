/**
 * Generic SSE client with functional approach
 * - Handles connection lifecycle
 * - Dispatches events to provided handlers
 * - Manages cleanup
 */

function createEventSourceFactory({ url }) {
  return () => new EventSource(url);
}

// Generic SSE client that accepts an event handler function
function createSSEClient({ url, logger, eventHandler }) {
  const createEventSource = createEventSourceFactory({ url });
  const evtSource = createEventSource();

  evtSource.onmessage = (event) => {
    try {
      // Call the provided event handler to get effects
      const effects = eventHandler({ event, logger });
      
      // Execute all effects
      for (const effect of effects) {
        try {
          const maybePromise = effect();
          if (maybePromise && typeof maybePromise.then === "function") {
            maybePromise.catch((e) => logger.error("Async effect failed:", e));
          }
        } catch (e) {
          logger.error("Effect failed:", e);
        }
      }
    } catch (e) {
      logger.error("Event handling error:", e);
    }
  };

  evtSource.onopen = () => logger.log("EventSource initialized and ready!");
  evtSource.onerror = (err) =>
    logger.error("Connection error or server offline.", err);

  // Return control object with cleanup methods
  return {
    close: () => evtSource.close(),
    setupCleanup: () => {
      window.addEventListener("beforeunload", () => evtSource.close());
    }
  };
}


/**
 * Parses the data from an SSE (Server-Sent Events) event as JSON.
 *
 * @param {MessageEvent} event - The SSE event containing a JSON string in its `data` property.
 * @returns {{status: "ok", payload: Object} | {status: "invalid", payload: null, error?: Error}}
 *   Returns an object with status "ok" and the parsed payload if successful,
 *   or status "invalid" and payload null (with error info) if parsing fails.
 */
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

// Export the function for use in other modules
export { createSSEClient, parseSSEData };