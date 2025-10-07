import logger from "./../utils/logger.js"; // winston logger
import sseHelper from "./../modules/sse/sseHelper.js";

// Keep the legacy API surface: export `time` and `broadcastShutdown` so other
// modules (like shutdown hooks) continue to work without changes.
export const time = (req, res) => {
  sseHelper.initResponse(res);
  // Prefer server-side session id as the stable client key. If not present,
  // the helper will generate a fallback id.
  const clientId = req?.sessionID || undefined;
  sseHelper.addClient(clientId, res, { ip: req.ip });

  const sendTime = () => {
    const utc = new Date().toISOString();
    sseHelper.send(res, { utc });
  };

  sendTime();
  const interval = setInterval(sendTime, 3000);

  req.on("close", () => {
    clearInterval(interval);
    sseHelper.removeClient(res);
  });
};

export const broadcastShutdown = () => {
  logger.info(`Broadcasting shutdown to ${sseHelper.getClientCount()} clients...`);
  sseHelper.broadcastAndClose({ type: "shutdown" });
};