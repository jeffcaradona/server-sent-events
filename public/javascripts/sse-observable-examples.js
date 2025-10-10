/**
 * SSE Observable Pattern Examples
 * 
 * This file demonstrates various ways to use the Observable pattern
 * with Server-Sent Events in vanilla JavaScript.
 */

import { createSSEObservable, parseSSEData, Observable } from "./sse-client.js";

/**
 * Example 1: Basic Observable Usage
 * Simple subscription to SSE events
 */
export function basicExample() {
  const stream$ = createSSEObservable("/sse/time");

  const subscription = stream$.subscribe({
    next: ({ type, event }) => {
      if (type === "message") {
        console.log("Received message:", event.data);
      } else if (type === "open") {
        console.log("Connection opened");
      }
    },
    error: (err) => console.error("Error:", err),
    complete: () => console.log("Stream completed"),
  });

  // Cleanup after 10 seconds
  setTimeout(() => subscription.unsubscribe(), 10000);
}

/**
 * Example 2: Using Operators for Data Transformation
 * Chain multiple operators to process the stream
 */
export function operatorChainExample() {
  const stream$ = createSSEObservable("/sse/time")
    .filter(({ type }) => type === "message")
    .map(({ event }) => parseSSEData(event))
    .filter(({ status }) => status === "ok")
    .map(({ payload }) => payload)
    .tap((data) => console.log("Processing:", data));

  return stream$.subscribe((data) => {
    // Only valid, parsed data reaches here
    console.log("Final data:", data);
  });
}

/**
 * Example 3: Multiple Subscribers
 * Multiple consumers can subscribe to the same observable
 */
export function multipleSubscribersExample() {
  const stream$ = createSSEObservable("/sse/time")
    .filter(({ type }) => type === "message")
    .map(({ event }) => event.data);

  // Subscriber 1: Log to console
  const sub1 = stream$.subscribe((data) => {
    console.log("Console logger:", data);
  });

  // Subscriber 2: Update DOM
  const sub2 = stream$.subscribe((data) => {
    const element = document.getElementById("sse-output");
    if (element) {
      element.textContent = data;
    }
  });

  // Subscriber 3: Send to analytics
  const sub3 = stream$.subscribe((data) => {
    // Could send to analytics service
    console.log("Analytics:", { event: "sse-received", data });
  });

  return () => {
    sub1.unsubscribe();
    sub2.unsubscribe();
    sub3.unsubscribe();
  };
}

/**
 * Example 4: Custom Operator
 * Create reusable custom operators for common tasks
 */
function parseJSON() {
  return (observable) => {
    return observable.map((event) => {
      try {
        return JSON.parse(event.data);
      } catch (e) {
        console.warn("Failed to parse JSON:", e);
        return null;
      }
    }).filter((data) => data !== null);
  };
}

export function customOperatorExample() {
  const stream$ = createSSEObservable("/sse/time")
    .filter(({ type }) => type === "message")
    .map(({ event }) => event);

  // Apply custom operator
  const parsedStream$ = parseJSON()(stream$);

  return parsedStream$.subscribe((data) => {
    console.log("Parsed data:", data);
  });
}

/**
 * Example 5: Error Recovery
 * Handle errors gracefully and continue processing
 */
export function errorRecoveryExample() {
  const stream$ = createSSEObservable("/sse/time")
    .filter(({ type }) => type === "message")
    .map(({ event }) => {
      const parsed = parseSSEData(event);
      if (parsed.status !== "ok") {
        console.warn("Parse error, using default");
        return { type: "default", message: "No data" };
      }
      return parsed.payload;
    });

  return stream$.subscribe({
    next: (data) => console.log("Data:", data),
    error: (err) => {
      console.error("Stream error:", err);
      // Could trigger reconnection logic here
    },
  });
}

/**
 * Example 6: Combining Multiple SSE Streams
 * Create a merged observable from multiple SSE endpoints
 */
export function mergeStreamsExample() {
  // Note: This is a simplified merge - a full implementation would be more complex
  const timeStream$ = createSSEObservable("/sse/time");
  const otherStream$ = createSSEObservable("/sse/other");

  const sub1 = timeStream$.subscribe((data) => {
    console.log("Time stream:", data);
  });

  const sub2 = otherStream$.subscribe((data) => {
    console.log("Other stream:", data);
  });

  return () => {
    sub1.unsubscribe();
    sub2.unsubscribe();
  };
}

/**
 * Example 7: Conditional Subscription
 * Subscribe only when certain conditions are met
 */
export function conditionalSubscriptionExample() {
  let subscription = null;
  const isUserActive = () => document.visibilityState === "visible";

  const startStream = () => {
    if (subscription) return;

    subscription = createSSEObservable("/sse/time")
      .filter(({ type }) => type === "message")
      .subscribe((data) => {
        console.log("Active user data:", data);
      });
  };

  const stopStream = () => {
    if (subscription) {
      subscription.unsubscribe();
      subscription = null;
    }
  };

  // Start/stop based on page visibility
  document.addEventListener("visibilitychange", () => {
    if (isUserActive()) {
      startStream();
    } else {
      stopStream();
    }
  });

  // Initial start if page is visible
  if (isUserActive()) {
    startStream();
  }

  return stopStream;
}

/**
 * Example 8: Rate Limiting / Debouncing
 * Only process events at a certain rate
 */
export function rateLimitExample() {
  let lastProcessedTime = 0;
  const minInterval = 1000; // Only process once per second

  const stream$ = createSSEObservable("/sse/time")
    .filter(({ type }) => type === "message")
    .filter(() => {
      const now = Date.now();
      if (now - lastProcessedTime >= minInterval) {
        lastProcessedTime = now;
        return true;
      }
      return false;
    });

  return stream$.subscribe((data) => {
    console.log("Rate-limited data:", data);
  });
}

/**
 * Example 9: State Management with Observable
 * Maintain state across SSE events
 */
export function stateManagementExample() {
  let messageCount = 0;
  let totalBytes = 0;

  const stream$ = createSSEObservable("/sse/time")
    .filter(({ type }) => type === "message")
    .tap(({ event }) => {
      messageCount++;
      totalBytes += event.data.length;
    })
    .map(({ event }) => ({
      data: event.data,
      stats: {
        messageCount,
        totalBytes,
        avgBytesPerMessage: totalBytes / messageCount,
      },
    }));

  return stream$.subscribe(({ data, stats }) => {
    console.log("Data:", data);
    console.log("Stats:", stats);
  });
}

/**
 * Example 10: Automatic Reconnection
 * Automatically reconnect when connection drops
 */
export function autoReconnectExample(maxRetries = 5) {
  let retryCount = 0;
  let subscription = null;

  const connect = () => {
    subscription = createSSEObservable("/sse/time").subscribe({
      next: (data) => {
        retryCount = 0; // Reset on successful message
        console.log("Data:", data);
      },
      error: (err) => {
        console.error("Connection error:", err);
        if (retryCount < maxRetries) {
          retryCount++;
          const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
          console.log(`Reconnecting in ${delay}ms... (attempt ${retryCount})`);
          setTimeout(connect, delay);
        } else {
          console.error("Max retries reached. Giving up.");
        }
      },
      complete: () => {
        console.log("Stream completed");
      },
    });
  };

  connect();

  return () => {
    if (subscription) {
      subscription.unsubscribe();
    }
  };
}
