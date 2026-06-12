const stateId = "live";
const playedStatusCodes = new Set(["1H", "HT", "2H", "ET", "BT", "P", "SUSP", "INT", "FT", "AET", "PEN"]);

export async function fetchApiFootballFixturesWithEvents() {
  const config = getApiFootballConfig();
  let fixturesPayload = await fetchFixturesForLeague(config, config.leagueId);
  const fixtures = Array.isArray(fixturesPayload.response) ? fixturesPayload.response : [];

  if (!fixtures.length) {
    const discoveryResult = await tryDiscoverWorldCupFixtures(config);

    if (discoveryResult?.fixtures?.length) {
      fixturesPayload = discoveryResult.payload;
      const fixturesWithEvents = await addDetailsToPlayedFixtures(discoveryResult.fixtures, config);

      return {
        source: "api-football",
        leagueId: discoveryResult.leagueId,
        configuredLeagueId: config.leagueId,
        season: config.season,
        fetchedAt: new Date().toISOString(),
        fixtures: fixturesWithEvents,
        apiMeta: {
          results: fixturesWithEvents.length,
          eventFixtureCount: fixturesWithEvents.filter((fixture) => Array.isArray(fixture.events)).length,
          errors: fixturesPayload.errors || null,
          discoveredLeague: discoveryResult.leagueSummary,
        },
      };
    }

    const diagnostics = await getLeagueDiagnostics(config);

    return {
      source: "api-football",
      leagueId: config.leagueId,
      season: config.season,
      fetchedAt: new Date().toISOString(),
      fixtures: [],
      message: buildNoFixturesMessage(config, diagnostics),
      apiMeta: {
        results: 0,
        eventFixtureCount: 0,
        errors: fixturesPayload.errors || null,
        requestUrl: fixturesPayload.requestUrl || null,
        firstRequestUrl: fixturesPayload.firstRequestUrl || null,
        firstResults: fixturesPayload.firstResults ?? null,
        diagnostics,
      },
    };
  }

  const fixturesWithEvents = await addDetailsToPlayedFixtures(fixtures, config);

  return {
    source: "api-football",
    leagueId: config.leagueId,
    season: config.season,
    fetchedAt: new Date().toISOString(),
    fixtures: fixturesWithEvents,
    apiMeta: {
      results: fixturesWithEvents.length,
      eventFixtureCount: fixturesWithEvents.filter((fixture) => Array.isArray(fixture.events)).length,
      errors: fixturesPayload.errors || null,
      requestUrl: fixturesPayload.requestUrl || null,
    },
  };
}

export async function syncApiFootballEventsToSupabase() {
  const supabase = getSupabaseConfig();
  const currentTournament = await loadLiveTournament(supabase);
  const apiPayload = await fetchApiFootballFixturesWithEvents();

  if (!currentTournament?.teams || !currentTournament?.fixtures) {
    throw new Error("Live tournament data is missing teams or fixtures.");
  }

  if (!apiPayload.fixtures.length) {
    throw new Error("API-Football returned no fixtures for the configured league and season.");
  }

  const nextTournament = mergeApiFootballEventsIntoTournament(currentTournament, apiPayload);
  const savedTournament = await saveLiveTournament(supabase, nextTournament);

  return {
    ...apiPayload,
    savedTournament,
    updatedFixtureCount: nextTournament.fixtures.length,
    eventFixtureCount: apiPayload.fixtures.filter((fixture) => Array.isArray(fixture.events)).length,
  };
}

