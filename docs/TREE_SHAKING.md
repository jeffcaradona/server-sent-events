# SSE Client: Tree-Shakeable vs Monolithic

## Overview

This project now provides **two versions** of the SSE Observable client:

1. **`sse-client.js`** - Monolithic (original)
2. **`sse-client-shakeable.js`** - Tree-shakeable (optimized for bundle size)

## Key Differences

### Monolithic (`sse-client.js`)

```javascript
import { Observable, createSSEObservable } from './sse-client.js';

// Operators are methods on the Observable class
const stream = createSSEObservable('/api/events')
  .map(x => x.value)
  .filter(x => x > 10)
  .tap(x => console.log(x));
```

**Pros:**

- Fluent, chainable API (feels like RxJS)
- All operators available on every Observable
- Simpler mental model for beginners

**Cons:**

- All operators bundled even if unused
- Larger bundle size (~3KB for everything)
- Cannot tree-shake unused operators

---

### Tree-Shakeable (`sse-client-shakeable.js`)

```javascript
import { createSSEObservable, pipe, map, filter } from './sse-client-shakeable.js';
// tap is NOT imported, so it won't be in your bundle

const stream = pipe(
  map(x => x.value),
  filter(x => x > 10)
)(createSSEObservable('/api/events'));
```

**Pros:**

- Import only what you use
- Smaller bundle size (up to 56% savings)
- Modern functional composition pattern
- Better for production builds

**Cons:**

- Slightly more verbose syntax
- Requires understanding of functional composition

---

## Bundle Size Comparison

| What You Use | Monolithic | Tree-Shakeable | Savings |
|-------------|-----------|----------------|---------|
| Observable + all operators | 3.0 KB | 3.0 KB | 0% |
| Observable + map + filter | 3.0 KB | 2.0 KB | **33%** |
| Observable only | 3.0 KB | 1.3 KB | **56%** |

> **Note:** Sizes are estimated minified (not gzipped)

---

## Available Operators

### Both Versions

| Operator | Purpose | Example |
|----------|---------|---------|
| `map` | Transform values | `map(x => x * 2)` |
| `filter` | Filter by predicate | `filter(x => x > 0)` |
| `tap` | Side effects (logging, etc.) | `tap(x => console.log(x))` |

### Tree-Shakeable Only

| Operator | Purpose | Example |
|----------|---------|---------|
| `take` | Emit first N values | `take(5)` |
| `skip` | Skip first N values | `skip(3)` |
| `pipe` | Compose operators | `pipe(map(...), filter(...))` |

---

## Migration Guide

### From Monolithic to Tree-Shakeable

**Before:**

```javascript
import { createSSEObservable, parseSSEData } from './sse-client.js';

const stream = createSSEObservable('/api/events')
  .filter(({ type }) => type === 'message')
  .map(({ event }) => parseSSEData(event))
  .filter(({ status }) => status === 'ok')
  .map(({ payload }) => payload)
  .tap(data => console.log('Received:', data));

const subscription = stream.subscribe({
  next: (data) => updateUI(data),
  error: (err) => console.error(err),
  complete: () => console.log('Done')
});
```

**After:**

```javascript
import { 
  createSSEObservable, 
  pipe, 
  filter, 
  map, 
  tap, 
  parseSSEData 
} from './sse-client-shakeable.js';

const stream = pipe(
  filter(({ type }) => type === 'message'),
  map(({ event }) => parseSSEData(event)),
  filter(({ status }) => status === 'ok'),
  map(({ payload }) => payload),
  tap(data => console.log('Received:', data))
)(createSSEObservable('/api/events'));

const subscription = stream.subscribe({
  next: (data) => updateUI(data),
  error: (err) => console.error(err),
  complete: () => console.log('Done')
});
```

---

## When to Use Which

### Use Monolithic (`sse-client.js`) when

- 🎓 Learning/prototyping
- 📦 Bundle size is not a concern
- 🔄 You prefer method chaining syntax
- 👥 Team is more familiar with OOP patterns

### Use Tree-Shakeable (`sse-client-shakeable.js`) when

- 📦 Bundle size matters (production apps)
- 🌲 Using modern build tools (Webpack 5+, Vite, Rollup)
- 🎯 Only need specific operators
- 🚀 Optimizing for performance
- 💡 Team is comfortable with functional composition

---

