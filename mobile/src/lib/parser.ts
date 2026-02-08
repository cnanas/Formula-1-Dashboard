/**
 * F1 game (EA/Codemasters) UDP CarTelemetry packet parser.
 * Supports F1 22, 23, 24, 25 packet formats.
 * Based on official UDP specification: PacketCarTelemetryData (packet id 6).
 */

import type { GameTelemetry } from "./types";

const PACKET_ID_CAR_TELEMETRY = 6;
const PACKET_HEADER_SIZE = 29;
const PLAYER_CAR_INDEX_OFFSET = 24;

/**
 * CarTelemetryData struct size varies by game year.
 * F1 22/23: ~60 bytes per car
 * F1 24/25: ~61 bytes per car
 * Using 61 for compatibility with F1 24/25.
 */
const CAR_TELEMETRY_DATA_SIZE = 61;

/**
 * Offsets within each CarTelemetryData struct (from F1 UDP spec).
 */
const CAR_SPEED_OFFSET = 0; // uint16
const CAR_THROTTLE_OFFSET = 4; // float
const CAR_STEER_OFFSET = 8; // float (skip)
const CAR_BRAKE_OFFSET = 12; // float
const CAR_CLUTCH_OFFSET = 16; // uint8
const CAR_GEAR_OFFSET = 17; // int8
const CAR_ENGINE_RPM_OFFSET = 18; // uint16
const CAR_DRS_OFFSET = 20; // uint8

/**
 * Parse F1 UDP CarTelemetry packet (packet id 6) and extract player car telemetry.
 * @param buffer - Raw UDP packet buffer (ArrayBuffer or Uint8Array)
 * @returns Parsed GameTelemetry or null if packet is not CarTelemetry or parse fails
 */
export function parseCarTelemetryPacket(
  buffer: ArrayBuffer | Uint8Array
): GameTelemetry | null {
  const data =
    buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  if (data.length < PACKET_HEADER_SIZE) {
    return null;
  }

  const packetId = view.getUint8(3);
  if (packetId !== PACKET_ID_CAR_TELEMETRY) {
    return null;
  }

  const playerCarIndex = view.getUint8(PLAYER_CAR_INDEX_OFFSET);
  const carOffset =
    PACKET_HEADER_SIZE + playerCarIndex * CAR_TELEMETRY_DATA_SIZE;

  if (data.length < carOffset + CAR_DRS_OFFSET + 1) {
    return null;
  }

  const speed = view.getUint16(carOffset + CAR_SPEED_OFFSET, true);
  const throttle = view.getFloat32(carOffset + CAR_THROTTLE_OFFSET, true);
  const brake = view.getFloat32(carOffset + CAR_BRAKE_OFFSET, true);
  const gear = view.getInt8(carOffset + CAR_GEAR_OFFSET);
  const rpm = view.getUint16(carOffset + CAR_ENGINE_RPM_OFFSET, true);
  const drsRaw = view.getUint8(carOffset + CAR_DRS_OFFSET);

  return {
    speed,
    rpm,
    throttle: Math.round(throttle * 100),
    brake: Math.round(brake * 100),
    n_gear: gear < 0 ? 0 : gear,
    drs: drsRaw >= 1 ? 10 : 0,
  };
}
