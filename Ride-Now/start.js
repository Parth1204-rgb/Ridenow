import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isWin = process.platform === "win32";

const RESET = "\x1b[0m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const BOLD = "\x1b[1m";
const RED = "\x1b[31m";

function tag(name, color) {
  return `${color}${BOLD}[${name}]${RESET} `;
}

function startProcess(name, color, cmd, args, cwd, env) {
  const t = tag(name, color);
  const proc = spawn(cmd, args, {
    cwd: path.resolve(__dirname, cwd),
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
    shell: isWin,
  });

  proc.stdout.on("data", (data) => {
    data.toString().split("\n").filter(Boolean).forEach((line) => {
      process.stdout.write(t + line + "\n");
    });
  });

  proc.stderr.on("data", (data) => {
    data.toString().split("\n").filter(Boolean).forEach((line) => {
      process.stderr.write(t + line + "\n");
    });
  });

  proc.on("exit", (code) => {
    if (code != null && code !== 0) {
      console.error(`${RED}${BOLD}[${name}] process exited with code ${code}${RESET}`);
    }
  });

  return proc;
}

console.log(`\n${BOLD}RideNow${RESET} — starting development servers\n`);

// Resolve npx/npm binary
const npx = isWin ? "npx.cmd" : "npx";

// Start API server with tsx (no build step needed locally)
const api = startProcess(
  "API  :8080",
  YELLOW,
  npx,
  ["tsx", "src/index.ts"],
  "artifacts/api-server",
  { PORT: "8080", NODE_ENV: "development" }
);

// Give the API server a moment to start before the frontend
setTimeout(() => {
  const web = startProcess(
    "Web  :5173",
    CYAN,
    npx,
    ["vite", "--config", "vite.config.ts", "--host", "0.0.0.0", "--port", "5173"],
    "artifacts/ridenow",
    { PORT: "5173" }
  );

  console.log(
    `\n${BOLD}Ready:${RESET} open ${CYAN}http://localhost:5173${RESET} in your browser\n`
  );

  function shutdown() {
    web.kill();
    api.kill();
    process.exit(0);
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}, 1000);

process.on("SIGINT", () => {
  api.kill();
  process.exit(0);
});
