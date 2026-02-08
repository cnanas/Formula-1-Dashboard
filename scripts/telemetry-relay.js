#!/usr/bin/env node
/**
 * F1 Game Telemetry Relay
 * Listens for UDP telemetry on port 20777, serves WebSocket on port 20978.
 * Run: node scripts/telemetry-relay.js
 * Requires: npm install ws @deltazeroproduction/f1-udp-parser
 */

const { F1TelemetryClient, constants } = require("@deltazeroproduction/f1-udp-parser");
const { WebSocketServer } = require("ws");

const UDP_PORT = 20777;
const WS_PORT = 20978;

const client = new F1TelemetryClient({ port: UDP_PORT });
const wss = new WebSocketServer({ port: WS_PORT, host: "0.0.0.0" });

let latestData = null;

client.on(constants.PACKETS.carTelemetry, (packet) => {
  const { m_header, m_carTelemetryData, m_mfdPanelIndex } = packet.data;
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

wss.on("connection", (ws) => {
  if (latestData) ws.send(JSON.stringify(latestData));
  const interval = setInterval(() => {
    if (latestData && ws.readyState === 1) ws.send(JSON.stringify(latestData));
  }, 50);
  ws.on("close", () => clearInterval(interval));
});

client.start();
console.log(`F1 Telemetry Relay: UDP ${UDP_PORT} -> WebSocket ${WS_PORT}`);
console.log("Configure your F1 game to send UDP telemetry to this machine's IP.");
