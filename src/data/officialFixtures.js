const easternTimeZoneOffset = "-04:00";

const teamNameAliases = {
  "Bosnia & Herzegovina": "Bosnia and Herzegovina",
  "South Korea": "Korea Republic",
  Curacao: "Curaçao",
  Turkiye: "Türkiye",
};

const officialFixtureSlots = [
  ["2026-06-11", "15:00", "Mexico", "South Africa", "A", "Estadio Banorte, Mexico City"],
  ["2026-06-11", "22:00", "South Korea", "Czechia", "A", "Estadio Akron, Guadalajara"],
  ["2026-06-12", "16:00", "Canada", "Bosnia & Herzegovina", "B", "BMO Field, Toronto"],
  ["2026-06-12", "22:00", "United States", "Paraguay", "D", "SoFi Stadium, Los Angeles"],
  ["2026-06-13", "16:00", "Qatar", "Switzerland", "B", "Levi's Stadium, San Francisco Bay Area"],
  ["2026-06-13", "19:00", "Brazil", "Morocco", "C", "MetLife Stadium, New York/New Jersey"],
  ["2026-06-13", "20:00", "Ivory Coast", "Ecuador", "E", "Lincoln Financial Field, Philadelphia"],
  ["2026-06-13", "22:00", "Haiti", "Scotland", "C", "Gillette Stadium, Boston"],
  ["2026-06-13", "23:00", "Sweden", "Tunisia", "F", "Estadio BBVA, Monterrey"],
  ["2026-06-14", "01:00", "Australia", "Türkiye", "D", "BC Place, Vancouver"],
  ["2026-06-14", "14:00", "Germany", "Curaçao", "E", "NRG Stadium, Houston"],
  ["2026-06-14", "17:00", "Netherlands", "Japan", "F", "AT&T Stadium, Dallas"],
  ["2026-06-15", "13:00", "Spain", "Cape Verde", "H", "Mercedes-Benz Stadium, Atlanta"],
  ["2026-06-15", "16:00", "Belgium", "Egypt", "G", "Lumen Field, Seattle"],
  ["2026-06-15", "19:00", "Saudi Arabia", "Uruguay", "H", "Hard Rock Stadium, Miami"],
  ["2026-06-15", "22:00", "Iran", "New Zealand", "G", "SoFi Stadium, Los Angeles"],
  ["2026-06-15", "22:00", "Argentina", "Algeria", "J", "GEHA Field at Arrowhead Stadium, Kansas City"],
  ["2026-06-16", "01:00", "Austria", "Jordan", "J", "Levi's Stadium, San Francisco Bay Area"],
  ["2026-06-17", "14:00", "Portugal", "DR Congo", "K", "NRG Stadium, Houston"],
  ["2026-06-16", "16:00", "France", "Senegal", "I", "MetLife Stadium, New York/New Jersey"],
  ["2026-06-17", "17:00", "England", "Croatia", "L", "AT&T Stadium, Dallas"],
  ["2026-06-16", "19:00", "Iraq", "Norway", "I", "Gillette Stadium, Boston"],
  ["2026-06-17", "20:00", "Ghana", "Panama", "L", "BMO Field, Toronto"],
  ["2026-06-17", "23:00", "Uzbekistan", "Colombia", "K", "Estadio Banorte, Mexico City"],
  ["2026-06-18", "13:00", "Czechia", "South Africa", "A", "Mercedes-Benz Stadium, Atlanta"],
  ["2026-06-18", "16:00", "Switzerland", "Bosnia & Herzegovina", "B", "SoFi Stadium, Los Angeles"],
  ["2026-06-18", "19:00", "Canada", "Qatar", "B", "BC Place, Vancouver"],
  ["2026-06-18", "22:00", "Mexico", "South Korea", "A", "Estadio Akron, Guadalajara"],
  ["2026-06-19", "16:00", "United States", "Australia", "D", "Lumen Field, Seattle"],
  ["2026-06-19", "19:00", "Scotland", "Morocco", "C", "Gillette Stadium, Boston"],
  ["2026-06-19", "21:00", "Ecuador", "Curaçao", "E", "GEHA Field at Arrowhead Stadium, Kansas City"],
  ["2026-06-19", "22:00", "Brazil", "Haiti", "C", "Lincoln Financial Field, Philadelphia"],
  ["2026-06-19", "22:00", "Türkiye", "Paraguay", "D", "Levi's Stadium, San Francisco Bay Area"],
  ["2026-06-20", "14:00", "Netherlands", "Sweden", "F", "NRG Stadium, Houston"],
  ["2026-06-20", "17:00", "Germany", "Ivory Coast", "E", "BMO Field, Toronto"],
  ["2026-06-20", "22:00", "Tunisia", "Japan", "F", "Estadio BBVA, Monterrey"],
  ["2026-06-20", "22:00", "New Zealand", "Egypt", "G", "BC Place, Vancouver"],
  ["2026-06-21", "13:00", "Spain", "Saudi Arabia", "H", "Mercedes-Benz Stadium, Atlanta"],
  ["2026-06-21", "16:00", "Belgium", "Iran", "G", "SoFi Stadium, Los Angeles"],
  ["2026-06-21", "19:00", "Uruguay", "Cape Verde", "H", "Hard Rock Stadium, Miami"],
  ["2026-06-22", "14:00", "Argentina", "Austria", "J", "AT&T Stadium, Dallas"],
  ["2026-06-22", "18:00", "France", "Iraq", "I", "Lincoln Financial Field, Philadelphia"],
  ["2026-06-22", "20:00", "Panama", "Croatia", "L", "BMO Field, Toronto"],
  ["2026-06-22", "21:00", "Norway", "Senegal", "I", "MetLife Stadium, New York/New Jersey"],
  ["2026-06-23", "23:00", "Colombia", "DR Congo", "K", "Estadio Akron, Guadalajara"],
  ["2026-06-23", "14:00", "Portugal", "Uzbekistan", "K", "NRG Stadium, Houston"],
  ["2026-06-23", "17:00", "England", "Ghana", "L", "Gillette Stadium, Boston"],
  ["2026-06-22", "20:00", "Jordan", "Algeria", "J", "Levi's Stadium, San Francisco Bay Area"],
  ["2026-06-24", "16:00", "Switzerland", "Canada", "B", "BC Place, Vancouver"],
  ["2026-06-24", "16:00", "Bosnia & Herzegovina", "Qatar", "B", "Lumen Field, Seattle"],
  ["2026-06-24", "19:00", "Scotland", "Brazil", "C", "Hard Rock Stadium, Miami"],
  ["2026-06-24", "19:00", "Morocco", "Haiti", "C", "Mercedes-Benz Stadium, Atlanta"],
  ["2026-06-25", "20:00", "Japan", "Sweden", "F", "AT&T Stadium, Dallas"],
  ["2026-06-25", "20:00", "Tunisia", "Netherlands", "F", "GEHA Field at Arrowhead Stadium, Kansas City"],
  ["2026-06-24", "22:00", "Czechia", "Mexico", "A", "Estadio Banorte, Mexico City"],
  ["2026-06-24", "22:00", "South Africa", "South Korea", "A", "Estadio BBVA, Monterrey"],
  ["2026-06-25", "23:00", "Türkiye", "United States", "D", "SoFi Stadium, Los Angeles"],
  ["2026-06-25", "23:00", "Paraguay", "Australia", "D", "Levi's Stadium, San Francisco Bay Area"],
  ["2026-06-25", "17:00", "Ecuador", "Germany", "E", "MetLife Stadium, New York/New Jersey"],
  ["2026-06-25", "17:00", "Curaçao", "Ivory Coast", "E", "Lincoln Financial Field, Philadelphia"],
  ["2026-06-26", "21:00", "Cape Verde", "Saudi Arabia", "H", "NRG Stadium, Houston"],
  ["2026-06-26", "21:00", "Uruguay", "Spain", "H", "Estadio Akron, Guadalajara"],
  ["2026-06-26", "00:00", "Egypt", "Iran", "G", "Lumen Field, Seattle"],
  ["2026-06-26", "00:00", "New Zealand", "Belgium", "G", "BC Place, Vancouver"],
  ["2026-06-27", "16:00", "Norway", "France", "I", "Gillette Stadium, Boston"],
  ["2026-06-27", "16:00", "Senegal", "Iraq", "I", "BMO Field, Toronto"],
  ["2026-06-27", "20:30", "Colombia", "Portugal", "K", "Hard Rock Stadium, Miami"],
  ["2026-06-27", "20:30", "DR Congo", "Uzbekistan", "K", "Mercedes-Benz Stadium, Atlanta"],
  ["2026-06-27", "23:00", "Algeria", "Austria", "J", "GEHA Field at Arrowhead Stadium, Kansas City"],
  ["2026-06-27", "23:00", "Jordan", "Argentina", "J", "AT&T Stadium, Dallas"],
  ["2026-06-27", "18:00", "Panama", "England", "L", "MetLife Stadium, New York/New Jersey"],
  ["2026-06-27", "18:00", "Croatia", "Ghana", "L", "Lincoln Financial Field, Philadelphia"],
  ["2026-06-28", "15:00", "2A", "2B", null, "SoFi Stadium, Los Angeles", "Round of 32"],
  ["2026-06-29", "13:00", "1C", "2F", null, "NRG Stadium, Houston", "Round of 32"],
  ["2026-06-29", "16:30", "1E", "3ACDF", null, "Gillette Stadium, Boston", "Round of 32"],
  ["2026-06-29", "20:00", "1F", "2C", null, "Estadio BBVA, Monterrey", "Round of 32"],
  ["2026-06-29", "21:00", "1A", "3CEFHI", null, "Estadio Banorte, Mexico City", "Round of 32"],
  ["2026-06-30", "13:00", "2E", "2I", null, "AT&T Stadium, Dallas", "Round of 32"],
  ["2026-06-30", "17:00", "1I", "3CDFGH", null, "MetLife Stadium, New York/New Jersey", "Round of 32"],
  ["2026-06-30", "20:00", "1D", "3BEFIJ", null, "Levi's Stadium, San Francisco Bay Area", "Round of 32"],
  ["2026-07-01", "12:00", "1L", "3EHIJK", null, "Mercedes-Benz Stadium, Atlanta", "Round of 32"],
  ["2026-07-01", "16:00", "1G", "3AEHIJ", null, "Lumen Field, Seattle", "Round of 32"],
  ["2026-07-02", "15:00", "1H", "2J", null, "SoFi Stadium, Los Angeles", "Round of 32"],
  ["2026-07-02", "19:00", "2K", "2L", null, "BMO Field, Toronto", "Round of 32"],
  ["2026-07-02", "23:00", "1B", "3EFGIJ", null, "BC Place, Vancouver", "Round of 32"],
  ["2026-07-03", "14:00", "2D", "2G", null, "AT&T Stadium, Dallas", "Round of 32"],
  ["2026-07-03", "18:00", "1J", "2H", null, "Hard Rock Stadium, Miami", "Round of 32"],
  ["2026-07-03", "21:30", "1K", "3DEIJL", null, "GEHA Field at Arrowhead Stadium, Kansas City", "Round of 32"],
  ["2026-07-04", "15:00", "W73", "W76", null, "NRG Stadium, Houston", "Round of 16"],
  ["2026-07-04", "19:00", "W74", "W78", null, "SoFi Stadium, Los Angeles", "Round of 16"],
  ["2026-07-04", "21:00", "W75", "W77", null, "MetLife Stadium, New York/New Jersey", "Round of 16"],
  ["2026-07-05", "18:00", "W79", "W81", null, "Lincoln Financial Field, Philadelphia", "Round of 16"],
  ["2026-07-05", "21:00", "W80", "W82", null, "Lumen Field, Seattle", "Round of 16"],
  ["2026-07-06", "17:00", "W83", "W84", null, "AT&T Stadium, Dallas", "Round of 16"],
  ["2026-07-06", "21:00", "W85", "W88", null, "Mercedes-Benz Stadium, Atlanta", "Round of 16"],
  ["2026-07-07", "21:00", "W86", "W87", null, "Gillette Stadium, Boston", "Round of 16"],
  ["2026-07-09", "18:00", "W89", "W90", null, "Gillette Stadium, Boston", "Quarter-final"],
  ["2026-07-10", "19:00", "W91", "W92", null, "SoFi Stadium, Los Angeles", "Quarter-final"],
  ["2026-07-11", "16:00", "W93", "W94", null, "Hard Rock Stadium, Miami", "Quarter-final"],
  ["2026-07-11", "21:00", "W95", "W96", null, "GEHA Field at Arrowhead Stadium, Kansas City", "Quarter-final"],
  ["2026-07-14", "20:00", "W97", "W98", null, "AT&T Stadium, Dallas", "Semi-final"],
  ["2026-07-15", "20:00", "W99", "W100", null, "Mercedes-Benz Stadium, Atlanta", "Semi-final"],
  ["2026-07-18", "16:00", "L101", "L102", null, "Hard Rock Stadium, Miami", "Third-place play-off"],
  ["2026-07-19", "16:00", "W101", "W102", null, "MetLife Stadium, New York/New Jersey", "Final"],
];

