import { expect } from "chai";
import debugLib from "debug";
import { 
  debug, 
  debugServer, 
  debugApplication, 
  debugRoutes, 
  debugControllers 
} from "../src/utils/debug.js";

describe("debug", () => {
  describe("debug exports", () => {
    it("should export debug function", () => {
      expect(debug).to.exist;
      expect(debug).to.be.a("function");
    });

    it("should export debugServer", () => {
      expect(debugServer).to.exist;
      expect(debugServer).to.be.a("function");
    });

    it("should export debugApplication", () => {
      expect(debugApplication).to.exist;
      expect(debugApplication).to.be.a("function");
    });

    it("should export debugRoutes", () => {
      expect(debugRoutes).to.exist;
      expect(debugRoutes).to.be.a("function");
    });

    it("should export debugControllers", () => {
      expect(debugControllers).to.exist;
      expect(debugControllers).to.be.a("function");
    });
  });

  describe("debug function", () => {
    it("should create a debug instance for a custom namespace", () => {
      const customDebug = debug("custom:namespace");
      expect(customDebug).to.exist;
      expect(customDebug).to.be.a("function");
    });

    it("should create different instances for different namespaces", () => {
      const debug1 = debug("namespace:one");
      const debug2 = debug("namespace:two");
      expect(debug1).to.not.equal(debug2);
    });

    it("should return debugLib instance with correct namespace", () => {
      const testDebug = debug("test:module");
      expect(testDebug.namespace).to.equal("test:module");
    });
  });

  describe("debugServer", () => {
    it("should have correct namespace", () => {
      expect(debugServer.namespace).to.equal("server-sent-events:server");
    });

    it("should allow logging messages", () => {
      expect(() => {
        debugServer("Test server message");
      }).to.not.throw();
    });

    it("should support formatted messages", () => {
      expect(() => {
        debugServer("Server status: %s, port: %d", "running", 3000);
      }).to.not.throw();
    });
  });

  describe("debugApplication", () => {
    it("should have correct namespace", () => {
      expect(debugApplication.namespace).to.equal("server-sent-events:application");
    });

    it("should allow logging messages", () => {
      expect(() => {
        debugApplication("Test application message");
      }).to.not.throw();
    });

    it("should support formatted messages", () => {
      expect(() => {
        debugApplication("App initialized with %d routes", 5);
      }).to.not.throw();
    });
  });

  describe("debugRoutes", () => {
    it("should have correct namespace", () => {
      expect(debugRoutes.namespace).to.equal("server-sent-events:routes");
    });

    it("should allow logging messages", () => {
      expect(() => {
        debugRoutes("Test routes message");
      }).to.not.throw();
    });

    it("should support formatted messages", () => {
      expect(() => {
        debugRoutes("Registered route: %s %s", "GET", "/api/test");
      }).to.not.throw();
    });
  });

  describe("debugControllers", () => {
    it("should have correct namespace", () => {
      expect(debugControllers.namespace).to.equal("server-sent-events:controllers");
    });

    it("should allow logging messages", () => {
      expect(() => {
        debugControllers("Test controllers message");
      }).to.not.throw();
    });

    it("should support formatted messages", () => {
      expect(() => {
        debugControllers("Controller: %s, action: %s", "UserController", "create");
      }).to.not.throw();
    });
  });

  describe("debug functionality", () => {
    it("should respect DEBUG environment variable", () => {
      const originalDebug = process.env.DEBUG;
      
      // Enable debug for server-sent-events namespace
      process.env.DEBUG = "server-sent-events:*";
      debugLib.enable(process.env.DEBUG);
      
      expect(() => {
        debugServer("This should log");
        debugApplication("This should also log");
      }).to.not.throw();
      
      // Restore
      process.env.DEBUG = originalDebug;
      if (originalDebug) {
        debugLib.enable(originalDebug);
      }
    });

    it("should handle disabled debug instances gracefully", () => {
      const originalDebug = process.env.DEBUG;
      
      // Disable all debug output
      process.env.DEBUG = "";
      debugLib.disable();
      
      expect(() => {
        debugServer("This should not log but shouldn't throw");
        debugApplication("Same here");
      }).to.not.throw();
      
      // Restore
      process.env.DEBUG = originalDebug;
      if (originalDebug) {
        debugLib.enable(originalDebug);
      }
    });

    it("should support namespace filtering", () => {
      const originalDebug = process.env.DEBUG;
      
      // Only enable server namespace
      process.env.DEBUG = "server-sent-events:server";
      debugLib.enable(process.env.DEBUG);
      
      expect(() => {
        debugServer("Server message");
        debugApplication("Application message");
        debugRoutes("Routes message");
        debugControllers("Controllers message");
      }).to.not.throw();
      
      // Restore
      process.env.DEBUG = originalDebug;
      if (originalDebug) {
        debugLib.enable(originalDebug);
      }
    });

    it("should handle multiple debug calls in sequence", () => {
      expect(() => {
        debugServer("Message 1");
        debugServer("Message 2");
        debugApplication("Message 3");
        debugRoutes("Message 4");
        debugControllers("Message 5");
      }).to.not.throw();
    });

    it("should support nested namespace creation", () => {
      const nestedDebug = debug("server-sent-events:custom:nested:deep");
      expect(nestedDebug).to.exist;
      expect(nestedDebug.namespace).to.equal("server-sent-events:custom:nested:deep");
    });
  });

  describe("debug instance properties", () => {
    it("should have enabled property", () => {
      expect(debugServer).to.have.property("enabled");
      expect(typeof debugServer.enabled).to.equal("boolean");
    });

    it("should have namespace property", () => {
      expect(debugServer).to.have.property("namespace");
      expect(typeof debugServer.namespace).to.equal("string");
    });

    it("should have extend method", () => {
      const extendedDebug = debugServer.extend("extended");
      expect(extendedDebug).to.exist;
      expect(extendedDebug.namespace).to.equal("server-sent-events:server:extended");
    });
  });

  describe("debug with objects and errors", () => {
    it("should handle object logging", () => {
      expect(() => {
        debugServer("User object: %O", { id: 1, name: "Test" });
      }).to.not.throw();
    });

    it("should handle error logging", () => {
      const error = new Error("Test error");
      expect(() => {
        debugServer("Error occurred: %O", error);
      }).to.not.throw();
    });

    it("should handle arrays", () => {
      expect(() => {
        debugRoutes("Routes: %O", ["/api/users", "/api/posts", "/api/comments"]);
      }).to.not.throw();
    });

    it("should handle null and undefined", () => {
      expect(() => {
        debugApplication("Null value: %O", null);
        debugApplication("Undefined value: %O", undefined);
      }).to.not.throw();
    });
  });

  describe("debug namespace consistency", () => {
    it("should maintain consistent module name across all debuggers", () => {
      expect(debugServer.namespace).to.include("server-sent-events");
      expect(debugApplication.namespace).to.include("server-sent-events");
      expect(debugRoutes.namespace).to.include("server-sent-events");
      expect(debugControllers.namespace).to.include("server-sent-events");
    });

    it("should have unique sub-namespaces for each debugger", () => {
      const namespaces = [
        debugServer.namespace,
        debugApplication.namespace,
        debugRoutes.namespace,
        debugControllers.namespace
      ];
      
      const uniqueNamespaces = new Set(namespaces);
      expect(uniqueNamespaces.size).to.equal(4);
    });

    it("should follow the correct naming pattern", () => {
      expect(debugServer.namespace).to.match(/^server-sent-events:.+$/);
      expect(debugApplication.namespace).to.match(/^server-sent-events:.+$/);
      expect(debugRoutes.namespace).to.match(/^server-sent-events:.+$/);
      expect(debugControllers.namespace).to.match(/^server-sent-events:.+$/);
    });
  });
});
