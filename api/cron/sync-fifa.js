import { syncFifaFixturesToSupabase } from "../_fifaSync.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.authorization || "";

  if (cronSecret && authorization !== `Bearer ${cronSecret}`) {
    sendJson(response, 401, { error: "Unauthorized cron request." });
    return;
  }

  try {
    const result = await syncFifaFixturesToSupabase();

    sendJson(response, 200, {
      ok: true,
      fetchedAt: result.fetchedAt,
      fifaFixtureCount: result.fixtures.length,
      updatedFixtureCount: result.updatedFixtureCount,
      completedFixtureCount: result.completedFixtureCount,
    });
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      ok: false,
      error: error instanceof Error ? error.message : "Could not sync FIFA fixtures.",
      details: error.details || String(error),
    });
  }
}

function sendJson(response, statusCode, body) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(body));
}
