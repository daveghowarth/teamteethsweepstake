import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), sportsDataProxy(env)],
    server: {
      host: "127.0.0.1",
    },
  };
});

function sportsDataProxy(env) {
  return {
    name: "sports-data-local-proxy",
    configureServer(server) {
      server.middlewares.use("/api/api-football/sync", async (_req, res) => {
        Object.assign(process.env, env);

        try {
          const { fetchApiFootballFixturesWithEvents } = await import("./api/_apiFootballSync.js");
          sendJson(res, 200, await fetchApiFootballFixturesWithEvents());
        } catch (error) {
          sendJson(res, error.statusCode || 500, {
            error: error instanceof Error ? error.message : "Could not connect to API-Football.",
            details: error instanceof Error ? error.message : String(error),
          });
        }
      });

      server.middlewares.use("/api/fifa/sync", async (_req, res) => {
        const competitionId = env.FIFA_COMPETITION_ID || "17";
        const seasonId = env.FIFA_SEASON_ID || "285023";
        const baseUrl = env.FIFA_BASE_URL || "https://api.fifa.com/api/v3";
        const url = new URL("/api/v3/calendar/matches", baseUrl);
        url.searchParams.set("language", "en");
        url.searchParams.set("count", "500");
        url.searchParams.set("idCompetition", competitionId);
        url.searchParams.set("idSeason", seasonId);

        try {
          const response = await fetch(url, {
            headers: {
              accept: "application/json",
              "user-agent": "Mozilla/5.0",
            },
          });
          const payload = await response.json();
          const fixtures = Array.isArray(payload.Results) ? payload.Results : [];

          if (!response.ok) {
            sendJson(res, response.status, {
              error: "FIFA returned an error.",
              details: payload,
            });
            return;
          }

          sendJson(res, 200, {
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
          sendJson(res, 500, {
            error: "Could not connect to FIFA.",
            details: error instanceof Error ? error.message : String(error),
          });
        }
      });

      server.middlewares.use("/api/thesportsdb/sync", async (_req, res) => {
        const apiKey = env.THESPORTSDB_KEY || "123";
        const leagueId = env.THESPORTSDB_LEAGUE_ID || "4429";
        const season = env.THESPORTSDB_SEASON || "2026";
        const baseUrl = env.THESPORTSDB_BASE_URL || "https://www.thesportsdb.com/api/v1/json";
        const url = `${baseUrl}/${apiKey}/eventsseason.php?id=${encodeURIComponent(
          leagueId
        )}&s=${encodeURIComponent(season)}`;

        try {
          const response = await fetch(url);
          const payload = await response.json();
          const events = Array.isArray(payload.events) ? payload.events : [];

          if (!response.ok) {
            sendJson(res, response.status, {
              error: "TheSportsDB returned an error.",
              details: payload,
            });
            return;
          }

          sendJson(res, 200, {
            source: "thesportsdb",
            leagueId,
            season,
            fetchedAt: new Date().toISOString(),
            fixtures: events,
            apiMeta: {
              results: events.length,
            },
          });
        } catch (error) {
          sendJson(res, 500, {
            error: "Could not connect to TheSportsDB.",
            details: error instanceof Error ? error.message : String(error),
          });
        }
      });
    },
  };
}

function sendJson(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
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
