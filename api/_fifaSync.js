const stateId = "live";

export async function fetchFifaFixtures() {
  const competitionId = process.env.FIFA_COMPETITION_ID || "17";
  const seasonId = process.env.FIFA_SEASON_ID || "285023";
  const baseUrl = process.env.FIFA_BASE_URL || "https://api.fifa.com/api/v3";
  const url = new URL("/api/v3/calendar/matches", baseUrl);

  url.searchParams.set("language", "en");
  url.searchParams.set("count", "500");
  url.searchParams.set("idCompetition", competitionId);
  url.searchParams.set("idSeason", seasonId);

  const apiResponse = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "Mozilla/5.0",
    },
  });
  const payload = await apiResponse.json();

  if (!apiResponse.ok) {
    const error = new Error("FIFA returned an error.");
    error.statusCode = apiResponse.status;
    error.details = payload;
    throw error;
  }

  const fixtures = Array.isArray(payload.Results) ? payload.Results : [];

  return {
    source: "fifa",
    competitionId,
    seasonId,
    fetchedAt: new Date().toISOString(),
    fixtures,
    apiMeta: {
      results: fixtures.length,
      continuationToken: payload.ContinuationToken,
    },
  };
}

export async function syncFifaFixturesToSupabase() {
  const supabase = getSupabaseConfig();
  const currentTournament = await loadLiveTournament(supabase);
  const fifaPayload = await fetchFifaFixtures();

  if (!currentTournament?.teams || !currentTournament?.fixtures) {
    throw new Error("Live tournament data is missing teams or fixtures.");
  }

  if (!fifaPayload.fixtures.length) {
    throw new Error("FIFA returned no fixtures.");
  }

  const nextTournament = mergeFifaFixturesIntoTournament(currentTournament, fifaPayload);
  const savedTournament = await saveLiveTournament(supabase, nextTournament);

  return {
    ...fifaPayload,
    savedTournament,
    updatedFixtureCount: nextTournament.fixtures.length,
    completedFixtureCount: nextTournament.fixtures.filter(
      (fixture) => fixture.homeScore !== null && fixture.awayScore !== null
    ).length,
  };
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

function mergeFifaFixturesIntoTournament(tournament, fifaPayload) {
  const fifaFixturesByMatchNumber = new Map(
    fifaPayload.fixtures
      .filter((fixture) => fixture.MatchNumber)
      .map((fixture) => [Number(fixture.MatchNumber), fixture])
  );

  return {
    ...tournament,
    fixtures: tournament.fixtures.map((fixture) => {
      const fifaFixture = fifaFixturesByMatchNumber.get(Number(fixture.matchNumber));
      if (!fifaFixture) return fixture;

      const homeScore = normaliseScore(fifaFixture.Home?.Score);
      const awayScore = normaliseScore(fifaFixture.Away?.Score);

      return {
        ...fixture,
        fifaMatchId: fifaFixture.IdMatch || fixture.fifaMatchId || null,
        date: getFifaFixtureDate(fifaFixture) || fixture.date,
        kickoffUk: getFifaKickoffUk(fifaFixture) || fixture.kickoffUk,
        venue: getFifaVenue(fifaFixture) || fixture.venue,
        homeScore: homeScore ?? fixture.homeScore ?? null,
        awayScore: awayScore ?? fixture.awayScore ?? null,
        apiStatus: fifaFixture.MatchStatus || fixture.apiStatus || null,
        apiRound: getFifaText(fifaFixture.GroupName) || getFifaText(fifaFixture.StageName) || fixture.apiRound || null,
      };
    }),
    fifaSync: {
      source: fifaPayload.source,
      competitionId: fifaPayload.competitionId,
      seasonId: fifaPayload.seasonId,
      fetchedAt: fifaPayload.fetchedAt,
      fixtureCount: fifaPayload.fixtures.length,
      automatic: true,
    },
    updatedAt: new Date().toISOString(),
  };
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

function getFifaFixtureDate(fifaFixture) {
  const date = fifaFixture.Date ? new Date(fifaFixture.Date) : null;
  if (!date || Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/London",
    year: "numeric",
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type)?.value;

  return `${part("year")}-${part("month")}-${part("day")}`;
}

function getFifaKickoffUk(fifaFixture) {
  const date = fifaFixture.Date ? new Date(fifaFixture.Date) : null;
  if (!date || Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone: "Europe/London",
  }).format(date);
}

function getFifaVenue(fifaFixture) {
  const stadium = getFifaText(fifaFixture.Stadium?.Name);
  const city = getFifaText(fifaFixture.Stadium?.CityName);

  if (stadium && city) return `${stadium}, ${city}`;
  return stadium || city || "";
}

function getFifaText(localisedValue) {
  if (!Array.isArray(localisedValue)) return "";

  return (
    localisedValue.find((item) => item.Locale === "en-GB")?.Description ||
    localisedValue[0]?.Description ||
    ""
  );
}

function normaliseScore(score) {
  if (score === null || score === undefined || score === "") return null;
  const numberScore = Number(score);
  return Number.isNaN(numberScore) ? null : numberScore;
}
