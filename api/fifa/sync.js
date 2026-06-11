export default async function handler(request, response) {
  if (request.method !== "GET") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  const competitionId = process.env.FIFA_COMPETITION_ID || "17";
  const seasonId = process.env.FIFA_SEASON_ID || "285023";
  const baseUrl = process.env.FIFA_BASE_URL || "https://api.fifa.com/api/v3";
  const url = new URL("/api/v3/calendar/matches", baseUrl);

  url.searchParams.set("language", "en");
  url.searchParams.set("count", "500");
  url.searchParams.set("idCompetition", competitionId);
  url.searchParams.set("idSeason", seasonId);

  try {
    const apiResponse = await fetch(url, {
      headers: {
        accept: "application/json",
        "user-agent": "Mozilla/5.0",
      },
    });
    const payload = await apiResponse.json();
    const fixtures = Array.isArray(payload.Results) ? payload.Results : [];

    if (!apiResponse.ok) {
      sendJson(response, apiResponse.status, {
        error: "FIFA returned an error.",
        details: payload,
      });
      return;
    }

    sendJson(response, 200, {
      source: "fifa",
      competitionId,
      seasonId,
      fetchedAt: new Date().toISOString(),
      fixtures,
      apiMeta: {
        results: fixtures.length,
        continuationToken: payload.ContinuationToken,
      },
    });
  } catch (error) {
    sendJson(response, 500, {
      error: "Could not connect to FIFA.",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

function sendJson(response, statusCode, body) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(body));
}
