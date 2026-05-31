const groups = "ABCDEFGHIJKL".split("");

const hostCities = [
  "Mexico City",
  "Guadalajara",
  "Monterrey",
  "Toronto",
  "Vancouver",
  "Atlanta",
  "Boston",
  "Dallas",
  "Houston",
  "Kansas City",
  "Los Angeles",
  "Miami",
  "New York/New Jersey",
  "Philadelphia",
  "San Francisco Bay Area",
  "Seattle",
];

const kickoffTimesUk = ["17:00", "20:00"];

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
    { name: "Scotland", flagEmoji: "🏴" },
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
    { name: "England", flagEmoji: "🏴" },
    { name: "Croatia", flagEmoji: "🇭🇷" },
    { name: "Ghana", flagEmoji: "🇬🇭" },
    { name: "Panama", flagEmoji: "🇵🇦" },
  ],
};

export function createDefaultTournament() {
  const teams = createPlaceholderTeams();
  const fixtures = [...createGroupFixtures(teams), ...createKnockoutFixtures()];
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

function createGroupFixtures(teams) {
  const pairings = [
    [0, 1],
    [2, 3],
    [0, 2],
    [1, 3],
    [0, 3],
    [1, 2],
  ];

  let fixtureNumber = 1;

  return groups.flatMap((group, groupIndex) => {
    const groupTeams = teams.filter((team) => team.group === group);

    return pairings.map(([homeIndex, awayIndex], roundIndex) => {
      const homeTeam = groupTeams[homeIndex];
      const awayTeam = groupTeams[awayIndex];

      return {
        id: `M${fixtureNumber++}`,
        matchNumber: fixtureNumber - 1,
        stage: "Group",
        group,
        date: addDays("2026-06-11", groupIndex * 2 + Math.floor(roundIndex / 2)),
        kickoffUk: kickoffTimesUk[roundIndex % kickoffTimesUk.length],
        venue: hostCities[(fixtureNumber + groupIndex) % hostCities.length],
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        homeTeamName: homeTeam.name,
        awayTeamName: awayTeam.name,
        homeScore: null,
        awayScore: null,
      };
    });
  });
}

function createKnockoutFixtures() {
  const knockoutStages = [
    { stage: "Round of 32", matches: 16, startDate: "2026-06-28" },
    { stage: "Round of 16", matches: 8, startDate: "2026-07-04" },
    { stage: "Quarter-final", matches: 4, startDate: "2026-07-09" },
    { stage: "Semi-final", matches: 2, startDate: "2026-07-14" },
    { stage: "Third-place play-off", matches: 1, startDate: "2026-07-18" },
    { stage: "Final", matches: 1, startDate: "2026-07-19" },
  ];

  let matchNumber = 73;

  return knockoutStages.flatMap(({ stage, matches, startDate }) =>
    Array.from({ length: matches }, (_, index) => ({
      id: `M${matchNumber}`,
      matchNumber: matchNumber++,
      stage,
      group: null,
      date: addDays(startDate, Math.floor(index / 2)),
      kickoffUk: kickoffTimesUk[index % kickoffTimesUk.length],
      venue: hostCities[(matchNumber + index) % hostCities.length],
      homeTeamId: null,
      awayTeamId: null,
      homeTeamName: `${stage} team ${index + 1}A`,
      awayTeamName: `${stage} team ${index + 1}B`,
      homeScore: null,
      awayScore: null,
    }))
  );
}

function addDays(dateText, daysToAdd) {
  const date = new Date(`${dateText}T12:00:00`);
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().slice(0, 10);
}
