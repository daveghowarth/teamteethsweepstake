import { calculateGroupTables, getFixturesByStage } from "./tournament.js";

const WIDTH = 1754;
const HEIGHT = 1240;
const EMAIL_WIDTH = 1200;
const EMAIL_HEIGHT = 848;
const PDF_WIDTH = 1190.55;
const PDF_HEIGHT = 841.89;
const BANNER_URL = "/images/banner3-desktop.jpg";
const BACKGROUND_URL = "/images/hero-optimized.jpg";

const reportTitles = {
  picks: "Pot A and Pot B Picks",
  fixtures: "Next 24 Matches",
  tables: "Current Group Tables",
  bracket: "Knockout Bracket",
};

export async function generatePdfReport(tournament, reportType) {
  const canvas = await renderReportCanvas(tournament, reportType);
  const jpegBlob = await canvasToBlob(canvas, "image/jpeg", 0.92);
  const pdfBlob = await createPdfFromJpeg(jpegBlob, canvas.width, canvas.height);
  downloadBlob(pdfBlob, `team-teeth-${reportType}-report.pdf`);
}

export async function generateEmailJpegReport(tournament, reportType) {
  const canvas = await renderReportCanvas(tournament, reportType);
  const emailCanvas = document.createElement("canvas");
  emailCanvas.width = EMAIL_WIDTH;
  emailCanvas.height = EMAIL_HEIGHT;

  const context = emailCanvas.getContext("2d");
  context.drawImage(canvas, 0, 0, emailCanvas.width, emailCanvas.height);

  const jpegBlob = await canvasToBlob(emailCanvas, "image/jpeg", 0.78);
  downloadBlob(jpegBlob, `team-teeth-${reportType}-email.jpg`);
}

async function renderReportCanvas(tournament, reportType) {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  const context = canvas.getContext("2d");
  const imageCache = new Map();
  const helpers = createDrawHelpers(context, imageCache);

  await drawReportBase(context, imageCache, reportTitles[reportType] || "Sweepstake Report");

  if (reportType === "picks") {
    await drawPicksReport(context, tournament, helpers);
  } else if (reportType === "fixtures") {
    await drawFixturesReport(context, tournament, helpers);
  } else if (reportType === "tables") {
    await drawTablesReport(context, tournament, helpers);
  } else if (reportType === "bracket") {
    await drawBracketReport(context, tournament, helpers);
  }

  return canvas;
}

async function drawReportBase(context, imageCache, title) {
  const background = await loadImage(BACKGROUND_URL, imageCache);
  drawCoverImage(context, background, 0, 0, WIDTH, HEIGHT);

  context.fillStyle = "rgba(6, 17, 31, 0.46)";
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.fillStyle = "rgba(6, 17, 31, 0.34)";
  context.fillRect(0, 220, WIDTH, HEIGHT - 220);

  const banner = await loadImage(BANNER_URL, imageCache);
  drawContainImage(context, banner, 72, 34, 720, 202);

  context.fillStyle = "rgba(103, 232, 249, 0.92)";
  context.font = "900 42px Inter, Arial, sans-serif";
  context.fillText(title, 835, 112);

  context.fillStyle = "rgba(255, 255, 255, 0.78)";
  context.font = "700 22px Inter, Arial, sans-serif";
  context.fillText(`Generated ${new Date().toLocaleDateString("en-GB")}`, 838, 152);
}

async function drawPicksReport(context, tournament, helpers) {
  const participantsByTeamId = getParticipantsByTeamId(tournament);
  const potATeams = getPotTeamsForReport(tournament, "A");
  const potBTeams = getPotTeamsForReport(tournament, "B");

  await drawPotPanel(context, helpers, "Pot A Teams", potATeams, participantsByTeamId, 76, 280);
  await drawPotPanel(context, helpers, "Pot B Teams", potBTeams, participantsByTeamId, 914, 280);
}

