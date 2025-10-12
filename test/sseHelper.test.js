import { expect } from "chai";
import { EventEmitter } from "node:events";
import sseHelper from "../src/modules/sse/sseHelper.js";

/**
 * Minimal mock Response object for testing SSE helpers.
 * Extends EventEmitter to support res.once('close', ...).
 */
class MockResponse extends EventEmitter {
  constructor() {
    super();
    this.headers = {};
    this.writableEnded = false;
    this.writes = [];
  }

  set(headers) {
    Object.assign(this.headers, headers);
  }

  flushHeaders() {
    // no-op
  }

  write(chunk) {
    if (this.writableEnded) throw new Error("write after end");
    this.writes.push(chunk);
    return true;
  }

  end() {
    this.writableEnded = true;
    this.emit("close");
  }
}

describe("sseHelper", () => {
  afterEach(() => {
    // Clean up all clients after each test to avoid cross-test pollution
    const clients = sseHelper._clients;
    for (const clientId of Array.from(clients.keys())) {
      sseHelper.removeClientById(clientId);
    }
  });

  describe("initResponse", () => {
    it("should set SSE headers on response", () => {
      const res = new MockResponse();
      sseHelper.initResponse(res);
      expect(res.headers).to.include({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
    });
  });

  describe("addClient / removeClient lifecycle", () => {
    it("should register a client and store it in the Map", () => {
      const res = new MockResponse();
      const clientId = sseHelper.addClient("test-id", res, { ip: "127.0.0.1" });
      expect(clientId).to.equal("test-id");
      expect(sseHelper.getClientCount()).to.equal(1);
      expect(sseHelper._clients.has("test-id")).to.be.true;
    });

    it("should generate a client id if only res is provided (back-compat)", () => {
      const res = new MockResponse();
      const clientId = sseHelper.addClient(res);
      expect(clientId).to.be.a("string");
      expect(clientId).to.match(/^anon-/);
      expect(sseHelper.getClientCount()).to.equal(1);
    });

    it("should attach a close listener that removes the client", () => {
      const res = new MockResponse();
      const clientId = sseHelper.addClient("close-test", res);
      expect(sseHelper.getClientCount()).to.equal(1);
      // Simulate client disconnect
      res.end();
      expect(sseHelper.getClientCount()).to.equal(0);
    });

    it("should remove client by res object", () => {
      const res = new MockResponse();
      sseHelper.addClient("remove-test", res);
      expect(sseHelper.getClientCount()).to.equal(1);
      sseHelper.removeClient(res);
      expect(sseHelper.getClientCount()).to.equal(0);
      expect(res.writableEnded).to.be.true;
    });

    it("should remove client by id", () => {
      const res = new MockResponse();
      sseHelper.addClient("id-remove", res);
      expect(sseHelper.getClientCount()).to.equal(1);
      sseHelper.removeClientById("id-remove");
      expect(sseHelper.getClientCount()).to.equal(0);
      expect(res.writableEnded).to.be.true;
    });
  });

  describe("send / sendToClient", () => {
    it("should write SSE-formatted payload to response", () => {
      const res = new MockResponse();
      sseHelper.send(res, { utc: "2025-10-06T00:00:00Z" });
      expect(res.writes).to.have.lengthOf(1);
      expect(res.writes[0]).to.equal(
        'data: {"utc":"2025-10-06T00:00:00Z"}\n\n'
      );
    });

    it("should not write if res is already ended", () => {
      const res = new MockResponse();
      res.writableEnded = true;
      sseHelper.send(res, { test: "data" });
      expect(res.writes).to.have.lengthOf(0);
    });

    it("should send to a specific client by id", () => {
      const res = new MockResponse();
      sseHelper.addClient("target-id", res);
      const success = sseHelper.sendToClient("target-id", { msg: "hello" });
      expect(success).to.be.true;
      expect(res.writes).to.have.lengthOf(1);
      expect(res.writes[0]).to.include("hello");
    });

    it("should return false for missing client id", () => {
      const success = sseHelper.sendToClient("nonexistent", { msg: "no" });
      expect(success).to.be.false;
    });

    it("should clean up ended client on sendToClient attempt", () => {
      const res = new MockResponse();
      sseHelper.addClient("stale-id", res);
      res.writableEnded = true; // simulate ended response
      const success = sseHelper.sendToClient("stale-id", { msg: "test" });
      expect(success).to.be.false;
      expect(sseHelper.getClientCount()).to.equal(0);
    });
  });

  describe("broadcast / broadcastAndClose", () => {
    it("should broadcast to all connected clients", () => {
      const res1 = new MockResponse();
      const res2 = new MockResponse();
      sseHelper.addClient("client1", res1);
      sseHelper.addClient("client2", res2);
      sseHelper.broadcast({ event: "test" });
      expect(res1.writes).to.have.lengthOf(1);
      expect(res2.writes).to.have.lengthOf(1);
      expect(res1.writes[0]).to.include("test");
      expect(res2.writes[0]).to.include("test");
    });

    it("should broadcast and close all clients", () => {
      const res1 = new MockResponse();
      const res2 = new MockResponse();
      sseHelper.addClient("client1", res1);
      sseHelper.addClient("client2", res2);
      sseHelper.broadcastAndClose({ type: "shutdown" });
      expect(res1.writableEnded).to.be.true;
      expect(res2.writableEnded).to.be.true;
      expect(sseHelper.getClientCount()).to.equal(0);
    });
  });

  describe("cleanupStaleClients", () => {
    it("should remove clients with ended responses", () => {
      const res1 = new MockResponse();
      const res2 = new MockResponse();
      sseHelper.addClient("stale1", res1);
      sseHelper.addClient("stale2", res2);
      res1.writableEnded = true; // mark as ended
      sseHelper.cleanupStaleClients();
      expect(sseHelper.getClientCount()).to.equal(1);
      expect(sseHelper._clients.has("stale2")).to.be.true;
    });

    it("should remove clients older than maxAgeMs", (done) => {
      const res = new MockResponse();
      sseHelper.addClient("old-client", res);
      // Wait a tiny bit then prune with a low threshold
      setTimeout(() => {
        sseHelper.cleanupStaleClients(10); // 10ms max age
        expect(sseHelper.getClientCount()).to.equal(0);
        done();
      }, 20);
    });
  });

  describe("safeSerialize (internal)", () => {
    it("should serialize valid objects", () => {
      const res = new MockResponse();
      sseHelper.send(res, { key: "value", num: 42 });
      expect(res.writes[0]).to.include('"key":"value"');
      expect(res.writes[0]).to.include('"num":42');
    });

    it("should handle circular structures gracefully", () => {
      const res = new MockResponse();
      const circular = { a: 1 };
      circular.self = circular;
      sseHelper.send(res, circular);
      // Should fall back to error payload instead of throwing
      expect(res.writes).to.have.lengthOf(1);
      expect(res.writes[0]).to.include("error");
    });
  });

  describe("error handling / edge cases", () => {
    it("should handle res without once method in addClient (back-compat)", () => {
      const res = new MockResponse();
      // Remove the once method to simulate non-EventEmitter response
      delete res.once;
      const clientId = sseHelper.addClient(res);
      expect(clientId).to.be.a("string");
      expect(sseHelper.getClientCount()).to.equal(1);
      // Manual cleanup since close handler wasn't attached
      sseHelper.removeClientById(clientId);
    });

    it("should handle res.once throwing an error in addClient (back-compat)", () => {
      const res = new MockResponse();
      // Make once throw an error instead of just being missing
      res.once = () => {
        throw new Error("EventEmitter error");
      };
      const clientId = sseHelper.addClient(res);
      expect(clientId).to.be.a("string");
      expect(sseHelper.getClientCount()).to.equal(1);
      // Manual cleanup since close handler wasn't attached
      sseHelper.removeClientById(clientId);
    });

    it("should handle res without once method in addClient with clientId", () => {
      const res = new MockResponse();
      delete res.once;
      const clientId = sseHelper.addClient("no-once", res, { ip: "127.0.0.1" });
      expect(clientId).to.equal("no-once");
      expect(sseHelper.getClientCount()).to.equal(1);
      sseHelper.removeClientById("no-once");
    });

    it("should handle res.once throwing in addClient with clientId", () => {
      const res = new MockResponse();
      res.once = () => {
        throw new Error("EventEmitter error");
      };
      const clientId = sseHelper.addClient("throw-once", res, { ip: "127.0.0.1" });
      expect(clientId).to.equal("throw-once");
      expect(sseHelper.getClientCount()).to.equal(1);
      sseHelper.removeClientById("throw-once");
    });

    it("should handle re-registering same res with different clientId", () => {
      const res = new MockResponse();
      sseHelper.addClient("client-1", res);
      expect(sseHelper.getClientCount()).to.equal(1);
      // Re-register same res with different id
      sseHelper.addClient("client-2", res);
      expect(sseHelper.getClientCount()).to.equal(1);
      expect(sseHelper._clients.has("client-1")).to.be.false;
      expect(sseHelper._clients.has("client-2")).to.be.true;
    });

    it("should check old client when re-registering with not-ended response", () => {
      const res1 = new MockResponse();
      const res2 = new MockResponse();
      sseHelper.addClient("client-old", res2);
      // Now register res2 again with a different ID
      // This should trigger the path where old?.res exists and is not ended
      sseHelper.addClient("client-new", res2);
      expect(sseHelper.getClientCount()).to.equal(1);
      expect(sseHelper._clients.has("client-new")).to.be.true;
    });

    it("should handle errors when accessing old client properties", () => {
      const res1 = new MockResponse();
      const res2 = new MockResponse();
      sseHelper.addClient("client-with-error", res1);
      
      // Create a problematic old entry
      const badEntry = {
        get res() {
          throw new Error("Property getter error");
        }
      };
      sseHelper._clients.set("client-with-error", badEntry);
      sseHelper._resIndex.set(res1, "client-with-error");
      
      // Try to register with same res but different ID - should handle error gracefully
      expect(() => {
        sseHelper.addClient("new-client", res1);
      }).to.not.throw();
      
      expect(sseHelper._clients.has("new-client")).to.be.true;
    });

    it("should handle errors when ending response in removeClient", () => {
      const res = new MockResponse();
      sseHelper.addClient("error-end", res);
      // Override end to throw an error
      res.end = () => {
        throw new Error("Failed to end");
      };
      // Should not throw, just handle gracefully
      expect(() => sseHelper.removeClient(res)).to.not.throw();
      expect(sseHelper.getClientCount()).to.equal(0);
    });

    it("should handle errors when deleting from resIndex", () => {
      const res = new MockResponse();
      sseHelper.addClient("delete-error", res);
      // Mock resIndex.delete to throw (edge case)
      const originalDelete = sseHelper._resIndex.delete;
      sseHelper._resIndex.delete = () => {
        throw new Error("Delete failed");
      };
      expect(() => sseHelper.removeClient(res)).to.not.throw();
      // Restore
      sseHelper._resIndex.delete = originalDelete;
    });

    it("should handle errors when ending response in removeClientById", () => {
      const res = new MockResponse();
      sseHelper.addClient("error-end-id", res);
      res.end = () => {
        throw new Error("Failed to end");
      };
      expect(() => sseHelper.removeClientById("error-end-id")).to.not.throw();
      expect(sseHelper.getClientCount()).to.equal(0);
    });

    it("should handle write failures in send", () => {
      const res = new MockResponse();
      sseHelper.addClient("write-fail", res);
      // Make write throw an error
      res.write = () => {
        throw new Error("Write failed");
      };
      expect(() => sseHelper.send(res, { test: "data" })).to.not.throw();
      // Client should be removed after write failure
      expect(sseHelper.getClientCount()).to.equal(0);
    });

    it("should handle res.end failure after write failure in send", () => {
      const res = new MockResponse();
      sseHelper.addClient("write-and-end-fail", res);
      // Make both write and end throw errors
      res.write = () => {
        throw new Error("Write failed");
      };
      res.end = () => {
        throw new Error("End failed");
      };
      expect(() => sseHelper.send(res, { test: "data" })).to.not.throw();
      // Client should still be cleaned up
      expect(sseHelper.getClientCount()).to.equal(0);
    });

    it("should handle write failures in broadcast", () => {
      const res1 = new MockResponse();
      const res2 = new MockResponse();
      sseHelper.addClient("broadcast-1", res1);
      sseHelper.addClient("broadcast-2", res2);
      // Make res1 fail to write
      res1.write = () => {
        throw new Error("Write failed");
      };
      expect(() => sseHelper.broadcast({ msg: "test" })).to.not.throw();
      // Failed client should be removed
      expect(sseHelper.getClientCount()).to.equal(1);
      expect(sseHelper._clients.has("broadcast-2")).to.be.true;
    });

    it("should handle errors in broadcastAndClose", () => {
      const res1 = new MockResponse();
      const res2 = new MockResponse();
      sseHelper.addClient("close-1", res1);
      sseHelper.addClient("close-2", res2);
      // Make res1.end throw
      res1.end = () => {
        throw new Error("End failed");
      };
      expect(() => sseHelper.broadcastAndClose({ msg: "shutdown" })).to.not.throw();
      expect(sseHelper.getClientCount()).to.equal(0);
    });

    it("should handle errors during cleanupStaleClients iteration", () => {
      const res = new MockResponse();
      sseHelper.addClient("cleanup-error", res);
      // Create an entry that will throw when accessed
      const badEntry = {
        get res() {
          throw new Error("Property access error");
        },
        createdAt: Date.now(),
      };
      sseHelper._clients.set("bad-entry", badEntry);
      expect(() => sseHelper.cleanupStaleClients()).to.not.throw();
      // Bad entry should be removed
      expect(sseHelper._clients.has("bad-entry")).to.be.false;
    });

    it("should not write to already ended response in send", () => {
      const res = new MockResponse();
      res.writableEnded = true;
      expect(() => sseHelper.send(res, { test: "data" })).to.not.throw();
      expect(res.writes).to.have.lengthOf(0);
    });

    it("should handle missing entry in sendToClient", () => {
      const result = sseHelper.sendToClient("nonexistent", { test: "data" });
      expect(result).to.be.false;
    });

    it("should handle entry without res in sendToClient", () => {
      sseHelper._clients.set("no-res", { meta: {}, createdAt: Date.now() });
      const result = sseHelper.sendToClient("no-res", { test: "data" });
      expect(result).to.be.false;
      sseHelper._clients.delete("no-res");
    });
  });
});
