/**
 * Examples demonstrating tree-shakeable SSE client usage
 * 
 * TREE-SHAKING BENEFIT:
 * Import only the operators you need. Unused operators won't be included in your bundle.
 */

// Example 1: Minimal import - only what you need
// Bundle will only include: Observable, createSSEObservable, pipe, filter, map
import { 
  createSSEObservable, 
  pipe, 
  filter, 
  map, 
  parseSSEData 
} from './sse-client-shakeable.js';

/**
 * Example 1: Basic usage with pipe
 * Only imports filter and map - tap, take, skip won't be in the bundle
 */
export function example1_BasicPipeline() {
  const timeData$ = pipe(
    filter(({ type }) => type === 'message'),
    map(({ event }) => parseSSEData(event)),
    filter(({ status }) => status === 'ok'),
    map(({ payload }) => payload)
  )(createSSEObservable('/sse/time'));

  return timeData$.subscribe({
    next: (data) => console.log('Time update:', data),
    error: (err) => console.error('Connection error:', err),
    complete: () => console.log('Stream completed')
  });
}

/**
 * Example 2: Using tap for debugging (add tap to imports if you need it)
 */
export function example2_WithDebugging() {
  // If you need tap, add it to your imports:
  // import { tap } from './sse-client-shakeable.js';
  
  // For now, using console.log in map as alternative
  const debugStream$ = pipe(
    filter(({ type }) => type === 'message'),
    map(({ event }) => {
      console.log('Raw event:', event);  // Debug side effect
      return parseSSEData(event);
    }),
    filter(({ status }) => status === 'ok'),
    map(({ payload }) => payload)
  )(createSSEObservable('/sse/time'));

  return debugStream$;
}

/**
 * Example 3: Taking only first N events (requires take operator)
 */
export function example3_LimitedEvents() {
  // import { take } from './sse-client-shakeable.js';
  
  // const limitedStream$ = pipe(
  //   filter(({ type }) => type === 'message'),
  //   take(10),  // Only process first 10 messages
  //   map(({ event }) => parseSSEData(event))
  // )(createSSEObservable('/sse/time'));
  
  // return limitedStream$;
  
  console.log('To use this example, import { take } from sse-client-shakeable.js');
}

/**
 * Example 4: Multiple independent streams
 * Each stream only bundles the operators it uses
 */
export function example4_MultipleStreams() {
  // Stream 1: Just messages
  const messages$ = pipe(
    filter(({ type }) => type === 'message')
  )(createSSEObservable('/sse/time'));

  // Stream 2: Parsed data only
  const data$ = pipe(
    filter(({ type }) => type === 'message'),
    map(({ event }) => parseSSEData(event)),
    filter(({ status }) => status === 'ok'),
    map(({ payload }) => payload)
  )(createSSEObservable('/sse/time'));

  // Stream 3: Connection status only
  const status$ = pipe(
    filter(({ type }) => type === 'open')
  )(createSSEObservable('/sse/time'));

  return { messages$, data$, status$ };
}

/**
 * Example 5: Reusable operator composition
 * Create custom operators by composing existing ones
 */
export function example5_CustomOperators() {
  // Custom operator: extract valid SSE payloads
  const extractValidPayload = pipe(
    filter(({ type }) => type === 'message'),
    map(({ event }) => parseSSEData(event)),
    filter(({ status }) => status === 'ok'),
    map(({ payload }) => payload)
  );

  // Use the custom operator
  const timePayload$ = extractValidPayload(createSSEObservable('/sse/time'));

  return timePayload$;
}

/**
 * Example 6: Comparison - Old vs New API
 */
export function example6_ComparisonDemo() {
  // OLD WAY (from sse-client.js - monolithic, all operators always bundled):
  // const stream = createSSEObservable('/sse/time')
  //   .map(x => x.value)
  //   .filter(x => x > 0)
  //   .tap(x => console.log(x));
  // Problem: Even if you don't use .tap(), it's in your bundle

  // NEW WAY (tree-shakeable):
  const stream$ = pipe(
    map(x => x.value),
    filter(x => x > 0)
    // tap is NOT imported, so it won't be in the bundle!
  )(createSSEObservable('/sse/time'));

  return stream$;
}

/**
 * Bundle size comparison (estimated):
 * 
 * sse-client.js (monolithic):
 * - Observable class + all operators: ~3KB minified
 * - You get: map, filter, tap (even if unused)
 * 
 * sse-client-shakeable.js (selective import):
 * - Observable class: ~800 bytes
 * - createSSEObservable: ~500 bytes
 * - pipe: ~200 bytes
 * - Each operator: ~300-400 bytes
 * 
 * If you only use map + filter:
 * - Old way: ~3KB
 * - New way: ~2KB (33% savings)
 * 
 * If you only use createSSEObservable:
 * - Old way: ~3KB
 * - New way: ~1.3KB (56% savings)
 */