async function drawPotPanel(context, helpers, title, teams, participantsByTeamId, x, y) {
  drawPanel(context, x, y, 764, 872);

  context.fillStyle = "#67e8f9";
  context.font = "900 32px Inter, Arial, sans-serif";
  context.fillText(title, x + 28, y + 48);

  for (let index = 0; index < teams.length; index += 1) {
    const team = teams[index];
    const participant = participantsByTeamId.get(team.id);
    const rowY = y + 78 + index * 32;

    context.fillStyle = index % 2 === 0 ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)";
    roundRect(context, x + 20, rowY, 724, 28, 8, true);

    await helpers.drawFlag(team, x + 36, rowY + 5, 24);
    drawText(context, team.name, x + 72, rowY + 20, 230, "700 17px Inter, Arial, sans-serif", "#ffffff");

    if (participant) {
      await helpers.drawAvatar(participant, x + 402, rowY + 4, 22);
      drawText(context, participant.name, x + 435, rowY + 20, 278, "800 17px Inter, Arial, sans-serif", "#cffafe");
    } else {
      drawText(context, "Not picked", x + 405, rowY + 20, 260, "700 16px Inter, Arial, sans-serif", "rgba(255,255,255,0.42)");
    }
  }
}

async function drawFixturesReport(context, tournament, helpers) {
  const fixtures = tournament.fixtures
    .filter((fixture) => fixture.homeScore === null || fixture.awayScore === null)
    .sort((a, b) => `${a.date} ${a.kickoffUk || ""}`.localeCompare(`${b.date} ${b.kickoffUk || ""}`))
    .slice(0, 24)
    .map((fixture) => hydrateFixtureForReport(fixture, tournament.teams));

  const cardWidth = 386;
  const cardHeight = 132;
  const startX = 72;
  const startY = 274;
  const gapX = 28;
  const gapY = 24;

  for (let index = 0; index < fixtures.length; index += 1) {
    const fixture = fixtures[index];
    const col = index % 4;
    const row = Math.floor(index / 4);
    const x = startX + col * (cardWidth + gapX);
    const y = startY + row * (cardHeight + gapY);

    drawPanel(context, x, y, cardWidth, cardHeight, 14);
    drawText(context, `${formatShortDate(fixture.date)} · ${fixture.kickoffUk || "Time TBC"} UK`, x + 18, y + 28, 210, "900 15px Inter, Arial, sans-serif", "#67e8f9");
    drawText(context, getFixtureLabel(fixture), x + 250, y + 28, 120, "800 14px Inter, Arial, sans-serif", "rgba(255,255,255,0.62)");

    await drawFixtureTeamLine(context, helpers, fixture.homeTeam, fixture.homeTeamName, x + 18, y + 65, 300);
    await drawFixtureTeamLine(context, helpers, fixture.awayTeam, fixture.awayTeamName, x + 18, y + 103, 300);

    context.fillStyle = "#67e8f9";
    context.font = "900 20px Inter, Arial, sans-serif";
    context.fillText("v", x + 334, y + 85);
  }
}

async function drawFixtureTeamLine(context, helpers, team, name, x, y, maxWidth) {
  await helpers.drawAvatar({ avatarUrl: team?.sweepstakeOwnerAvatarUrl, name: team?.sweepstakeOwner }, x, y - 22, 28);
  await helpers.drawFlag(team, x + 22, y - 5, 18);
  drawText(context, name, x + 58, y, maxWidth - 60, "850 18px Inter, Arial, sans-serif", "#ffffff");
  drawText(context, team?.sweepstakeOwner || "Not drawn yet", x + 58, y + 20, maxWidth - 60, "700 12px Inter, Arial, sans-serif", "rgba(207,250,254,0.62)");
}

async function drawTablesReport(context, tournament, helpers) {
  const groupTables = calculateGroupTables(tournament);
  const groups = Object.entries(groupTables);
  const panelWidth = 388;
  const panelHeight = 268;
  const startX = 72;
  const startY = 266;
  const gapX = 28;
  const gapY = 24;

  for (let index = 0; index < groups.length; index += 1) {
    const [group, table] = groups[index];
    const col = index % 4;
    const row = Math.floor(index / 4);
    const x = startX + col * (panelWidth + gapX);
    const y = startY + row * (panelHeight + gapY);

    drawPanel(context, x, y, panelWidth, panelHeight, 14);
    context.fillStyle = "#67e8f9";
    context.font = "900 24px Inter, Arial, sans-serif";
    context.fillText(`Group ${group}`, x + 18, y + 34);

    drawText(context, "P", x + 220, y + 64, 24, "900 12px Inter, Arial, sans-serif", "rgba(207,250,254,0.62)");
    drawText(context, "GD", x + 262, y + 64, 32, "900 12px Inter, Arial, sans-serif", "rgba(207,250,254,0.62)");
    drawText(context, "PTS", x + 318, y + 64, 42, "900 12px Inter, Arial, sans-serif", "rgba(207,250,254,0.62)");

    for (let teamIndex = 0; teamIndex < table.length; teamIndex += 1) {
      const team = table[teamIndex];
      const rowY = y + 88 + teamIndex * 39;
      context.fillStyle = teamIndex < 2 ? "rgba(103,232,249,0.14)" : "rgba(255,255,255,0.04)";
      roundRect(context, x + 14, rowY - 24, panelWidth - 28, 31, 8, true);
      await helpers.drawFlag(team, x + 24, rowY - 19, 22);
      drawText(context, team.name, x + 55, rowY, 150, "800 16px Inter, Arial, sans-serif", "#ffffff");
      drawText(context, String(team.played), x + 222, rowY, 24, "800 16px Inter, Arial, sans-serif", "#ffffff");
      drawText(context, String(team.goalDifference), x + 264, rowY, 36, "800 16px Inter, Arial, sans-serif", "#ffffff");
      drawText(context, String(team.points), x + 322, rowY, 38, "900 17px Inter, Arial, sans-serif", "#67e8f9");
    }
  }
}

