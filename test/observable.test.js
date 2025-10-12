/**
 * Tests for Observable SSE Client
 * 
 * Simple test examples demonstrating how to test the Observable pattern
 * Run with: node --test test/observable.test.js
 * Or integrate with your existing test framework
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// Mock Observable for testing
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

describe('Observable', () => {
  it('should emit values to subscriber', () => {
    const values = [];
    const observable = new Observable((observer) => {
      observer.next(1);
      observer.next(2);
      observer.next(3);
      observer.complete();
    });

    observable.subscribe({
      next: (value) => values.push(value),
    });

    assert.deepStrictEqual(values, [1, 2, 3]);
  });

  it('should handle errors', () => {
    let errorReceived = null;
    const observable = new Observable((observer) => {
      observer.next(1);
      observer.error(new Error('Test error'));
    });

    observable.subscribe({
      error: (err) => {
        errorReceived = err;
      },
    });

    assert.ok(errorReceived instanceof Error);
    assert.strictEqual(errorReceived.message, 'Test error');
  });

  it('should call cleanup on unsubscribe', () => {
    let cleanupCalled = false;
    const observable = new Observable((observer) => {
      return () => {
        cleanupCalled = true;
      };
    });

    const subscription = observable.subscribe(() => {});
    subscription.unsubscribe();

    assert.strictEqual(cleanupCalled, true);
  });

  it('should transform values with map', () => {
    const values = [];
    const observable = new Observable((observer) => {
      observer.next(1);
      observer.next(2);
      observer.next(3);
      observer.complete();
    });

    observable.map((x) => x * 2).subscribe({
      next: (value) => values.push(value),
    });

    assert.deepStrictEqual(values, [2, 4, 6]);
  });

  it('should filter values with filter', () => {
    const values = [];
    const observable = new Observable((observer) => {
      observer.next(1);
      observer.next(2);
      observer.next(3);
      observer.next(4);
      observer.complete();
    });

    observable.filter((x) => x % 2 === 0).subscribe({
      next: (value) => values.push(value),
    });

    assert.deepStrictEqual(values, [2, 4]);
  });

  it('should perform side effects with tap', () => {
    const sideEffects = [];
    const values = [];
    
    const observable = new Observable((observer) => {
      observer.next(1);
      observer.next(2);
      observer.complete();
    });

    observable
      .tap((x) => sideEffects.push(x))
      .subscribe({
        next: (value) => values.push(value),
      });

    assert.deepStrictEqual(sideEffects, [1, 2]);
    assert.deepStrictEqual(values, [1, 2]);
  });

  it('should chain multiple operators', () => {
    const values = [];
    const observable = new Observable((observer) => {
      observer.next(1);
      observer.next(2);
      observer.next(3);
      observer.next(4);
      observer.next(5);
      observer.complete();
    });

    observable
      .filter((x) => x > 2)
      .map((x) => x * 2)
      .filter((x) => x < 10)
      .subscribe({
        next: (value) => values.push(value),
      });

    assert.deepStrictEqual(values, [6, 8]);
  });

  it('should support multiple subscribers', () => {
    const values1 = [];
    const values2 = [];
    
    const observable = new Observable((observer) => {
      observer.next(1);
      observer.next(2);
      observer.complete();
    });

    observable.subscribe((value) => values1.push(value));
    observable.subscribe((value) => values2.push(value * 10));

    assert.deepStrictEqual(values1, [1, 2]);
    assert.deepStrictEqual(values2, [10, 20]);
  });

  it('should handle map errors', () => {
    let errorReceived = null;
    const observable = new Observable((observer) => {
      observer.next(1);
      observer.next(2);
    });

    observable
      .map((x) => {
        if (x === 2) throw new Error('Map error');
        return x;
      })
      .subscribe({
        error: (err) => {
          errorReceived = err;
        },
      });

    assert.ok(errorReceived instanceof Error);
    assert.strictEqual(errorReceived.message, 'Map error');
  });

  it('should handle filter errors', () => {
    let errorReceived = null;
    const observable = new Observable((observer) => {
      observer.next(1);
      observer.next(2);
    });

    observable
      .filter((x) => {
        if (x === 2) throw new Error('Filter error');
        return true;
      })
      .subscribe({
        error: (err) => {
          errorReceived = err;
        },
      });

    assert.ok(errorReceived instanceof Error);
    assert.strictEqual(errorReceived.message, 'Filter error');
  });
});

describe('SSE Observable Integration', () => {
  it('should simulate SSE message flow', () => {
    const messages = [];
    
    // Simulate SSE Observable
    const sseObservable = new Observable((observer) => {
      observer.next({ type: 'open', event: null });
      observer.next({ type: 'message', event: { data: '{"utc":"2025-01-01"}' } });
      observer.next({ type: 'message', event: { data: '{"utc":"2025-01-02"}' } });
      observer.complete();
    });

    sseObservable
      .filter(({ type }) => type === 'message')
      .map(({ event }) => JSON.parse(event.data))
      .subscribe({
        next: (data) => messages.push(data),
      });

    assert.strictEqual(messages.length, 2);
    assert.strictEqual(messages[0].utc, '2025-01-01');
    assert.strictEqual(messages[1].utc, '2025-01-02');
  });

  it('should handle SSE parse errors gracefully', () => {
    const validMessages = [];
    
    const sseObservable = new Observable((observer) => {
      observer.next({ type: 'message', event: { data: '{"valid":true}' } });
      observer.next({ type: 'message', event: { data: 'invalid json' } });
      observer.next({ type: 'message', event: { data: '{"valid":true}' } });
      observer.complete();
    });

    sseObservable
      .filter(({ type }) => type === 'message')
      .map(({ event }) => {
        try {
          return { status: 'ok', payload: JSON.parse(event.data) };
        } catch (e) {
          return { status: 'invalid', payload: null };
        }
      })
      .filter(({ status }) => status === 'ok')
      .map(({ payload }) => payload)
      .subscribe({
        next: (data) => validMessages.push(data),
      });

    assert.strictEqual(validMessages.length, 2);
    assert.strictEqual(validMessages[0].valid, true);
  });
});

