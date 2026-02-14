#!/usr/bin/env node
/**
 * F1 Game Telemetry Relay
 * Listens for UDP telemetry on port 20777, serves WebSocket on port 20978.
 * Sends live telemetry and, at session end, a session summary (final classification).
 * Optional: set DISCORD_WEBHOOK_URL (env or .env) to post the summary to a Discord channel.
 * Run: node scripts/telemetry-relay.js
 * Requires: npm install ws @deltazeroproduction/f1-udp-parser dotenv
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const { F1TelemetryClient, constants } = require("@deltazeroproduction/f1-udp-parser");
const { WebSocketServer } = require("ws");

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || null;

const UDP_PORT = 20777;
const WS_PORT = 20978;

const client = new F1TelemetryClient({ port: UDP_PORT });
const wss = new WebSocketServer({ port: WS_PORT, host: "0.0.0.0" });

let latestData = null;
/** @type {{ final: boolean, sessionType: string, trackName: string, totalLaps: number, position: number, gridPosition: number, numLaps: number, bestLapTimeMs: number|null, bestLapTimeFormatted: string, totalRaceTimeMs?: number|null, totalRaceTimeFormatted: string, numPitStops: number, points: number, penaltiesTime: number, numPenalties: number, resultStatus: number } | null} */
let sessionSummary = null;

// Session/lap context for building summary (track name, session type, best lap during session)
let gameYear = 2024;
let sessionTypeIndex = 0;
let trackId = 0;
let totalLaps = 0;
let bestLapTimeMs = null;
let lastLapTimeMs = null;
let currentLapNum = 0;
let carPosition = 0;

const SESSION_TYPES = constants.SESSION_TYPES;
const TRACKS = constants.TRACKS || [];

function getSessionTypeName(year, index) {
  try {
    const byYear = SESSION_TYPES[year] || SESSION_TYPES[2024];
    const entry = byYear && byYear[index];
    return entry ? (entry.long || entry.short || `Session ${index}`) : `Session ${index}`;
  } catch {
    return `Session ${index}`;
  }
}

function getTrackName(id) {
  try {
    const t = TRACKS[id];
    return (t && t.name) ? t.name : `Track ${id}`;
  } catch {
    return `Track ${id}`;
  }
}

function msToTime(ms) {
  if (ms == null || ms <= 0) return "—";
  const totalSec = ms / 1000;
  const min = Math.floor(totalSec / 60);
  const sec = (totalSec % 60).toFixed(3);
  return `${min}:${sec.padStart(6, "0")}`;
}

function positionLabel(pos) {
  if (pos === 1) return "1st";
  if (pos === 2) return "2nd";
  if (pos === 3) return "3rd";
  return `${pos}th`;
}

function postSummaryToDiscord(summary) {
  if (!DISCORD_WEBHOOK_URL || typeof fetch !== "function") return;
  const fields = [
    { name: "Position", value: positionLabel(summary.position), inline: true },
    { name: "Track", value: summary.trackName, inline: true },
    { name: "Session", value: summary.sessionType, inline: true },
    { name: "Laps", value: `${summary.numLaps} / ${summary.totalLaps}`, inline: true },
    { name: "Best lap", value: summary.bestLapTimeFormatted, inline: true },
    { name: "Total time", value: summary.totalRaceTimeFormatted, inline: true },
  ];
  if (summary.numPitStops > 0) {
    fields.push({ name: "Pit stops", value: String(summary.numPitStops), inline: true });
  }
  if (summary.points > 0) {
    fields.push({ name: "Points", value: `+${summary.points}`, inline: true });
  }
  if (summary.numPenalties > 0 || (summary.penaltiesTime && summary.penaltiesTime > 0)) {
    const pen = summary.penaltiesTime
      ? `${summary.numPenalties} (${(summary.penaltiesTime / 1000).toFixed(1)}s)`
      : String(summary.numPenalties);
    fields.push({ name: "Penalties", value: pen, inline: true });
  }
  const body = JSON.stringify({
    embeds: [
      {
        title: "🏁 Session summary",
        color: 0xe10600, // F1 red
        fields,
      },
    ],
  });
  fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  }).catch((err) => console.error("Discord webhook error:", err.message));
}

