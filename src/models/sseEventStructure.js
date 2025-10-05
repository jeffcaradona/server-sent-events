/**
 * SSE Event Structure Models
 * 
 * Defines the complete Server-Sent Events wire format
 * including headers, event types, and data payloads
 */

/**
 * Core SSE Event Types
 * Domain-agnostic event types for the SSE transport layer
 */
export const SSEEventTypes = {
  // Default event (no event field specified)
  DEFAULT: null,
  
  // Core SSE system events
  HEARTBEAT: 'heartbeat',
  SHUTDOWN: 'shutdown',
  ERROR: 'error'
};

/**
 * Domain-specific event types
 * These should be defined in their respective service modules
 * but are documented here for reference
 */
export const DomainEventTypes = {
  // Time service events (should be moved to timeService.js)
  TIME: {
    CONNECT: 'time-connect',
    UPDATE: 'time-update', 
    BROADCAST: 'time-broadcast'
  },
  
  // Future domain events can be added here for documentation
  // USER: { LOGIN: 'user-login', LOGOUT: 'user-logout' },
  // NOTIFICATION: { ALERT: 'notification-alert' }
};

/**
 * SSE Wire Format Structure
 * Represents the complete SSE message as sent over HTTP
 */
export const SSEWireFormat = {
  /**
   * Complete SSE event structure
   * @typedef {Object} SSEEvent
   * @property {string} [id] - Event ID for client-side tracking
   * @property {string} [event] - Event type (optional, defaults to 'message')
   * @property {string} data - JSON stringified data payload
   * @property {number} [retry] - Retry interval in milliseconds
   */
  Event: {
    schema: {
      id: 'string?',        // Optional event ID
      event: 'string?',     // Optional event type
      data: 'string',       // Required: JSON stringified data
      retry: 'number?'      // Optional retry interval
    },
    examples: {
      // Basic time update (legacy compatible)
      legacyTimeUpdate: {
        data: '{"utc":"2025-10-05T14:30:00.000Z"}'
      },
      
      // Enhanced time update with event type
      enhancedTimeUpdate: {
        id: '1728134200000',
        event: 'time-update',
        data: '{"type":"time-update","utc":"2025-10-05T14:30:00.000Z","timestamp":1728134200000,"timezone":"UTC"}'
      },
      
      // Initial connection message
      initialConnection: {
        id: '1728134200001',
        event: 'time-connect',
        data: '{"type":"initial-time","utc":"2025-10-05T14:30:00.000Z","timestamp":1728134200000,"timezone":"UTC","message":"Connected to time service"}'
      },
      
      // Heartbeat
      heartbeat: {
        id: '1728134200002',
        event: 'heartbeat',
        data: '{"type":"heartbeat","timestamp":"2025-10-05T14:30:00.000Z","id":"1728134200002-abc123"}'
      },
      
      // Shutdown notification
      shutdown: {
        event: 'shutdown',
        data: '{"type":"shutdown","reason":"Server shutdown","timestamp":"2025-10-05T14:30:00.000Z"}'
      },
      
      // Error notification
      error: {
        event: 'error',
        data: '{"type":"error","message":"Service temporarily unavailable","code":"SERVICE_UNAVAILABLE","timestamp":"2025-10-05T14:30:00.000Z"}'
      }
    }
  },

  /**
   * SSE Headers structure
   * Standard headers required for SSE connections
   */
  Headers: {
    required: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    },
    recommended: {
      'X-Accel-Buffering': 'no'  // Disable nginx buffering
    },
    cors: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  }
};

/**
 * Client Event Handler Expectations
 * Defines what the client-side event handlers expect
 */
