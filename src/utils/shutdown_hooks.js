

import logger from './logger.js';
import { createHookRegistry } from "./../modules/hooks/default.js";



export const shutdownHooks = createHookRegistry("shutdown");


import * as sseSendTimeController from "./../controllers/sseSendTimeController.js";


// Register a shutdown hook
shutdownHooks.register(() => {
  // Notify SSE clients
  if (typeof sseSendTimeController.broadcastShutdown === "function") {
    logger.warn("Broadcasting shutdown to SSE clients...");
    sseSendTimeController.broadcastShutdown();
  }
});

