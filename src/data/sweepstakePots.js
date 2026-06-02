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

export function getTeamSweepstakePot(teamName) {
  if (potATeamNames.has(teamName)) return "A";
  if (potBTeamNames.has(teamName)) return "B";
  return null;
}

export function getTeamSweepstakePotRank(teamName) {
  const potAIndex = potATeamList.indexOf(teamName);
  if (potAIndex !== -1) return potAIndex;

  const potBIndex = potBTeamList.indexOf(teamName);
  if (potBIndex !== -1) return potBIndex;

  return 999;
}