## Technical Deep Dive

### How Tree-Shaking Works

Modern bundlers (Webpack, Rollup, Vite) perform **static analysis** of ES6 imports:

```javascript
// Bundler sees: "Only 'map' and 'filter' are imported"
import { map, filter } from './sse-client-shakeable.js';

// Bundler knows: "tap, take, skip are never used"
// Result: They're removed from the final bundle
```

### Why Methods Can't Be Tree-Shaken

```javascript
class Observable {
  map(fn) { /* ... */ }
  filter(fn) { /* ... */ }
  tap(fn) { /* ... */ }  // ← Always bundled, even if never called
}
```

When you instantiate a class, **all methods** must be available. The bundler can't know at build time which methods you'll call at runtime.

### Why Functions Can Be Tree-Shaken

```javascript
export const map = (fn) => (source) => { /* ... */ };
export const filter = (fn) => (source) => { /* ... */ };
export const tap = (fn) => (source) => { /* ... */ };  // ← Removed if not imported
```

Each function is a **separate export**. If you don't import it, the bundler can prove it's unused and eliminate it.

---

## Architecture Decision: Hybrid Approach

Both implementations follow the **same Observable protocol**:

```javascript
interface Observable {
  subscribe(observer: Observer): Subscription
}

interface Observer {
  next: (value) => void
  error: (error) => void
  complete: () => void
}

interface Subscription {
  unsubscribe: () => void
}
```

This means:

- ✅ Operators from both versions work the same way
- ✅ Easy to migrate between versions
- ✅ Can mix and match if needed (not recommended)

---

## Performance Characteristics

| Aspect | Monolithic | Tree-Shakeable |
|--------|-----------|----------------|
| Runtime speed | Same | Same |
| Memory usage | Same | Same |
| Bundle size | Larger | Smaller |
| Parse time | Slower (more code) | Faster (less code) |
| Tree-shaking | ❌ | ✅ |

---

## Best Practices

### 1. Create Reusable Pipelines

```javascript
// Don't repeat yourself
const extractValidPayload = pipe(
  filter(({ type }) => type === 'message'),
  map(({ event }) => parseSSEData(event)),
  filter(({ status }) => status === 'ok'),
  map(({ payload }) => payload)
);

// Reuse across multiple streams
const timeData$ = extractValidPayload(createSSEObservable('/sse/time'));
const eventsData$ = extractValidPayload(createSSEObservable('/sse/events'));
```

### 2. Use Type-Specific Operators

```javascript
// Good: Import only what you need
import { createSSEObservable, pipe, map, filter } from './sse-client-shakeable.js';

// Avoid: Importing everything
import * as SSE from './sse-client-shakeable.js';  // Defeats tree-shaking!
```

### 3. Compose Small, Focused Operators

```javascript
// Good: Small, composable functions
const onlyMessages = filter(({ type }) => type === 'message');
const parseData = map(({ event }) => parseSSEData(event));
const onlyValid = filter(({ status }) => status === 'ok');
const extractPayload = map(({ payload }) => payload);

const stream$ = pipe(
  onlyMessages,
  parseData,
  onlyValid,
  extractPayload
)(createSSEObservable('/api/events'));

// Each piece can be tested and reused independently
```

---

## Future Enhancements

Potential operators to add (all tree-shakeable):

- `debounce(ms)` - Limit emission rate
- `throttle(ms)` - Sample at intervals
- `distinctUntilChanged()` - Skip duplicates
- `switchMap(fn)` - Cancel previous inner observables
- `mergeMap(fn)` - Flatten inner observables
- `catchError(handler)` - Error recovery
- `retry(count)` - Automatic reconnection
- `share()` - Multicast to multiple subscribers

---

## Examples

See [`sse-shakeable-examples.js`](../public/javascripts/sse-shakeable-examples.js) for comprehensive usage examples.

---

## Conclusion

The tree-shakeable version represents **pragmatic functional programming**:

- ✅ Keeps the Observable **class** (clear abstraction)
- ✅ Extracts operators as **functions** (tree-shakeable)
- ✅ Maintains **protocol compatibility** (easy migration)
- ✅ Reduces **bundle size** (production optimization)
- ✅ Preserves **code reuse** (functional composition)

**Recommendation:** Use tree-shakeable version for all new production code. Keep monolithic version for backward compatibility and rapid prototyping.
