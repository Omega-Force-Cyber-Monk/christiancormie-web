import test from "node:test";
import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import {
  createSocketService,
  messagingSocketUrl,
  socketTokenDeadline,
} from "./socket.ts";
import { FakeSocket } from "./socket.test-fixtures.mjs";
const jwt = (exp) =>
  `header.${globalThis.btoa(JSON.stringify({ exp })).replaceAll("=", "")}.signature`;
test("messaging namespace, token auth and bounded reconnect configuration", () => {
  const s = new FakeSocket();
  let count = 0;
  const service = createSocketService((url, options) => {
    count++;
    assert.equal(url, "https://example.invalid/messaging");
    assert.deepEqual(options.auth, { token: "test-token" });
    assert.equal(options.autoConnect, false);
    assert.equal(options.reconnectionAttempts, 5);
    assert.equal(options.forceNew, true);
    return s;
  }, "https://example.invalid/api/v1/");
  const release = service.acquire("test-token", "session:user:CUSTOMER");
  assert.equal(count, 1);
  assert.equal(service.getSnapshot().status, "connecting");
  s.server("connect");
  assert.equal(service.getSnapshot().status, "connected");
  release();
  assert.equal(service.getSocket(), null);
});
test("connecting/reconnecting owners share a socket; reference-counted unmount is idempotent", () => {
  let count = 0;
  const s = new FakeSocket();
  const service = createSocketService(() => {
    count++;
    return s;
  }, "https://example.invalid");
  const a = service.acquire("a", "owner");
  const b = service.acquire("a", "owner");
  assert.equal(count, 1);
  s.io.emit("reconnect_attempt");
  assert.equal(service.getSnapshot().status, "reconnecting");
  assert.equal(service.connect("a", "owner"), s);
  a();
  a();
  assert.equal(service.getSocket(), s);
  b();
  assert.equal(service.getSocket(), null);
  assert.equal(s.io.listenerCount("reconnect_attempt"), 0);
});
test("token rotation and account replacement dispose captured socket; old releases cannot close new account", () => {
  const sockets = [];
  const service = createSocketService(() => {
    const s = new FakeSocket();
    sockets.push(s);
    return s;
  }, "https://example.invalid");
  const old = service.acquire("old", "customer");
  const rotate = service.acquire("fresh", "customer");
  assert.equal(sockets.length, 2);
  assert.ok(sockets[0].disconnections);
  const account = service.acquire("other", "vendor");
  old();
  rotate();
  assert.equal(service.getSocket(), sockets[2]);
  assert.equal(service.getSnapshot().owner, "vendor");
  account();
});
test("subscription cleanup removes listener from the captured instance", () => {
  const sockets = [];
  const service = createSocketService(() => {
    const s = new FakeSocket();
    sockets.push(s);
    return s;
  }, "https://example.invalid");
  service.connect("a", "a");
  let oldCalls = 0;
  const remove = service.subscribe("message:new", () => oldCalls++);
  const oldSocket = sockets[0];
  service.connect("b", "b");
  let newCalls = 0;
  service.subscribe("message:new", () => newCalls++);
  remove();
  oldSocket.server("message:new", {});
  sockets[1].server("message:new", {});
  assert.equal(oldCalls, 0);
  assert.equal(newCalls, 1);
  service.disconnect();
});
test("missing/invalid URL is HTTP-only and never invokes transport", () => {
  for (const url of ["", "invalid", "file:///private"]) {
    const service = createSocketService(() => {
      throw new Error("Must not connect");
    }, url);
    const release = service.acquire("token", "owner");
    assert.equal(service.getSnapshot().status, "unavailable");
    release();
  }
  assert.equal(
    messagingSocketUrl("https://example.invalid/messaging/"),
    "https://example.invalid/messaging",
  );
});
test("authentication errors disconnect; exhausted retries wait for explicit recovery", () => {
  const s = new FakeSocket();
  const service = createSocketService(() => s, "https://example.invalid");
  const release = service.acquire("token", "owner");
  s.server("connect");
  s.server("error", { message: "Invalid or expired access token" });
  assert.equal(service.getSnapshot().status, "error");
  assert.equal(s.connected, false);
  const count = s.connections;
  service.retry("other-token", "owner");
  assert.equal(s.connections, count);
  service.retry("token", "owner");
  assert.equal(s.connections, count + 1);
  s.io.emit("reconnect_failed");
  assert.equal(service.getSnapshot().status, "error");
  release();
});
test("JWT expiry is advisory metadata, stops realtime and never invents identity", async () => {
  assert.equal(socketTokenDeadline("opaque"), null);
  assert.equal(socketTokenDeadline(jwt("bad")), null);
  assert.equal(socketTokenDeadline(jwt(123)), 123000);
  const s = new FakeSocket();
  const service = createSocketService(() => s, "https://example.invalid");
  const release = service.acquire(jwt(Math.floor(Date.now() / 1000) - 1), "owner");
  assert.equal(service.getSnapshot().status, "expired");
  assert.equal(s.connections, 0);
  service.retry("no", "owner");
  assert.equal(s.connections, 0);
  release();
  const deadline = Math.floor(Date.now() / 1000) + 1;
  const second = service.acquire(jwt(deadline), "owner");
  s.server("connect");
  await delay(Math.max(1, deadline * 1000 - Date.now() + 20));
  assert.equal(service.getSnapshot().status, "expired");
  assert.equal(s.connected, false);
  second();
});
