import { EventEmitter } from "node:events";
export class FakeSocket {
  connected = false;
  active = false;
  connections = 0;
  disconnections = 0;
  sent = [];
  handlers = new Map();
  io = new EventEmitter();
  on(name, handler) {
    const list = this.handlers.get(name) ?? new Set();
    list.add(handler);
    this.handlers.set(name, list);
    return this;
  }
  off(name, handler) {
    this.handlers.get(name)?.delete(handler);
    return this;
  }
  removeAllListeners() {
    this.handlers.clear();
    return this;
  }
  connect() {
    this.connections++;
    this.active = true;
    return this;
  }
  disconnect() {
    const live = this.connected || this.active;
    this.disconnections++;
    this.connected = false;
    this.active = false;
    if (live) this.server("disconnect", "io client disconnect");
    return this;
  }
  emit(name, payload) {
    this.sent.push({ name, payload });
    return this;
  }
  server(name, payload) {
    if (name === "connect") {
      this.connected = true;
      this.active = true;
    }
    if (name === "disconnect") this.connected = false;
    for (const f of [...(this.handlers.get(name) ?? [])]) f(payload);
  }
}