async function drawBracketReport(context, tournament, helpers) {
  const fixtures = getFixturesByStage(tournament.fixtures, "knockout").map((fixture) =>
    hydrateFixtureForReport(fixture, tournament.teams)
  );
  const stages = ["Round of 32", "Round of 16", "Quarter-final", "Semi-final", "Third-place play-off", "Final"];
  const colWidth = 256;
  const startX = 74;
  const startY = 270;
  const gap = 20;

  for (let stageIndex = 0; stageIndex < stages.length; stageIndex += 1) {
    const stage = stages[stageIndex];
    const stageFixtures = fixtures.filter((fixture) => fixture.stage === stage);
    const x = startX + stageIndex * (colWidth + gap);

    drawPanel(context, x, startY, colWidth, 850, 14);
    drawText(context, stage, x + 16, startY + 34, colWidth - 32, "900 22px Inter, Arial, sans-serif", "#67e8f9");

    const matchHeight = stage === "Round of 32" ? 44 : stage === "Round of 16" ? 64 : 88;
    for (let index = 0; index < stageFixtures.length; index += 1) {
      const fixture = stageFixtures[index];
      const y = startY + 58 + index * matchHeight;
      if (y + matchHeight > startY + 830) break;

      context.fillStyle = "rgba(255,255,255,0.06)";
      roundRect(context, x + 12, y, colWidth - 24, matchHeight - 8, 9, true);
      await helpers.drawFlag(fixture.homeTeam, x + 22, y + 8, 18);
      drawText(context, fixture.homeTeamName, x + 48, y + 23, colWidth - 70, "750 12px Inter, Arial, sans-serif", "#ffffff");
      await helpers.drawFlag(fixture.awayTeam, x + 22, y + 26, 18);
      drawText(context, fixture.awayTeamName, x + 48, y + 41, colWidth - 70, "750 12px Inter, Arial, sans-serif", "#ffffff");
    }
  }
}

function createDrawHelpers(context, imageCache) {
  return {
    async drawFlag(team, x, y, size) {
      const flagUrl = team?.flagUrl || team?.logoUrl;
      const image = flagUrl ? await loadImage(flagUrl, imageCache).catch(() => null) : null;

      context.save();
      roundRect(context, x, y, size, size, size / 2, false);
      context.clip();
      if (image) {
        drawCoverImage(context, image, x, y, size, size);
      } else {
        context.fillStyle = "rgba(255,255,255,0.16)";
        context.fillRect(x, y, size, size);
        context.fillStyle = "#ffffff";
        context.font = `${Math.floor(size * 0.72)}px Arial`;
        context.fillText(team?.flagEmoji || "⚽", x + 2, y + size * 0.76);
      }
      context.restore();
    },
    async drawAvatar(participant, x, y, size) {
      const image = participant?.avatarUrl
        ? await loadImage(participant.avatarUrl, imageCache).catch(() => null)
        : null;

      context.save();
      roundRect(context, x, y, size, size, size / 2, false);
      context.clip();
      if (image) {
        drawCoverImage(context, image, x, y, size, size);
      } else {
        context.fillStyle = "#67e8f9";
        context.fillRect(x, y, size, size);
        context.fillStyle = "#06111f";
        context.font = `900 ${Math.floor(size * 0.36)}px Inter, Arial, sans-serif`;
        context.textAlign = "center";
        context.fillText(getInitialsForReport(participant?.name), x + size / 2, y + size * 0.62);
        context.textAlign = "left";
      }
      context.restore();
    },
  };
}

