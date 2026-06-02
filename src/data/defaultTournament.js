import { createOfficialFixtures } from "./officialFixtures.js";
import { getTeamFlagUrl } from "./teamFlags.js";

const groups = "ABCDEFGHIJKL".split("");

const officialGroupTeams = {
  A: [
    { name: "Mexico", flagEmoji: "🇲🇽" },
    { name: "South Africa", flagEmoji: "🇿🇦" },
    { name: "Korea Republic", flagEmoji: "🇰🇷" },
    { name: "Czechia", flagEmoji: "🇨🇿" },
  ],
  B: [
    { name: "Canada", flagEmoji: "🇨🇦" },
    { name: "Bosnia and Herzegovina", flagEmoji: "🇧🇦" },
    { name: "Qatar", flagEmoji: "🇶🇦" },
    { name: "Switzerland", flagEmoji: "🇨🇭" },
  ],
  C: [
    { name: "Brazil", flagEmoji: "🇧🇷" },
    { name: "Morocco", flagEmoji: "🇲🇦" },
    { name: "Haiti", flagEmoji: "🇭🇹" },
    { name: "Scotland", flagEmoji: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}" },
  ],
  D: [
    { name: "United States", flagEmoji: "🇺🇸" },
    { name: "Paraguay", flagEmoji: "🇵🇾" },
    { name: "Australia", flagEmoji: "🇦🇺" },
    { name: "Türkiye", flagEmoji: "🇹🇷" },
  ],
  E: [
    { name: "Germany", flagEmoji: "🇩🇪" },
    { name: "Curaçao", flagEmoji: "🇨🇼" },
    { name: "Ivory Coast", flagEmoji: "🇨🇮" },
    { name: "Ecuador", flagEmoji: "🇪🇨" },
  ],
  F: [
    { name: "Netherlands", flagEmoji: "🇳🇱" },
    { name: "Japan", flagEmoji: "🇯🇵" },
    { name: "Tunisia", flagEmoji: "🇹🇳" },
    { name: "Sweden", flagEmoji: "🇸🇪" },
  ],
  G: [
    { name: "Belgium", flagEmoji: "🇧🇪" },
    { name: "Egypt", flagEmoji: "🇪🇬" },
    { name: "Iran", flagEmoji: "🇮🇷" },
    { name: "New Zealand", flagEmoji: "🇳🇿" },
  ],
  H: [
    { name: "Spain", flagEmoji: "🇪🇸" },
    { name: "Cape Verde", flagEmoji: "🇨🇻" },
    { name: "Saudi Arabia", flagEmoji: "🇸🇦" },
    { name: "Uruguay", flagEmoji: "🇺🇾" },
  ],
  I: [
    { name: "France", flagEmoji: "🇫🇷" },
    { name: "Senegal", flagEmoji: "🇸🇳" },
    { name: "Norway", flagEmoji: "🇳🇴" },
    { name: "Iraq", flagEmoji: "🇮🇶" },
  ],
  J: [
    { name: "Argentina", flagEmoji: "🇦🇷" },
    { name: "Algeria", flagEmoji: "🇩🇿" },
    { name: "Austria", flagEmoji: "🇦🇹" },
    { name: "Jordan", flagEmoji: "🇯🇴" },
  ],
  K: [
    { name: "Portugal", flagEmoji: "🇵🇹" },
    { name: "Uzbekistan", flagEmoji: "🇺🇿" },
    { name: "Colombia", flagEmoji: "🇨🇴" },
    { name: "DR Congo", flagEmoji: "🇨🇩" },
  ],
  L: [
    { name: "England", flagEmoji: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}" },
    { name: "Croatia", flagEmoji: "🇭🇷" },
    { name: "Ghana", flagEmoji: "🇬🇭" },
    { name: "Panama", flagEmoji: "🇵🇦" },
  ],
};

export function createDefaultTournament() {
  const teams = createPlaceholderTeams();
  const fixtures = createOfficialFixtures(teams);
  const participants = createPlaceholderParticipants(teams);

  return {
    name: "FIFA World Cup 2026",
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    groups,
    teams,
    fixtures,
    prizeRules: createPrizeRules(),
    participants,
  };
}

function createPlaceholderTeams() {
  return groups.flatMap((group) =>
    [1, 2, 3, 4].map((seed) => {
      const team = officialGroupTeams[group][seed - 1];

      return {
        id: `${group}${seed}`,
        name: team.name,
        group,
        seed,
        flagEmoji: team.flagEmoji,
        flagUrl: getTeamFlagUrl(team.name),
        sweepstakeOwner: "Not drawn yet",
      };
    })
  );
}

function createPrizeRules() {
  return [
    {
      id: "winner",
      name: "Prize 1: World Cup winner",
      prize: "TBC",
      summary: "Awarded to the participant who picked the team that wins the World Cup.",
      complexity: "simple",
    },
    {
      id: "runner-up",
      name: "Prize 2: Runner-up",
      prize: "TBC",
      summary: "Awarded to the participant who picked the losing finalist.",
      complexity: "simple",
    },
    {
      id: "best-pot-b",
      name: "Prize 3: Best Pot B team",
      prize: "TBC",
      summary: "Awarded to the participant whose Pot B team has the most successful tournament.",
      complexity: "table",
      tableColumns: ["Rank factor", "How it is decided"],
      tableRows: [
        ["1", "Furthest stage reached"],
        ["2", "Most tournament points"],
        ["3", "Best goal difference"],
        ["4", "Most goals scored"],
      ],
    },
    {
      id: "biggest-loser",
      name: "Prize 4: Biggest loser",
      prize: "TBC",
      summary: "Awarded to the participant who picked the worst performing team.",
      complexity: "table",
      tableColumns: ["Rank factor", "How it is decided"],
      tableRows: [
        ["1", "Fewest points"],
        ["2", "Worst goal difference"],
        ["3", "Fewest goals scored"],
        ["4", "Most cards"],
      ],
    },
    {
      id: "master-of-chaos",
      name: "Prize 5: Master of Chaos",
      prize: "TBC",
      summary:
        "Awarded to the player whose two teams' matches have jointly produced the most goals for and against across the tournament.",
      complexity: "simple",
    },
    {
      id: "dirtiest-player",
      name: "Prize 6: Dirtiest player",
      prize: "TBC",
      summary:
        "Awarded to the player whose two teams jointly accumulate the most disciplinary points across the tournament. Yellow cards score 1 point and red cards score 2 points.",
      complexity: "simple",
    },
  ];
}

function createPlaceholderParticipants(teams) {
  const names = ["Dave", "Sarah", "Mike", "Aisha", "Tom", "Priya", "Ben", "Lucy"];

  return names.map((name, index) => {
    const potATeam = teams[index];
    const potBTeam = teams[index + 24];

    return {
      id: `player-${index + 1}`,
      name,
      potATeamId: potATeam.id,
      potBTeamId: potBTeam.id,
    };
  });
}
