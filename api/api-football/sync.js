import { fetchApiFootballFixturesWithEvents } from "../_apiFootballSync.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  try {
    sendJson(response, 200, await fetchApiFootballFixturesWithEvents());
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: error instanceof Error ? error.message : "Could not connect to API-Football.",
      details: error.details || String(error),
    });
  }
}

function sendJson(response, statusCode, body) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.setHeader("Cache-Control", "no-store, max-age=0");
  response.end(JSON.stringify(body));
}
