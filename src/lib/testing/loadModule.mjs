import { after } from "node:test";
import { fileURLToPath, URL } from "node:url";
import { createServer } from "vite";

// Use the existing Vite transformer for TS/TSX and aliases; no test dependency needed.
const server = await createServer({
  configFile: false,
  envFile: false,
  logLevel: "error",
  resolve: { alias: { "@": fileURLToPath(new URL("../../", import.meta.url)) } },
  define: { "import.meta.env.VITE_ENABLE_MOCK_AUTH": '"false"' },
  server: { middlewareMode: true, hmr: false, ws: false, watch: null },
});

after(() => server.close());

export const loadModule = (path) => server.ssrLoadModule(path);
