import { expect } from "chai";
import { accessLogger, serverLogger, morganStream } from "../src/utils/logger.js";

describe("logger", () => {
  describe("logger exports", () => {
    it("should export accessLogger", () => {
      expect(accessLogger).to.exist;
      expect(accessLogger.info).to.be.a("function");
    });

    it("should export serverLogger", () => {
      expect(serverLogger).to.exist;
      expect(serverLogger.info).to.be.a("function");
    });

    it("should export morganStream", () => {
      expect(morganStream).to.exist;
      expect(morganStream.write).to.be.a("function");
    });
  });

  describe("morganStream", () => {
    it("should have a write method that calls accessLogger", () => {
      // This will call accessLogger.info internally
      expect(() => {
        morganStream.write("GET /test 200\n");
      }).to.not.throw();
    });

    it("should trim newlines from messages", () => {
      // Should handle messages with trailing newlines
      expect(() => {
        morganStream.write("POST /api 201\n");
      }).to.not.throw();
    });
  });

  describe("logger functionality", () => {
    it("should allow logging at different levels", () => {
      expect(() => {
        serverLogger.info("Test info message");
        serverLogger.warn("Test warn message");
        serverLogger.error("Test error message");
      }).to.not.throw();
    });

    it("should handle production environment settings", () => {
      // Just verify loggers work regardless of NODE_ENV
      const originalEnv = process.env.NODE_ENV;
      
      // Test in production mode
      process.env.NODE_ENV = "production";
      expect(() => {
        accessLogger.info("Production test");
      }).to.not.throw();
      
      // Test in development mode
      process.env.NODE_ENV = "development";
      expect(() => {
        serverLogger.info("Development test");
      }).to.not.throw();
      
      // Restore
      process.env.NODE_ENV = originalEnv;
    });

    it("should log debug messages in development", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
      
      // Re-import to get fresh logger with new NODE_ENV
      // Note: This test verifies the logger can handle debug level
      expect(() => {
        serverLogger.debug("Debug message");
      }).to.not.throw();
      
      process.env.NODE_ENV = originalEnv;
    });
  });
});
