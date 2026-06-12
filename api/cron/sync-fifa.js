import { syncFifaFixturesToSupabase } from "../_fifaSync.js";
import { syncApiFootballEventsToSupabase } from "../_apiFootballSync.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.authorization || "";
  const userAgent = request.headers["user-agent"] || "";
  const isVercelCron = userAgent.includes("vercel-cron/1.0");
  const hasValidSecret = cronSecret && authorization === `Bearer ${cronSecret}`;

  if (!isVercelCron && !hasValidSecret) {
    sendJson(response, 401, { error: "Unauthorized cron request." });
    return;
  }

  try {
    const fifaResult = await syncFifaFixturesToSupabase();
    const apiFootballResult = await trySyncApiFootballEvents();

    sendJson(response, 200, {
      ok: true,
      fetchedAt: fifaResult.fetchedAt,
      fifaFixtureCount: fifaResult.fixtures.length,
      fifaMatchCentreStatCount: fifaResult.apiMeta?.matchCentreStatCount || 0,
      apiFootball: apiFootballResult,
      updatedFixtureCount: fifaResult.updatedFixtureCount,
      completedFixtureCount: fifaResult.completedFixtureCount,
    });
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      ok: false,
      error: error instanceof Error ? error.message : "Could not sync FIFA fixtures.",
      details: error.details || String(error),
    });
  }
}

async function trySyncApiFootballEvents() {
  if (!process.env.API_FOOTBALL_KEY) {
    return {
      ok: false,
      skipped: true,
      reason: "API_FOOTBALL_KEY is not set.",
    };
  }

  try {
    const result = await syncApiFootballEventsToSupabase();

    return {
      ok: true,
      fetchedAt: result.fetchedAt,
      fixtureCount: result.fixtures.length,
      eventFixtureCount: result.eventFixtureCount,
    };
  } catch (error) {
    return {
      ok: false,
      skipped: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

function sendJson(response, statusCode, body) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.setHeader("Cache-Control", "no-store, max-age=0");
  response.end(JSON.stringify(body));
}