export const ClientExpectations = {
  /**
   * Legacy client expectations (current implementation)
   */
  Legacy: {
    // Default event handler expects these payload structures
    defaultEvent: {
      // Time messages: { utc: "ISO_STRING" }
      timeMessage: 'payload.utc (string)',
      
      // Shutdown messages: { type: "shutdown" }
      shutdownMessage: 'payload.type === "shutdown"'
    },
    
    // Event types the legacy client handles
    supportedTypes: [
      'message', // Default event type
      // No specific event types in legacy implementation
    ]
  },

  /**
   * Enhanced client expectations (new implementation)
   */
  Enhanced: {
    // Event-specific handlers
    events: {
      'time-connect': 'Initial connection acknowledgment',
      'time-update': 'Regular time updates',
      'time-broadcast': 'Broadcast messages',
      'heartbeat': 'Connection health checks',
      'shutdown': 'Graceful shutdown notifications',
      'error': 'Error notifications'
    },
    
    // Payload structure expectations by message type
    payloadStructures: {
      'time-update': 'EnhancedFormats.TimeMessage',
      'initial-time': 'EnhancedFormats.TimeMessage',
      'heartbeat': 'EnhancedFormats.HeartbeatMessage',
      'shutdown': 'EnhancedFormats.ShutdownMessage',
      'error': 'EnhancedFormats.ErrorMessage'
    }
  }
};

/**
 * Migration Compatibility Matrix
 * Defines how different client/server combinations should work
 */
export const CompatibilityMatrix = {
  /**
   * Server v1 (Legacy) + Client v1 (Legacy)
   * Current working state
   */
  'server-v1_client-v1': {
    status: 'working',
    wireFormat: 'data: {"utc":"..."}',
    clientHandling: 'payload.utc in default case'
  },

  /**
   * Server v2 (Enhanced) + Client v1 (Legacy)
   * Needs backward compatibility
   */
  'server-v2_client-v1': {
    status: 'needs-compatibility',
    solution: 'Server sends enhanced format but ensures payload.utc exists',
    wireFormat: 'data: {"type":"time-update","utc":"...","timestamp":...}',
    clientHandling: 'payload.utc in default case (ignores type field)'
  },

  /**
   * Server v1 (Legacy) + Client v2 (Enhanced)
   * Forward compatibility
   */
  'server-v1_client-v2': {
    status: 'needs-forward-compatibility',
    solution: 'Client handles both legacy and enhanced formats',
    wireFormat: 'data: {"utc":"..."}',
    clientHandling: 'Detects legacy format and handles appropriately'
  },

  /**
   * Server v2 (Enhanced) + Client v2 (Enhanced)
   * Target state
   */
  'server-v2_client-v2': {
    status: 'target-state',
    wireFormat: 'event: time-update\\ndata: {"type":"time-update","utc":"..."}',
    clientHandling: 'Type-based routing to specific handlers'
  }
};

/**
 * Transition Strategy
 * Defines the safe migration path
 */
export const TransitionStrategy = {
  phases: [
    {
      phase: 1,
      name: 'Backward Compatible Server',
      description: 'Server sends enhanced format but maintains legacy compatibility',
      serverChanges: 'Send enhanced messages with guaranteed payload.utc field',
      clientChanges: 'None required',
      validation: 'Legacy client continues to work'
    },
    {
      phase: 2,
      name: 'Enhanced Client',
      description: 'Client handles both legacy and enhanced formats',
      serverChanges: 'None required',
      clientChanges: 'Add type-based routing with legacy fallback',
      validation: 'Client works with both server versions'
    },
    {
      phase: 3,
      name: 'Full Enhanced Mode',
      description: 'Both server and client use enhanced formats with event types',
      serverChanges: 'Add event types to SSE messages',
      clientChanges: 'Use event-specific handlers',
      validation: 'Full feature set available'
    },
    {
      phase: 4,
      name: 'Legacy Cleanup',
      description: 'Remove legacy format support',
      serverChanges: 'Remove backward compatibility code',
      clientChanges: 'Remove legacy format handling',
      validation: 'Clean, maintainable codebase'
    }
  ]
};