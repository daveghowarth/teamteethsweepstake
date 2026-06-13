export const potATeamList = [
  "France",
  "Spain",
  "Argentina",
  "England",
  "Portugal",
  "Brazil",
  "Netherlands",
  "Morocco",
  "Belgium",
  "Germany",
  "Croatia",
  "Colombia",
  "Senegal",
  "Mexico",
  "United States",
  "Uruguay",
  "Japan",
  "Switzerland",
  "Iran",
  "Türkiye",
  "Ecuador",
  "Austria",
  "Korea Republic",
  "Australia",
];

export const potBTeamList = [
  "Algeria",
  "Egypt",
  "Canada",
  "Norway",
  "Panama",
  "Ivory Coast",
  "Sweden",
  "Paraguay",
  "Czechia",
  "Scotland",
  "Tunisia",
  "DR Congo",
  "Uzbekistan",
  "Qatar",
  "Iraq",
  "South Africa",
  "Saudi Arabia",
  "Jordan",
  "Bosnia and Herzegovina",
  "Cape Verde",
  "Ghana",
  "Haiti",
  "Curaçao",
  "New Zealand",
];

export const potATeamNames = new Set(potATeamList);
export const potBTeamNames = new Set(potBTeamList);

const teamNameAliases = {
  "bosnia herzegovina": "Bosnia and Herzegovina",
  "bosnia & herzegovina": "Bosnia and Herzegovina",
  "cote d ivoire": "Ivory Coast",
  "côte d ivoire": "Ivory Coast",
  "cote divoire": "Ivory Coast",
  "côte divoire": "Ivory Coast",
  "ivory coast": "Ivory Coast",
  "curacao": "Curaçao",
  "curaçao": "Curaçao",
  "dr congo": "DR Congo",
  "democratic republic of congo": "DR Congo",
  "congo dr": "DR Congo",
  "usa": "United States",
  "u s a": "United States",
  "us": "United States",
  "u s": "United States",
  "united states": "United States",
  "united states of america": "United States",
  "america": "United States",
  "south korea": "Korea Republic",
  "korea republic": "Korea Republic",
  "republic of korea": "Korea Republic",
  "turkey": "Türkiye",
  "turkiye": "Türkiye",
  "türkiye": "Türkiye",
  "czech republic": "Czechia",
  "czechia": "Czechia",
};

const canonicalTeamNames = new Map(
  [...potATeamList, ...potBTeamList].map((teamName) => [normaliseTeamNameForLookup(teamName), teamName])
);

export function getCanonicalTeamName(teamName) {
  const lookupName = normaliseTeamNameForLookup(teamName);
  if (!lookupName) return "";

  return teamNameAliases[lookupName] || canonicalTeamNames.get(lookupName) || teamName;
}

export function getTeamSweepstakePot(teamName) {
  const canonicalTeamName = getCanonicalTeamName(teamName);

  if (potATeamNames.has(canonicalTeamName)) return "A";
  if (potBTeamNames.has(canonicalTeamName)) return "B";
  return null;
}

export function getTeamSweepstakePotRank(teamName) {
  const canonicalTeamName = getCanonicalTeamName(teamName);
  const potAIndex = potATeamList.indexOf(canonicalTeamName);
  if (potAIndex !== -1) return potAIndex;

  const potBIndex = potBTeamList.indexOf(canonicalTeamName);
  if (potBIndex !== -1) return potBIndex;

  return 999;
}

function normaliseTeamNameForLookup(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
