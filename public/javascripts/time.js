
import { createSSEObservable, parseSSEData } from "./sse-client.js";

/**
 * Observable-based SSE client for time updates
 * Demonstrates functional reactive programming with SSE
 */

document.addEventListener("DOMContentLoaded", () => {
  const logger = console;

  // Create the base SSE observable
  const timeStream$ = createSSEObservable("/sse/time");

  // Set up the processing pipeline using operators
  const subscription = timeStream$
    // Only process message events
    .filter(({ type }) => type === "message")
    
    // Extract the event object
    .map(({ event }) => event)
    
    // Parse the SSE data
    .map((event) => {
      const parsed = parseSSEData(event);
      return { event, parsed };
    })
    
    // Log any parse errors but continue stream
    .tap(({ parsed }) => {
      if (parsed.status !== "ok") {
        logger.error("Invalid event data received.");
        if (parsed.error) {
          logger.error("Parse error:", parsed.error);
        }
      }
    })
    
    // Filter out invalid messages
    .filter(({ parsed }) => parsed.status === "ok")
    
    // Extract the payload
    .map(({ event, parsed }) => ({ event, payload: parsed.payload }))
    
    // Subscribe to the stream and handle different message types
    .subscribe({
      next: ({ event, payload }) => {
        switch (payload.type) {
          case "error":
            logger.error("Server error:", payload.message || "Unknown error");
            break;
            
          case "shutdown":
            logger.log("Server is shutting down. Closing connection.");
            subscription.unsubscribe();
            break;
            
          default:
            if (typeof payload.utc === "string") {
              const local = new Date().toLocaleString();
              logger.log(`Server UTC: ${payload.utc} | Browser Local: ${local}`);
            } else {
              logger.warn("Unexpected event data format:", payload);
            }
        }
      },
      
      error: (err) => {
        logger.error("Connection error or server offline.", err);
      },
      
      complete: () => {
        logger.log("Connection closed.");
      },
    });

  // Clean up on page unload
  window.addEventListener("beforeunload", () => {
    subscription.unsubscribe();
  });
});
