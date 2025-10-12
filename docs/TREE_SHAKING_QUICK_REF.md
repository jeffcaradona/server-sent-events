# Tree-Shakeable SSE Client - Quick Reference

## Import Patterns

### Minimal Import (Recommended)

```javascript
import { createSSEObservable, pipe, map, filter } from './sse-client-shakeable.js';
```

**Bundle Size:** ~1.8KB (vs 3KB monolithic)

### All Operators

```javascript
import { 
  Observable,
  createSSEObservable, 
  pipe, 
  map, 
  filter, 
  tap, 
  take, 
  skip,
  parseSSEData 
} from './sse-client-shakeable.js';
```

**Bundle Size:** ~3KB (same as monolithic)

## Basic Usage

```javascript
// Create a stream
const stream$ = createSSEObservable('/api/events');

// Subscribe
const subscription = stream$.subscribe({
  next: (data) => console.log(data),
  error: (err) => console.error(err),
  complete: () => console.log('Done')
});

// Cleanup
subscription.unsubscribe();
```

## With Operators (Using pipe)

```javascript
const data$ = pipe(
  filter(({ type }) => type === 'message'),
  map(({ event }) => parseSSEData(event)),
  filter(({ status }) => status === 'ok'),
  map(({ payload }) => payload)
)(createSSEObservable('/api/events'));

const subscription = data$.subscribe({
  next: (payload) => updateUI(payload)
});
```

## Available Operators

| Operator | Purpose | Signature |
|----------|---------|-----------|
| `map` | Transform values | `(fn: T => U) => Observable<T> => Observable<U>` |
| `filter` | Filter by predicate | `(fn: T => boolean) => Observable<T> => Observable<T>` |
| `tap` | Side effects | `(fn: T => void) => Observable<T> => Observable<T>` |
| `take` | Limit emissions | `(count: number) => Observable<T> => Observable<T>` |
| `skip` | Skip first N | `(count: number) => Observable<T> => Observable<T>` |
| `pipe` | Compose operators | `(...ops) => Observable => Observable` |

## Reusable Pipelines

```javascript
// Define once
const extractValidPayload = pipe(
  filter(({ type }) => type === 'message'),
  map(({ event }) => parseSSEData(event)),
  filter(({ status }) => status === 'ok'),
  map(({ payload }) => payload)
);

// Reuse everywhere
const timeData$ = extractValidPayload(createSSEObservable('/sse/time'));
const eventsData$ = extractValidPayload(createSSEObservable('/sse/events'));
```

## Migration Cheat Sheet

| Monolithic (Old) | Tree-Shakeable (New) |
|-----------------|---------------------|
| `stream.map(fn)` | `pipe(map(fn))(stream)` |
| `stream.filter(pred)` | `pipe(filter(pred))(stream)` |
| `stream.tap(fn)` | `pipe(tap(fn))(stream)` |
| `stream.map(f1).filter(f2)` | `pipe(map(f1), filter(f2))(stream)` |

## Common Patterns

### 1. Basic SSE Data Stream

```javascript
import { createSSEObservable, pipe, filter, map, parseSSEData } 
  from './sse-client-shakeable.js';

const data$ = pipe(
  filter(({ type }) => type === 'message'),
  map(({ event }) => parseSSEData(event))
)(createSSEObservable('/api/stream'));
```

### 2. With Error Handling

```javascript
const subscription = data$.subscribe({
  next: (data) => {
    if (data.status === 'ok') {
      updateUI(data.payload);
    } else {
      console.error('Invalid data:', data.error);
    }
  },
  error: (err) => {
    console.error('Connection error:', err);
    // Attempt reconnection
  },
  complete: () => console.log('Stream closed')
});
```

### 3. Limited Duration

```javascript
import { createSSEObservable, pipe, take, map } 
  from './sse-client-shakeable.js';

// Only take first 10 messages
const limited$ = pipe(
  take(10),
  map(data => data.payload)
)(createSSEObservable('/api/stream'));
```

### 4. Skip Initial Messages

```javascript
import { createSSEObservable, pipe, skip } 
  from './sse-client-shakeable.js';

// Skip first 3 messages (maybe they're headers)
const skipped$ = pipe(
  skip(3)
)(createSSEObservable('/api/stream'));
```

### 5. Debugging Stream

```javascript
import { createSSEObservable, pipe, tap, map } 
  from './sse-client-shakeable.js';

const debugged$ = pipe(
  tap(x => console.log('Raw:', x)),
  map(transform),
  tap(x => console.log('Transformed:', x))
)(createSSEObservable('/api/stream'));
```

## Performance Tips

### ✅ DO

```javascript
// Import only what you need
import { createSSEObservable, pipe, map } from './sse-client-shakeable.js';

// Reuse pipelines
const transform = pipe(map(fn1), map(fn2));
const stream1$ = transform(createSSEObservable('/api/1'));
const stream2$ = transform(createSSEObservable('/api/2'));
```

### ❌ DON'T

```javascript
// Don't import everything
import * as SSE from './sse-client-shakeable.js'; // Defeats tree-shaking!

// Don't repeat yourself
createSSEObservable('/api/1').map(fn1).map(fn2); // Wrong API!
```

## Testing

```javascript
import { Observable, map, filter } from './sse-client-shakeable.js';

describe('map operator', () => {
  it('transforms values', (done) => {
    const source = new Observable(observer => {
      observer.next(5);
      observer.complete();
    });
    
    const doubled = map(x => x * 2)(source);
    
    doubled.subscribe({
      next: (val) => expect(val).toBe(10),
      complete: done
    });
  });
});
```

## Bundle Size Breakdown

```
Observable class:          800 bytes
createSSEObservable:       500 bytes
pipe:                      200 bytes
parseSSEData:              300 bytes
-----------------------------------
Core Total:              1,800 bytes

Each operator:         300-400 bytes
```

**Example Bundles:**

- Core only: **1.8 KB**
- Core + map + filter: **2.5 KB**
- Core + all operators: **3.0 KB**

## Browser Compatibility

- Modern ES6+ browsers
- Supports: Chrome 51+, Firefox 54+, Safari 10+, Edge 15+
- Requires: `EventSource` API support
- Build tool: Any bundler with tree-shaking (Webpack 5+, Rollup, Vite, esbuild)

## Files

| File | Purpose |
|------|---------|
| `sse-client-shakeable.js` | Main implementation |
| `sse-shakeable-examples.js` | Usage examples |
| `tree-shaking-demo.html` | Live interactive demo |
| `docs/TREE_SHAKING.md` | Full documentation |
| `docs/TREE_SHAKING_SUMMARY.md` | Implementation summary |
