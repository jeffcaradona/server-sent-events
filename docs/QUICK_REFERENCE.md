# Observable Pattern Quick Reference

## Creating an Observable

```javascript
import { createSSEObservable } from './sse-client.js';

const stream$ = createSSEObservable('/sse/endpoint');
```

## Basic Subscription

```javascript
const subscription = stream$.subscribe({
  next: (value) => console.log('Value:', value),
  error: (err) => console.error('Error:', err),
  complete: () => console.log('Complete')
});

// Cleanup
subscription.unsubscribe();
```

## Simple Function Subscription

```javascript
const subscription = stream$.subscribe(
  (value) => console.log(value)
);
```

## Operators Cheat Sheet

### filter(predicate)
Only emit values that pass the test.

```javascript
stream$
  .filter(x => x.type === 'message')
  .subscribe(console.log);
```

### map(fn)
Transform each value.

```javascript
stream$
  .map(x => x * 2)
  .subscribe(console.log);
```

### tap(fn)
Perform side effects without changing the value.

```javascript
stream$
  .tap(x => console.log('Debug:', x))
  .map(x => x * 2)
  .subscribe(console.log);
```

## Common Patterns

### SSE Message Processing

```javascript
createSSEObservable('/sse/time')
  .filter(({ type }) => type === 'message')
  .map(({ event }) => parseSSEData(event))
  .filter(({ status }) => status === 'ok')
  .map(({ payload }) => payload)
  .subscribe({
    next: (data) => updateUI(data),
    error: (err) => handleError(err)
  });
```

### Multiple Subscribers

```javascript
const data$ = createSSEObservable('/sse/data')
  .filter(({ type }) => type === 'message')
  .map(({ event }) => event.data);

// UI
data$.subscribe(updateUI);

// Analytics  
data$.subscribe(trackEvent);

// Logger
data$.subscribe(console.log);
```

### Cleanup on Page Unload

```javascript
const subscription = stream$.subscribe(handler);

window.addEventListener('beforeunload', () => {
  subscription.unsubscribe();
});
```

### Conditional Processing

```javascript
stream$
  .filter(({ type }) => type === 'message')
  .map(({ event }) => JSON.parse(event.data))
  .filter(data => data.priority === 'high')
  .subscribe(processHighPriority);
```

### Error Recovery

```javascript
stream$
  .map(event => {
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

### Rate Limiting

```javascript
let lastTime = 0;
const minInterval = 1000;

stream$
  .filter(() => {
    const now = Date.now();
    if (now - lastTime >= minInterval) {
      lastTime = now;
      return true;
    }
    return false;
  })
  .subscribe(console.log);
```

### State Accumulation

```javascript
let count = 0;

stream$
  .tap(() => count++)
  .map(data => ({ data, count }))
  .subscribe(console.log);
```

## Observable Constructor

```javascript
import { Observable } from './sse-client.js';

const custom$ = new Observable((observer) => {
  // Emit values
  observer.next(1);
  observer.next(2);
  observer.next(3);
  
  // Complete
  observer.complete();
  
  // Or error
  // observer.error(new Error('Something failed'));
  
  // Return cleanup function
  return () => {
    console.log('Cleanup');
  };
});
```

## Observer Interface

```javascript
const observer = {
  next: (value) => {
    // Handle each emitted value
  },
  error: (err) => {
    // Handle errors
  },
  complete: () => {
    // Handle completion
  }
};

stream$.subscribe(observer);
```

## Lifecycle

```
1. Create Observable
   ↓
2. Subscribe (connection opens)
   ↓
3. Emit values via next()
   ↓
4. Error or Complete (optional)
   ↓
5. Unsubscribe (cleanup runs)
```

## Tips

✅ **DO:**
- Chain operators for cleaner code
- Unsubscribe to prevent memory leaks
- Use `tap()` for logging/debugging
- Filter early in the chain for efficiency
- Handle errors gracefully

❌ **DON'T:**
- Forget to unsubscribe
- Mutate values inside operators
- Subscribe multiple times unnecessarily
- Mix side effects with transformations (use `tap()`)

## Common Use Cases

| Use Case | Pattern |
|----------|---------|
| Filter messages | `.filter(({ type }) => type === 'message')` |
| Parse JSON | `.map(({ event }) => JSON.parse(event.data))` |
| Extract field | `.map(data => data.fieldName)` |
| Log for debug | `.tap(x => console.log('Debug:', x))` |
| Remove nulls | `.filter(x => x !== null)` |
| Transform data | `.map(x => ({ ...x, newField: value }))` |
| Side effects | `.tap(x => analytics.track(x))` |

## Error Handling

```javascript
stream$
  .map(risky)
  .subscribe({
    next: (value) => console.log(value),
    error: (err) => {
      console.error('Stream error:', err);
      // Optional: trigger reconnection
    }
  });
```

## Testing

```javascript
const values = [];

const test$ = new Observable(observer => {
  observer.next(1);
  observer.next(2);
  observer.complete();
});

test$.subscribe(v => values.push(v));

assert.deepEqual(values, [1, 2]);
```

## Performance

- Operators are lazy (only run when subscribed)
- Each subscriber creates a new execution
- Unsubscribe immediately when done
- Filter early to reduce processing

## Resources

- Examples: `/public/javascripts/sse-observable-examples.js`
- Docs: `/docs/OBSERVABLE_PATTERN.md`
- Tests: `/test/observable.test.js`
