/**
 * SSE Message Format Models
 * 
 * Defines the structure of messages sent via Server-Sent Events
 * - Legacy formats for backward compatibility
 * - New structured formats for enhanced functionality
 * - Validation helpers for ensuring format compliance
 */

/**
 * Legacy SSE Message Formats (v1)
 * Simple format used by existing implementation
 */
export const LegacyFormats = {
  /**
   * Legacy time message format
   * @typedef {Object} LegacyTimeMessage
   * @property {string} utc - ISO string of current UTC time
   */
  TimeMessage: {
    schema: {
      utc: 'string' // ISO 8601 format: "2025-10-05T14:30:00.000Z"
    },
    example: {
      utc: "2025-10-05T14:30:00.000Z"
    }
  },

  /**
   * Legacy shutdown message format
   * @typedef {Object} LegacyShutdownMessage
   * @property {string} type - Always "shutdown"
   */
  ShutdownMessage: {
    schema: {
      type: 'string' // Always "shutdown"
    },
    example: {
      type: "shutdown"
    }
  }
};

/**
 * Enhanced SSE Message Formats (v2)
 * Structured format with type-based routing and extensibility
 */
export const EnhancedFormats = {
  /**
   * Base message structure for all enhanced messages
   * @typedef {Object} BaseMessage
   * @property {string} type - Message type identifier
   * @property {string} timestamp - ISO timestamp of message creation
   */
  BaseMessage: {
    schema: {
      type: 'string',
      timestamp: 'string'
    }
  },

  /**
   * Enhanced time message format
   * @typedef {Object} EnhancedTimeMessage
   * @property {string} type - Message type: "time-update", "initial-time", etc.
   * @property {string} utc - ISO string of current UTC time
   * @property {number} timestamp - Unix timestamp in milliseconds
   * @property {string} timezone - Timezone identifier
   * @property {string} [local] - Local time string (optional)
   * @property {string} [localeTimezone] - Local timezone (optional)
   * @property {string} [message] - Optional message (for initial connection)
   */
  TimeMessage: {
    schema: {
      type: 'string',           // "time-update" | "initial-time"
      utc: 'string',            // ISO 8601 format
      timestamp: 'number',      // Unix timestamp (ms)
      timezone: 'string',       // "UTC"
      local: 'string?',         // Optional local time
      localeTimezone: 'string?', // Optional local timezone
      message: 'string?'        // Optional message
    },
    examples: {
      timeUpdate: {
        type: "time-update",
        utc: "2025-10-05T14:30:00.000Z",
        timestamp: 1728134200000,
        timezone: "UTC"
      },
      initialTime: {
        type: "initial-time",
        utc: "2025-10-05T14:30:00.000Z",
        timestamp: 1728134200000,
        timezone: "UTC",
        message: "Connected to time service"
      },
      withLocal: {
        type: "time-update",
        utc: "2025-10-05T14:30:00.000Z",
        timestamp: 1728134200000,
        timezone: "UTC",
        local: "10/5/2025, 10:30:00 AM",
        localeTimezone: "America/New_York"
      }
    }
  },

  /**
   * Enhanced shutdown message format
   * @typedef {Object} EnhancedShutdownMessage
   * @property {string} type - "shutdown" | "time-service-shutdown"
   * @property {string} reason - Reason for shutdown
   * @property {string} timestamp - ISO timestamp
   * @property {string} [message] - Optional shutdown message
   * @property {Object} [finalTime] - Final time data (for time service shutdown)
   */
  ShutdownMessage: {
    schema: {
      type: 'string',           // "shutdown" | "time-service-shutdown"
      reason: 'string',         // Shutdown reason
      timestamp: 'string',      // ISO timestamp
      message: 'string?',       // Optional message
      finalTime: 'object?'      // Optional final time data
    },
    examples: {
      general: {
        type: "shutdown",
        reason: "Server shutdown",
        timestamp: "2025-10-05T14:30:00.000Z"
      },
      timeService: {
        type: "time-service-shutdown",
        reason: "Time service shutdown",
        timestamp: "2025-10-05T14:30:00.000Z",
        message: "Time service is shutting down",
        finalTime: {
          utc: "2025-10-05T14:30:00.000Z",
          timestamp: 1728134200000,
          timezone: "UTC"
        }
      }
    }
  },

  /**
   * Heartbeat message format
   * @typedef {Object} HeartbeatMessage
   * @property {string} type - Always "heartbeat"
   * @property {string} timestamp - ISO timestamp
   * @property {string} id - Unique heartbeat identifier
   */
  HeartbeatMessage: {
    schema: {
      type: 'string',           // Always "heartbeat"
      timestamp: 'string',      // ISO timestamp
      id: 'string'              // Unique heartbeat ID
    },
    example: {
      type: "heartbeat",
      timestamp: "2025-10-05T14:30:00.000Z",
      id: "1728134200000-abc123"
    }
  },

  /**
   * Error message format
   * @typedef {Object} ErrorMessage
   * @property {string} type - Always "error"
   * @property {string} message - Error message
   * @property {string} code - Error code
   * @property {string} timestamp - ISO timestamp
   */
  ErrorMessage: {
    schema: {
      type: 'string',           // Always "error"
      message: 'string',        // Error message
      code: 'string',           // Error code
      timestamp: 'string'       // ISO timestamp
    },
    example: {
      type: "error",
      message: "Service temporarily unavailable",
      code: "SERVICE_UNAVAILABLE",
      timestamp: "2025-10-05T14:30:00.000Z"
    }
  }
};

