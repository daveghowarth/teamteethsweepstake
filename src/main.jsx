import React from "react";
import ReactDOM from "react-dom/client";
import {
  BookOpen,
  CalendarDays,
  Database,
  Home,
  ImagePlus,
  Shield,
  Trophy,
  Users,
  X,
} from "lucide-react";
import "./styles.css";
import { createDefaultTournament } from "./data/defaultTournament";
import { createOfficialFixtures } from "./data/officialFixtures.js";
import {
  calculateDashboardStats,
  calculateGroupTables,
  getFixturesByStage,
  getQualifiedTeams,
} from "./utils/tournament";
import { useLocalStorage } from "./hooks/useLocalStorage";

const STORAGE_KEY = "world-cup-2026-tournament-data";
const PLAYER_COUNT = 24;

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

const prizeIconPaths = {
  winner: {
    large: "/images/prizes/64/prize-1.png",
    small: "/images/prizes/32/prize-1.png",
  },
  "runner-up": {
    large: "/images/prizes/64/prize-2.png",
    small: "/images/prizes/32/prize-2.png",
  },
  "best-pot-b": {
    large: "/images/prizes/64/prize-3.png",
    small: "/images/prizes/32/prize-3.png",
  },
  "biggest-loser": {
    large: "/images/prizes/64/prize-4.png",
    small: "/images/prizes/32/prize-4.png",
  },
  "master-of-chaos": {
    large: "/images/prizes/64/prize-5.png",
    small: "/images/prizes/32/prize-5.png",
  },
  "dirtiest-player": {
    large: "/images/prizes/64/prize-6.png",
    small: "/images/prizes/32/prize-6.png",
  },
};

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "fixtures", label: "Fixtures and scores", icon: CalendarDays },
  { id: "rules", label: "Rules", icon: BookOpen },
  { id: "players", label: "Players", icon: Users },
  { id: "admin", label: "Enter Scores", icon: Shield },
  { id: "sweepstake", label: "Sweepstake draw", icon: Trophy },
  { id: "settings", label: "Settings / Data", icon: Database },
];

