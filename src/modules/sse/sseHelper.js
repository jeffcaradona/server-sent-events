/**
 * SSE Helper - Functional utilities for Server-Sent Events
 * 
 * This module demonstrates clean SSE implementation patterns:
 * 
 * FUNCTIONAL APPROACH:
 * - Pure functions for message creation (no side effects)
 * - Immutable data structures 
 * - Clear separation between transport and business logic
 * 
 * PRODUCTION PATTERNS:
 * - Proper resource management with client tracking
 * - Error handling and graceful degradation
 * - Logging and monitoring capabilities
 * 
 * EXTENSIBILITY:
 * - Ready for heartbeat systems
 * - Supports multiple message types
 * - Clean upgrade path to enhanced formats
 */

/**
 * Sets up standard SSE headers on a response
 * @param {Object} res - Express response object
 * @returns {Object} The same response object for chaining
 */
export function setupSSEHeaders(res) {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.flushHeaders();
  
  return res;
}

/**
 * Creates a properly formatted SSE data message
 * @param {Object} data - Data to send (will be JSON stringified)
 * @returns {string} Formatted SSE message
 */
export function createSSEMessage(data) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

/**
 * Creates a time message following legacy format
 * Pure function - no side effects, predictable output
 * @returns {Object} Time message object
 */
export function createTimeMessage() {
  return {
    utc: new Date().toISOString()
  };
}

/**
 * Creates a shutdown message following legacy format
 * Pure function - no side effects, predictable output
 * @param {string} [type='shutdown'] - Shutdown message type
 * @returns {Object} Shutdown message object
 */
export function createShutdownMessage(type = 'shutdown') {
  return { type };
}

/**
 * Simple Client Manager - Functional approach to client management
 * Keeps global state but provides functional interface
 */
const clients = [];

export const ClientManager = {
  /**
   * Adds a client to the managed list
   * @param {Object} res - Express response object
   * @returns {number} New client count
   */
  addClient(res) {
    clients.push(res);
    return clients.length;
  },

  /**
   * Removes a client from the managed list
   * @param {Object} res - Express response object to remove
   * @returns {number} Remaining client count
   */
  removeClient(res) {
    const idx = clients.indexOf(res);
    if (idx !== -1) {
      clients.splice(idx, 1);
    }
    return clients.length;
  },

  /**
   * Gets current client count
   * @returns {number} Number of active clients
   */
  getClientCount() {
    return clients.length;
  },

  /**
   * Broadcasts a message to all clients
   * @param {string} message - Formatted SSE message to send
   * @param {Object} logger - Logger instance for error reporting
   * @returns {Object} Broadcast results
   */
  broadcast(message, logger) {
    let successful = 0;
    let failed = 0;
    const failedClients = [];

    for (const res of clients) {
      if (!res.writableEnded) {
        try {
          res.write(message);
          successful++;
        } catch (err) {
          logger.warn(`Failed to write to client: ${err.message}`);
          failed++;
          failedClients.push(res);
        }
      } else {
        failed++;
        failedClients.push(res);
      }
    }

    // Clean up failed clients
    failedClients.forEach(client => this.removeClient(client));

    return { successful, failed, total: this.getClientCount() };
  }
};