/**
 * Message Type Constants
 * Centralized type definitions to avoid magic strings
 */
export const MessageTypes = {
  // Legacy types
  LEGACY_SHUTDOWN: 'shutdown',

  // Enhanced types
  TIME_UPDATE: 'time-update',
  INITIAL_TIME: 'initial-time',
  TIME_BROADCAST: 'time-broadcast',
  
  SHUTDOWN: 'shutdown',
  TIME_SERVICE_SHUTDOWN: 'time-service-shutdown',
  
  HEARTBEAT: 'heartbeat',
  ERROR: 'error'
};

/**
 * Validation helpers for message formats
 */
export const MessageValidators = {
  /**
   * Validates if a message matches the legacy time format
   * @param {Object} message - Message to validate
   * @returns {boolean} True if valid legacy time message
   */
  isLegacyTimeMessage(message) {
    return typeof message === 'object' &&
           typeof message.utc === 'string' &&
           !message.type; // Legacy messages don't have type field
  },

  /**
   * Validates if a message matches the legacy shutdown format
   * @param {Object} message - Message to validate
   * @returns {boolean} True if valid legacy shutdown message
   */
  isLegacyShutdownMessage(message) {
    return typeof message === 'object' &&
           message.type === MessageTypes.LEGACY_SHUTDOWN &&
           Object.keys(message).length === 1; // Only has 'type' field
  },

  /**
   * Validates if a message matches enhanced format structure
   * @param {Object} message - Message to validate
   * @returns {boolean} True if valid enhanced message
   */
  isEnhancedMessage(message) {
    return typeof message === 'object' &&
           typeof message.type === 'string' &&
           typeof message.timestamp === 'string';
  },

  /**
   * Gets the message format version
   * @param {Object} message - Message to analyze
   * @returns {'legacy' | 'enhanced' | 'unknown'} Format version
   */
  getMessageVersion(message) {
    if (this.isEnhancedMessage(message)) return 'enhanced';
    if (this.isLegacyTimeMessage(message) || this.isLegacyShutdownMessage(message)) return 'legacy';
    return 'unknown';
  }
};

/**
 * Format conversion utilities
 */
export const FormatConverters = {
  /**
   * Converts enhanced time message to legacy format
   * @param {Object} enhancedMessage - Enhanced format message
   * @returns {Object} Legacy format message
   */
  enhancedToLegacy(enhancedMessage) {
    if (enhancedMessage.type === MessageTypes.TIME_UPDATE || 
        enhancedMessage.type === MessageTypes.INITIAL_TIME) {
      return { utc: enhancedMessage.utc };
    }
    
    if (enhancedMessage.type === MessageTypes.SHUTDOWN ||
        enhancedMessage.type === MessageTypes.TIME_SERVICE_SHUTDOWN) {
      return { type: MessageTypes.LEGACY_SHUTDOWN };
    }
    
    // For other types, return a generic legacy format
    return enhancedMessage.utc ? { utc: enhancedMessage.utc } : enhancedMessage;
  },

  /**
   * Converts legacy message to enhanced format
   * @param {Object} legacyMessage - Legacy format message
   * @returns {Object} Enhanced format message
   */
  legacyToEnhanced(legacyMessage) {
    if (MessageValidators.isLegacyTimeMessage(legacyMessage)) {
      return {
        type: MessageTypes.TIME_UPDATE,
        utc: legacyMessage.utc,
        timestamp: Date.now(),
        timezone: 'UTC'
      };
    }
    
    if (MessageValidators.isLegacyShutdownMessage(legacyMessage)) {
      return {
        type: MessageTypes.SHUTDOWN,
        reason: 'Server shutdown',
        timestamp: new Date().toISOString()
      };
    }
    
    return legacyMessage;
  }
};