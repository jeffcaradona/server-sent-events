/**
 * Generic SSE client with Observable pattern
 * - Handles connection lifecycle
 * - Emits events through Observable streams
 * - Manages cleanup through subscription
 */

/**
 * Simple Observable implementation for SSE events
 */
class Observable {
  constructor(subscriber) {
    this._subscriber = subscriber;
  }

  subscribe(observer) {
    const normalizedObserver =
      typeof observer === "function"
        ? { next: observer, error: () => {}, complete: () => {} }
        : {
            next: observer.next || (() => {}),
            error: observer.error || (() => {}),
            complete: observer.complete || (() => {}),
          };

    const unsubscribe = this._subscriber(normalizedObserver);
    return {
      unsubscribe: typeof unsubscribe === "function" ? unsubscribe : () => {},
    };
  }

  // Operator: map - transform each value
  map(fn) {
    return new Observable((observer) => {
      const subscription = this.subscribe({
        next: (value) => {
          try {
            observer.next(fn(value));
          } catch (error) {
            observer.error(error);
          }
        },
        error: (err) => observer.error(err),
        complete: () => observer.complete(),
      });
      return () => subscription.unsubscribe();
    });
  }

  // Operator: filter - only emit values that pass predicate
  filter(predicate) {
    return new Observable((observer) => {
      const subscription = this.subscribe({
        next: (value) => {
          try {
            if (predicate(value)) {
              observer.next(value);
            }
          } catch (error) {
            observer.error(error);
          }
        },
        error: (err) => observer.error(err),
        complete: () => observer.complete(),
      });
      return () => subscription.unsubscribe();
    });
  }

  // Operator: tap - perform side effects
  tap(fn) {
    return new Observable((observer) => {
      const subscription = this.subscribe({
        next: (value) => {
          try {
            fn(value);
            observer.next(value);
          } catch (error) {
            observer.error(error);
          }
        },
        error: (err) => observer.error(err),
        complete: () => observer.complete(),
      });
      return () => subscription.unsubscribe();
    });
  }
}

/**
 * Creates an Observable that emits SSE events
 * @param {string} url - The SSE endpoint URL
 * @returns {Observable} Observable that emits MessageEvent objects
 */
function createSSEObservable(url) {
  return new Observable((observer) => {
    const eventSource = new EventSource(url);
    let closed = false;

    eventSource.onopen = () => {
      observer.next({ type: "open", event: null });
    };

    eventSource.onmessage = (event) => {
      if (!closed) {
        observer.next({ type: "message", event });
      }
    };

    eventSource.onerror = (error) => {
      if (!closed) {
        observer.error(error);
        eventSource.close();
        closed = true;
      }
    };

    // Return cleanup function
    return () => {
      if (!closed) {
        eventSource.close();
        closed = true;
        observer.complete();
      }
    };
  });
}

/**
 * Legacy adapter: creates an SSE client with event handler (for backward compatibility)
 * @deprecated Use createSSEObservable instead for better composability
 */
function createSSEClient({ url, logger, eventHandler }) {
  const observable = createSSEObservable(url);
  
  const subscription = observable.subscribe({
    next: ({ type, event }) => {
      if (type === "open") {
        logger.log("EventSource initialized and ready!");
      } else if (type === "message") {
        try {
          const effects = eventHandler({ event, logger });
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
      }
    },
    error: (err) => logger.error("Connection error or server offline.", err),
    complete: () => logger.log("Connection closed."),
  });

  return {
    close: () => subscription.unsubscribe(),
    setupCleanup: () => {
      window.addEventListener("beforeunload", () => subscription.unsubscribe());
    },
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
export { Observable, createSSEObservable, createSSEClient, parseSSEData };
