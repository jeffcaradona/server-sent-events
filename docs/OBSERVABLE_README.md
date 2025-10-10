# Observable Pattern for SSE - Complete Guide

## 📚 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [API Documentation](#api-documentation)
- [Examples](#examples)
- [Migration Guide](#migration-guide)
- [Testing](#testing)
- [Advanced Patterns](#advanced-patterns)
- [Troubleshooting](#troubleshooting)

## Overview

This implementation provides a lightweight, vanilla JavaScript Observable pattern specifically designed for Server-Sent Events (SSE). It offers:

- ✅ **Zero dependencies** - Pure vanilla JavaScript
- 🎯 **Functional & composable** - Chain operators for clean code
- 🔄 **Reactive** - Respond to data streams declaratively
- 🧹 **Automatic cleanup** - No memory leaks
- 📦 **Tiny bundle size** - ~3KB total
- 🧪 **Fully tested** - Comprehensive test suite
- 🔙 **Backward compatible** - Old API still works

## Quick Start

### Basic Usage

```javascript
import { createSSEObservable } from './sse-client.js';

// Create an observable from SSE endpoint
const timeStream$ = createSSEObservable('/sse/time');

// Subscribe to receive messages
const subscription = timeStream$
  .filter(({ type }) => type === 'message')
  .map(({ event }) => JSON.parse(event.data))
  .subscribe({
    next: (data) => console.log('Received:', data),
    error: (err) => console.error('Error:', err),
    complete: () => console.log('Stream closed')
  });

// Cleanup when done
subscription.unsubscribe();
```

### Full Example (from time.js)

```javascript
import { createSSEObservable, parseSSEData } from './sse-client.js';

document.addEventListener('DOMContentLoaded', () => {
  const subscription = createSSEObservable('/sse/time')
    // Filter for message events only
    .filter(({ type }) => type === 'message')
    
    // Extract the event
    .map(({ event }) => event)
    
    // Parse JSON data
    .map((event) => parseSSEData(event))
    
    // Log errors but continue
    .tap(({ parsed }) => {
      if (parsed.status !== 'ok' && parsed.error) {
        console.error('Parse error:', parsed.error);
      }
    })
    
    // Filter valid messages
    .filter(({ parsed }) => parsed.status === 'ok')
    
    // Extract payload
    .map(({ parsed }) => parsed.payload)
    
    // Process the data
    .subscribe({
      next: (payload) => {
        if (payload.type === 'shutdown') {
          console.log('Server shutting down');
          subscription.unsubscribe();
        } else {
          console.log(`Server UTC: ${payload.utc}`);
        }
      },
      error: (err) => console.error('Connection error:', err)
    });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    subscription.unsubscribe();
  });
});
```

## Core Concepts

### Observable

An **Observable** represents a stream of data over time. Think of it as a "lazy collection" that only executes when someone subscribes.

```javascript
const numbers$ = new Observable((observer) => {
  observer.next(1);
  observer.next(2);
  observer.next(3);
  observer.complete();
});
```

### Observer

An **Observer** consumes the data from an Observable through three callbacks:

```javascript
const observer = {
  next: (value) => {}, // Handle each value
  error: (err) => {},  // Handle errors
  complete: () => {}   // Handle completion
};
```

### Subscription

A **Subscription** represents the connection between Observable and Observer:

```javascript
const subscription = observable.subscribe(observer);

// Later, cleanup:
subscription.unsubscribe();
```

### Operators

**Operators** transform, filter, or combine Observables:

```javascript
stream$
  .filter(x => x > 0)  // Only positive numbers
  .map(x => x * 2)     // Double them
  .tap(x => console.log(x)) // Log for debugging
```

## API Documentation

### `createSSEObservable(url)`

Creates an Observable from an SSE endpoint.

**Parameters:**
- `url` (string): SSE endpoint URL

**Returns:** Observable<{type: string, event: MessageEvent}>

**Example:**
```javascript
const stream$ = createSSEObservable('/sse/time');
```

### `Observable` Class

#### Constructor

```javascript
new Observable((observer) => {
  // Emit values
  observer.next(value);
  
  // Signal error
  observer.error(error);
  
  // Signal completion
  observer.complete();
  
  // Return cleanup function
  return () => {
    // Cleanup logic
  };
});
```

#### Methods

##### `subscribe(observer)`

Subscribe to the Observable.

```javascript
// Full observer
stream$.subscribe({
  next: (value) => console.log(value),
  error: (err) => console.error(err),
  complete: () => console.log('Done')
});

// Or just a function
stream$.subscribe((value) => console.log(value));
```

##### `map(fn)`

Transform each emitted value.

```javascript
numbers$.map(x => x * 2)
```

##### `filter(predicate)`

Only emit values that pass the test.

```javascript
numbers$.filter(x => x % 2 === 0)
```

##### `tap(fn)`

Perform side effects without modifying values.

```javascript
stream$.tap(x => console.log('Debug:', x))
```

### `parseSSEData(event)`

Parse JSON data from SSE event.

**Parameters:**
- `event` (MessageEvent): SSE message event

**Returns:**
```javascript
{ 
  status: 'ok' | 'invalid',
  payload: Object | null,
  error?: Error
}
```

## Examples

### 1. Simple Message Logger

```javascript
createSSEObservable('/sse/events')
  .filter(({ type }) => type === 'message')
  .subscribe(({ event }) => {
    console.log('Message:', event.data);
  });
```

### 2. JSON Data Stream

```javascript
createSSEObservable('/sse/data')
  .filter(({ type }) => type === 'message')
  .map(({ event }) => JSON.parse(event.data))
  .subscribe((data) => {
    updateUI(data);
  });
```

### 3. Error-Resilient Parsing

```javascript
createSSEObservable('/sse/data')
  .filter(({ type }) => type === 'message')
  .map(({ event }) => {
    try {
      return { ok: true, data: JSON.parse(event.data) };
    } catch (e) {
      return { ok: false, error: e };
    }
  })
  .filter(result => result.ok)
  .map(result => result.data)
  .subscribe(console.log);
```

### 4. Multiple Subscribers

```javascript
const data$ = createSSEObservable('/sse/data')
  .filter(({ type }) => type === 'message')
  .map(({ event }) => event.data);

// UI updates
data$.subscribe(updateDashboard);

// Analytics tracking
data$.subscribe(trackEvent);

// Console logging
data$.subscribe(console.log);
```

### 5. Filtered Stream

```javascript
createSSEObservable('/sse/events')
  .filter(({ type }) => type === 'message')
  .map(({ event }) => JSON.parse(event.data))
  .filter(data => data.priority === 'high')
  .subscribe(handleHighPriority);
```

### 6. State Management

```javascript
let messageCount = 0;

createSSEObservable('/sse/data')
  .filter(({ type }) => type === 'message')
  .tap(() => messageCount++)
  .map(({ event }) => ({
    data: event.data,
    count: messageCount
  }))
  .subscribe(({ data, count }) => {
    console.log(`Message #${count}: ${data}`);
  });
```

### 7. Rate Limiting

```javascript
let lastProcessed = 0;
const throttleMs = 1000;

createSSEObservable('/sse/data')
  .filter(() => {
    const now = Date.now();
    if (now - lastProcessed >= throttleMs) {
      lastProcessed = now;
      return true;
    }
    return false;
  })
  .subscribe(console.log);
```

## Migration Guide

### From Effect-Based to Observable

**Before:**
```javascript
function getTimeEventEffects({ event, logger }) {
  const { status, payload } = parseSSEData(event);
  
  if (status !== "ok") {
    return [() => logger.error("Invalid data")];
  }
  
  return [() => logger.log(payload.utc)];
}

const client = createSSEClient({
  url: "/sse/time",
  logger: console,
  eventHandler: getTimeEventEffects
});
```

**After:**
```javascript
const subscription = createSSEObservable("/sse/time")
  .filter(({ type }) => type === "message")
  .map(({ event }) => parseSSEData(event))
  .filter(({ status }) => status === "ok")
  .map(({ payload }) => payload)
  .subscribe({
    next: (payload) => console.log(payload.utc),
    error: (err) => console.error("Invalid data", err)
  });
```

### Backward Compatibility

The old API still works! No need to migrate immediately:

```javascript
// Still supported
const client = createSSEClient({
  url: "/sse/time",
  logger: console,
  eventHandler: getTimeEventEffects
});
```

## Testing

### Run Tests

```bash
node test/observable.test.js
```

### Write Tests

```javascript
import { Observable } from './sse-client.js';
import assert from 'assert';

// Test observable behavior
const values = [];
const test$ = new Observable(observer => {
  observer.next(1);
  observer.next(2);
  observer.complete();
});

test$.subscribe(v => values.push(v));

assert.deepEqual(values, [1, 2]);
```

## Advanced Patterns

### Custom Operators

```javascript
function debounce(ms) {
  return (observable) => {
    return new Observable((observer) => {
      let timeout;
      return observable.subscribe({
        next: (value) => {
          clearTimeout(timeout);
          timeout = setTimeout(() => observer.next(value), ms);
        },
        error: (e) => observer.error(e),
        complete: () => observer.complete()
      });
    });
  };
}

// Use it
stream$.pipe(debounce(300)).subscribe(console.log);
```

### Conditional Subscription

```javascript
let subscription = null;

function startStream() {
  if (!subscription) {
    subscription = createSSEObservable('/sse/data')
      .subscribe(handleData);
  }
}

function stopStream() {
  if (subscription) {
    subscription.unsubscribe();
    subscription = null;
  }
}

// Subscribe only when page is visible
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopStream();
  } else {
    startStream();
  }
});
```

### Auto-Reconnect

```javascript
function createReconnectingSSE(url, maxRetries = 5) {
  let retries = 0;
  
  const connect = () => {
    createSSEObservable(url).subscribe({
      next: (data) => {
        retries = 0; // Reset on success
        handleData(data);
      },
      error: (err) => {
        if (retries < maxRetries) {
          retries++;
          const delay = Math.pow(2, retries) * 1000;
          console.log(`Reconnecting in ${delay}ms...`);
          setTimeout(connect, delay);
        }
      }
    });
  };
  
  connect();
}
```

## Troubleshooting

### Observable not receiving data

✅ **Check:** Did you subscribe?
```javascript
// Won't work - no subscription
const stream$ = createSSEObservable('/sse/data')
  .filter(x => x);

