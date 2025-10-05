/**
 * Time Domain Models
 * 
 * Time-specific message formats, event types, and business logic models
 * Separated from generic SSE transport concerns
 */

/**
 * Time Service Event Types
 * Domain-specific events for time-related functionality
 */
export const TimeEventTypes = {
  // Connection events
  CONNECT: 'time-connect',
  DISCONNECT: 'time-disconnect',
  
  // Data events  
  UPDATE: 'time-update',
  INITIAL: 'initial-time',
  BROADCAST: 'time-broadcast',
  
  // Service events
  SERVICE_START: 'time-service-start',
  SERVICE_STOP: 'time-service-stop',
  SERVICE_SHUTDOWN: 'time-service-shutdown'
};

/**
 * Time Message Structures
 * Business logic specific to time data
 */
export const TimeMessageStructures = {
  /**
   * Base time data structure
   * @typedef {Object} TimeData
   * @property {string} utc - ISO 8601 UTC timestamp
   * @property {number} timestamp - Unix timestamp in milliseconds
   * @property {string} timezone - Timezone identifier
   */
  BaseTimeData: {
    schema: {
      utc: 'string',      // ISO 8601 format
      timestamp: 'number', // Unix timestamp (ms)
      timezone: 'string'   // Usually 'UTC'
    }
  },

  /**
   * Time update message (regular broadcasts)
   * @typedef {Object} TimeUpdateMessage
   * @property {string} type - Always 'time-update'
   * @property {string} utc - Current UTC time
   * @property {number} timestamp - Unix timestamp
   * @property {string} timezone - Timezone
   * @property {string} [local] - Local time if enabled
   * @property {string} [localeTimezone] - Local timezone if enabled
   */
  TimeUpdate: {
    type: TimeEventTypes.UPDATE,
    schema: {
      type: 'string',
      utc: 'string',
      timestamp: 'number',
      timezone: 'string',
      local: 'string?',
      localeTimezone: 'string?'
    },
    example: {
      type: 'time-update',
      utc: '2025-10-05T14:30:00.000Z',
      timestamp: 1728134200000,
      timezone: 'UTC'
    }
  },

  /**
   * Initial time message (sent on connection)
   * @typedef {Object} InitialTimeMessage
   * @property {string} type - Always 'initial-time'
   * @property {string} message - Connection confirmation message
   * @property {...TimeData} - All time data fields
   */
  InitialTime: {
    type: TimeEventTypes.INITIAL,
    schema: {
      type: 'string',
      message: 'string',
      utc: 'string',
      timestamp: 'number',
      timezone: 'string'
    },
    example: {
      type: 'initial-time',
      message: 'Connected to time service',
      utc: '2025-10-05T14:30:00.000Z',
      timestamp: 1728134200000,
      timezone: 'UTC'
    }
  },

  /**
   * Time broadcast message (custom broadcasts)
   * @typedef {Object} TimeBroadcastMessage
   * @property {string} type - Always 'time-broadcast'
   * @property {string} message - Broadcast message
   * @property {...TimeData} - All time data fields
   */
  TimeBroadcast: {
    type: TimeEventTypes.BROADCAST,
    schema: {
      type: 'string',
      message: 'string',
      utc: 'string',
      timestamp: 'number',
      timezone: 'string'
    }
  }
};

/**
 * Time Service Configuration Models
 * Business logic configuration for time services
 */
export const TimeServiceConfig = {
  /**
   * Default time service settings
   */
  defaults: {
    interval: 3000,           // 3 seconds
    timezone: 'UTC',
    includeLocal: false,
    enableHeartbeat: false,
    broadcastOnConnect: true
  },

  /**
   * Validation rules for time service config
   */
  validation: {
    interval: {
      min: 1000,    // Minimum 1 second
      max: 300000   // Maximum 5 minutes
    },
    timezone: {
      allowed: ['UTC', 'local']
    }
  }
};

/**
 * Time Domain Message Factories
 * Pure functions for creating time-specific messages
 */
export const TimeMessageFactory = {
  /**
   * Creates a time update message
   * @param {Object} options - Configuration options
   * @returns {Object} Time update message
   */
  createTimeUpdate(options = {}) {
    const now = new Date();
    const baseMessage = {
      type: TimeEventTypes.UPDATE,
      utc: now.toISOString(),
      timestamp: now.getTime(),
      timezone: options.timezone || 'UTC'
    };

    if (options.includeLocal) {
      baseMessage.local = now.toLocaleString();
      baseMessage.localeTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    return baseMessage;
  },

  /**
   * Creates an initial time message
   * @param {string} message - Connection message
   * @param {Object} options - Configuration options
   * @returns {Object} Initial time message
   */
  createInitialTime(message = 'Connected to time service', options = {}) {
    return {
      ...this.createTimeUpdate(options),
      type: TimeEventTypes.INITIAL,
      message
    };
  },

  /**
   * Creates a time broadcast message
   * @param {string} message - Broadcast message
   * @param {Object} options - Configuration options
   * @returns {Object} Time broadcast message
   */
  createTimeBroadcast(message, options = {}) {
    return {
      ...this.createTimeUpdate(options),
      type: TimeEventTypes.BROADCAST,
      message
    };
  },

  /**
   * Creates a time service shutdown message
   * @param {string} reason - Shutdown reason
   * @returns {Object} Shutdown message
   */
  createTimeServiceShutdown(reason = 'Time service shutdown') {
    const now = new Date();
    return {
      type: TimeEventTypes.SERVICE_SHUTDOWN,
      reason,
      message: 'Time service is shutting down',
      finalTime: {
        utc: now.toISOString(),
        timestamp: now.getTime(),
        timezone: 'UTC'
      },
      timestamp: now.toISOString()
    };
  }
};

/**
 * Legacy Compatibility for Time Messages
 * Ensures backward compatibility with existing clients
 */
export const TimeLegacyCompat = {
  /**
   * Converts enhanced time message to legacy format
   * @param {Object} enhancedMessage - Enhanced time message
   * @returns {Object} Legacy compatible message
   */
  toLegacyFormat(enhancedMessage) {
    // Handle shutdown messages specially
    if (enhancedMessage.type === 'shutdown' || enhancedMessage.type === 'time-service-shutdown') {
      return { type: 'shutdown' };
    }
    
    // For time messages, preserve utc field
    if (enhancedMessage.utc) {
      return { utc: enhancedMessage.utc };
    }
    
    // Fallback for unknown formats
    return enhancedMessage;
  },

  /**
   * Checks if message needs legacy compatibility
   * @param {Object} message - Message to check
   * @returns {boolean} True if backward compatibility needed
   */
  needsLegacyCompat(message) {
    return message.type && message.type.startsWith('time-');
  }
};