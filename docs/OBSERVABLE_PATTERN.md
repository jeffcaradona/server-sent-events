# SSE Observable Pattern Implementation

## Overview

This document explains the Observable pattern implementation for Server-Sent Events (SSE) in vanilla JavaScript. The Observable pattern provides a functional, reactive approach to handling asynchronous event streams.

## What is the Observable Pattern?

The Observable pattern is a design pattern where an object (the Observable) maintains a list of dependents (Observers) and notifies them of state changes. It's particularly useful for handling streams of asynchronous events.

### Key Concepts

1. **Observable**: Represents a stream of data/events over time
2. **Observer**: Consumes the data from the Observable
3. **Subscription**: The connection between Observable and Observer
4. **Operators**: Functions that transform, filter, or combine Observables

## Architecture

```
┌─────────────────┐
│  EventSource    │
│  (SSE Stream)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Observable    │◄─── Wraps EventSource
│                 │
│  - onopen       │
│  - onmessage    │
│  - onerror      │
└────────┬────────┘
         │
         │ Operators (map, filter, tap)
         │
         ▼
┌─────────────────┐
│   Observer      │
│                 │
│  - next()       │
│  - error()      │
│  - complete()   │
└─────────────────┘
```

## API Reference

### `Observable` Class

The core Observable implementation.

#### Constructor
```javascript
new Observable((observer) => {
  // Setup logic
  observer.next(value);
  observer.error(error);
  observer.complete();
  
  // Return cleanup function
  return () => {
    // Cleanup logic
  };
});
```

#### Methods

##### `subscribe(observer)`
Subscribe to the Observable to start receiving values.

```javascript
const subscription = observable.subscribe({
  next: (value) => console.log(value),
  error: (err) => console.error(err),
  complete: () => console.log('Done')
});

// Or with just a function
const subscription = observable.subscribe(
  (value) => console.log(value)
);
```

Returns a subscription object with an `unsubscribe()` method.

##### `map(fn)`
Transform each value emitted by the Observable.

```javascript
const doubled$ = numbers$.map(x => x * 2);
```

##### `filter(predicate)`
Only emit values that satisfy the predicate.

```javascript
const evens$ = numbers$.filter(x => x % 2 === 0);
```

##### `tap(fn)`
Perform side effects without modifying the stream.

```javascript
const logged$ = stream$.tap(x => console.log('Value:', x));
```

### `createSSEObservable(url)`

Creates an Observable from an SSE endpoint.

**Parameters:**
- `url` (string): The SSE endpoint URL

**Returns:** Observable that emits objects with:
- `type`: Either `"open"` or `"message"`
- `event`: The MessageEvent object (for message type)

**Example:**
```javascript
const stream$ = createSSEObservable('/sse/time');

const subscription = stream$.subscribe({
  next: ({ type, event }) => {
    if (type === 'open') {
      console.log('Connected!');
    } else if (type === 'message') {
      console.log('Message:', event.data);
    }
  },
  error: (err) => console.error(err),
  complete: () => console.log('Closed')
});
```

### `parseSSEData(event)`

Utility function to parse JSON data from SSE events.

**Parameters:**
- `event` (MessageEvent): The SSE event object

**Returns:** Object with:
- `status`: `"ok"` or `"invalid"`
- `payload`: Parsed data (if successful) or `null`
- `error`: Error object (if parsing failed)

## Usage Patterns

### Basic Pattern

```javascript
import { createSSEObservable } from './sse-client.js';

const subscription = createSSEObservable('/sse/endpoint')
  .subscribe(({ type, event }) => {
    console.log(type, event);
  });

// Cleanup
subscription.unsubscribe();
```

### Pipeline Pattern (Recommended)

```javascript
const subscription = createSSEObservable('/sse/time')
  .filter(({ type }) => type === 'message')
  .map(({ event }) => parseSSEData(event))
  .filter(({ status }) => status === 'ok')
  .map(({ payload }) => payload)
  .subscribe((data) => {
    console.log('Processed data:', data);
  });
```