// Will work - subscribed
const stream$ = createSSEObservable('/sse/data')
  .filter(x => x)
  .subscribe(console.log); // ✓
```

### Memory leaks

✅ **Check:** Are you unsubscribing?
```javascript
const subscription = stream$.subscribe(handler);

// Always cleanup
window.addEventListener('beforeunload', () => {
  subscription.unsubscribe();
});
```

### Data not transforming

✅ **Check:** Operator chain order
```javascript
// Wrong - filtering after map might fail
stream$
  .map(x => JSON.parse(x))
  .filter(x => x.type === 'message') // Might throw

// Right - filter first
stream$
  .filter(x => x.type === 'message')
  .map(x => JSON.parse(x))
```

### Errors not being caught

✅ **Check:** Error handler in subscribe
```javascript
stream$.subscribe({
  next: (value) => console.log(value),
  error: (err) => console.error(err) // ✓ Handle errors
});
```

## Performance Tips

1. **Filter early** - Reduce unnecessary processing
2. **Unsubscribe promptly** - Prevent memory leaks
3. **Reuse streams** - Share observables across subscribers
4. **Avoid heavy operations in map** - Keep transforms light

## Resources

📁 **Files:**
- `/public/javascripts/sse-client.js` - Core implementation
- `/public/javascripts/time.js` - Working example
- `/public/javascripts/sse-observable-examples.js` - 10+ examples
- `/test/observable.test.js` - Test suite

📖 **Documentation:**
- `/docs/OBSERVABLE_PATTERN.md` - Comprehensive guide
- `/docs/OBSERVABLE_REFACTOR.md` - Refactor summary
- `/docs/QUICK_REFERENCE.md` - Quick reference card
- `/docs/observable-architecture.mmd` - Architecture diagrams

## Next Steps

1. ✅ Read the [Quick Reference](QUICK_REFERENCE.md)
2. 🎯 Try the [examples](../public/javascripts/sse-observable-examples.js)
3. 🧪 Run the [tests](../test/observable.test.js)
4. 🚀 Start migrating your code!

## Questions?

The Observable pattern provides a modern, functional approach to handling SSE streams. It's composable, testable, and follows reactive programming principles while remaining lightweight and framework-free.

Happy streaming! 🎉
