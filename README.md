# World Cup 2026 Tournament Engine

This is a beginner-friendly React, Vite, and Tailwind CSS app for managing the structure of the FIFA World Cup 2026.

It starts as a tournament engine only. The sweepstake page is included as a placeholder so you can add that feature later.

## What It Includes

- 48 placeholder teams
- 12 groups of 4 teams, Groups A to L
- 104 fixtures
- Group tables calculated automatically from scores
- Score entry page
- Dashboard
- Fixture cards
- Qualified teams display
- Knockout bracket placeholder
- Reset button
- Export and import JSON backup
- Data saved in your browser

## Install Dependencies

Open this folder in a terminal and run:

```bash
npm install
```

## Run The App

After installing dependencies, run:

```bash
npm run dev
```

Vite will show a local web address, usually:

```bash
http://localhost:5173
```

Open that address in your browser.

## Connect API-Football / API-SPORTS

Your API key must stay out of the React frontend code. This app uses Vite's local development server as a private proxy.

Create a local `.env` file in this project folder:

```bash
cp .env.example .env
```

Open `.env` and paste your API key:

```text
API_FOOTBALL_KEY=your_real_key_goes_here
API_FOOTBALL_LEAGUE_ID=1
API_FOOTBALL_SEASON=2026
API_FOOTBALL_BASE_URL=https://v3.football.api-sports.io
PORT=5173
```

What to copy from your API-Football dashboard:

1. Go to your API-Football / API-SPORTS dashboard.
2. Copy your API key.
3. Paste it after `API_FOOTBALL_KEY=` in `.env`.
4. Do not paste it into any file inside `src`.

The default league ID is set to `1`, which is commonly used for the FIFA World Cup in API-Football. If your dashboard shows a different World Cup league ID for 2026, change `API_FOOTBALL_LEAGUE_ID`.

If API-Football says your plan does not have access to season `2026`, the integration is working but your subscription does not currently allow that season. League `1` is the World Cup, and API-Football lists season `2026`, but some plans restrict future/current seasons.

After editing `.env`, restart the app:

```bash
npm run dev
```

Then go to **Settings / Data** and click **Sync from API-Football**.

The sync uses API-Football's fixtures endpoint via the local server:

```text
GET /fixtures?league=API_FOOTBALL_LEAGUE_ID&season=API_FOOTBALL_SEASON&timezone=Europe/London
```

Manual score entry still works as a fallback from the **Enter Scores** page.

## Sync From FIFA Official Schedule

The preferred sync source is FIFA's own public match calendar.

These values are included in `.env.example`:

```text
FIFA_COMPETITION_ID=17
FIFA_SEASON_ID=285023
FIFA_BASE_URL=https://api.fifa.com/api/v3
```

To use it:

```bash
npm run dev
```

Then go to **Settings / Data** and click **Sync from FIFA**.

This currently fetches the official 104-match FIFA World Cup 2026 schedule from FIFA's calendar API.

## Try TheSportsDB Instead

The app also supports TheSportsDB as an alternate sync source.

The free TheSportsDB v1 key is:

```text
123
```

These values are already included in `.env.example`:

```text
THESPORTSDB_KEY=123
THESPORTSDB_LEAGUE_ID=4429
THESPORTSDB_SEASON=2026
THESPORTSDB_BASE_URL=https://www.thesportsdb.com/api/v1/json
```

League `4429` is FIFA World Cup on TheSportsDB.

After changing `.env`, restart the app:

```bash
npm run dev
```

Then go to **Settings / Data** and click **Sync from TheSportsDB**.

TheSportsDB v1 uses the API key in the URL path, so the app still calls it from the local proxy rather than the React browser code.

## Sweepstake Admin Page

The main app stays at:

```text
http://localhost:5173
```

The separate sweepstake admin page is at:

```text
http://localhost:5173/sweepstake-admin
```

Use this page to enter the 24 player names, choose each player's Pot A and Pot B teams, and upload an avatar/photo.

The uploaded photos are stored in your browser along with the rest of the tournament data. Use **Settings / Data** to export a JSON backup after adding the players.

### Using Google Sheets For Players

On the sweepstake admin page, click **Download CSV template**.

Open the downloaded file in Google Sheets and fill in:

```text
name
pot_a_team
pot_b_team
avatar_file
```

Use team names such as:

```text
Dave,Mexico,Belgium,dave.jpg
Sarah,Canada,Spain,sarah.png
```

Put avatar photos in:

```text
public/images/avatars
```

For example:

```text
public/images/avatars/dave.jpg
public/images/avatars/sarah.png
```

Then type only the filename in the spreadsheet:

```text
dave.jpg
```

Use simple filenames with no spaces, such as `dave.jpg` or `sarah-smith.png`.

When finished in Google Sheets, choose **File > Download > Comma Separated Values (.csv)**.

Back in the app, click **Import completed CSV** and choose that downloaded CSV file.

### Sync Error: Unexpected token '<'

If you see an error like this:

