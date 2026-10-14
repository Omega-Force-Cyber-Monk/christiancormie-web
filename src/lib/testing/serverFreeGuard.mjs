import http from "node:http";
import https from "node:https";
import http2 from "node:http2";
import net from "node:net";
import tls from "node:tls";
import dgram from "node:dgram";
import { syncBuiltinESMExports } from "node:module";

// Installed before build/test imports. Tests must replace fetch with a local stub.
const blocked = () => {
  throw new Error("Regression tests cannot initialize servers or use real network I/O");
};

for (const [module, methods] of [
  [http, ["createServer", "request", "get"]],
  [https, ["createServer", "request", "get"]],
  [http2, ["createServer", "createSecureServer", "connect"]],
  [net, ["createServer", "connect", "createConnection"]],
  [tls, ["createServer", "connect"]],
  [dgram, ["createSocket"]],
]) {
  for (const method of methods) module[method] = blocked;
}
net.Server.prototype.listen = blocked;
net.Socket.prototype.connect = blocked;
globalThis.fetch = blocked;
syncBuiltinESMExports();
