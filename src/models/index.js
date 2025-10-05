/**
 * SSE Models - Centralized export of all SSE-related models
 * 
 * This module provides a single import point for all SSE message formats,
 * event structures, and compatibility utilities.
 */

// Generic SSE message format definitions
export {
  LegacyFormats,
  EnhancedFormats,
  MessageTypes,
  MessageValidators,
  FormatConverters
} from './sseMessageFormats.js';

// Core SSE event structure definitions
export {
  SSEEventTypes,
  DomainEventTypes,
  SSEWireFormat,
  ClientExpectations,
  CompatibilityMatrix,
  TransitionStrategy
} from './sseEventStructure.js';

// Time domain-specific models
export {
  TimeEventTypes,
  TimeMessageStructures,
  TimeServiceConfig,
  TimeMessageFactory,
  TimeLegacyCompat
} from './timeModels.js';

/**
 * Quick reference for common use cases
 */
export const SSEModels = {
  // Message creation helpers
  createLegacyTimeMessage: (utc) => ({ utc }),
  createLegacyShutdownMessage: () => ({ type: 'shutdown' }),
  
  // Enhanced message creation helpers
  createEnhancedTimeMessage: (utc, type = 'time-update', additionalData = {}) => ({
    type,
    utc,
    timestamp: Date.now(),
    timezone: 'UTC',
    ...additionalData
  }),
  
  createEnhancedShutdownMessage: (reason = 'Server shutdown') => ({
    type: 'shutdown',
    reason,
    timestamp: new Date().toISOString()
  }),
  
  // Compatibility helpers
  isLegacyFormat: (message) => MessageValidators.isLegacyTimeMessage(message) || 
                              MessageValidators.isLegacyShutdownMessage(message),
  
  isEnhancedFormat: (message) => MessageValidators.isEnhancedMessage(message),
  
  // Format conversion
  toLegacy: (enhancedMessage) => FormatConverters.enhancedToLegacy(enhancedMessage),
  toEnhanced: (legacyMessage) => FormatConverters.legacyToEnhanced(legacyMessage)
};