export function mergeApiFootballEventsIntoTournament(tournament, apiPayload) {
  return {
    ...tournament,
    fixtures: tournament.fixtures.map((fixture) => {
      const apiFixture = findMatchingApiFixture(fixture, apiPayload.fixtures);
      if (!apiFixture) return fixture;

      const eventStats = calculateEventStats(apiFixture);
      const apiHomeScore = normaliseScore(apiFixture.goals?.home);
      const apiAwayScore = normaliseScore(apiFixture.goals?.away);
      const apiFixtureId = apiFixture.fixture?.id || fixture.apiFootballFixtureId || null;

      return {
        ...fixture,
        apiFootballFixtureId: apiFixtureId,
        homeScore: apiHomeScore ?? fixture.homeScore ?? null,
        awayScore: apiAwayScore ?? fixture.awayScore ?? null,
        homeYellowCards: eventStats.home.yellowCards ?? fixture.homeYellowCards ?? 0,
        homeRedCards: eventStats.home.redCards ?? fixture.homeRedCards ?? 0,
        awayYellowCards: eventStats.away.yellowCards ?? fixture.awayYellowCards ?? 0,
        awayRedCards: eventStats.away.redCards ?? fixture.awayRedCards ?? 0,
        homePenaltiesWon: eventStats.home.penaltiesWon ?? fixture.homePenaltiesWon ?? 0,
        homePenaltiesConceded: eventStats.away.penaltiesWon ?? fixture.homePenaltiesConceded ?? 0,
        awayPenaltiesWon: eventStats.away.penaltiesWon ?? fixture.awayPenaltiesWon ?? 0,
        awayPenaltiesConceded: eventStats.home.penaltiesWon ?? fixture.awayPenaltiesConceded ?? 0,
        apiFootballStatus: apiFixture.fixture?.status?.short || fixture.apiFootballStatus || null,
      };
    }),
    apiFootballSync: {
      source: apiPayload.source,
      leagueId: apiPayload.leagueId,
      season: apiPayload.season,
      fetchedAt: apiPayload.fetchedAt,
      fixtureCount: apiPayload.fixtures.length,
      eventFixtureCount: apiPayload.apiMeta?.eventFixtureCount || 0,
    },
    updatedAt: new Date().toISOString(),
  };
}