function App() {
  const [activeTab, setActiveTab] = React.useState("dashboard");
  const isLocalSite = isLocalEditableSite();
  const isSweepstakeAdmin = window.location.pathname.includes("sweepstake-admin");
  const isEditableSite = isLocalSite || isSweepstakeAdmin;
  const hasSavedLocalTournament = React.useRef(window.localStorage.getItem(STORAGE_KEY) !== null);
  const [localTournament, setLocalTournament] = useLocalStorage(STORAGE_KEY, createDefaultTournament);
  const [publishedTournament, setPublishedTournament] = React.useState(() => createDefaultTournament());
  const tournament = isEditableSite ? localTournament : publishedTournament;
  const setTournament = isEditableSite ? setLocalTournament : setPublishedTournament;
  const displayTournament = React.useMemo(
    () => addSweepstakeOwnersToTeams(applyOfficialFixtureSchedule(applyOfficialTeamNames(tournament))),
    [tournament]
  );

  React.useEffect(() => {
    if (isEditableSite && (isLocalSite || hasSavedLocalTournament.current)) return undefined;

    let isMounted = true;

    fetch("/data/published-tournament.json")
      .then((response) => (response.ok ? response.json() : createDefaultTournament()))
      .then((publishedData) => {
        if (!isMounted) return;

        if (isEditableSite) {
          setLocalTournament(publishedData);
          hasSavedLocalTournament.current = true;
        } else {
          setPublishedTournament(publishedData);
        }
      })
      .catch(() => {
        if (isMounted && !isEditableSite) {
          setPublishedTournament(createDefaultTournament());
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isEditableSite, isLocalSite, setLocalTournament]);

  React.useEffect(() => {
    if (!isEditableSite) return;
    if (
      !hasPlaceholderTeamNames(tournament) &&
      !hasOutdatedFixtureSchedule(tournament) &&
      !hasOutdatedHomeNationFlags(tournament)
    ) {
      return;
    }
    setTournament((current) => applyOfficialFixtureSchedule(applyOfficialTeamNames(current)));
  }, [isEditableSite, setTournament, tournament]);

  const groupTables = React.useMemo(
    () => calculateGroupTables(displayTournament),
    [displayTournament]
  );
  const qualifiedTeams = React.useMemo(() => getQualifiedTeams(groupTables), [groupTables]);
  const dashboardStats = React.useMemo(
    () => calculateDashboardStats(displayTournament, groupTables, qualifiedTeams),
    [displayTournament, groupTables, qualifiedTeams]
  );

  function updateFixtureScore(fixtureId, homeScore, awayScore) {
    setTournament((current) => ({
      ...current,
      fixtures: current.fixtures.map((fixture) =>
        fixture.id === fixtureId
          ? {
              ...fixture,
              homeScore: homeScore === "" ? null : Number(homeScore),
              awayScore: awayScore === "" ? null : Number(awayScore),
            }
          : fixture
      ),
      updatedAt: new Date().toISOString(),
    }));
  }

  function resetTournament() {
    const confirmed = window.confirm("Reset all scores and data back to the starter tournament?");
    if (confirmed) {
      setTournament(createDefaultTournament());
      setActiveTab("dashboard");
    }
  }

  if (isSweepstakeAdmin) {
    return (
      <div className="app-shell min-h-screen text-white">
        <Hero />
        <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">
          <SweepstakeAdmin
            tournament={displayTournament}
            setTournament={setTournament}
            isLocalSite={isLocalSite}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen text-white">
      <Hero />
      <main className="relative z-10 mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 lg:px-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <Navigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isEditableSite={isEditableSite}
          />
        </aside>

        <section className="min-w-0 flex-1">
          <div className="mb-5 lg:hidden">
            <Navigation
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isEditableSite={isEditableSite}
              compact
            />
          </div>

          {activeTab === "dashboard" && (
            <Dashboard
              tournament={displayTournament}
              groupTables={groupTables}
              qualifiedTeams={qualifiedTeams}
              stats={dashboardStats}
            />
          )}
          {activeTab === "fixtures" && <Fixtures tournament={displayTournament} />}
          {activeTab === "rules" && <RulesPage tournament={displayTournament} />}
          {activeTab === "players" && (
            <PlayersPage tournament={displayTournament} groupTables={groupTables} />
          )}
          {activeTab === "admin" && (
            <AdminScores tournament={displayTournament} updateFixtureScore={updateFixtureScore} />
          )}
          {activeTab === "sweepstake" && <SweepstakePlaceholder isEditableSite={isEditableSite} />}
          {activeTab === "settings" && (
            <SettingsData
              tournament={displayTournament}
              setTournament={setTournament}
              resetTournament={resetTournament}
            />
          )}
        </section>
      </main>
    </div>
  );
}

function Hero() {
  return (
    <header className="relative overflow-hidden border-b border-white/10 text-white">
      <div className="relative mx-auto max-w-7xl px-4 py-4 lg:px-8">
        <picture>
          <source media="(max-width: 700px)" srcSet="/images/banner3-mobile.jpg" />
          <source media="(max-width: 1400px)" srcSet="/images/banner3-desktop.jpg" />
          <img
            className="w-full rounded-lg shadow-soft"
            src="/images/banner3-desktop.jpg"
            alt="Team Teeth and Friends World Cup Sweepstake 2026"
            width="1400"
            height="393"
            loading="eager"
            fetchPriority="high"
          />
        </picture>
      </div>
    </header>
  );
}

function Navigation({ activeTab, setActiveTab, isEditableSite, compact = false }) {
  const visibleTabs = isEditableSite
    ? tabs
    : tabs.filter((tab) => !["admin", "settings"].includes(tab.id));

  return (
    <nav className={compact ? "flex gap-2 overflow-x-auto pb-1" : "sticky top-4 space-y-2"}>
      {visibleTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex min-h-11 items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-bold transition duration-200 ${
              compact ? "shrink-0" : "w-full"
            } ${
              isActive
                ? "bg-cyan-300 text-slate-950 shadow-soft"
                : "glass-card text-white/82 hover:-translate-y-0.5 hover:bg-white/15 hover:text-white"
            }`}
            title={tab.label}
          >
            <Icon size={18} />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

function Dashboard({ tournament, groupTables, qualifiedTeams, stats }) {
  const hydratedFixtures = tournament.fixtures.map((fixture) =>
    hydrateFixtureTeams(fixture, tournament.teams)
  );
  const matchDay = getTodayOrNextMatchDay(hydratedFixtures);

  return (
    <div className="space-y-6">
      <TodaysMatchesCard matchDay={matchDay} />

      <GroupTables groupTables={groupTables} qualifiedTeams={qualifiedTeams} />
      <KnockoutBracket fixtures={getFixturesByStage(tournament.fixtures, "knockout")} />
    </div>
  );
}

function TodaysMatchesCard({ matchDay }) {
  const hasMatchesToday = matchDay.todaysFixtures.length > 0;

  return (
    <section className="mx-auto max-w-5xl rounded-lg border border-white/12 bg-white/10 p-4 shadow-soft backdrop-blur-xl sm:p-5">
      <h2 className="mb-4 text-xl font-black text-white">Today's matches</h2>
      <div className="grid gap-4 md:grid-cols-[180px_1fr] md:items-stretch">
        <CalendarDate date={matchDay.today} />
        <div className="space-y-4">
          {!hasMatchesToday && (
            <div className="rounded-lg border border-dashed border-white/20 bg-white/8 p-4">
              <p className="text-lg font-black text-white">No matches today</p>
              {matchDay.nextDate && (
                <p className="mt-1 text-sm font-semibold text-cyan-100/80">
                  Next matches: {formatShortDate(matchDay.nextDate)}
                </p>
              )}
            </div>
          )}
          <div className="grid gap-3 lg:grid-cols-2">
            {(hasMatchesToday ? matchDay.todaysFixtures : matchDay.nextFixtures).map((fixture) => (
              <TodaysMatch key={fixture.id} fixture={fixture} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CalendarDate({ date }) {
  const calendarDate = new Date(`${date}T12:00:00`);

  return (
    <div className="overflow-hidden rounded-lg border border-white/15 bg-slate-950/70 text-center shadow-soft">
      <div className="bg-cyan-300 px-4 py-2 text-sm font-black uppercase text-slate-950">
        {new Intl.DateTimeFormat("en-GB", { month: "long" }).format(calendarDate)}
      </div>
      <div className="px-4 py-5">
        <p className="text-sm font-bold uppercase text-white/55">
          {new Intl.DateTimeFormat("en-GB", { weekday: "long" }).format(calendarDate)}
        </p>
        <p className="text-5xl font-black text-white">{calendarDate.getDate()}</p>
        <p className="text-sm font-semibold text-cyan-100/70">{calendarDate.getFullYear()}</p>
      </div>
    </div>
  );
}

function TodaysMatch({ fixture }) {
  const played = fixture.homeScore !== null && fixture.awayScore !== null;

  return (
    <article className="tv-fixture rounded-lg p-4 transition duration-200 hover:-translate-y-1">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-black uppercase tracking-wide text-cyan-200">
          {fixture.stage === "Group" ? `Group ${fixture.group}` : fixture.stage}
        </p>
        <p className="rounded bg-white/10 px-2 py-1 text-xs font-bold text-white/75">
          {getKickoffUk(fixture)} UK
        </p>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamName team={fixture.homeTeam} name={fixture.homeTeamName} align="right" />
        <div className="rounded-lg bg-cyan-300 px-3 py-2 text-center font-black text-slate-950 shadow-soft">
          {played ? `${fixture.homeScore} - ${fixture.awayScore}` : "vs"}
        </div>
        <TeamName team={fixture.awayTeam} name={fixture.awayTeamName} />
      </div>
      <p className="mt-3 text-center text-xs text-white/50">{fixture.venue}</p>
    </article>
  );
}

function Fixtures({ tournament }) {
  const [filter, setFilter] = React.useState("all");
  const fixtures = tournament.fixtures.map((fixture) => hydrateFixtureTeams(fixture, tournament.teams)).filter((fixture) => {
    if (filter === "all") return true;
    if (filter === "group") return fixture.stage === "Group";
    if (filter === "knockout") return fixture.stage !== "Group";
    return fixture.group === filter;
  });

  return (
    <div className="space-y-6">
      <SectionTitle title="Fixtures and scores" subtitle="Browse the full 104-match structure." />
      <FilterBar filter={filter} setFilter={setFilter} />
      <FixtureGrid fixtures={fixtures} />
    </div>
  );
}

function AdminScores({ tournament, updateFixtureScore }) {
  const groupFixtures = tournament.fixtures
    .map((fixture) => hydrateFixtureTeams(fixture, tournament.teams))
    .filter((fixture) => fixture.stage === "Group");

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Enter Scores"
        subtitle="Private admin-style page for updating match results. Scores save automatically in this browser."
      />
      <div className="rounded-lg border border-amber-300/30 bg-amber-300/10 p-4 text-sm font-semibold text-amber-100">
        This is not password protected yet. Later you can connect it to a real admin login.
      </div>
      <div className="space-y-3">
        {groupFixtures.map((fixture) => (
          <ScoreInputCard key={fixture.id} fixture={fixture} updateFixtureScore={updateFixtureScore} />
        ))}
      </div>
    </div>
  );
}

function RulesPage({ tournament }) {
  const prizeRules = getPrizeRules(tournament);
  const [selectedPrizeTable, setSelectedPrizeTable] = React.useState(null);
  const selectedRule = prizeRules.find((rule) => rule.id === selectedPrizeTable);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Rules"
        subtitle="The sweepstake prize structure. The amounts and wording are editable in the starter data."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {prizeRules.map((rule) => (
          <PrizeRuleCard key={rule.id} rule={rule} onOpenTable={setSelectedPrizeTable} />
        ))}
      </div>

      {selectedRule && (
        <PrizeTableModal
          rule={selectedRule}
          tournament={tournament}
          onClose={() => setSelectedPrizeTable(null)}
        />
      )}
    </div>
  );
}

function PrizeRuleCard({ rule, onOpenTable }) {
  const hasPopoutTable = rule.id === "master-of-chaos" || rule.id === "dirtiest-player";

  return (
    <article className="glass-card rounded-lg p-5 shadow-sm transition hover:-translate-y-1 hover:bg-white/12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <PrizeIcon prizeId={rule.id} label={rule.name} />
          <div>
            <h3 className="text-lg font-black text-white">{rule.name}</h3>
            <p className="mt-1 text-sm leading-6 text-white/65">{rule.summary}</p>
          </div>
        </div>
        <span className="rounded bg-cyan-300 px-3 py-1 text-xs font-black text-slate-950">{rule.prize}</span>
      </div>

      {hasPopoutTable && (
        <button
          onClick={() => onOpenTable(rule.id)}
          className="mt-4 rounded-lg bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-white"
        >
          View league table
        </button>
      )}

      {rule.complexity === "table" && (
        <div className="mt-4 overflow-hidden rounded-lg border border-white/12">
          <table className="w-full text-sm">
            <thead className="bg-white/10 text-xs uppercase text-cyan-100/70">
              <tr>
                {rule.tableColumns.map((column) => (
                  <th key={column} className="px-3 py-2 text-left">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rule.tableRows.map((row) => (
                <tr key={row.join("-")} className="border-t border-white/10">
                  {row.map((cell) => (
                    <td key={cell} className="px-3 py-2">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

function PrizeIcon({ prizeId, label, size = "large", active = true }) {
  const imagePath = prizeIconPaths[prizeId]?.[size] || prizeIconPaths.winner[size];
  const sizeClass = size === "small" ? "prize-icon-small" : "prize-icon-large";

  return (
    <img
      src={imagePath}
      alt={label}
      className={`prize-icon ${sizeClass} ${active ? "" : "prize-icon-inactive"}`}
      loading="lazy"
    />
  );
}

function PrizeTableModal({ rule, tournament, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/80 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prize-table-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-5xl overflow-hidden rounded-lg border border-white/12 bg-slate-950 shadow-soft">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-slate-950/95 px-5 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-cyan-200">League table</p>
            <h2 id="prize-table-title" className="text-2xl font-black text-white">
              {rule.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close prize table"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="max-h-[calc(100vh-9rem)] overflow-y-auto p-5">
          {rule.id === "master-of-chaos" && <MasterOfChaosTable tournament={tournament} />}
          {rule.id === "dirtiest-player" && <DirtiestPlayerTable tournament={tournament} />}
        </div>
      </div>
    </div>
  );
}

function MasterOfChaosTable({ tournament }) {
  const rows = getMasterOfChaosRows(tournament);

  return (
    <ResponsiveTable
      columns={["Player", "Pot 1 goals", "Pot 2 goals", "Total goals"]}
      rows={rows.map((row, index) => [
        `${index + 1}. ${row.player}`,
        row.pot1Goals,
        row.pot2Goals,
        row.totalGoals,
      ])}
    />
  );
}

function DirtiestPlayerTable({ tournament }) {
  const rows = getDirtiestPlayerRows(tournament);

  return (
    <ResponsiveTable
      columns={[
        "Player",
        "Pot 1 yellows",
        "Pot 1 reds",
        "Pot 2 yellows",
        "Pot 2 reds",
        "Total points",
      ]}
      rows={rows.map((row, index) => [
        `${index + 1}. ${row.player}`,
        row.pot1Yellows,
        row.pot1Reds,
        row.pot2Yellows,
        row.pot2Reds,
        row.totalPoints,
      ])}
    />
  );
}

function ResponsiveTable({ columns, rows }) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/12">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="bg-white/10 text-xs uppercase text-cyan-100/70">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-3 py-3 text-left">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.join("-")} className="border-t border-white/10 text-white/85">
                {row.map((cell, index) => (
                  <td key={`${row[0]}-${index}`} className="px-3 py-3 font-semibold">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlayersPage({ tournament, groupTables }) {
  const participants = getParticipants(tournament);
  const [selectedParticipantId, setSelectedParticipantId] = React.useState(null);
  const selectedParticipant = participants.find(
    (participant) => participant.id === selectedParticipantId
  );

  React.useEffect(() => {
    if (!selectedParticipantId) return undefined;

    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setSelectedParticipantId(null);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedParticipantId]);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Players"
        subtitle="Click a participant to open their Pot A and Pot B teams, fixtures, scores, and active prize chances."
      />
      {participants.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {participants.map((participant) => (
            <ParticipantButton
              key={participant.id}
              participant={participant}
              tournament={tournament}
              groupTables={groupTables}
              onClick={() => setSelectedParticipantId(participant.id)}
            />
          ))}
        </div>
      ) : (
        <Panel title="No players yet">
          <p className="text-sm text-white/65">Add participants to the starter data to show them here.</p>
        </Panel>
      )}

      {selectedParticipant && (
        <ParticipantModal
          participant={selectedParticipant}
          tournament={tournament}
          groupTables={groupTables}
          onClose={() => setSelectedParticipantId(null)}
        />
      )}
    </div>
  );
}

function ParticipantButton({ participant, tournament, groupTables, onClick }) {
  const picks = getParticipantPicks(participant, tournament.teams);
  const prizeEligibility = getPrizeEligibility(participant, tournament, groupTables);

  return (
    <button
      onClick={onClick}
      className="glass-card w-full rounded-lg p-4 text-left shadow-sm transition hover:-translate-y-1 hover:bg-white/12 hover:shadow-soft"
    >
      <div className="flex items-center gap-3">
        <PlayerAvatar participant={participant} size="large" />
        <p className="font-black text-white">{getParticipantDisplayName(participant)}</p>
      </div>
      <div className="mt-2 space-y-1 text-sm text-white/65">
        <p className="flex flex-wrap items-center gap-1">Pot A: <CompactTeam team={picks.potA} /></p>
        <p className="flex flex-wrap items-center gap-1">Pot B: <CompactTeam team={picks.potB} /></p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {prizeEligibility.map((prize) => (
          <span
            key={prize.id}
            className="prize-icon-chip"
            title={`${prize.name}: ${prize.status}`}
            aria-label={`${prize.name}: ${prize.status}`}
          >
            <PrizeIcon
              prizeId={prize.id}
              label={prize.name}
              size="small"
              active={isPrizeStillEligible(prize)}
            />
          </span>
        ))}
      </div>
    </button>
  );
}

function PlayerAvatar({ participant, size = "normal" }) {
  const initials = getInitials(getParticipantDisplayName(participant));
  const sizeClass = size === "large" ? "player-avatar-large" : "player-avatar";

  if (participant.avatarUrl) {
    return (
      <img
        className={sizeClass}
        src={participant.avatarUrl}
        alt=""
        loading="lazy"
      />
    );
  }

  return (
    <span className={`${sizeClass} player-avatar-fallback`} aria-hidden="true">
      {initials}
    </span>
  );
}

function ParticipantModal({ participant, tournament, groupTables, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/80 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="participant-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-5xl overflow-hidden rounded-lg border border-white/12 bg-slate-950 shadow-soft">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-slate-950/95 px-5 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-cyan-200">Player details</p>
            <div className="mt-1 flex items-center gap-3">
              <PlayerAvatar participant={participant} />
              <h2 id="participant-modal-title" className="text-2xl font-black text-white">
                {getParticipantDisplayName(participant)}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close player details"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="max-h-[calc(100vh-9rem)] overflow-y-auto p-5">
          <ParticipantDetail
            participant={participant}
            tournament={tournament}
            groupTables={groupTables}
          />
        </div>
      </div>
    </div>
  );
}

function ParticipantDetail({ participant, tournament, groupTables }) {
  const picks = getParticipantPicks(participant, tournament.teams);
  const pickedTeams = [picks.potA, picks.potB].filter(Boolean);
  const pickedTeamIds = pickedTeams.map((team) => team.id);
  const pickedFixtures = tournament.fixtures
    .map((fixture) => hydrateFixtureTeams(fixture, tournament.teams))
    .filter(
      (fixture) =>
        pickedTeamIds.includes(fixture.homeTeamId) || pickedTeamIds.includes(fixture.awayTeamId)
    );
  const prizeEligibility = getPrizeEligibility(participant, tournament, groupTables);

  return (
    <div className="space-y-5">
      <Panel title={`${getParticipantDisplayName(participant)}'s picks`}>
        <div className="grid gap-3 md:grid-cols-2">
          <PickedTeamCard label="Pot A" team={picks.potA} groupTables={groupTables} />
          <PickedTeamCard label="Pot B" team={picks.potB} groupTables={groupTables} />
        </div>
      </Panel>

      <Panel title="Prize eligibility">
        <div className="grid gap-3 md:grid-cols-2">
          {prizeEligibility.map((prize) => (
            <div
              key={prize.id}
              className={`rounded-lg border p-3 ${
                isPrizeStillEligible(prize)
                  ? "border-cyan-300/25 bg-cyan-300/10"
                  : "border-white/12 bg-white/8"
              }`}
            >
              <div className="flex items-start gap-3">
                <PrizeIcon
                  prizeId={prize.id}
                  label={prize.name}
                  size="small"
                  active={isPrizeStillEligible(prize)}
                />
                <div>
                  <p className="font-bold">{prize.name}</p>
                  <p className="mt-1 text-sm text-white/65">{prize.status}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Scores and fixtures">
        <FixtureGrid fixtures={pickedFixtures} />
      </Panel>
    </div>
  );
}

function PickedTeamCard({ label, team, groupTables }) {
  const tableRow = team ? groupTables[team.group]?.find((row) => row.id === team.id) : null;

  return (
    <div className="rounded-lg border border-white/12 bg-white/8 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-cyan-200">{label}</p>
      <div className="mt-2">
        <TeamName team={team} name={team?.name || "Team TBC"} />
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
        <MiniStat label="Pts" value={tableRow?.points ?? 0} />
        <MiniStat label="P" value={tableRow?.played ?? 0} />
        <MiniStat label="GD" value={tableRow?.goalDifference ?? 0} />
        <MiniStat label="GF" value={tableRow?.goalsFor ?? 0} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded bg-white/8 p-2">
      <p className="font-black text-cyan-200">{value}</p>
      <p className="text-white/50">{label}</p>
    </div>
  );
}

function CompactTeam({ team }) {
  if (!team) return <span>Team TBC</span>;
  const flag = team.flagEmoji || getPlaceholderFlag(team.id);

  return (
    <span className="inline-flex items-center gap-1.5">
      <TeamMarker team={team} fallbackFlag={flag} />
      <span>{team.name}</span>
    </span>
  );
}

function ScoreInputCard({ fixture, updateFixtureScore }) {
  return (
    <div className="glass-card grid gap-3 rounded-lg p-4 shadow-sm md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <p className="text-xs font-bold uppercase text-cyan-100/65">
          {formatDate(fixture.date)} · {getKickoffUk(fixture)} UK · Group {fixture.group}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-base font-bold">
          <TeamName team={fixture.homeTeam} name={fixture.homeTeamName} />
          <span className="text-white/40">vs</span>
          <TeamName team={fixture.awayTeam} name={fixture.awayTeamName} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          aria-label={`${fixture.homeTeamName} score`}
          className="score-input"
          min="0"
          type="number"
          value={fixture.homeScore ?? ""}
          onChange={(event) =>
            updateFixtureScore(fixture.id, event.target.value, fixture.awayScore ?? "")
          }
        />
        <span className="font-bold text-white/40">-</span>
        <input
          aria-label={`${fixture.awayTeamName} score`}
          className="score-input"
          min="0"
          type="number"
          value={fixture.awayScore ?? ""}
          onChange={(event) =>
            updateFixtureScore(fixture.id, fixture.homeScore ?? "", event.target.value)
          }
        />
      </div>
    </div>
  );
}

function SettingsData({ tournament, setTournament, resetTournament }) {
  const fileInputRef = React.useRef(null);
  const [syncStatus, setSyncStatus] = React.useState(null);

  function exportJson() {
    const blob = new Blob([JSON.stringify(tournament, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "world-cup-2026-tournament-backup.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function importJson(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const importedData = JSON.parse(reader.result);
        if (!importedData.teams || !importedData.fixtures) {
          throw new Error("Missing teams or fixtures");
        }
        setTournament(importedData);
        window.alert("Tournament data imported successfully.");
      } catch {
        window.alert("That file could not be imported. Please choose a valid tournament JSON backup.");
      }
    };
    reader.readAsText(file);
  }

  async function syncFromApiFootball() {
    await syncFromProvider({
      providerName: "API-Football",
      endpoint: "/api/api-football/sync",
      mapper: mapApiFootballDataToTournament,
    });
  }

  async function syncFromFifa() {
    await syncFromProvider({
      providerName: "FIFA",
      endpoint: "/api/fifa/sync",
      mapper: mapFifaDataToTournament,
    });
  }

  async function syncFromTheSportsDb() {
    await syncFromProvider({
      providerName: "TheSportsDB",
      endpoint: "/api/thesportsdb/sync",
      mapper: mapTheSportsDbDataToTournament,
    });
  }

  async function syncFromProvider({ providerName, endpoint, mapper }) {
    setSyncStatus({ type: "loading", message: `Syncing fixtures from ${providerName}...` });

    try {
      const response = await fetch(endpoint);
      const responseText = await response.text();
      let payload;

      try {
        payload = JSON.parse(responseText);
      } catch {
        throw new Error(
          "The sync endpoint returned the app page instead of API data. Stop the dev server, then restart it with npm run dev so the local API proxy is running."
        );
      }

      if (!response.ok) {
        throw new Error(payload.error || `${providerName} sync failed.`);
      }

      const syncedFixtures = Array.isArray(payload.fixtures) ? payload.fixtures : [];

      if (syncedFixtures.length === 0) {
        throw new Error(`${providerName} returned no fixtures for the configured league and season.`);
      }

      const nextTournament = mapper(tournament, syncedFixtures, payload);
      setTournament(nextTournament);
      setSyncStatus({
        type: "success",
        message: `Sync complete: imported ${syncedFixtures.length} fixtures from ${providerName}.`,
      });
    } catch (error) {
      setSyncStatus({
        type: "error",
        message: error instanceof Error ? error.message : `${providerName} sync failed.`,
      });
    }
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Settings / Data"
        subtitle="Back up, restore, or reset your local tournament data."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <ActionCard
          title="Sync from FIFA"
          text="Fetch the official 104-match World Cup schedule from FIFA."
          button={syncStatus?.type === "loading" ? "Syncing..." : "Sync from FIFA"}
          onClick={syncFromFifa}
          disabled={syncStatus?.type === "loading"}
        />
        <ActionCard
          title="Sync from API-Football"
          text="Fetch World Cup 2026 fixtures and results through the local private proxy."
          button={syncStatus?.type === "loading" ? "Syncing..." : "Sync from API-Football"}
          onClick={syncFromApiFootball}
          disabled={syncStatus?.type === "loading"}
        />
        <ActionCard
          title="Sync from TheSportsDB"
          text="Try TheSportsDB as an alternate source for World Cup fixtures and results."
          button={syncStatus?.type === "loading" ? "Syncing..." : "Sync from TheSportsDB"}
          onClick={syncFromTheSportsDb}
          disabled={syncStatus?.type === "loading"}
        />
        <ActionCard
          title="Export backup"
          text="Download all teams, fixtures, and scores as one JSON file."
          button="Export JSON"
          onClick={exportJson}
        />
        <ActionCard
          title="Import backup"
          text="Restore a JSON backup from this app."
          button="Import JSON"
          onClick={() => fileInputRef.current?.click()}
        />
        <ActionCard
          title="Reset data"
          text="Return to the starter placeholder tournament."
          button="Reset"
          danger
          onClick={resetTournament}
        />
      </div>
      {syncStatus && (
        <div
          className={`rounded-lg border p-4 text-sm font-semibold ${
            syncStatus.type === "success"
              ? "border-green-300/30 bg-green-300/10 text-green-100"
              : syncStatus.type === "error"
                ? "border-red-300/30 bg-red-300/10 text-red-100"
                : "border-white/12 bg-white/10 text-white/80"
          }`}
        >
          {syncStatus.message}
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={importJson} />
      <Panel title="Starter data summary">
        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <p>
            <strong>{tournament.teams.length}</strong> teams
          </p>
          <p>
            <strong>{tournament.groups.length}</strong> groups
          </p>
          <p>
            <strong>{tournament.fixtures.length}</strong> fixtures
          </p>
        </div>
      </Panel>
    </div>
  );
}

function SweepstakePlaceholder({ isEditableSite }) {
  return (
    <div className="space-y-6">
      <SectionTitle
        title="Sweepstake draw"
        subtitle="Reserved for the sweepstake feature you plan to add later."
      />
      <div className="glass-panel rounded-lg border-dashed p-8 text-center shadow-sm">
        <Trophy className="mx-auto text-cyan-200" size={42} />
        <h2 className="mt-4 text-2xl font-black text-white">Coming next</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-white/65">
          {isEditableSite
            ? "Use the separate sweepstake admin page to enter player names, team picks, and photos."
            : "The draw details and player picks will appear here once the sweepstake is ready."}
        </p>
        {isEditableSite && (
          <a
            className="mt-5 inline-flex rounded-lg bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-white"
            href="/sweepstake-admin"
          >
            Open sweepstake admin
          </a>
        )}
      </div>
    </div>
  );
}

function SweepstakeAdmin({ tournament, setTournament, isLocalSite }) {
  const csvInputRef = React.useRef(null);
  const participants = getParticipants(tournament);
  const potATeams = getPotTeams(tournament.teams, "A");
  const potBTeams = getPotTeams(tournament.teams, "B");
  const completedPlayers = participants.filter((participant) => participant.name.trim()).length;

  function updateParticipant(participantId, changes) {
    setTournament((current) => {
      const nextParticipants = getParticipants(current).map((participant) =>
        participant.id === participantId ? { ...participant, ...changes } : participant
      );

      return addSweepstakeOwnersToTeams({
        ...applyOfficialFixtureSchedule(applyOfficialTeamNames(current)),
        participants: nextParticipants,
        updatedAt: new Date().toISOString(),
      });
    });
  }

  function clearAvatar(participantId) {
    updateParticipant(participantId, { avatarUrl: "" });
  }

  async function uploadAvatar(participantId, file) {
    if (!file) return;

    try {
      const avatarUrl = await resizeAvatarFile(file);
      updateParticipant(participantId, { avatarUrl });
    } catch {
      window.alert("That photo could not be uploaded. Please try a different image.");
    }
  }

  function exportPlayersCsv() {
    const csvRows = [
      ["player_number", "name", "pot_a_team", "pot_b_team"],
      ...participants.map((participant, index) => {
        const picks = getParticipantPicks(participant, tournament.teams);

        return [
          index + 1,
          participant.name,
          picks.potA?.name || "",
          picks.potB?.name || "",
        ];
      }),
    ];

    downloadCsv("sweepstake-players-template.csv", csvRows);
  }

  function importPlayersCsv(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = parseCsv(reader.result);
        const importedParticipants = mapPlayerCsvRowsToParticipants(rows, tournament);

        setTournament((current) =>
          addSweepstakeOwnersToTeams({
            ...applyOfficialTeamNames(current),
            participants: importedParticipants,
            updatedAt: new Date().toISOString(),
          })
        );

        window.alert("Player list imported successfully.");
      } catch (error) {
        window.alert(
          error instanceof Error
            ? error.message
            : "That CSV could not be imported. Please check the columns and try again."
        );
      } finally {
        event.target.value = "";
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionTitle
          title="Sweepstake admin"
          subtitle="Add 24 players, choose their Pot A and Pot B teams, and upload player photos."
        />
        <a
          className="rounded-lg bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white/20"
          href="/"
        >
          Back to main app
        </a>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Players named" value={`${completedPlayers} / ${PLAYER_COUNT}`} />
        <StatCard label="Pot A picks" value={`${participants.filter((player) => player.potATeamId).length} / ${PLAYER_COUNT}`} />
        <StatCard label="Pot B picks" value={`${participants.filter((player) => player.potBTeamId).length} / ${PLAYER_COUNT}`} />
      </div>

      {!isLocalSite && (
        <div className="rounded-lg border border-amber-300/30 bg-amber-300/10 p-4 text-sm font-semibold leading-6 text-amber-100">
          This online admin page saves changes in this browser. It is useful when you are away
          from your laptop, but it does not update the public site for everyone until we connect a
          shared database or publish a new data file.
        </div>
      )}

      <Panel title="Google Sheets import">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <p className="text-sm leading-6 text-white/65">
            Download the CSV template, open it in Google Sheets, fill in the player names and team
            names, then download it from Sheets as CSV and import it here.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-white"
              onClick={exportPlayersCsv}
            >
              Download CSV template
            </button>
            <button
              type="button"
              className="rounded-lg bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white/20"
              onClick={() => csvInputRef.current?.click()}
            >
              Import completed CSV
            </button>
          </div>
        </div>
        <input ref={csvInputRef} type="file" accept=".csv,text/csv" hidden onChange={importPlayersCsv} />
      </Panel>

      <Panel title="Player setup">
        <div className="grid gap-4 lg:grid-cols-2">
          {participants.map((participant, index) => (
            <div key={participant.id} className="glass-card rounded-lg p-4">
              <div className="flex items-start gap-4">
                <PlayerAvatar participant={participant} size="large" />
                <div className="min-w-0 flex-1">
                  <label className="admin-label" htmlFor={`${participant.id}-name`}>
                    Player {index + 1}
                  </label>
                  <input
                    id={`${participant.id}-name`}
                    className="admin-input"
                    type="text"
                    value={participant.name}
                    placeholder={`Player ${index + 1} name`}
                    onChange={(event) =>
                      updateParticipant(participant.id, { name: event.target.value })
                    }
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <TeamSelect
                  label="Pot A team"
                  value={participant.potATeamId}
                  teams={potATeams}
                  onChange={(value) => updateParticipant(participant.id, { potATeamId: value })}
                />
                <TeamSelect
                  label="Pot B team"
                  value={participant.potBTeamId}
                  teams={potBTeams}
                  onChange={(value) => updateParticipant(participant.id, { potBTeamId: value })}
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-cyan-300 px-3 py-2 text-sm font-black text-slate-950 transition hover:bg-white">
                  <ImagePlus size={16} />
                  Upload photo
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(event) => uploadAvatar(participant.id, event.target.files?.[0])}
                  />
                </label>
                {participant.avatarUrl && (
                  <button
                    type="button"
                    className="rounded-lg bg-white/10 px-3 py-2 text-sm font-black text-white transition hover:bg-white/20"
                    onClick={() => clearAvatar(participant.id)}
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function TeamSelect({ label, value, teams, onChange }) {
  return (
    <label className="block">
      <span className="admin-label">{label}</span>
      <select
        className="admin-input"
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Choose team</option>
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {formatTeamSelectLabel(team)}
          </option>
        ))}
      </select>
    </label>
  );
}

function GroupTables({ groupTables, qualifiedTeams }) {
  return (
    <Panel title="Group tables">
      <div className="grid gap-5 xl:grid-cols-2">
        {Object.entries(groupTables).map(([group, table]) => (
          <div key={group} className="overflow-hidden rounded-lg border border-white/12 bg-slate-950/45 transition hover:-translate-y-1 hover:border-cyan-200/30">
            <div className="bg-gradient-to-r from-cyan-300 to-emerald-300 px-4 py-3 font-black text-slate-950">Group {group}</div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="bg-white/8 text-xs uppercase text-cyan-100/65">
                  <tr>
                    <th className="px-3 py-2 text-left">Team</th>
                    <th>P</th>
                    <th>W</th>
                    <th>D</th>
                    <th>L</th>
                    <th>GD</th>
                    <th>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {table.map((team) => (
                    <tr key={team.id} className="border-t border-white/10 text-white/85">
                      <td className="px-3 py-2 font-semibold">
                        <TeamName team={team} name={team.name} />
                        {qualifiedTeams.some((qualified) => qualified.id === team.id) && (
                          <span className="ml-2 rounded bg-cyan-300 px-2 py-0.5 text-xs font-black text-slate-950">Q</span>
                        )}
                      </td>
                      <td className="text-center">{team.played}</td>
                      <td className="text-center">{team.wins}</td>
                      <td className="text-center">{team.draws}</td>
                      <td className="text-center">{team.losses}</td>
                      <td className="text-center">{team.goalDifference}</td>
                      <td className="text-center font-bold">{team.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function KnockoutBracket({ fixtures }) {
  const stages = ["Round of 32", "Round of 16", "Quarter-final", "Semi-final", "Third-place play-off", "Final"];

  return (
    <Panel title="Knockout stage">
      <div className="bracket-scroll overflow-x-auto pb-2">
        <div className="grid min-w-[980px] grid-cols-6 gap-4">
        {stages.map((stage) => (
          <div key={stage} className="bracket-column rounded-lg border border-white/12 bg-slate-950/45 p-4">
            <h3 className="font-black text-cyan-200">{stage}</h3>
            <div className="mt-3 space-y-2">
              {fixtures
                .filter((fixture) => fixture.stage === stage)
                .slice(0, stage === "Round of 32" ? 8 : 4)
                .map((fixture) => (
                  <div key={fixture.id} className="bracket-match rounded border border-white/10 bg-white/8 p-2 text-xs">
                    <TeamName team={fixture.homeTeam} name={fixture.homeTeamName} />
                    <div className="my-1 text-center text-[10px] font-bold uppercase text-cyan-100/45">vs</div>
                    <TeamName team={fixture.awayTeam} name={fixture.awayTeamName} />
                  </div>
                ))}
            </div>
          </div>
        ))}
        </div>
      </div>
    </Panel>
  );
}

function FixtureGrid({ fixtures, compact = false }) {
  if (fixtures.length === 0) {
    return <p className="glass-card rounded-lg p-4 text-sm text-white/70">No fixtures to show yet.</p>;
  }

  const grouped = groupFixturesByDate(fixtures);

  return (
    <div className="space-y-5">
      {Object.entries(grouped).map(([date, dateFixtures]) => (
        <div key={date}>
          <h3 className="mb-3 font-black text-cyan-100">{formatDate(date)}</h3>
          <div className={`grid gap-3 ${compact ? "md:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2"}`}>
            {dateFixtures.map((fixture) => (
              <FixtureCard key={fixture.id} fixture={fixture} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FixtureCard({ fixture }) {
  const played = fixture.homeScore !== null && fixture.awayScore !== null;

  return (
    <article className="tv-fixture rounded-lg p-4 shadow-sm transition duration-200 hover:-translate-y-1">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-cyan-200">
            {fixture.stage === "Group" ? `Group ${fixture.group}` : fixture.stage}
          </p>
          <p className="mt-1 text-sm text-white/50">{fixture.venue}</p>
        </div>
        <span className={`rounded px-2 py-1 text-xs font-black ${played ? "bg-cyan-300 text-slate-950" : "bg-white/10 text-white/70"}`}>
          {played ? "Played" : "Upcoming"}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamName team={fixture.homeTeam} name={fixture.homeTeamName} align="right" />
        <div className="rounded-lg bg-cyan-300 px-3 py-2 text-center font-black text-slate-950">
          {played ? `${fixture.homeScore} - ${fixture.awayScore}` : "vs"}
        </div>
        <TeamName team={fixture.awayTeam} name={fixture.awayTeamName} />
      </div>
    </article>
  );
}

function FilterBar({ filter, setFilter }) {
  const filterOptions = ["all", "group", "knockout", ..."ABCDEFGHIJKL".split("")];

  return (
    <div className="glass-card flex gap-2 overflow-x-auto rounded-lg p-2 shadow-sm">
      {filterOptions.map((option) => (
        <button
          key={option}
          onClick={() => setFilter(option)}
          className={`shrink-0 rounded-md px-3 py-2 text-sm font-semibold ${
            filter === option ? "bg-cyan-300 text-slate-950" : "text-white/70 hover:bg-white/10 hover:text-white"
          }`}
        >
          {option.length === 1 ? `Group ${option}` : option[0].toUpperCase() + option.slice(1)}
        </button>
      ))}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="glass-card rounded-lg p-5 shadow-sm">
      <p className="text-sm font-semibold text-white/55">{label}</p>
      <p className="mt-2 text-3xl font-black text-cyan-200">{value}</p>
    </div>
  );
}

function ActionCard({ title, text, button, onClick, danger = false, disabled = false }) {
  return (
    <div className="glass-card rounded-lg p-5 shadow-sm transition hover:-translate-y-1 hover:bg-white/12">
      <h3 className="font-black text-white">{title}</h3>
      <p className="mt-2 min-h-12 text-sm leading-6 text-white/62">{text}</p>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`mt-4 rounded-lg px-4 py-2 text-sm font-black disabled:cursor-not-allowed disabled:opacity-60 ${
          danger ? "bg-red-500 text-white hover:bg-red-400" : "bg-cyan-300 text-slate-950 hover:bg-white"
        }`}
      >
        {button}
      </button>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section className="glass-panel rounded-lg p-4 shadow-sm">
      <h2 className="mb-4 text-xl font-black text-white">{title}</h2>
      {children}
    </section>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <div>
      <h2 className="text-3xl font-black text-white sm:text-4xl">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-cyan-100/70">{subtitle}</p>
    </div>
  );
}

function TeamName({ team, name, align = "left" }) {
  const displayTeam = team || getTeamFallback(name);
  const flag = displayTeam.flagEmoji || getPlaceholderFlag(displayTeam.id);

  return (
    <span
      className={`inline-flex min-w-0 flex-wrap items-center gap-1 text-sm font-bold ${
        align === "right" ? "justify-end text-right" : "justify-start text-left"
      }`}
    >
      <TeamMarker team={displayTeam} fallbackFlag={flag} />
      <span>{displayTeam.name || name}</span>
      <span className="font-semibold text-white/48">({displayTeam.sweepstakeOwner || "Not drawn yet"})</span>
    </span>
  );
}

function TeamMarker({ team, fallbackFlag }) {
  if (team?.sweepstakeOwnerAvatarUrl) {
    return (
      <span className="team-owner-marker" title={team.sweepstakeOwner}>
        <img
          className="team-owner-marker-avatar"
          src={team.sweepstakeOwnerAvatarUrl}
          alt=""
          loading="lazy"
        />
        <span className="team-owner-marker-flag" aria-hidden="true">
          {fallbackFlag}
        </span>
      </span>
    );
  }

  return <TeamBadge team={team} fallbackFlag={fallbackFlag} />;
}

function TeamBadge({ team, fallbackFlag }) {
  const [imageFailed, setImageFailed] = React.useState(false);

  if (team?.logoUrl) {
    return (
      <span className="team-badge">
        {imageFailed ? (
          <span aria-hidden="true">{fallbackFlag}</span>
        ) : (
          <img src={team.logoUrl} alt="" onError={() => setImageFailed(true)} />
        )}
      </span>
    );
  }

  return <span aria-hidden="true">{fallbackFlag}</span>;
}

function isLocalEditableSite() {
  return ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
}

function getTodayOrNextMatchDay(fixtures) {
  const today = getLocalDateKey(new Date());
  const todaysMatches = fixtures.filter((fixture) => fixture.date === today);
  const nextFixture = fixtures
    .filter((fixture) => fixture.date > today)
    .sort((a, b) => a.date.localeCompare(b.date))
    [0];

  const nextDate = nextFixture?.date || null;

  return {
    today,
    todaysFixtures: todaysMatches.slice(0, 2),
    nextDate,
    nextFixtures: nextDate
      ? fixtures.filter((fixture) => fixture.date === nextDate).slice(0, 2)
      : [],
  };
}

function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function hydrateFixtureTeams(fixture, teams) {
  const homeTeam = teams.find((team) => team.id === fixture.homeTeamId);
  const awayTeam = teams.find((team) => team.id === fixture.awayTeamId);

  return {
    ...fixture,
    homeTeam: homeTeam || getTeamFallback(fixture.homeTeamName),
    awayTeam: awayTeam || getTeamFallback(fixture.awayTeamName),
  };
}

function getTeamFallback(name) {
  return {
    name: name || "Team TBC",
    flagEmoji: "🌐",
    sweepstakeOwner: "Not drawn yet",
  };
}

function getPlaceholderFlag(teamId = "") {
  const flags = ["🇺🇸", "🇲🇽", "🇨🇦", "🇧🇷", "🇦🇷", "🇫🇷", "🇪🇸", "🇩🇪"];
  const idScore = teamId
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0);

  return flags[idScore % flags.length];
}

function getPrizeRules(tournament) {
  const defaultRules = createDefaultTournament().prizeRules;

  if (!tournament.prizeRules?.length) {
    return defaultRules;
  }

  // Older browser saves may still contain the first draft of the prizes.
  // If the new prize IDs are missing, show the corrected starter rules.
  const hasCurrentRules = tournament.prizeRules.some((rule) => rule.id === "master-of-chaos");
  return hasCurrentRules ? tournament.prizeRules : defaultRules;
}

function getParticipants(tournament) {
  return ensureParticipantSlots(
    tournament.participants?.length ? tournament.participants : createDefaultTournament().participants
  );
}

function getParticipantPicks(participant, teams) {
  return {
    potA: teams.find((team) => team.id === participant.potATeamId),
    potB: teams.find((team) => team.id === participant.potBTeamId),
  };
}

function ensureParticipantSlots(participants = []) {
  return Array.from({ length: PLAYER_COUNT }, (_, index) => {
    const existingParticipant = participants[index];

    return {
      id: existingParticipant?.id || `player-${index + 1}`,
      name: existingParticipant?.name || "",
      potATeamId: existingParticipant?.potATeamId || "",
      potBTeamId: existingParticipant?.potBTeamId || "",
      avatarUrl: existingParticipant?.avatarUrl || "",
    };
  });
}

function getParticipantDisplayName(participant) {
  if (participant?.name?.trim()) return participant.name.trim();
  const match = participant?.id?.match(/player-(\d+)/);
  return match ? `Player ${match[1]}` : "Player";
}

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function resizeAvatarFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();

      image.onerror = reject;
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 256;
        const shortestSide = Math.min(image.width, image.height);
        const sourceX = (image.width - shortestSide) / 2;
        const sourceY = (image.height - shortestSide) / 2;

        canvas.width = size;
        canvas.height = size;

        const context = canvas.getContext("2d");
        context.drawImage(
          image,
          sourceX,
          sourceY,
          shortestSide,
          shortestSide,
          0,
          0,
          size,
          size
        );

        resolve(canvas.toDataURL("image/jpeg", 0.86));
      };

      image.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}

function getPotTeams(teams, pot) {
  const groupStageTeams = teams.filter(
    (team) => /^[A-L]$/.test(team.group || "") && Number(team.seed) >= 1 && Number(team.seed) <= 4
  );
  const midpoint = PLAYER_COUNT;
  const sortedTeams = [...groupStageTeams].sort((teamA, teamB) =>
    `${teamA.group}-${teamA.seed || 99}-${teamA.name}`.localeCompare(
      `${teamB.group}-${teamB.seed || 99}-${teamB.name}`
    )
  );
  const potTeams = pot === "A" ? sortedTeams.slice(0, midpoint) : sortedTeams.slice(midpoint);

  return potTeams;
}

function formatTeamSelectLabel(team) {
  const flag = team.flagEmoji || getPlaceholderFlag(team.id);
  const groupLabel = team.group ? `Group ${team.group}` : "Group TBC";

  return `${flag} ${team.name} (${groupLabel})`;
}

function downloadCsv(fileName, rows) {
  const csvText = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value) {
  const text = String(value ?? "");

  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function parseCsv(csvText) {
  const rows = [];
  let row = [];
  let cell = "";
  let insideQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const character = csvText[index];
    const nextCharacter = csvText[index + 1];

    if (insideQuotes && character === '"' && nextCharacter === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (!insideQuotes && character === ",") {
      row.push(cell);
      cell = "";
      continue;
    }

    if (!insideQuotes && (character === "\n" || character === "\r")) {
      if (character === "\r" && nextCharacter === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += character;
  }

  row.push(cell);
  rows.push(row);

  return rows.filter((csvRow) => csvRow.some((csvCell) => csvCell.trim()));
}

function mapPlayerCsvRowsToParticipants(rows, tournament) {
  if (rows.length < 2) {
    throw new Error("The CSV needs a header row and at least one player row.");
  }

  const headers = rows[0].map((header) => normaliseHeader(header));
  const nameIndex = headers.indexOf("name");
  const potAIndex = headers.indexOf("pot_a_team");
  const potBIndex = headers.indexOf("pot_b_team");

  if (nameIndex === -1 || potAIndex === -1 || potBIndex === -1) {
    throw new Error("The CSV must include columns called name, pot_a_team, and pot_b_team.");
  }

  const existingParticipants = getParticipants(tournament);
  const teams = applyOfficialTeamNames(tournament).teams;
  const importedRows = rows.slice(1, PLAYER_COUNT + 1);

  return ensureParticipantSlots(
    importedRows.map((row, index) => {
      const existingParticipant = existingParticipants[index] || {};
      const name = row[nameIndex]?.trim() || "";
      const potATeamId = findTeamIdFromCsvValue(row[potAIndex], teams);
      const potBTeamId = findTeamIdFromCsvValue(row[potBIndex], teams);

      return {
        ...existingParticipant,
        id: existingParticipant.id || `player-${index + 1}`,
        name,
        potATeamId,
        potBTeamId,
      };
    })
  );
}

function normaliseHeader(header) {
  return header.trim().toLowerCase().replaceAll(" ", "_");
}

function findTeamIdFromCsvValue(value, teams) {
  const cleanedValue = normaliseTeamSearchValue(value);
  if (!cleanedValue) return "";

  const exactTeam = teams.find(
    (team) =>
      normaliseTeamSearchValue(team.name) === cleanedValue ||
      normaliseTeamSearchValue(team.id) === cleanedValue ||
      normaliseTeamSearchValue(formatTeamSelectLabel(team)) === cleanedValue
  );

  if (exactTeam) return exactTeam.id;

  const partialTeam = teams.find((team) =>
    cleanedValue.includes(normaliseTeamSearchValue(team.name))
  );

  if (partialTeam) return partialTeam.id;

  throw new Error(`I could not match this team name from the CSV: "${value}".`);
}

function normaliseTeamSearchValue(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function hasPlaceholderTeamNames(tournament) {
  return tournament.teams.some((team) => /^Group [A-L] Team [1-4]$/.test(team.name || ""));
}

function applyOfficialTeamNames(tournament) {
  let changed = false;

  const teams = tournament.teams.map((team) => {
    const officialTeam = officialGroupTeams[team.group]?.[Number(team.seed) - 1];

    if (!officialTeam) return team;

    const shouldRename = /^Group [A-L] Team [1-4]$/.test(team.name || "");
    const nextName = shouldRename ? officialTeam.name : team.name;
    const nextFlag = officialTeam.flagEmoji;

    if (nextName === team.name && nextFlag === team.flagEmoji) {
      return team;
    }

    changed = true;
    return {
      ...team,
      name: nextName,
      flagEmoji: nextFlag,
    };
  });

  if (!changed) return tournament;

  const teamNameById = new Map(teams.map((team) => [team.id, team.name]));

  return {
    ...tournament,
    teams,
    fixtures: tournament.fixtures.map((fixture) => ({
      ...fixture,
      homeTeamName: teamNameById.get(fixture.homeTeamId) || fixture.homeTeamName,
      awayTeamName: teamNameById.get(fixture.awayTeamId) || fixture.awayTeamName,
    })),
    updatedAt: new Date().toISOString(),
  };
}

function hasOutdatedFixtureSchedule(tournament) {
  const firstFixture = tournament.fixtures?.[0];

  return (
    tournament.fixtures?.length !== 104 ||
    firstFixture?.homeTeamName !== "Mexico" ||
    firstFixture?.awayTeamName !== "South Africa" ||
    firstFixture?.date !== "2026-06-11" ||
    firstFixture?.kickoffUk !== "21:00"
  );
}

function hasOutdatedHomeNationFlags(tournament) {
  return tournament.teams.some((team) => {
    const officialTeam = officialGroupTeams[team.group]?.[Number(team.seed) - 1];
    return officialTeam && team.flagEmoji !== officialTeam.flagEmoji;
  });
}

function applyOfficialFixtureSchedule(tournament) {
  if (!hasOutdatedFixtureSchedule(tournament)) return tournament;

  const officialFixtures = createOfficialFixtures(tournament.teams);
  const previousByMatchNumber = new Map(
    (tournament.fixtures || []).map((fixture) => [fixture.matchNumber, fixture])
  );

  return {
    ...tournament,
    fixtures: officialFixtures.map((fixture) => {
      const previousFixture = previousByMatchNumber.get(fixture.matchNumber);
      const sameTeams =
        previousFixture?.homeTeamId === fixture.homeTeamId &&
        previousFixture?.awayTeamId === fixture.awayTeamId;

      if (!sameTeams) return fixture;

      return {
        ...fixture,
        homeScore: previousFixture.homeScore,
        awayScore: previousFixture.awayScore,
        homeYellowCards: previousFixture.homeYellowCards || 0,
        homeRedCards: previousFixture.homeRedCards || 0,
        awayYellowCards: previousFixture.awayYellowCards || 0,
        awayRedCards: previousFixture.awayRedCards || 0,
      };
    }),
    updatedAt: new Date().toISOString(),
  };
}

function addSweepstakeOwnersToTeams(tournament) {
  const participants = getParticipants(tournament);
  const ownerByTeamId = new Map();

  for (const participant of participants) {
    const ownerName = participant.name.trim();
    if (!ownerName) continue;

    for (const teamId of [participant.potATeamId, participant.potBTeamId]) {
      if (!teamId) continue;
      ownerByTeamId.set(teamId, {
        name: ownerName,
        avatarUrl: participant.avatarUrl || "",
      });
    }
  }

  return {
    ...tournament,
    participants,
    teams: tournament.teams.map((team) => {
      const owner = ownerByTeamId.get(team.id);

      return {
        ...team,
        sweepstakeOwner: owner?.name || "Not drawn yet",
        sweepstakeOwnerAvatarUrl: owner?.avatarUrl || "",
      };
    }),
  };
}

function isPrizeStillEligible(prize) {
  return prize.status?.startsWith("Still eligible");
}

function getPrizeEligibility(participant, tournament, groupTables) {
  const prizeRules = getPrizeRules(tournament);
  const picks = getParticipantPicks(participant, tournament.teams);
  const pickedTeams = [picks.potA, picks.potB].filter(Boolean);
  const allGroupMatchesCompleted = tournament.fixtures
    .filter((fixture) => fixture.stage === "Group")
    .every((fixture) => fixture.homeScore !== null && fixture.awayScore !== null);

  return prizeRules.map((rule) => {
    if (rule.id === "master-of-chaos" || rule.id === "dirtiest-player") {
      return {
        id: rule.id,
        name: rule.name,
        status: pickedTeams.length
          ? "Still eligible via combined Pot A and Pot B totals"
          : "Not currently eligible",
      };
    }

    const teamsToCheck = rule.id === "best-pot-b" ? [picks.potB].filter(Boolean) : pickedTeams;
    const activeTeams = teamsToCheck.filter((team) =>
      isTeamStillRelevantForPrize(team, rule.id, groupTables, allGroupMatchesCompleted)
    );

    return {
      id: rule.id,
      name: rule.name,
      status:
        activeTeams.length > 0
          ? `Still eligible via ${activeTeams.map((team) => team.name).join(" or ")}`
          : "Not currently eligible",
    };
  });
}

function isTeamStillRelevantForPrize(team, prizeId, groupTables, allGroupMatchesCompleted) {
  if (!team) return false;

  const table = groupTables[team.group] || [];
  const row = table.find((tableTeam) => tableTeam.id === team.id);
  const groupPosition = table.findIndex((tableTeam) => tableTeam.id === team.id) + 1;

  if (!row) return true;
  if (!allGroupMatchesCompleted) return true;

  if (prizeId === "biggest-loser") {
    return groupPosition >= 3;
  }

  if (prizeId === "best-pot-b") {
    return groupPosition === 1;
  }

  return groupPosition <= 3;
}

function getMasterOfChaosRows(tournament) {
  return getParticipants(tournament)
    .map((participant) => {
      const picks = getParticipantPicks(participant, tournament.teams);
      const pot1Goals = getTeamMatchGoalTotal(picks.potA?.id, tournament.fixtures);
      const pot2Goals = getTeamMatchGoalTotal(picks.potB?.id, tournament.fixtures);

      return {
        player: participant.name,
        pot1Goals,
        pot2Goals,
        totalGoals: pot1Goals + pot2Goals,
      };
    })
    .sort((a, b) => b.totalGoals - a.totalGoals || a.player.localeCompare(b.player));
}

function getDirtiestPlayerRows(tournament) {
  return getParticipants(tournament)
    .map((participant) => {
      const picks = getParticipantPicks(participant, tournament.teams);
      const pot1Cards = getTeamCardTotals(picks.potA?.id, tournament.fixtures);
      const pot2Cards = getTeamCardTotals(picks.potB?.id, tournament.fixtures);
      const totalPoints =
        pot1Cards.yellows + pot2Cards.yellows + (pot1Cards.reds + pot2Cards.reds) * 2;

      return {
        player: participant.name,
        pot1Yellows: pot1Cards.yellows,
        pot1Reds: pot1Cards.reds,
        pot2Yellows: pot2Cards.yellows,
        pot2Reds: pot2Cards.reds,
        totalPoints,
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints || a.player.localeCompare(b.player));
}

function getTeamMatchGoalTotal(teamId, fixtures) {
  if (!teamId) return 0;

  return fixtures.reduce((total, fixture) => {
    const played = fixture.homeScore !== null && fixture.awayScore !== null;
    const teamPlayed = fixture.homeTeamId === teamId || fixture.awayTeamId === teamId;

    if (!played || !teamPlayed) return total;

    return total + fixture.homeScore + fixture.awayScore;
  }, 0);
}

function getTeamCardTotals(teamId, fixtures) {
  if (!teamId) return { yellows: 0, reds: 0 };

  return fixtures.reduce(
    (total, fixture) => {
      if (fixture.homeTeamId === teamId) {
        total.yellows += fixture.homeYellowCards || 0;
        total.reds += fixture.homeRedCards || 0;
      }

      if (fixture.awayTeamId === teamId) {
        total.yellows += fixture.awayYellowCards || 0;
        total.reds += fixture.awayRedCards || 0;
      }

      return total;
    },
    { yellows: 0, reds: 0 }
  );
}

function groupFixturesByDate(fixtures) {
  return fixtures.reduce((groups, fixture) => {
    groups[fixture.date] = groups[fixture.date] || [];
    groups[fixture.date].push(fixture);
    return groups;
  }, {});
}

function formatDate(dateText) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${dateText}T12:00:00`));
}

function formatShortDate(dateText) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
  }).format(new Date(`${dateText}T12:00:00`));
}

function getKickoffUk(fixture) {
  if (fixture.kickoffUk) return fixture.kickoffUk;
  return fixture.matchNumber % 2 === 1 ? "17:00" : "20:00";
}

function mapFifaDataToTournament(currentTournament, fifaFixtures, syncPayload) {
  const sortedFifaFixtures = [...fifaFixtures].sort((a, b) =>
    (a.MatchNumber || 999) - (b.MatchNumber || 999)
  );
  const nextTeams = currentTournament.teams.map((team) => ({ ...team }));
  const previousFixturesByFifaId = new Map(
    currentTournament.fixtures
      .filter((fixture) => fixture.fifaMatchId)
      .map((fixture) => [fixture.fifaMatchId, fixture])
  );
  const groupSlotUsage = {};

  for (const group of currentTournament.groups) {
    groupSlotUsage[group] = new Set();
  }

  const nextFixtures = sortedFifaFixtures.map((fifaFixture, index) => {
    const stage = parseFifaStage(getFifaText(fifaFixture.StageName));
    const group = stage === "Group" ? parseApiGroup(getFifaText(fifaFixture.GroupName)) : null;
    const homeTeam = mapFifaTeamToLocalTeam(fifaFixture.Home, group, nextTeams, groupSlotUsage);
    const awayTeam = mapFifaTeamToLocalTeam(fifaFixture.Away, group, nextTeams, groupSlotUsage);
    const previousFixture = previousFixturesByFifaId.get(fifaFixture.IdMatch);
    const homeScore = normaliseApiScore(fifaFixture.Home?.Score);
    const awayScore = normaliseApiScore(fifaFixture.Away?.Score);

    return {
      id: `fifa-${fifaFixture.IdMatch || index + 1}`,
      fifaMatchId: fifaFixture.IdMatch || null,
      matchNumber: fifaFixture.MatchNumber || index + 1,
      stage,
      group,
      date: getFifaFixtureDate(fifaFixture),
      kickoffUk: getFifaKickoffUk(fifaFixture),
      venue: getFifaVenue(fifaFixture),
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      homeTeamName: homeTeam.name,
      awayTeamName: awayTeam.name,
      homeScore: homeScore ?? previousFixture?.homeScore ?? null,
      awayScore: awayScore ?? previousFixture?.awayScore ?? null,
      homeYellowCards: previousFixture?.homeYellowCards || 0,
      homeRedCards: previousFixture?.homeRedCards || 0,
      awayYellowCards: previousFixture?.awayYellowCards || 0,
      awayRedCards: previousFixture?.awayRedCards || 0,
      apiStatus: fifaFixture.MatchStatus || null,
      apiRound: getFifaText(fifaFixture.GroupName) || getFifaText(fifaFixture.StageName),
    };
  });

  return {
    ...currentTournament,
    teams: nextTeams,
    fixtures: nextFixtures,
    fifaSync: {
      source: syncPayload.source,
      competitionId: syncPayload.competitionId,
      seasonId: syncPayload.seasonId,
      fetchedAt: syncPayload.fetchedAt,
      fixtureCount: nextFixtures.length,
    },
    updatedAt: new Date().toISOString(),
  };
}

function mapFifaTeamToLocalTeam(fifaTeam, group, teams, groupSlotUsage) {
  const fifaTeamId = fifaTeam?.IdTeam || null;
  const fifaTeamName = getFifaText(fifaTeam?.TeamName) || fifaTeam?.ShortClubName || "Team TBC";
  const existingFifaTeam = teams.find((team) => team.fifaTeamId === fifaTeamId && fifaTeamId);

  if (existingFifaTeam) {
    existingFifaTeam.name = fifaTeamName;
    existingFifaTeam.flagEmoji = getFlagEmojiFromCountryCode(fifaTeam?.IdCountry) || existingFifaTeam.flagEmoji;
    existingFifaTeam.logoUrl = getFifaFlagUrl(fifaTeam) || existingFifaTeam.logoUrl;
    return existingFifaTeam;
  }

  if (group) {
    const groupTeams = teams.filter((team) => team.group === group).sort((a, b) => a.seed - b.seed);
    const existingByName = groupTeams.find((team) => team.name === fifaTeamName);

    if (existingByName) {
      existingByName.fifaTeamId = fifaTeamId;
      existingByName.flagEmoji = getFlagEmojiFromCountryCode(fifaTeam?.IdCountry) || existingByName.flagEmoji;
      existingByName.logoUrl = getFifaFlagUrl(fifaTeam) || existingByName.logoUrl;
      groupSlotUsage[group]?.add(existingByName.id);
      return existingByName;
    }

    const nextSlot = groupTeams.find((team) => !groupSlotUsage[group]?.has(team.id));

    if (nextSlot) {
      groupSlotUsage[group]?.add(nextSlot.id);
      nextSlot.name = fifaTeamName;
      nextSlot.fifaTeamId = fifaTeamId;
      nextSlot.flagEmoji = getFlagEmojiFromCountryCode(fifaTeam?.IdCountry) || nextSlot.flagEmoji;
      nextSlot.logoUrl = getFifaFlagUrl(fifaTeam) || nextSlot.logoUrl;
      return nextSlot;
    }
  }

  const fallbackId = fifaTeamId ? `fifa-team-${fifaTeamId}` : `fifa-team-${slugify(fifaTeamName)}`;
  const existingFallback = teams.find((team) => team.id === fallbackId);

  if (existingFallback) return existingFallback;

  const fallbackTeam = {
    id: fallbackId,
    fifaTeamId,
    name: fifaTeamName,
    group,
    seed: 99,
    flagEmoji: getFlagEmojiFromCountryCode(fifaTeam?.IdCountry) || "🌐",
    sweepstakeOwner: "Not drawn yet",
    logoUrl: getFifaFlagUrl(fifaTeam),
  };
  teams.push(fallbackTeam);
  return fallbackTeam;
}

function mapApiFootballDataToTournament(currentTournament, apiFixtures, syncPayload) {
  const sortedApiFixtures = [...apiFixtures].sort((a, b) =>
    getApiFixtureDate(a).localeCompare(getApiFixtureDate(b))
  );
  const nextTeams = currentTournament.teams.map((team) => ({ ...team }));
  const previousFixturesByApiId = new Map(
    currentTournament.fixtures
      .filter((fixture) => fixture.apiFootballFixtureId)
      .map((fixture) => [fixture.apiFootballFixtureId, fixture])
  );
  const groupSlotUsage = {};

  for (const group of currentTournament.groups) {
    groupSlotUsage[group] = new Set();
  }

  const nextFixtures = sortedApiFixtures.map((apiFixture, index) => {
    const roundText = apiFixture.league?.round || "";
    const stage = parseApiStage(roundText);
    const group = stage === "Group" ? parseApiGroup(roundText) : null;
    const homeTeam = mapApiTeamToLocalTeam(apiFixture.teams?.home, group, nextTeams, groupSlotUsage);
    const awayTeam = mapApiTeamToLocalTeam(apiFixture.teams?.away, group, nextTeams, groupSlotUsage);
    const previousFixture = previousFixturesByApiId.get(apiFixture.fixture?.id);
    const apiHomeScore = normaliseApiScore(apiFixture.goals?.home);
    const apiAwayScore = normaliseApiScore(apiFixture.goals?.away);

    return {
      id: `api-${apiFixture.fixture?.id || index + 1}`,
      apiFootballFixtureId: apiFixture.fixture?.id || null,
      matchNumber: index + 1,
      stage,
      group,
      date: getApiFixtureDate(apiFixture),
      kickoffUk: getApiFixtureKickoffUk(apiFixture),
      venue: apiFixture.fixture?.venue?.name || "Venue TBC",
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      homeTeamName: homeTeam.name,
      awayTeamName: awayTeam.name,
      homeScore: apiHomeScore ?? previousFixture?.homeScore ?? null,
      awayScore: apiAwayScore ?? previousFixture?.awayScore ?? null,
      homeYellowCards: previousFixture?.homeYellowCards || 0,
      homeRedCards: previousFixture?.homeRedCards || 0,
      awayYellowCards: previousFixture?.awayYellowCards || 0,
      awayRedCards: previousFixture?.awayRedCards || 0,
      apiStatus: apiFixture.fixture?.status?.short || null,
      apiRound: roundText,
    };
  });

  return {
    ...currentTournament,
    teams: nextTeams,
    fixtures: nextFixtures,
    apiFootballSync: {
      source: syncPayload.source,
      leagueId: syncPayload.leagueId,
      season: syncPayload.season,
      fetchedAt: syncPayload.fetchedAt,
      fixtureCount: nextFixtures.length,
    },
    updatedAt: new Date().toISOString(),
  };
}

function mapApiTeamToLocalTeam(apiTeam, group, teams, groupSlotUsage) {
  const apiTeamId = apiTeam?.id || null;
  const apiTeamName = apiTeam?.name || "Team TBC";
  const existingApiTeam = teams.find((team) => team.apiFootballTeamId === apiTeamId && apiTeamId);

  if (existingApiTeam) {
    existingApiTeam.name = apiTeamName;
    existingApiTeam.logoUrl = apiTeam?.logo || existingApiTeam.logoUrl;
    return existingApiTeam;
  }

  if (group) {
    const groupTeams = teams.filter((team) => team.group === group).sort((a, b) => a.seed - b.seed);
    const existingByName = groupTeams.find((team) => team.name === apiTeamName);

    if (existingByName) {
      existingByName.apiFootballTeamId = apiTeamId;
      existingByName.logoUrl = apiTeam?.logo || existingByName.logoUrl;
      groupSlotUsage[group]?.add(existingByName.id);
      return existingByName;
    }

    const nextSlot = groupTeams.find((team) => !groupSlotUsage[group]?.has(team.id));

    if (nextSlot) {
      groupSlotUsage[group]?.add(nextSlot.id);
      nextSlot.name = apiTeamName;
      nextSlot.apiFootballTeamId = apiTeamId;
      nextSlot.logoUrl = apiTeam?.logo || nextSlot.logoUrl;
      return nextSlot;
    }
  }

  const fallbackId = apiTeamId ? `api-team-${apiTeamId}` : `api-team-${slugify(apiTeamName)}`;
  const existingFallback = teams.find((team) => team.id === fallbackId);

  if (existingFallback) return existingFallback;

  const fallbackTeam = {
    id: fallbackId,
    apiFootballTeamId: apiTeamId,
    name: apiTeamName,
    group,
    seed: 99,
    flagEmoji: "🌐",
    sweepstakeOwner: "Not drawn yet",
    logoUrl: apiTeam?.logo || null,
  };
  teams.push(fallbackTeam);
  return fallbackTeam;
}

function mapTheSportsDbDataToTournament(currentTournament, apiEvents, syncPayload) {
  const sortedEvents = [...apiEvents].sort((a, b) =>
    getTheSportsDbEventDateTime(a).localeCompare(getTheSportsDbEventDateTime(b))
  );
  const nextTeams = currentTournament.teams.map((team) => ({ ...team }));
  const previousFixturesByApiId = new Map(
    currentTournament.fixtures
      .filter((fixture) => fixture.theSportsDbEventId)
      .map((fixture) => [fixture.theSportsDbEventId, fixture])
  );
  const groupSlotUsage = {};

  for (const group of currentTournament.groups) {
    groupSlotUsage[group] = new Set();
  }

  const nextFixtures = sortedEvents.map((event, index) => {
    const stage = parseTheSportsDbStage(event);
    const group = stage === "Group" ? parseApiGroup(event.strRound || event.strGroup || "") : null;
    const homeTeam = mapSportsDbTeamToLocalTeam(
      {
        id: event.idHomeTeam,
        name: event.strHomeTeam,
        badge: event.strHomeTeamBadge,
      },
      group,
      nextTeams,
      groupSlotUsage
    );
    const awayTeam = mapSportsDbTeamToLocalTeam(
      {
        id: event.idAwayTeam,
        name: event.strAwayTeam,
        badge: event.strAwayTeamBadge,
      },
      group,
      nextTeams,
      groupSlotUsage
    );
    const previousFixture = previousFixturesByApiId.get(event.idEvent);
    const homeScore = normaliseSportsDbScore(event.intHomeScore);
    const awayScore = normaliseSportsDbScore(event.intAwayScore);

    return {
      id: `sportsdb-${event.idEvent || index + 1}`,
      theSportsDbEventId: event.idEvent || null,
      matchNumber: index + 1,
      stage,
      group,
      date: getTheSportsDbEventDate(event),
      kickoffUk: getTheSportsDbKickoffUk(event),
      venue: event.strVenue || "Venue TBC",
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      homeTeamName: homeTeam.name,
      awayTeamName: awayTeam.name,
      homeScore: homeScore ?? previousFixture?.homeScore ?? null,
      awayScore: awayScore ?? previousFixture?.awayScore ?? null,
      homeYellowCards: previousFixture?.homeYellowCards || 0,
      homeRedCards: previousFixture?.homeRedCards || 0,
      awayYellowCards: previousFixture?.awayYellowCards || 0,
      awayRedCards: previousFixture?.awayRedCards || 0,
      apiStatus: event.strStatus || null,
      apiRound: event.strRound || event.strGroup || null,
    };
  });

  return {
    ...currentTournament,
    teams: nextTeams,
    fixtures: nextFixtures,
    theSportsDbSync: {
      source: syncPayload.source,
      leagueId: syncPayload.leagueId,
      season: syncPayload.season,
      fetchedAt: syncPayload.fetchedAt,
      fixtureCount: nextFixtures.length,
    },
    updatedAt: new Date().toISOString(),
  };
}

function mapSportsDbTeamToLocalTeam(apiTeam, group, teams, groupSlotUsage) {
  const apiTeamId = apiTeam.id || null;
  const apiTeamName = apiTeam.name || "Team TBC";
  const existingApiTeam = teams.find((team) => team.theSportsDbTeamId === apiTeamId && apiTeamId);

  if (existingApiTeam) {
    existingApiTeam.name = apiTeamName;
    existingApiTeam.logoUrl = apiTeam.badge || existingApiTeam.logoUrl;
    return existingApiTeam;
  }

  if (group) {
    const groupTeams = teams.filter((team) => team.group === group).sort((a, b) => a.seed - b.seed);
    const existingByName = groupTeams.find((team) => team.name === apiTeamName);

    if (existingByName) {
      existingByName.theSportsDbTeamId = apiTeamId;
      existingByName.logoUrl = apiTeam.badge || existingByName.logoUrl;
      groupSlotUsage[group]?.add(existingByName.id);
      return existingByName;
    }

    const nextSlot = groupTeams.find((team) => !groupSlotUsage[group]?.has(team.id));

    if (nextSlot) {
      groupSlotUsage[group]?.add(nextSlot.id);
      nextSlot.name = apiTeamName;
      nextSlot.theSportsDbTeamId = apiTeamId;
      nextSlot.logoUrl = apiTeam.badge || nextSlot.logoUrl;
      return nextSlot;
    }
  }

  const fallbackId = apiTeamId ? `sportsdb-team-${apiTeamId}` : `sportsdb-team-${slugify(apiTeamName)}`;
  const existingFallback = teams.find((team) => team.id === fallbackId);

  if (existingFallback) return existingFallback;

  const fallbackTeam = {
    id: fallbackId,
    theSportsDbTeamId: apiTeamId,
    name: apiTeamName,
    group,
    seed: 99,
    flagEmoji: "🌐",
    sweepstakeOwner: "Not drawn yet",
    logoUrl: apiTeam.badge || null,
  };
  teams.push(fallbackTeam);
  return fallbackTeam;
}

function parseApiStage(roundText) {
  const text = roundText.toLowerCase();

  if (text.includes("group")) return "Group";
  if (text.includes("round of 32")) return "Round of 32";
  if (text.includes("round of 16") || text.includes("8th")) return "Round of 16";
  if (text.includes("quarter")) return "Quarter-final";
  if (text.includes("semi")) return "Semi-final";
  if (text.includes("third")) return "Third-place play-off";
  if (text.includes("final")) return "Final";

  return roundText || "Stage TBC";
}

function parseFifaStage(stageText) {
  const text = stageText.toLowerCase();

  if (text.includes("first stage") || text.includes("group")) return "Group";
  if (text.includes("round of 32")) return "Round of 32";
  if (text.includes("round of 16")) return "Round of 16";
  if (text.includes("quarter")) return "Quarter-final";
  if (text.includes("semi")) return "Semi-final";
  if (text.includes("third") || text.includes("play-off")) return "Third-place play-off";
  if (text.includes("final")) return "Final";

  return stageText || "Stage TBC";
}

function parseTheSportsDbStage(event) {
  const text = `${event.strRound || ""} ${event.strGroup || ""} ${event.strEvent || ""}`.toLowerCase();

  if (text.includes("group")) return "Group";
  if (text.includes("round of 32")) return "Round of 32";
  if (text.includes("round of 16")) return "Round of 16";
  if (text.includes("quarter")) return "Quarter-final";
  if (text.includes("semi")) return "Semi-final";
  if (text.includes("third")) return "Third-place play-off";
  if (text.includes("final")) return "Final";

  return event.strRound || "Stage TBC";
}

function parseApiGroup(roundText) {
  const match = roundText.match(/group\s+([A-L])/i);
  return match?.[1]?.toUpperCase() || null;
}

function getApiFixtureDate(apiFixture) {
  const date = apiFixture.fixture?.date ? new Date(apiFixture.fixture.date) : null;
  if (!date || Number.isNaN(date.getTime())) return "2026-01-01";

  return getLocalDateKey(date);
}

function getApiFixtureKickoffUk(apiFixture) {
  const date = apiFixture.fixture?.date ? new Date(apiFixture.fixture.date) : null;
  if (!date || Number.isNaN(date.getTime())) return "Time TBC";

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/London",
  }).format(date);
}

function getFifaFixtureDate(fifaFixture) {
  const date = fifaFixture.Date ? new Date(fifaFixture.Date) : null;
  if (!date || Number.isNaN(date.getTime())) return "2026-01-01";

  return getLocalDateKey(date);
}

function getFifaKickoffUk(fifaFixture) {
  const date = fifaFixture.Date ? new Date(fifaFixture.Date) : null;
  if (!date || Number.isNaN(date.getTime())) return "Time TBC";

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/London",
  }).format(date);
}

function getFifaVenue(fifaFixture) {
  const stadium = getFifaText(fifaFixture.Stadium?.Name);
  const city = getFifaText(fifaFixture.Stadium?.CityName);

  if (stadium && city) return `${stadium}, ${city}`;
  return stadium || city || "Venue TBC";
}

function getFifaText(localisedValue) {
  if (!Array.isArray(localisedValue)) return "";

  return (
    localisedValue.find((item) => item.Locale === "en-GB")?.Description ||
    localisedValue[0]?.Description ||
    ""
  );
}

function getFifaFlagUrl(fifaTeam) {
  return fifaTeam?.PictureUrl?.replace("{format}", "png").replace("{size}", "4") || null;
}

function getFlagEmojiFromCountryCode(countryCode = "") {
  const fifaCountryToIso2 = {
    ALG: "DZ",
    ARG: "AR",
    AUS: "AU",
    AUT: "AT",
    BEL: "BE",
    BIH: "BA",
    BRA: "BR",
    CAN: "CA",
    CIV: "CI",
    COL: "CO",
    CPV: "CV",
    CRO: "HR",
    CUW: "CW",
    COD: "CD",
    CZE: "CZ",
    ECU: "EC",
    EGY: "EG",
    ENG: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}",
    FRA: "FR",
    GER: "DE",
    GHA: "GH",
    HAI: "HT",
    IRN: "IR",
    IRQ: "IQ",
    JOR: "JO",
    JPN: "JP",
    KOR: "KR",
    MAR: "MA",
    MEX: "MX",
    NED: "NL",
    NZL: "NZ",
    NOR: "NO",
    PAN: "PA",
    PAR: "PY",
    POR: "PT",
    QAT: "QA",
    RSA: "ZA",
    KSA: "SA",
    SCO: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}",
    SEN: "SN",
    ESP: "ES",
    SUI: "CH",
    SWE: "SE",
    TUN: "TN",
    TUR: "TR",
    UKR: "UA",
    URU: "UY",
    USA: "US",
    UZB: "UZ",
  };
  const iso2 = fifaCountryToIso2[countryCode] || countryCode;

  if (iso2.startsWith("\u{1F3F4}")) return iso2;

  if (!/^[A-Z]{2}$/.test(iso2)) return "";

  return iso2
    .split("")
    .map((letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)))
    .join("");
}

function normaliseApiScore(score) {
  return typeof score === "number" ? score : null;
}

function normaliseSportsDbScore(score) {
  if (score === null || score === undefined || score === "") return null;
  const numberScore = Number(score);
  return Number.isNaN(numberScore) ? null : numberScore;
}

function getTheSportsDbEventDate(event) {
  if (event.dateEvent) return event.dateEvent;
  const date = new Date(getTheSportsDbEventDateTime(event));
  if (Number.isNaN(date.getTime())) return "2026-01-01";
  return getLocalDateKey(date);
}

function getTheSportsDbEventDateTime(event) {
  return `${event.dateEvent || "2026-01-01"}T${event.strTime || "12:00:00"}`;
}

function getTheSportsDbKickoffUk(event) {
  if (!event.strTime) return "Time TBC";

  const date = new Date(getTheSportsDbEventDateTime(event));
  if (Number.isNaN(date.getTime())) {
    return event.strTime.slice(0, 5);
  }

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/London",
  }).format(date);
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