export function createOfficialFixtures(teams) {
  return officialFixtureSlots.map((slot, index) => {
    const [dateEt, timeEt, homeName, awayName, group, venue, knockoutStage] = slot;
    const homeTeam = findTeamByName(teams, homeName);
    const awayTeam = findTeamByName(teams, awayName);
    const kickoff = getUkKickoff(dateEt, timeEt);
    const stage = group ? "Group" : knockoutStage;

    return {
      id: `M${index + 1}`,
      matchNumber: index + 1,
      stage,
      group,
      date: kickoff.date,
      kickoffUk: kickoff.time,
      venue,
      homeTeamId: homeTeam?.id || null,
      awayTeamId: awayTeam?.id || null,
      homeTeamName: homeTeam?.name || homeName,
      awayTeamName: awayTeam?.name || awayName,
      homeScore: null,
      awayScore: null,
      homePenaltiesWon: 0,
      homePenaltiesConceded: 0,
      awayPenaltiesWon: 0,
      awayPenaltiesConceded: 0,
    };
  });
}

function findTeamByName(teams, name) {
  const normalisedName = normaliseTeamName(teamNameAliases[name] || name);
  return teams.find((team) => normaliseTeamName(team.name) === normalisedName);
}

function normaliseTeamName(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getUkKickoff(dateEt, timeEt) {
  const kickoffDate = new Date(`${dateEt}T${timeEt}:00${easternTimeZoneOffset}`);
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    timeZone: "Europe/London",
    year: "numeric",
  }).formatToParts(kickoffDate);
  const part = (type) => parts.find((item) => item.type === type)?.value;

  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    time: `${part("hour")}:${part("minute")}`,
  };
}
