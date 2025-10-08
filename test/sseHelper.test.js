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
});