```text
Unexpected token '<', "<!doctype "... is not valid JSON
```

It means the browser received the app's HTML page instead of JSON from the local API proxy.

Fix it by stopping the running dev server, then starting it again:

```bash
npm run dev
```

Use `npm run dev` for API syncing, because that starts the frontend and the private API proxy together.

## Where The Data Is Stored

The app stores data in your browser using `localStorage`.

The storage key is:

```text
world-cup-2026-tournament-data
```

This means your scores stay saved after refreshing the page, but only in the browser you are using.

Use **Settings / Data** to export a JSON backup before making big changes.

## How To Edit Teams Later

The starter teams are created in:

```text
src/data/defaultTournament.js
```

Look for the `createPlaceholderTeams` function.

Each team has:

```js
{
  id: "A1",
  name: "Group A Team 1",
  group: "A",
  seed: 1,
  flagEmoji: "🏳️",
  sweepstakeOwner: "Not drawn yet"
}
```

The starter flags are dummy placeholders so the screens look realistic before the real team list is added.

You can change the `name` and `flagEmoji` values when the real teams are known.

When the sweepstake draw has happened, change `sweepstakeOwner` to the name of the person who drew that team.

## How To Edit Fixtures Later

Fixtures are also created in:

```text
src/data/defaultTournament.js
```

Group fixtures are made by `createGroupFixtures`.

Knockout placeholder fixtures are made by `createKnockoutFixtures`.

Each fixture has fields like:

```js
{
  id: "M1",
  matchNumber: 1,
  stage: "Group",
  group: "A",
  date: "2026-06-11",
  kickoffUk: "17:00",
  venue: "Mexico City",
  homeTeamName: "Group A Team 1",
  awayTeamName: "Group A Team 2",
  homeScore: null,
  awayScore: null
}
```

When you edit the starter data file, use the **Reset data** button in the app so your browser loads the new starter data.

## How To Edit The Rules And Prizes

The starter prize rules are created in:

```text
src/data/defaultTournament.js
```

Look for the `createPrizeRules` function.

There are 6 starter prizes. Each prize has:

```js
{
  id: "winner",
  name: "Prize 1: World Cup winner",
  prize: "TBC",
  summary: "Awarded to the participant who picked the team that wins the World Cup."
}
```

For more complex prizes, you can also edit the table rows in `tableRows`.

## How To Edit Players

The starter participants are created in:

```text
src/data/defaultTournament.js
```

Look for the `createPlaceholderParticipants` function.

Each participant has:

```js
{
  id: "player-1",
  name: "Dave",
  potATeamId: "A1",
  potBTeamId: "G1"
}
```

After the real sweepstake draw, change the names and team IDs so each player has their real Pot A and Pot B picks.

## Dashboard Banner Size

The dashboard has a placeholder for a banner graphic called:

```text
Team Teeth and Friends World Cup Sweepstake 2026
```

Recommended image size:

```text
1600 x 360 pixels
```

That gives a wide banner shape that works well on desktop and can crop down neatly on smaller screens.

## Useful Files

- `src/main.jsx` contains the app screens and components.
- `src/data/defaultTournament.js` creates the starter tournament data.
- `src/utils/tournament.js` calculates group tables and qualified teams.
- `src/hooks/useLocalStorage.js` saves data in the browser.

## Build For Production

To create a production build, run:

```bash
npm run build
```

## Deploy To Vercel

The public site runs on Vercel. The admin page can also run online at:

```text
https://your-vercel-url/sweepstake-admin
```

On the public navigation, the site still hides:

```text
Enter Scores
Settings / Data
```

The public site first tries to load live data from:

```text
/api/tournament
```

If live data is not available yet, it falls back to:

```text
public/data/published-tournament.json
```

To deploy:

1. Push the latest code to GitHub.
2. Go to Vercel and sign in with GitHub.
3. Click **Add New > Project**.
4. Import `teamteethsweepstake`.
5. Use these settings:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

6. Click **Deploy**.

## Supabase Live Data Setup

To make online admin changes update the real public site, create a Supabase project and run the SQL in:

```text
supabase/schema.sql
```

In Supabase:

1. Open your project.
2. Go to **SQL Editor**.
3. Paste the contents of `supabase/schema.sql`.
4. Click **Run**.

Then find these values in Supabase:

```text
Project URL
Service role key
```

Add these environment variables in Vercel:

```text
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_PASSWORD=choose_a_private_password
```

Do not put the service role key in React code, GitHub, or `.env.example`.

After adding environment variables, redeploy the Vercel project.

Then visit:

```text
https://your-vercel-url/sweepstake-admin
```

Make edits, enter the admin password, and click **Save live site**.

### Updating The Public Site Later

With Supabase connected, use the online admin page and click **Save live site**.

The older fallback route still works:

1. Update the app data locally.
2. Export a JSON backup from **Settings / Data**.
3. Replace `public/data/published-tournament.json` with that exported JSON.
4. Commit and push to GitHub.
5. Vercel will redeploy automatically.
