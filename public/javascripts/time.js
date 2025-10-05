
import { createSSEClient, parseSSEData } from "./sse-client.js";





function getTimeEventEffects({ event, logger }) {
  const { status, payload, error } = parseSSEData(event);

  if (status !== "ok") {
    return [
      () => logger.error("Invalid event data received."),
      ...(error ? [() => logger.error("Parse error:", error)] : []),
    ];
  }

  switch (payload.type) {
    case "error":
      return [
        () => logger.error("Server error:", payload.message || "Unknown error"),
      ];
    case "shutdown":
      return [
        () => logger.log("Server is shutting down. Closing connection."),
        () => event.target.close(),
      ];
    default:
      if (typeof payload.utc === "string") {
        return [
          () => {
            const local = new Date().toLocaleString();
            logger.log(`Server UTC: ${payload.utc} | Browser Local: ${local}`);
          },
        ];
      } else {
        return [() => logger.warn("Unexpected event data format:", payload)];
      }
  }
}

document.addEventListener("DOMContentLoaded", () => {

  const client = createSSEClient({
    url: "/sse/time",
    logger: console,
    eventHandler: getTimeEventEffects, 
  });

  // Set up cleanup
  client.setupCleanup();
});
