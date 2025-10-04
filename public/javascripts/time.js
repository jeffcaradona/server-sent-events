/**
 * time.js
 * Client-side JavaScript to handle Server-Sent Events (SSE) for time updates.
 * Refactored for better testability and maintainability.
 */
/"
// Singleton EventSource factory
const eventSourceSingletonFactory = (() => {
  const sources = {};
  return (url) => {
    if (!sources[url]) {
      sources[url] = new EventSource(url);
    }
    return sources[url];
  };
})();

// Usage
const es1 = eventSourceSingletonFactory('/events');
const es2 = eventSourceSingletonFactory('/events'); // returns the same instance as es1
const es3 = eventSourceSingletonFactory('/other-events'); // new instance
*/

/**
 * Pure function to create and configure an EventSource instance.
 * No side effects; returns a configured EventSource.
 * @param {string} url - The SSE endpoint URL.
 * @returns {EventSource}
 */
const createEventSource = (url) => new EventSource(url);

/**
 * Pure function to parse and validate SSE event data.
 * Returns an object with status and payload for further handling.
 */
const parseSSEData = (event) => {
  try {
    const data = JSON.parse(event.data);
    if (typeof data !== 'object' || data === null) {
      return { status: 'invalid', payload: null };
    }
    return { status: 'ok', payload: data };
  } catch (err) {
    // Log the error for visibility and debugging
    console.error("Failed to parse SSE event data:", err);
    return { status: 'invalid', payload: null };
  }
};

/**
 * Pure function to handle parsed SSE time events.
 * All side effects (logging, closing connection) are isolated here.
 */
const handleTimeEvent = (event) => {
  const { status, payload } = parseSSEData(event);
  if (status !== 'ok') {
    console.error("Invalid event data received.");
    return;
  }
  switch (payload.type) {
    case 'error':
      console.error("Server error:", payload.message || "Unknown error");
      break;
    case 'shutdown':
      console.log("Server is shutting down. Closing connection.");
      event.target.close();
      // Optionally, update UI to inform user
      break;
    default:
      if (typeof payload.utc === "string") {
        const local = new Date().toLocaleString();
        console.log(`Server UTC: ${payload.utc} | Browser Local: ${local}`);
      } else {
        console.warn("Unexpected event data format:", payload);
      }
  }
};


/**
 * Main entry point: initializes SSE connection and attaches handlers.
 * All side effects are isolated here.
 */
const onReady = () => {
  console.log("Initializing...");

  // Encapsulate connection logic for reuse
  const connect = () => {
    const evtSource = createEventSource("/sse/time");

    evtSource.onmessage = handleTimeEvent;

    evtSource.onopen = () => {
      console.log("EventSource initialized and ready!");
    };

    evtSource.onerror = (err) => {
      // Log error for visibility and debugging
      console.error("Connection error or server offline.", err);
      // No reconnection or circuit breaker logic
    };
  };

  connect();

  console.log("Document is ready!");
};

document.addEventListener("DOMContentLoaded", onReady);
