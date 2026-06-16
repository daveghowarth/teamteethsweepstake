const stateId = "live";
const completedStatusPattern = /full|final|ft|ended|complete/i;

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
  const fixturesWithMatchCentreStats = await addMatchCentreStatsToCompletedFixtures(
    fixtures,
    competitionId,
    seasonId
  );

  return {
    source: "fifa",
    competitionId,
    seasonId,
    fetchedAt: new Date().toISOString(),
    fixtures: fixturesWithMatchCentreStats,
    apiMeta: {
      results: fixturesWithMatchCentreStats.length,
      matchCentreStatCount: fixturesWithMatchCentreStats.filter((fixture) => fixture.matchCentreStats).length,
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

export async function diagnoseFifaMatchCentre(matchCentreUrl, homeTeamName = "", awayTeamName = "") {
  const matchId = extractMatchIdFromMatchCentreUrl(matchCentreUrl);
  const stats = await fetchFifaTeamStats({ IdMatch: matchId });

  return {
    url: matchCentreUrl,
    matchId,
    stats,
    source: stats.diagnostic?.source || "fifa-fdh-stats",
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
  const previousFixturesByFifaId = new Map(
    (tournament.fixtures || [])
      .filter((fixture) => fixture.fifaMatchId)
      .map((fixture) => [fixture.fifaMatchId, fixture])
  );
  const previousFixturesByTeamPair = new Map(
    (tournament.fixtures || []).map((fixture) => [getTournamentFixtureTeamPairKey(fixture), fixture])
  );
  const teams = (tournament.teams || []).map((team) => ({ ...team }));
  const fifaFixtures = [...fifaPayload.fixtures].sort((a, b) =>
    (Number(a.MatchNumber) || 999) - (Number(b.MatchNumber) || 999)
  );

  return {
    ...tournament,
    teams,
    fixtures: fifaFixtures.map((fifaFixture, index) => {
      const homeTeam = findTournamentTeamForFifaTeam(fifaFixture.Home, teams);
      const awayTeam = findTournamentTeamForFifaTeam(fifaFixture.Away, teams);
      const previousFixture =
        previousFixturesByFifaId.get(fifaFixture.IdMatch) ||
        previousFixturesByTeamPair.get(getTeamPairKey(homeTeam.name, awayTeam.name));
      const homeScore = normaliseScore(fifaFixture.Home?.Score);
      const awayScore = normaliseScore(fifaFixture.Away?.Score);
      const matchCentreStats = fifaFixture.matchCentreStats || null;
      const matchNumber = Number(fifaFixture.MatchNumber) || index + 1;
      const group = parseFifaGroupName(getFifaText(fifaFixture.GroupName));
      const stage = group ? "Group" : parseFifaStageName(getFifaText(fifaFixture.StageName));

      return {
        id: `fifa-${fifaFixture.IdMatch || matchNumber}`,
        fifaMatchId: fifaFixture.IdMatch || previousFixture?.fifaMatchId || null,
        fifaStageId: fifaFixture.IdStage || previousFixture?.fifaStageId || null,
        fifaMatchCentreUrl: fifaFixture.matchCentreUrl || previousFixture?.fifaMatchCentreUrl || null,
        fifaMatchNumber: fifaFixture.MatchNumber || previousFixture?.fifaMatchNumber || null,
        matchNumber,
        stage,
        group,
        date: getFifaFixtureDate(fifaFixture) || previousFixture?.date || "",
        kickoffUk: getFifaKickoffUk(fifaFixture) || previousFixture?.kickoffUk || "",
        venue: getFifaVenue(fifaFixture) || previousFixture?.venue || "",
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        homeTeamName: homeTeam.name,
        awayTeamName: awayTeam.name,
        homeScore,
        awayScore,
        homeYellowCards: mergePositiveMatchCentreStat(matchCentreStats?.homeYellowCards, previousFixture?.homeYellowCards),
        homeRedCards: mergePositiveMatchCentreStat(matchCentreStats?.homeRedCards, previousFixture?.homeRedCards),
        awayYellowCards: mergePositiveMatchCentreStat(matchCentreStats?.awayYellowCards, previousFixture?.awayYellowCards),
        awayRedCards: mergePositiveMatchCentreStat(matchCentreStats?.awayRedCards, previousFixture?.awayRedCards),
        homePenaltiesWon: mergePositiveMatchCentreStat(matchCentreStats?.homePenaltiesWon, previousFixture?.homePenaltiesWon),
        homePenaltiesConceded: mergePositiveMatchCentreStat(
          matchCentreStats?.awayPenaltiesWon,
          previousFixture?.homePenaltiesConceded
        ),
        awayPenaltiesWon: mergePositiveMatchCentreStat(matchCentreStats?.awayPenaltiesWon, previousFixture?.awayPenaltiesWon),
        awayPenaltiesConceded: mergePositiveMatchCentreStat(
          matchCentreStats?.homePenaltiesWon,
          previousFixture?.awayPenaltiesConceded
        ),
        apiStatus: fifaFixture.MatchStatus || previousFixture?.apiStatus || null,
        apiRound: getFifaText(fifaFixture.GroupName) || getFifaText(fifaFixture.StageName) || previousFixture?.apiRound || null,
      };
    }),
    fifaSync: {
      source: fifaPayload.source,
      competitionId: fifaPayload.competitionId,
      seasonId: fifaPayload.seasonId,
      fetchedAt: fifaPayload.fetchedAt,
      fixtureCount: fifaPayload.fixtures.length,
      matchCentreStatCount: fifaPayload.apiMeta?.matchCentreStatCount || 0,
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

async function addMatchCentreStatsToCompletedFixtures(fixtures, competitionId, seasonId) {
  const completedFixtures = fixtures.filter(shouldFetchMatchCentreStats);
  const statsByMatchId = new Map();

  for (const fixture of completedFixtures) {
    const matchCentreUrl = buildFifaMatchCentreUrl(fixture, competitionId, seasonId);

    try {
      const stats = await fetchFifaTeamStats(fixture);
      statsByMatchId.set(fixture.IdMatch, { stats, matchCentreUrl });
    } catch (error) {
      statsByMatchId.set(fixture.IdMatch, {
        stats: null,
        matchCentreUrl,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return fixtures.map((fixture) => {
    const matchCentreResult = statsByMatchId.get(fixture.IdMatch);
    if (!matchCentreResult) return fixture;

    return {
      ...fixture,
      matchCentreUrl: matchCentreResult.matchCentreUrl,
      matchCentreStats: matchCentreResult.stats,
      matchCentreError: matchCentreResult.error || null,
    };
  });
}

function shouldFetchMatchCentreStats(fifaFixture) {
  const homeScore = normaliseScore(fifaFixture.Home?.Score);
  const awayScore = normaliseScore(fifaFixture.Away?.Score);
  const statusText = String(fifaFixture.MatchStatus || fifaFixture.MatchStatusName || "");

  return (
    (homeScore !== null && awayScore !== null) ||
    completedStatusPattern.test(statusText)
  );
}

function buildFifaMatchCentreUrl(fifaFixture, competitionId, seasonId) {
  const stageName = getFifaText(fifaFixture.StageName);
  const fallbackGroupStageId = process.env.FIFA_GROUP_STAGE_ID || "289273";
  const stageId =
    fifaFixture.IdStage ||
    fifaFixture.Stage?.IdStage ||
    fifaFixture.StageId ||
    (parseFifaStageName(stageName) === "Group" ? fallbackGroupStageId : null);
  const matchId = fifaFixture.IdMatch;

  if (!stageId || !matchId) return "";

  return `https://www.fifa.com/en/match-centre/match/${competitionId}/${seasonId}/${stageId}/${matchId}`;
}

function parseFifaStageName(stageName) {
  const text = String(stageName || "").toLowerCase();
  if (text.includes("first stage") || text.includes("group")) return "Group";
  return stageName || "";
}

function extractMatchIdFromMatchCentreUrl(matchCentreUrl) {
  const match = String(matchCentreUrl).match(/\/match-centre\/match\/\d+\/\d+\/\d+\/(\d+)/);

  if (!match?.[1]) {
    throw new Error("Could not find a FIFA match ID in the match-centre URL.");
  }

  return match[1];
}

async function fetchFifaTeamStats(fifaFixture) {
  const liveMatch = await fetchFifaLiveMatch(fifaFixture.IdMatch);
  const fdhMatchId = liveMatch?.Properties?.IdIFES;

  if (!fdhMatchId) {
    throw new Error("FIFA live match data did not include a stats match ID.");
  }

  const teamsPayload = await fetchJson(`https://fdh-api.fifa.com/v1/stats/match/${fdhMatchId}/teams.json`);
  const homeTeamId = liveMatch.HomeTeam?.IdTeam || fifaFixture.Home?.IdTeam;
  const awayTeamId = liveMatch.AwayTeam?.IdTeam || fifaFixture.Away?.IdTeam;
  const homeStats = getFdhTeamStats(teamsPayload, homeTeamId);
  const awayStats = getFdhTeamStats(teamsPayload, awayTeamId);

  return {
    homeYellowCards: getFdhStat(homeStats, "YellowCards"),
    homeRedCards: getFdhStat(homeStats, "RedCards"),
    homePenaltiesWon: getFdhStat(homeStats, "Penalties"),
    awayYellowCards: getFdhStat(awayStats, "YellowCards"),
    awayRedCards: getFdhStat(awayStats, "RedCards"),
    awayPenaltiesWon: getFdhStat(awayStats, "Penalties"),
    diagnostic: {
      source: "fifa-fdh-stats",
      fdhMatchId,
      homeTeamId,
      awayTeamId,
      hasHomeStats: homeStats.length > 0,
      hasAwayStats: awayStats.length > 0,
    },
  };
}

async function fetchFifaLiveMatch(matchId) {
  return fetchJson(`https://api.fifa.com/api/v3/live/football/${matchId}?language=en`);
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "Mozilla/5.0",
    },
  });

  if (!response.ok) {
    throw new Error(`FIFA JSON endpoint returned ${response.status}.`);
  }

  return response.json();
}

function getFdhTeamStats(teamsPayload, teamId) {
  return teamsPayload?.[teamId] || teamsPayload?.[String(teamId)] || [];
}

function getFdhStat(teamStats, statName) {
  const row = teamStats.find((stat) => stat[0] === statName);
  const value = Number(row?.[1]);

  return Number.isNaN(value) ? undefined : value;
}

async function fetchFifaMatchCentreStats(matchCentreUrl, fifaFixture) {
  const response = await fetch(matchCentreUrl, {
    headers: {
      accept: "text/html",
      "user-agent": "Mozilla/5.0",
    },
  });

  if (!response.ok) {
    throw new Error(`FIFA match centre returned ${response.status}.`);
  }

  const html = await response.text();
  const liveBlogUpdates = extractFifaLiveBlogUpdates(html);
  const renderedText = htmlToText(html);
  const homeTeamName = getFifaText(fifaFixture.Home?.TeamName) || fifaFixture.Home?.ShortClubName || "";
  const awayTeamName = getFifaText(fifaFixture.Away?.TeamName) || fifaFixture.Away?.ShortClubName || "";

  return {
    ...calculateRenderedMatchStats(renderedText),
    ...calculateMatchCentreStats(liveBlogUpdates, homeTeamName, awayTeamName),
    diagnostic: {
      hasLiveBlogUpdates: liveBlogUpdates.length > 0,
      liveBlogUpdateCount: liveBlogUpdates.length,
      hasRenderedYellowCards: renderedText.includes("Yellow Cards"),
      hasRenderedRedCards: renderedText.includes("Red Cards"),
    },
  };
}

function extractFifaLiveBlogUpdates(html) {
  const scriptPattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const updates = [];
  let match;

  while ((match = scriptPattern.exec(html))) {
    const jsonText = decodeHtmlEntities(match[1].trim());

    try {
      const data = JSON.parse(jsonText);
      const entries = Array.isArray(data) ? data : [data];

      for (const entry of entries) {
        if (Array.isArray(entry.liveBlogUpdate)) {
          updates.push(...entry.liveBlogUpdate);
        }
      }
    } catch {
      // Other structured-data snippets can exist on the page; skip any that are not JSON we need.
    }
  }

  return updates;
}

function calculateMatchCentreStats(liveBlogUpdates, homeTeamName, awayTeamName) {
  const stats = {};
  const homeMatchName = normaliseTeamName(homeTeamName);
  const awayMatchName = normaliseTeamName(awayTeamName);

  for (const update of liveBlogUpdates) {
    const headline = String(update.headline || "").toLowerCase();
    const body = String(update.articleBody || "");
    const bodyLower = body.toLowerCase();
    const teamName = extractTeamNameFromEventBody(body);
    const teamSide =
      normaliseTeamName(teamName) === homeMatchName
        ? "home"
        : normaliseTeamName(teamName) === awayMatchName
          ? "away"
          : null;

    if (!teamSide) continue;

    if (headline.includes("yellow card") || bodyLower.includes("is booked")) {
      stats[`${teamSide}YellowCards`] = (stats[`${teamSide}YellowCards`] || 0) + 1;
    }

    if (
      headline.includes("red card") ||
      headline.includes("second yellow") ||
      bodyLower.includes("is sent off")
    ) {
      stats[`${teamSide}RedCards`] = (stats[`${teamSide}RedCards`] || 0) + 1;
    }

    if (isFifaPenaltyEvent(headline, bodyLower)) {
      stats[`${teamSide}PenaltiesWon`] = (stats[`${teamSide}PenaltiesWon`] || 0) + 1;
    }
  }

  return stats;
}

function calculateRenderedMatchStats(renderedText) {
  const stats = {};
  const yellowCards = extractRenderedStatPair(renderedText, "Yellow Cards");
  const redCards = extractRenderedStatPair(renderedText, "Red Cards");
  const penaltiesScored = extractRenderedStatPair(renderedText, "Penalties Scored");

  if (yellowCards) {
    stats.homeYellowCards = yellowCards.home;
    stats.awayYellowCards = yellowCards.away;
  }

  if (redCards) {
    stats.homeRedCards = redCards.home;
    stats.awayRedCards = redCards.away;
  }

  if (penaltiesScored) {
    stats.homePenaltiesWon = penaltiesScored.home;
    stats.awayPenaltiesWon = penaltiesScored.away;
  }

  return stats;
}

function extractRenderedStatPair(renderedText, label) {
  const labelIndex = renderedText.indexOf(label);
  if (labelIndex < 0) return null;

  const afterLabel = renderedText.slice(labelIndex + label.length, labelIndex + label.length + 120);
  const numbers = afterLabel.match(/\b\d+\b/g);

  if (!numbers || numbers.length < 2) return null;

  return {
    home: Number(numbers[0]),
    away: Number(numbers[1]),
  };
}

function extractTeamNameFromEventBody(body) {
  const matches = [...String(body).matchAll(/\(([^)]+)\)/g)];
  return matches.at(-1)?.[1] || "";
}

function isFifaPenaltyEvent(headline, bodyLower) {
  if (headline.includes("penalty shootout") || bodyLower.includes("penalty shootout")) return false;

  return (
    headline === "penalty" ||
    headline.includes("penalty scored") ||
    headline.includes("penalty missed") ||
    bodyLower.includes("penalty is awarded") ||
    bodyLower.includes("scores from the penalty") ||
    bodyLower.includes("misses the penalty")
  );
}

function decodeHtmlEntities(text) {
  return String(text)
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function htmlToText(html) {
  return decodeHtmlEntities(
    String(html)
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function getTextSample(text, label) {
  const index = text.indexOf(label);
  if (index < 0) return "";
  return text.slice(Math.max(0, index - 80), index + 180);
}

function mergePositiveMatchCentreStat(matchCentreValue, existingValue) {
  const parsedMatchCentreValue = Number(matchCentreValue);

  if (!Number.isNaN(parsedMatchCentreValue) && parsedMatchCentreValue > 0) {
    return parsedMatchCentreValue;
  }

  return existingValue ?? 0;
}

function getTournamentFixtureTeamPairKey(fixture) {
  return getTeamPairKey(fixture.homeTeamName, fixture.awayTeamName);
}

function getFifaFixtureTeamPairKey(fifaFixture) {
  const homeTeamName = getFifaTeamName(fifaFixture.Home);
  const awayTeamName = getFifaTeamName(fifaFixture.Away);

  return getTeamPairKey(homeTeamName, awayTeamName);
}

function getTeamPairKey(homeTeamName, awayTeamName) {
  return `${normaliseTeamName(homeTeamName)}::${normaliseTeamName(awayTeamName)}`;
}

function getFifaTeamName(fifaTeam) {
  return getFifaText(fifaTeam?.TeamName) || fifaTeam?.ShortClubName || "";
}

function findTournamentTeamForFifaTeam(fifaTeam, teams) {
  const fifaTeamName = getFifaTeamName(fifaTeam);
  const normalisedFifaTeamName = normaliseTeamName(fifaTeamName);
  const existingTeam = teams.find((team) => normaliseTeamName(team.name) === normalisedFifaTeamName);

  if (existingTeam) {
    existingTeam.fifaTeamId = fifaTeam?.IdTeam || existingTeam.fifaTeamId || null;
    return existingTeam;
  }

  return {
    id: fifaTeam?.IdTeam ? `fifa-team-${fifaTeam.IdTeam}` : `fifa-team-${normalisedFifaTeamName || "unknown"}`,
    fifaTeamId: fifaTeam?.IdTeam || null,
    name: fifaTeamName || "Team TBC",
    group: null,
    seed: 99,
    sweepstakeOwner: "Not drawn yet",
  };
}

function parseFifaGroupName(groupName = "") {
  const match = String(groupName).match(/\bGroup\s+([A-L])\b/i);
  return match?.[1]?.toUpperCase() || null;
}

function normaliseTeamName(name = "") {
  const aliases = {
    "bosnia herzegovina": "bosnia and herzegovina",
    "bosnia and herzegovina": "bosnia and herzegovina",
    "cote d ivoire": "ivory coast",
    "cote divoire": "ivory coast",
    "czech republic": "czechia",
    "ivory coast": "ivory coast",
    "korea republic": "korea republic",
    "south korea": "korea republic",
    "turkey": "turkiye",
    "turkiye": "turkiye",
    "united states": "united states",
    "usa": "united states",
  };
  const normalised = String(name)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  return aliases[normalised] || normalised;
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