function drawPanel(context, x, y, width, height, radius = 18) {
  context.fillStyle = "rgba(2, 6, 23, 0.68)";
  roundRect(context, x, y, width, height, radius, true);
  context.strokeStyle = "rgba(255,255,255,0.14)";
  context.lineWidth = 2;
  roundRect(context, x, y, width, height, radius, false);
  context.stroke();
}

function roundRect(context, x, y, width, height, radius, fill) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
  if (fill) context.fill();
}

function drawText(context, text, x, y, maxWidth, font, color) {
  context.font = font;
  context.fillStyle = color;
  let output = String(text || "");
  while (output.length > 3 && context.measureText(output).width > maxWidth) {
    output = `${output.slice(0, -2)}`;
  }
  if (output !== String(text || "")) output = `${output.slice(0, -1)}…`;
  context.fillText(output, x, y);
}

function drawCoverImage(context, image, x, y, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.width - sourceWidth) / 2;
  const sourceY = (image.height - sourceHeight) / 2;
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function drawContainImage(context, image, x, y, width, height) {
  const scale = Math.min(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  context.drawImage(image, x, y, drawWidth, drawHeight);
}

function getParticipantsByTeamId(tournament) {
  const map = new Map();

  for (const participant of tournament.participants || []) {
    const pickedTeams = [
      findReportTeamByStoredPick(tournament.teams, participant.potATeamId, participant.potATeamName),
      findReportTeamByStoredPick(tournament.teams, participant.potBTeamId, participant.potBTeamName),
    ];

    for (const team of pickedTeams) {
      if (team?.id) map.set(team.id, participant);
    }
  }

  return map;
}

function findReportTeamByStoredPick(teams, teamId, teamName) {
  const normalisedName = normaliseReportTeamName(teamName);
  const namedTeam = normalisedName
    ? teams.find((team) => normaliseReportTeamName(team.name) === normalisedName)
    : null;

  return namedTeam || teams.find((team) => team.id === teamId) || null;
}

function normaliseReportTeamName(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function getPotTeamsForReport(tournament, pot) {
  return tournament.teams
    .filter((team) => team.sweepstakePot === pot)
    .sort((teamA, teamB) => teamA.name.localeCompare(teamB.name));
}

function hydrateFixtureForReport(fixture, teams) {
  const homeTeam = teams.find((team) => team.id === fixture.homeTeamId);
  const awayTeam = teams.find((team) => team.id === fixture.awayTeamId);

  return {
    ...fixture,
    homeTeam,
    awayTeam,
    homeTeamName: homeTeam?.name || fixture.homeTeamName,
    awayTeamName: awayTeam?.name || fixture.awayTeamName,
  };
}

function getFixtureLabel(fixture) {
  return fixture.stage === "Group" ? `Group ${fixture.group}` : fixture.stage;
}

function formatShortDate(dateText) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${dateText}T12:00:00`));
}

function getInitialsForReport(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";
}

function loadImage(url, imageCache) {
  if (imageCache.has(url)) return imageCache.get(url);

  const promise = new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });

  imageCache.set(url, promise);
  return promise;
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not create PDF image."));
    }, type, quality);
  });
}

async function createPdfFromJpeg(jpegBlob, imageWidth, imageHeight) {
  const imageBytes = new Uint8Array(await jpegBlob.arrayBuffer());
  const encoder = new TextEncoder();
  const content = `q\n${PDF_WIDTH} 0 0 ${PDF_HEIGHT} 0 0 cm\n/Im0 Do\nQ`;
  const objects = [
    encoder.encode("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"),
    encoder.encode("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"),
    encoder.encode(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_WIDTH} ${PDF_HEIGHT}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`),
    combineBytes([
      encoder.encode(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`),
      imageBytes,
      encoder.encode("\nendstream\nendobj\n"),
    ]),
    encoder.encode(`5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`),
  ];

  const header = encoder.encode("%PDF-1.4\n");
  const offsets = [];
  let position = header.length;

  for (const object of objects) {
    offsets.push(position);
    position += object.length;
  }

  const xrefPosition = position;
  const xref = encoder.encode(
    `xref\n0 6\n0000000000 65535 f \n${offsets
      .map((offset) => `${String(offset).padStart(10, "0")} 00000 n `)
      .join("\n")}\ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefPosition}\n%%EOF`
  );

  return new Blob([header, ...objects, xref], { type: "application/pdf" });
}

function combineBytes(parts) {
  const length = parts.reduce((total, part) => total + part.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;

  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }

  return output;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
