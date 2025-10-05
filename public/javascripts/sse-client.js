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

// Export the function for use in other modules
export { createSSEClient };