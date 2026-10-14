import "./serverFreeGuard.mjs";
import { mkdir, mkdtemp, readdir, rm } from "node:fs/promises";
import { resolve, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL, URL } from "node:url";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { build } from "vite";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const sourceRoot = resolve(root, "src");
const isTest = (path) => /\.(test|regression)\.mjs$/.test(path);

async function discover(directory) {
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) paths.push(...(await discover(path)));
    else if (entry.isFile() && isTest(path)) paths.push(path);
  }
  return paths;
}

// Explicit paths select tests; remaining arguments are Node test-runner flags.
const args = process.argv.slice(2);
const selected = args.filter((arg) => !arg.startsWith("--"));
const flags = args.filter((arg) => arg.startsWith("--"));
if (flags.some((flag) => !/^--test-(name-pattern|reporter|timeout)=/.test(flag))) {
  throw new Error(
    "Supported flags: --test-name-pattern=, --test-reporter=, --test-timeout=",
  );
}
const tests = selected.length
  ? [...new Set(selected.map((path) => resolve(root, path)))].sort()
  : (await discover(sourceRoot)).sort();
if (!tests.length) throw new Error("No regression tests found");
for (const path of tests) {
  if (!path.startsWith(sourceRoot + sep) || !isTest(path)) {
    throw new Error("Select .test.mjs or .regression.mjs files inside src");
  }
}

const tempRoot = resolve(root, "node_modules/.tmp/regression-tests");
await mkdir(tempRoot, { recursive: true });
const output = await mkdtemp(resolve(tempRoot, "run-"));
if (!output.startsWith(tempRoot + sep)) throw new Error("Unsafe test output path");
try {
  const input = Object.fromEntries(
    tests.map((path) => [relative(sourceRoot, path).replaceAll(sep, "/"), path]),
  );
  // Reuse the actual Vite config/plugins for TSX, @ aliases, CSS and asset imports.
  // Only production build is invoked: no createServer, preview, watcher or browser.
  await build({
    root,
    configFile: resolve(root, "vite.config.ts"),
    envDir: false,
    mode: "test",
    logLevel: "warn",
    define: {
      "import.meta.env.VITE_API_BASE_URL": JSON.stringify(
        "https://example.invalid/api/v1",
      ),
      "import.meta.env.VITE_SOCKET_URL": JSON.stringify(""),
      "import.meta.env.VITE_ENABLE_MOCK_AUTH": JSON.stringify("false"),
    },
    build: {
      ssr: true,
      watch: null,
      outDir: output,
      emptyOutDir: false,
      sourcemap: true,
      rolldownOptions: { input, output: { entryFileNames: "[name]" } },
    },
  });
  const result = spawnSync(
    process.execPath,
    [
      "--enable-source-maps",
      "--import",
      pathToFileURL(resolve(root, "src/lib/testing/serverFreeGuard.mjs")).href,
      "--test",
      ...flags,
      ...Object.keys(input).map((name) => resolve(output, name)),
    ],
    { cwd: root, stdio: "inherit", env: { ...process.env, NODE_ENV: "test" } },
  );
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  // Only remove the unique directory created above, inside this workspace's cache.
  await rm(output, { recursive: true, force: true });
}
