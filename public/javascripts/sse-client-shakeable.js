/**
 * Tree-shakeable SSE client with Observable pattern
 * - Minimal Observable class for subscription management
 * - Standalone operator functions (import only what you need)
 * - Handles connection lifecycle
 * - Emits events through Observable streams
 */

/**
 * Lightweight Observable implementation for SSE events
 * This class only handles subscription - all operators are standalone functions
 */
export class Observable {
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
}

/**
 * Operator: map - transform each value
 * @param {function} fn - Transformation function
 * @returns {function(Observable): Observable}
 * 
 * @example
 * import { createSSEObservable, map } from './sse-client-shakeable.js';
 * const stream$ = map(data => data.toUpperCase())(createSSEObservable('/api/events'));
 */
export const map = (fn) => (source) => {
  return new Observable((observer) => {
    const subscription = source.subscribe({
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
};

/**
 * Operator: filter - only emit values that pass predicate
 * @param {function} predicate - Test function
 * @returns {function(Observable): Observable}
 * 
 * @example
 * import { createSSEObservable, filter } from './sse-client-shakeable.js';
 * const stream$ = filter(x => x.value > 10)(createSSEObservable('/api/events'));
 */
export const filter = (predicate) => (source) => {
  return new Observable((observer) => {
    const subscription = source.subscribe({
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
};

/**
 * Operator: tap - perform side effects without modifying the stream
 * @param {function} fn - Side effect function
 * @returns {function(Observable): Observable}
 * 
 * @example
 * import { createSSEObservable, tap } from './sse-client-shakeable.js';
 * const stream$ = tap(x => console.log(x))(createSSEObservable('/api/events'));
 */
export const tap = (fn) => (source) => {
  return new Observable((observer) => {
    const subscription = source.subscribe({
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
};

/**
 * Operator: take - emit only the first n values
 * @param {number} count - Number of values to take
 * @returns {function(Observable): Observable}
 * 
 * @example
 * import { createSSEObservable, take } from './sse-client-shakeable.js';
 * const stream$ = take(5)(createSSEObservable('/api/events'));
 */
export const take = (count) => (source) => {
  return new Observable((observer) => {
    let taken = 0;
    const subscription = source.subscribe({
      next: (value) => {
        if (taken < count) {
          taken++;
          observer.next(value);
          if (taken >= count) {
            observer.complete();
            subscription.unsubscribe();
          }
        }
      },
      error: (err) => observer.error(err),
      complete: () => observer.complete(),
    });
    return () => subscription.unsubscribe();
  });
};

/**
 * Operator: skip - skip the first n values
 * @param {number} count - Number of values to skip
 * @returns {function(Observable): Observable}
 * 
 * @example
 * import { createSSEObservable, skip } from './sse-client-shakeable.js';
 * const stream$ = skip(3)(createSSEObservable('/api/events'));
 */
export const skip = (count) => (source) => {
  return new Observable((observer) => {
    let skipped = 0;
    const subscription = source.subscribe({
      next: (value) => {
        if (skipped < count) {
          skipped++;
        } else {
          observer.next(value);
        }
      },
      error: (err) => observer.error(err),
      complete: () => observer.complete(),
    });
    return () => subscription.unsubscribe();
  });
};

/**
 * Utility: pipe - compose operators left-to-right
 * @param {...function} operators - Operator functions to compose
 * @returns {function(Observable): Observable}
 * 
 * @example
 * import { createSSEObservable, pipe, map, filter } from './sse-client-shakeable.js';
 * const stream$ = pipe(
 *   filter(x => x.type === 'message'),
 *   map(x => x.event.data)
 * )(createSSEObservable('/api/events'));
 */
export const pipe = (...operators) => (source) => {
  return operators.reduce((acc, operator) => operator(acc), source);
};

/**
 * Creates an Observable that emits SSE events
 * @param {string} url - The SSE endpoint URL
 * @returns {Observable} Observable that emits MessageEvent objects
 * 
 * @example
 * import { createSSEObservable } from './sse-client-shakeable.js';
 * const events$ = createSSEObservable('/api/time');
 * const subscription = events$.subscribe({
 *   next: ({ type, event }) => console.log(type, event),
 *   error: (err) => console.error(err),
 *   complete: () => console.log('Done')
 * });
 */
export function createSSEObservable(url) {
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
 * @deprecated Use createSSEObservable with pipe() instead for better composability
 * 
 * @example
 * // Old way (still works):
 * const client = createSSEClient({ url, logger, eventHandler });
 * 
 * // New way (recommended):
 * import { createSSEObservable, pipe, filter, map } from './sse-client-shakeable.js';
 * const stream$ = pipe(
 *   filter(({ type }) => type === 'message'),
 *   map(({ event }) => parseSSEData(event))
 * )(createSSEObservable(url));
 */
export function createSSEClient({ url, logger, eventHandler }) {
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
 * 
 * @example
 * import { createSSEObservable, pipe, filter, map } from './sse-client-shakeable.js';
 * const data$ = pipe(
 *   filter(({ type }) => type === 'message'),
 *   map(({ event }) => parseSSEData(event)),
 *   filter(({ status }) => status === 'ok'),
 *   map(({ payload }) => payload)
 * )(createSSEObservable('/api/events'));
 */
export function parseSSEData(event) {
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
