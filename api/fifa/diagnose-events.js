import { diagnoseFifaEventData } from "../_fifaSync.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  const params = new URL(request.url || "", "http://localhost").searchParams;
  const matchCentreUrl = request.query?.url || params.get("url");
  const search = request.query?.search || params.get("search") || "";

  if (!matchCentreUrl || !String(matchCentreUrl).startsWith("https://www.fifa.com/")) {
    sendJson(response, 400, {
      error: "Add a FIFA match-centre URL using ?url=https://www.fifa.com/...",
    });
    return;
  }

  try {
    sendJson(response, 200, await diagnoseFifaEventData(String(matchCentreUrl), String(search)));
  } catch (error) {
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : "Could not diagnose FIFA event data.",
      details: String(error),
    });
  }
}

function sendJson(response, statusCode, body) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.setHeader("Cache-Control", "no-store, max-age=0");
  response.end(JSON.stringify(body));
}