### Multiple Subscribers Pattern

```javascript
const stream$ = createSSEObservable('/sse/data')
  .filter(({ type }) => type === 'message')
  .map(({ event }) => event.data);

// UI subscriber
const uiSub = stream$.subscribe(updateUI);

// Analytics subscriber
const analyticsSub = stream$.subscribe(trackEvent);

// Logger subscriber
const logSub = stream$.subscribe(console.log);
```

## Advantages Over Callback Pattern

### Before (Callback-based)
```javascript
function createSSEClient({ url, logger, eventHandler }) {
  const evtSource = new EventSource(url);
  
  evtSource.onmessage = (event) => {
    const effects = eventHandler({ event, logger });
    effects.forEach(effect => effect());
  };
  
  // Tightly coupled to eventHandler
  // Hard to compose
  // No standard error handling
}
```

### After (Observable-based)
```javascript
const stream$ = createSSEObservable('/sse/time')
  .filter(({ type }) => type === 'message')
  .map(({ event }) => parseSSEData(event))
  .filter(({ status }) => status === 'ok')
  .subscribe({
    next: (data) => processData(data),
    error: (err) => handleError(err),
    complete: () => cleanup()
  });

// Composable
// Chainable operators
// Standard observer interface
// Better error handling
```

## Benefits

1. **Composability**: Chain operators to build complex data pipelines
2. **Reusability**: Create reusable operators for common tasks
3. **Declarative**: Code reads like a description of transformations
4. **Testability**: Easy to test individual operators
5. **Multiple Subscribers**: Multiple consumers can subscribe to the same stream
6. **Lazy Evaluation**: Stream doesn't start until you subscribe
7. **Automatic Cleanup**: Unsubscribe handles all cleanup automatically
8. **Error Handling**: Standardized error handling through observer interface

## Migration Guide

### From Effect-based to Observable-based

**Old code (time.js):**
```javascript
function getTimeEventEffects({ event, logger }) {
  const { status, payload, error } = parseSSEData(event);
  
  if (status !== "ok") {
    return [
      () => logger.error("Invalid event data received."),
    ];
  }
  
  // Returns array of effect functions
  return [
    () => logger.log(`Server UTC: ${payload.utc}`)
  ];
}

const client = createSSEClient({
  url: "/sse/time",
  logger: console,
  eventHandler: getTimeEventEffects, 
});
```

**New code (Observable):**
```javascript
const subscription = createSSEObservable("/sse/time")
  .filter(({ type }) => type === "message")
  .map(({ event }) => event)
  .map((event) => parseSSEData(event))
  .filter(({ status }) => status === "ok")
  .map(({ payload }) => payload)
  .subscribe({
    next: (payload) => {
      console.log(`Server UTC: ${payload.utc}`);
    },
    error: (err) => {
      console.error("Connection error:", err);
    }
  });
```

## Advanced Patterns

See `sse-observable-examples.js` for comprehensive examples including:
- Rate limiting
- Auto-reconnection
- State management
- Conditional subscriptions
- Custom operators
- Error recovery

## Comparison with RxJS

This implementation provides a lightweight alternative to RxJS:

| Feature | This Implementation | RxJS |
|---------|-------------------|------|
| Size | ~3KB | ~15KB (min) |
| Operators | 3 basic | 100+ |
| Learning Curve | Low | High |
| Use Case | SSE-specific | General purpose |
| Dependencies | Zero | Zero |

If you need more advanced operators (debounce, throttle, merge, etc.), consider using RxJS instead.

## Further Reading

- [ReactiveX Introduction](http://reactivex.io/intro.html)
- [The Observer Pattern](https://refactoring.guru/design-patterns/observer)
- [Functional Reactive Programming](https://en.wikipedia.org/wiki/Functional_reactive_programming)