async function addDetailsToPlayedFixtures(fixtures, config) {
  const playedFixtures = fixtures.filter(shouldFetchEventsForFixture);
  const detailsByFixtureId = new Map();

  for (const batch of chunkArray(playedFixtures, 20)) {
    const fixtureIds = batch.map((fixture) => fixture.fixture?.id).filter(Boolean).join("-");
    if (!fixtureIds) continue;

    const detailsUrl = new URL("/fixtures", config.baseUrl);
    detailsUrl.searchParams.set("ids", fixtureIds);

    try {
      const detailsPayload = await requestApiFootball(detailsUrl, config.apiKey);

      for (const detailedFixture of detailsPayload.response || []) {
        if (detailedFixture.fixture?.id) {
          detailsByFixtureId.set(detailedFixture.fixture.id, detailedFixture);
        }
      }
    } catch (error) {
      for (const fixture of batch) {
        detailsByFixtureId.set(fixture.fixture?.id, {
          ...fixture,
          events: [],
          eventsError: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  return fixtures.map((fixture) => {
    const detailedFixture = detailsByFixtureId.get(fixture.fixture?.id);
    return detailedFixture ? { ...fixture, ...detailedFixture } : fixture;
  });
}

async function fetchFixturesForLeague(config, leagueId) {
  const fixturesUrl = new URL("/fixtures", config.baseUrl);

  fixturesUrl.searchParams.set("league", leagueId);
  fixturesUrl.searchParams.set("season", config.season);
  fixturesUrl.searchParams.set("timezone", "Europe/London");

  const payload = await requestApiFootball(fixturesUrl, config.apiKey);
  const fixtures = Array.isArray(payload.response) ? payload.response : [];

  if (fixtures.length) {
    return {
      ...payload,
      requestUrl: fixturesUrl.toString(),
    };
  }

  const plainFixturesUrl = new URL("/fixtures", config.baseUrl);
  plainFixturesUrl.searchParams.set("league", leagueId);
  plainFixturesUrl.searchParams.set("season", config.season);

  const plainPayload = await requestApiFootball(plainFixturesUrl, config.apiKey);

  return {
    ...plainPayload,
    requestUrl: plainFixturesUrl.toString(),
    firstRequestUrl: fixturesUrl.toString(),
    firstResults: payload.results || 0,
  };
}

async function tryDiscoverWorldCupFixtures(config) {
  const diagnostics = await getLeagueDiagnostics(config);
  const candidates = diagnostics.worldCupCandidates.filter((candidate) =>
    candidate.seasons.includes(Number(config.season))
  );

  for (const candidate of candidates.slice(0, 8)) {
    if (String(candidate.id) === String(config.leagueId)) continue;

    try {
      const payload = await fetchFixturesForLeague(config, String(candidate.id));
      const fixtures = Array.isArray(payload.response) ? payload.response : [];

      if (fixtures.length) {
        return {
          leagueId: String(candidate.id),
          leagueSummary: candidate,
          fixtures,
          payload,
        };
      }
    } catch {
      // Keep trying other candidates. The final diagnostics will explain what was found.
    }
  }

  return null;
}

async function getLeagueDiagnostics(config) {
  const diagnostics = {
    configuredLeague: null,
    worldCupCandidates: [],
  };

  try {
    const configuredUrl = new URL("/leagues", config.baseUrl);
    configuredUrl.searchParams.set("id", config.leagueId);
    const configuredPayload = await requestApiFootball(configuredUrl, config.apiKey);
    diagnostics.configuredLeague = summariseLeague(configuredPayload.response?.[0]);
  } catch (error) {
    diagnostics.configuredLeagueError = error instanceof Error ? error.message : String(error);
  }

  const searchTerms = ["world cup", "fifa world cup", "fifa"];
  const candidatesById = new Map();
  const searchErrors = [];

  for (const term of searchTerms) {
    try {
      const searchUrl = new URL("/leagues", config.baseUrl);
      searchUrl.searchParams.set("search", term);
      const searchPayload = await requestApiFootball(searchUrl, config.apiKey);

      for (const candidate of (searchPayload.response || []).map(summariseLeague).filter(Boolean)) {
        candidatesById.set(candidate.id, candidate);
      }
    } catch (error) {
      searchErrors.push(`${term}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  diagnostics.worldCupCandidates = [...candidatesById.values()]
    .filter((candidate) => candidate.name.toLowerCase().includes("world cup"))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (searchErrors.length) {
    diagnostics.worldCupSearchError = searchErrors.join("; ");
  }

  return diagnostics;
}

function buildNoFixturesMessage(config, diagnostics) {
  const usefulCandidates = diagnostics.worldCupCandidates
    .filter((candidate) => candidate.seasons?.length)
    .slice(0, 8)
    .map((candidate) => `${candidate.name} (ID ${candidate.id}, seasons ${candidate.seasons.join(", ")})`);

  let message = `API-Football returned no fixtures for league ${config.leagueId}, season ${config.season}.`;

  if (diagnostics.configuredLeague) {
    message += ` League ${config.leagueId} is "${diagnostics.configuredLeague.name}" with seasons ${
      diagnostics.configuredLeague.seasons.join(", ") || "not listed"
    }.`;
  }

  if (usefulCandidates.length) {
    message += ` World Cup options found: ${usefulCandidates.join("; ")}.`;
  } else if (diagnostics.worldCupSearchError) {
    message += ` The World Cup search also failed: ${diagnostics.worldCupSearchError}.`;
  } else {
    message += " API-Football did not list any World Cup candidates from the search endpoint.";
  }

  message += " If no listed option includes 2026 fixtures, API-Football has not published the 2026 World Cup feed yet for this key/plan.";

  return message;
}

function summariseLeague(leagueEntry) {
  if (!leagueEntry?.league) return null;

  return {
    id: leagueEntry.league.id,
    name: leagueEntry.league.name,
    type: leagueEntry.league.type,
    country: leagueEntry.country?.name || "",
    seasons: (leagueEntry.seasons || []).map((season) => season.year).filter(Boolean),
  };
}

function shouldFetchEventsForFixture(apiFixture) {
  const status = apiFixture.fixture?.status?.short;
  if (playedStatusCodes.has(status)) return true;
  return apiFixture.goals?.home !== null || apiFixture.goals?.away !== null;
}

function chunkArray(items, size) {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

async function requestApiFootball(url, apiKey) {
  const apiResponse = await fetch(url, {
    headers: {
      "x-apisports-key": apiKey,
      accept: "application/json",
    },
  });
  const payload = await apiResponse.json();

  if (!apiResponse.ok || hasApiFootballErrors(payload.errors)) {
    const error = new Error("API-Football returned an error.");
    error.statusCode = apiResponse.status;
    error.details = payload.errors || payload;
    throw error;
  }

  return payload;
}

function hasApiFootballErrors(errors) {
  if (!errors) return false;
  if (Array.isArray(errors)) return errors.length > 0;
  if (typeof errors === "object") return Object.keys(errors).length > 0;
  return Boolean(errors);
}

function findMatchingApiFixture(fixture, apiFixtures) {
  if (fixture.apiFootballFixtureId) {
    const byId = apiFixtures.find((apiFixture) => apiFixture.fixture?.id === fixture.apiFootballFixtureId);
    if (byId) return byId;
  }

  const homeName = normaliseTeamName(fixture.homeTeamName);
  const awayName = normaliseTeamName(fixture.awayTeamName);

  return apiFixtures.find((apiFixture) => {
    const apiHomeName = normaliseTeamName(apiFixture.teams?.home?.name);
    const apiAwayName = normaliseTeamName(apiFixture.teams?.away?.name);
    return apiHomeName === homeName && apiAwayName === awayName;
  });
}

function calculateEventStats(apiFixture) {
  const homeTeamId = apiFixture.teams?.home?.id;
  const awayTeamId = apiFixture.teams?.away?.id;
  const stats = {
    home: { yellowCards: 0, redCards: 0, penaltiesWon: 0 },
    away: { yellowCards: 0, redCards: 0, penaltiesWon: 0 },
  };

  for (const event of apiFixture.events || []) {
    const side = event.team?.id === homeTeamId ? "home" : event.team?.id === awayTeamId ? "away" : null;
    if (!side) continue;

    const type = String(event.type || "").toLowerCase();
    const detail = String(event.detail || "").toLowerCase();
    const comments = String(event.comments || "").toLowerCase();
    const eventText = `${type} ${detail} ${comments}`;

    if (type === "card" && detail.includes("yellow")) {
      stats[side].yellowCards += 1;
    }

    if (type === "card" && (detail.includes("red") || detail.includes("second yellow"))) {
      stats[side].redCards += 1;
    }

    if (isPenaltyAttempt(detail) && !eventText.includes("shootout")) {
      stats[side].penaltiesWon += 1;
    }
  }

  return stats;
}

function isPenaltyAttempt(detail) {
  return detail === "penalty" || detail === "missed penalty";
}

async function loadLiveTournament(supabase) {
  const apiResponse = await fetch(
    `${supabase.url}/rest/v1/tournament_state?id=eq.${stateId}&select=data`,
    {
      headers: getSupabaseHeaders(supabase.serviceKey),
    }
  );
  const rows = await apiResponse.json();

  if (!apiResponse.ok) {
    const error = new Error("Could not load live tournament data from Supabase.");
    error.statusCode = apiResponse.status;
    error.details = rows;
    throw error;
  }

  return rows?.[0]?.data || null;
}

async function saveLiveTournament(supabase, tournament) {
  const apiResponse = await fetch(
    `${supabase.url}/rest/v1/tournament_state?on_conflict=id`,
    {
      method: "POST",
      headers: {
        ...getSupabaseHeaders(supabase.serviceKey),
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({
        id: stateId,
        data: tournament,
        updated_at: new Date().toISOString(),
      }),
    }
  );
  const rows = await apiResponse.json();

  if (!apiResponse.ok) {
    const error = new Error("Could not save live tournament data to Supabase.");
    error.statusCode = apiResponse.status;
    error.details = rows;
    throw error;
  }

  return rows?.[0]?.data || tournament;
}

function getApiFootballConfig() {
  const apiKey = process.env.API_FOOTBALL_KEY;
  const leagueId = process.env.API_FOOTBALL_LEAGUE_ID || "1";
  const season = process.env.API_FOOTBALL_SEASON || "2026";
  const baseUrl = process.env.API_FOOTBALL_BASE_URL || "https://v3.football.api-sports.io";

  if (!apiKey) {
    throw new Error("Missing API_FOOTBALL_KEY environment variable.");
  }

  return { apiKey, leagueId, season, baseUrl: baseUrl.replace(/\/$/, "") };
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable.");
  }

  return { url: url.replace(/\/$/, ""), serviceKey };
}

function getSupabaseHeaders(serviceKey) {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };
}

function normaliseScore(score) {
  if (score === null || score === undefined || score === "") return null;
  const numberScore = Number(score);
  return Number.isNaN(numberScore) ? null : numberScore;
}

function normaliseTeamName(name = "") {
  const aliases = {
    "bosnia herzegovina": "bosnia and herzegovina",
    "bosnia and herzegovina": "bosnia and herzegovina",
    "cote d ivoire": "ivory coast",
    "cote divoire": "ivory coast",
    "ivory coast": "ivory coast",
    "south korea": "korea republic",
    "korea republic": "korea republic",
    "usa": "united states",
    "united states": "united states",
    "turkiye": "turkiye",
    "turkey": "turkiye",
    "curacao": "curacao",
  };
  const normalised = String(name)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  return aliases[normalised] || normalised;
}
