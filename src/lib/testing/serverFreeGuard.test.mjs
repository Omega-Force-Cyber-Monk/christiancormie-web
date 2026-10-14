import assert from "node:assert/strict";
import test from "node:test";
import http from "node:http";
import { createServer } from "node:https";
import net from "node:net";

test("the runner rejects server creation and unmocked network access before initialization", () => {
  for (const action of [
    () => http.createServer(),
    () => createServer(),
    () => net.createConnection({ port: 1 }),
    () => globalThis.fetch("https://example.invalid"),
  ])
    assert.throws(action, /cannot initialize servers or use real network/);
});
