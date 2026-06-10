import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const appDir = path.join(rootDir, "app");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

function getPort() {
  const argvPort = process.argv.find((arg) => arg.startsWith("--port="));
  if (argvPort) return Number(argvPort.split("=")[1]);
  return Number(process.env.PORT || 4173);
}

function isExplicitPort() {
  return process.argv.some((arg) => arg.startsWith("--port=")) || Boolean(process.env.PORT);
}

function safeResolve(urlPath) {
  const cleaned = decodeURIComponent(urlPath.split("?")[0]);
  const candidate = cleaned === "/" ? "/index.html" : cleaned;
  const normalized = path.normalize(candidate).replace(/^(\.\.[/\\])+/, "");
  const fromApp = path.join(appDir, normalized);
  const fromRoot = path.join(rootDir, normalized);

  if (fromApp.startsWith(appDir)) {
    return { absolutePath: fromApp, fallbackPath: fromRoot };
  }

  return { absolutePath: appDir, fallbackPath: fromRoot };
}

async function serveFile(filePath, response) {
  const extension = path.extname(filePath).toLowerCase();
  const body = await readFile(filePath);
  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Type": mimeTypes[extension] || "application/octet-stream"
  });
  response.end(body);
}

const server = createServer(async (request, response) => {
  try {
    if ((request.url || "/").split("?")[0] === "/favicon.ico") {
      response.writeHead(204);
      response.end();
      return;
    }

    const { absolutePath, fallbackPath } = safeResolve(request.url || "/");

    try {
      const fileStat = await stat(absolutePath);
      if (fileStat.isFile()) {
        await serveFile(absolutePath, response);
        return;
      }
    } catch {
      // Fall through to the root-level lookup.
    }

    const fallbackStat = await stat(fallbackPath);
    if (fallbackStat.isFile()) {
      await serveFile(fallbackPath, response);
      return;
    }

    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  } catch (error) {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(`Server error: ${error.message}`);
  }
});

function listenWithRetry(startPort, explicitPort) {
  const host = "127.0.0.1";
  let currentPort = startPort;

  server.once("listening", () => {
    const address = server.address();
    const resolvedPort = typeof address === "object" && address ? address.port : currentPort;
    console.log(`Preview server running at http://${host}:${resolvedPort}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && !explicitPort) {
      const nextPort = currentPort + 1;
      console.warn(`Port ${currentPort} is busy, retrying on ${nextPort}...`);
      currentPort = nextPort;
      server.listen(currentPort, host);
      return;
    }

    throw error;
  });

  server.listen(currentPort, host);
}

listenWithRetry(getPort(), isExplicitPort());
