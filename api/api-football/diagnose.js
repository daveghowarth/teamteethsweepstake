import { fetchApiFootballFixturesWithEvents } from "../_apiFootballSync.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  try {
    const payload = await fetchApiFootballFixturesWithEvents();

    sendJson(response, 200, {
      ok: true,
      keyConfigured: Boolean(process.env.API_FOOTBALL_KEY),
      leagueId: payload.leagueId,
      configuredLeagueId: payload.configuredLeagueId || payload.leagueId,
      season: payload.season,
      fixtureCount: payload.fixtures?.length || 0,
      eventFixtureCount: payload.apiMeta?.eventFixtureCount || 0,
      requestUrl: payload.apiMeta?.requestUrl || null,
      firstRequestUrl: payload.apiMeta?.firstRequestUrl || null,
      firstResults: payload.apiMeta?.firstResults ?? null,
      message: payload.message || null,
      diagnostics: payload.apiMeta?.diagnostics || null,
      sampleFixture: payload.fixtures?.[0]
        ? {
            id: payload.fixtures[0].fixture?.id,
            date: payload.fixtures[0].fixture?.date,
            status: payload.fixtures[0].fixture?.status,
            home: payload.fixtures[0].teams?.home?.name,
            away: payload.fixtures[0].teams?.away?.name,
            eventCount: payload.fixtures[0].events?.length || 0,
          }
        : null,
    });
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      ok: false,
      keyConfigured: Boolean(process.env.API_FOOTBALL_KEY),
      error: error instanceof Error ? error.message : "Could not diagnose API-Football.",
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
