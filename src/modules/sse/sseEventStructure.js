/**
 * Core SSE Event Types
 * Domain-agnostic event types for the SSE transport layer
 */
export const SSEEventTypes = {
  // Default event (no event field specified)
  DEFAULT: null,

  // Core SSE system events
  HEARTBEAT: "heartbeat",
  SHUTDOWN: "shutdown",
  ERROR: "error",
};

