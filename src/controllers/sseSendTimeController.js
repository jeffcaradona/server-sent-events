/**
 * SSE Time Controller - Refactored for functional patterns
 * 
 * BEFORE REFACTORING:
 * - Mixed concerns: SSE transport + time logic + client management
 * - Global state mutations
 * - Inline message formatting
 * - Manual client array management
 * 
 * AFTER REFACTORING:
 * - Pure functions for message creation
 * - Functional client management interface  
 * - Clear separation of concerns
 * - Better logging and error handling
 * 
 * MAINTAINED COMPATIBILITY:
 * - Same message format: { utc: "ISO_STRING" }
 * - Same timing: 3-second intervals
 * - Same SSE headers and wire protocol
 */

import logger from "./../utils/logger.js"; // winston logger
import { 
  setupSSEHeaders,        // Pure function - sets SSE headers
  createSSEMessage,       // Pure function - formats SSE wire protocol
  createTimeMessage,      // Pure function - creates time data
  createShutdownMessage,  // Pure function - creates shutdown data
  ClientManager           // Functional interface - manages client connections
} from "./../modules/sse/sseHelper.js";
import { MessageTypes } from "../models/index.js"; // Message type constants

// Safe logging helper to prevent crashes during shutdown
const safeLog = (level, message) => {
    try {
        logger[level](message);
    } catch (err) {
        // Fallback to console if winston fails
        console.log(`[${level.toUpperCase()}] ${message}`);
    }
};

export const time = (req, res) => {
    setupSSEHeaders(res);

    const clientCount = ClientManager.addClient(res);
    safeLog('info', `SSE client connected. Total clients: ${clientCount}`);

    const sendTime = () => {
        // Check if connection is still alive before writing
        if (res.writableEnded || res.destroyed) {
            clearInterval(interval);
            return;
        }
        
        try {
            // Pure function creates message - no side effects
            const timeMessage = createTimeMessage();
            res.write(createSSEMessage(timeMessage));
        } catch (err) {
            safeLog('warn', `Failed to send time message: ${err.message}`);
            clearInterval(interval);
            ClientManager.removeClient(res);
        }
    };

    sendTime();
    const interval = setInterval(sendTime, 3000);

    req.on('close', () => {
        clearInterval(interval);
        
        // Remove client first to prevent concurrent operations
        const remainingClients = ClientManager.removeClient(res);
        
        // Safe logging with fallback
        safeLog('info', `SSE client disconnected. Remaining clients: ${remainingClients}`);
    });
};

export const broadcastShutdown = () => {
  const clientCount = ClientManager.getClientCount();
  safeLog('info', `Broadcasting shutdown to ${clientCount} clients...`);

  // Pure function creates shutdown message
  const shutdownMessage = createShutdownMessage(MessageTypes.LEGACY_SHUTDOWN);
  const sseMessage = createSSEMessage(shutdownMessage);
  
  // Functional broadcast with results - use safe logger
  const safeLogger = {
    warn: (msg) => safeLog('warn', msg),
    info: (msg) => safeLog('info', msg)
  };
  const results = ClientManager.broadcast(sseMessage, safeLogger);
  
  safeLog('info', `Shutdown broadcast complete: ${results.successful} successful, ${results.failed} failed`);
  
  // End all remaining connections
  ClientManager.broadcast('', { warn: () => {}, info: () => {} }); // Silent cleanup
};