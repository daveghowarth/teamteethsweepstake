import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createServer as createViteServer } from "vite";

const root = process.cwd();
loadLocalEnv(path.join(root, ".env"));

const port = Number(process.env.PORT || 5173);
const vite = await createViteServer({
  root,
  server: {
    host: "127.0.0.1",
    middlewareMode: true,
    hmr: false,
  },
  appType: "spa",
});

const server = http.createServer(async (req, res) => {
  if (req.url?.startsWith("/api/api-football/sync")) {
    await handleApiFootballSync(res);
    return;
  }

  vite.middlewares(req, res);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`World Cup app running at http://127.0.0.1:${port}`);
});

async function handleApiFootballSync(res) {
  try {
    const { fetchApiFootballFixturesWithEvents } = await import("./api/_apiFootballSync.js");
    sendJson(res, 200, await fetchApiFootballFixturesWithEvents());
  } catch (error) {
    sendJson(res, error.statusCode || 500, {
      error: error instanceof Error ? error.message : "Could not connect to API-Football.",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
  });
  res.end(JSON.stringify(body));
}

function hasApiFootballErrors(errors) {
  if (!errors) return false;
  if (Array.isArray(errors)) return errors.length > 0;
  return Object.keys(errors).length > 0;
}

function formatApiFootballErrors(errors) {
  if (typeof errors === "string") return errors;
  if (Array.isArray(errors)) return errors.join(", ");

  return Object.entries(errors)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
}

function loadLocalEnv(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    const rawValue = trimmed.slice(equalsIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}