client.on(constants.PACKETS.carTelemetry, (packet) => {
  const { m_header, m_carTelemetryData } = packet.data;
  const playerIndex = m_header.m_playerCarIndex;
  const car = m_carTelemetryData?.[playerIndex];
  if (!car) return;

  latestData = {
    speed: car.m_speed ?? 0,
    rpm: car.m_engineRPM ?? 0,
    throttle: Math.round((car.m_throttle ?? 0) * 100),
    brake: Math.round((car.m_brake ?? 0) * 100),
    n_gear: car.m_gear < 0 ? 0 : car.m_gear,
    drs: (car.m_drs ?? 0) >= 1 ? 10 : 0,
  };
});

client.on(constants.PACKETS.session, (packet) => {
  const d = packet.data;
  if (!d || !d.m_header) return;
  gameYear = d.m_header.m_gameYear || 2024;
  sessionTypeIndex = d.m_sessionType ?? 0;
  trackId = d.m_trackId ?? 0;
  totalLaps = d.m_totalLaps ?? 0;
  // Reset session-level summary when a new session starts (don't clear final summary)
  if (!sessionSummary || !sessionSummary.final) {
    bestLapTimeMs = null;
    lastLapTimeMs = null;
    currentLapNum = 0;
    carPosition = 0;
  }
});

client.on(constants.PACKETS.lapData, (packet) => {
  const { m_header, m_lapData } = packet.data;
  if (!m_lapData) return;
  const playerIndex = m_header.m_playerCarIndex;
  const lap = m_lapData[playerIndex];
  if (!lap) return;

  const lastLap = lap.m_lastLapTimeInMs;
  if (lastLap != null && lastLap > 0) {
    lastLapTimeMs = lastLap;
    if (bestLapTimeMs == null || lastLap < bestLapTimeMs) bestLapTimeMs = lastLap;
  }
  currentLapNum = lap.m_currentLapNum ?? 0;
  carPosition = lap.m_carPosition ?? 0;
});

client.on(constants.PACKETS.finalClassification, (packet) => {
  const { m_header, m_classificationData } = packet.data;
  if (!m_classificationData) return;
  const playerIndex = m_header.m_playerCarIndex;
  const c = m_classificationData[playerIndex];
  if (!c) return;

  sessionSummary = {
    final: true,
    sessionType: getSessionTypeName(gameYear, sessionTypeIndex),
    trackName: getTrackName(trackId),
    totalLaps,
    position: c.m_position ?? 0,
    gridPosition: c.m_gridPosition ?? 0,
    numLaps: c.m_numLaps ?? 0,
    bestLapTimeMs: c.m_bestLapTimeInMs ?? bestLapTimeMs ?? null,
    bestLapTimeFormatted: msToTime(c.m_bestLapTimeInMs ?? bestLapTimeMs),
    totalRaceTimeMs: c.m_totalRaceTime ?? null,
    totalRaceTimeFormatted: msToTime(c.m_totalRaceTime),
    numPitStops: c.m_numPitStops ?? 0,
    points: c.m_points ?? 0,
    penaltiesTime: c.m_penaltiesTime ?? 0,
    numPenalties: c.m_numPenalties ?? 0,
    resultStatus: c.m_resultStatus ?? 0,
  };
  if (DISCORD_WEBHOOK_URL) postSummaryToDiscord(sessionSummary);
});

function buildPayload() {
  const payload = {};
  if (latestData) payload.live = latestData;
  if (sessionSummary) payload.summary = sessionSummary;
  if (Object.keys(payload).length === 0) return null;
  return payload;
}

wss.on("connection", (ws) => {
  const payload = buildPayload();
  if (payload) ws.send(JSON.stringify(payload));
  const interval = setInterval(() => {
    const p = buildPayload();
    if (p && ws.readyState === 1) ws.send(JSON.stringify(p));
  }, 50);
  ws.on("close", () => clearInterval(interval));
});

client.start();
console.log(`F1 Telemetry Relay: UDP ${UDP_PORT} -> WebSocket ${WS_PORT}`);
console.log("Session summary will be sent when the race/session ends (final classification).");
if (DISCORD_WEBHOOK_URL) {
  console.log("Discord: session summaries will be posted to your webhook.");
} else {
  console.log("Optional: set DISCORD_WEBHOOK_URL in .env to post summaries to Discord.");
}
console.log("Configure your F1 game to send UDP telemetry to this machine's IP.");
