/**
 * F1 game (EA/Codemasters) UDP CarTelemetry packet parser.
 * Supports F1 22, 23, 24, 25 packet formats.
 * Based on official UDP specification: PacketCarTelemetryData (packet id 6).
 * F1 2024/25: packetId at byte 6, playerCarIndex at 27, header 29 bytes.
 * F1 2023: packetId at byte 5, playerCarIndex at 26, header 28 bytes.
 * F1 22 and older: packetId at byte 3, playerCarIndex at 24, header 29 bytes.
 */

import type { GameTelemetry } from "./types";

const PACKET_ID_CAR_TELEMETRY = 6;
const PACKET_ID_LAP_DATA = 2;
const PACKET_ID_SESSION_HISTORY = 11;
const PACKET_ID_SESSION = 1;
const PACKET_ID_PARTICIPANTS = 4;
const PACKET_ID_CAR_SETUP = 5;

/** F1 2024 Session packet: header 29, then weather(1), trackTemp(1), airTemp(1), totalLaps(1), trackLength(2), sessionType(1), trackId(1)... */
const SESSION_HEADER_SIZE_2024 = 29;
const SESSION_UID_OFFSET = 7;
const SESSION_WEATHER_OFFSET = 29;
const SESSION_TRACK_TEMP_OFFSET = 30;
const SESSION_AIR_TEMP_OFFSET = 31;
const SESSION_TOTAL_LAPS_OFFSET = 32;
const SESSION_TRACK_LENGTH_OFFSET = 33;
const SESSION_TYPE_OFFSET = 35;
const SESSION_TRACK_ID_OFFSET = 36;

const PACKET_ID_CAR_STATUS = 7;
const CAR_STATUS_SIZE_2024 = 60;
const CAR_STATUS_SIZE_2025 = 62;
// CarStatusData: tractionControl(1), antiLockBrakes(1), fuelMix(1), frontBrakeBias(1), pitLimiterStatus(1), then fuel floats (F1 2020 spec)
const CAR_STATUS_FUEL_REMAINING_OFFSET = 5;
const CAR_STATUS_FUEL_CAPACITY_OFFSET = 9;

/**
 * F1 2024 LapData: 57 bytes per car.
 * F1 2024 added minute parts to delta fields (deltaToCarInFront, deltaToRaceLeader)
 * shifting all subsequent offsets +2 from F1 2020 layout.
 */
const LAP_DATA_HEADER_SIZE_2024 = 29;
const LAP_DATA_SIZE_2024 = 57;
const LAP_LAST_LAP_TIME_MS = 0;    // uint32 - Last lap time in milliseconds
const LAP_CURRENT_LAP_TIME_MS = 4; // uint32 - Current lap time in milliseconds
const LAP_CURRENT_LAP_NUM = 33;
// F1 2024 lap data offsets for sector times (from official UDP spec)
const LAP_SECTOR1_MS_PART = 8;    // uint16 - Sector 1 time in milliseconds
const LAP_SECTOR1_MIN_PART = 10;  // uint8 - Sector 1 whole minute part
const LAP_SECTOR2_MS_PART = 11;   // uint16 - Sector 2 time in milliseconds
const LAP_SECTOR2_MIN_PART = 13;  // uint8 - Sector 2 whole minute part
/** Lap distance around current lap in metres (float). F1 2024: offset 20. */
const LAP_DISTANCE_OFFSET = 20;
/** Current sector 0/1/2 (uint8). F1 2024: offset 36. */
const LAP_SECTOR_OFFSET = 36;

export interface LapDataSnapshot {
  currentLapNum: number;
  lastLapTimeMs: number;
  currentLapTimeMs: number;
  sector1Ms: number | null;
  sector2Ms: number | null;
  /** Distance around current lap in metres (0 to track length). */
  lapDistance: number;
  /** Current sector: 0 = sector 1, 1 = sector 2, 2 = sector 3. */
  sector: number;
}

function getHeaderLayout(packetFormat: number): {
  headerSize: number;
  packetIdOffset: number;
  playerCarIndexOffset: number;
} {
  if (packetFormat >= 2024) {
    return { headerSize: 29, packetIdOffset: 6, playerCarIndexOffset: 27 };
  }
  if (packetFormat >= 2023) {
    return { headerSize: 28, packetIdOffset: 5, playerCarIndexOffset: 26 };
  }
  return { headerSize: 29, packetIdOffset: 3, playerCarIndexOffset: 24 };
}

/**
 * CarTelemetryData struct layout per game format (from F1 UDP spec).
 * F1 2024: throttle@2, steer@6, brake@10, clutch@14, gear@15, rpm@16, drs@18; 60 bytes/car.
 * F1 22/23: throttle@4, brake@12, gear@17, rpm@18, drs@20; 61 bytes/car.
 */
function getCarDataLayout(packetFormat: number): {
  carDataSize: number;
  throttle: number;
  steer: number;
  brake: number;
  clutch: number;
  gear: number;
  rpm: number;
  drs: number;
} {
  if (packetFormat >= 2024) {
    return {
      carDataSize: 60,
      throttle: 2,
      steer: 6,
      brake: 10,
      clutch: 14,
      gear: 15,
      rpm: 16,
      drs: 18,
    };
  }
  return {
    carDataSize: 61,
    throttle: 4,
    steer: -1,
    brake: 12,
    clutch: 16,
    gear: 17,
    rpm: 18,
    drs: 20,
  };
}

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

  if (data.length < 7) {
    return null;
  }

  const packetFormat = view.getUint16(0, true);
  const layout = getHeaderLayout(packetFormat);

  if (data.length < layout.headerSize) {
    return null;
  }

  const packetId = view.getUint8(layout.packetIdOffset);
  if (packetId !== PACKET_ID_CAR_TELEMETRY) {
    return null;
  }

  const playerCarIndex = view.getUint8(layout.playerCarIndexOffset);
  const carLayout = getCarDataLayout(packetFormat);
  const carOffset =
    layout.headerSize + playerCarIndex * carLayout.carDataSize;

  if (data.length < carOffset + carLayout.drs + 1) {
    return null;
  }

  const speed = view.getUint16(carOffset + 0, true);
  const throttle = view.getFloat32(carOffset + carLayout.throttle, true);
  const brake = view.getFloat32(carOffset + carLayout.brake, true);
  const gear = view.getInt8(carOffset + carLayout.gear);
  const rpm = view.getUint16(carOffset + carLayout.rpm, true);
  const drsRaw = view.getUint8(carOffset + carLayout.drs);
  const steer =
    carLayout.steer >= 0
      ? Math.round(view.getFloat32(carOffset + carLayout.steer, true) * 100)
      : 0;
  const clutch =
    carLayout.clutch >= 0
      ? Math.round(view.getFloat32(carOffset + carLayout.clutch, true) * 100)
      : 0;

  return {
    speed,
    rpm,
    throttle: Math.round(throttle * 100),
    brake: Math.round(brake * 100),
    n_gear: gear < 0 ? 0 : gear,
    drs: drsRaw >= 1 ? 10 : 0,
    steering: steer,
    clutch: Math.min(100, Math.max(0, clutch)),
  };
}

/**
 * Parse F1 UDP Lap Data packet (packet id 2). F1 2024/25 format.
 * Returns player car lap state for building lap history.
 */
export function parseLapDataPacket(
  buffer: ArrayBuffer | Uint8Array
): LapDataSnapshot | null {
  const data =
    buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  if (data.length < LAP_DATA_HEADER_SIZE_2024 + LAP_DATA_SIZE_2024) {
    return null;
  }

  const packetFormat = view.getUint16(0, true);
  if (packetFormat < 2024) return null;

  const packetId = view.getUint8(6);
  if (packetId !== PACKET_ID_LAP_DATA) return null;

  const playerCarIndex = view.getUint8(27);
  const lapOffset =
    LAP_DATA_HEADER_SIZE_2024 + playerCarIndex * LAP_DATA_SIZE_2024;

  if (data.length < lapOffset + LAP_CURRENT_LAP_NUM + 1) return null;

  const lastLapTimeMs = view.getUint32(lapOffset + LAP_LAST_LAP_TIME_MS, true);
  const currentLapTimeMs = view.getUint32(lapOffset + LAP_CURRENT_LAP_TIME_MS, true);
  const currentLapNum = view.getUint8(lapOffset + LAP_CURRENT_LAP_NUM);

  const s1Min = view.getUint8(lapOffset + LAP_SECTOR1_MIN_PART);
  const s1Ms = view.getUint16(lapOffset + LAP_SECTOR1_MS_PART, true);
  const rawSector1Ms = s1Min * 60000 + s1Ms;
  // Validate sector time is reasonable (less than 5 minutes = 300000ms)
  // and the milliseconds part is valid (less than 60000)
  const sector1Ms =
    (s1Min > 0 || s1Ms > 0) && rawSector1Ms < 300000 && s1Ms < 60000 ? rawSector1Ms : null;

  const s2Min = view.getUint8(lapOffset + LAP_SECTOR2_MIN_PART);
  const s2Ms = view.getUint16(lapOffset + LAP_SECTOR2_MS_PART, true);
  const rawSector2Ms = s2Min * 60000 + s2Ms;
  // Validate sector time is reasonable (less than 5 minutes = 300000ms)
  // and the milliseconds part is valid (less than 60000)
  const sector2Ms =
    (s2Min > 0 || s2Ms > 0) && rawSector2Ms < 300000 && s2Ms < 60000 ? rawSector2Ms : null;

  let lapDistance = 0;
  let sector = 0;
  if (data.length >= lapOffset + LAP_DISTANCE_OFFSET + 4) {
    lapDistance = Math.max(0, view.getFloat32(lapOffset + LAP_DISTANCE_OFFSET, true));
  }
  if (data.length >= lapOffset + LAP_SECTOR_OFFSET + 1) {
    sector = Math.max(0, Math.min(2, view.getUint8(lapOffset + LAP_SECTOR_OFFSET)));
  }

  return {
    currentLapNum,
    lastLapTimeMs,
    currentLapTimeMs,
    sector1Ms,
    sector2Ms,
    lapDistance,
    sector,
  };
}

/**
 * F1 2025 Session History packet (ID 11): best sector times from the game.
 * Used for live sector delta so values stay correct after mid-lap reset.
 * Layout (per official F1 25 spec): header 29, carIdx 1, numLaps 1, numTyreStints 1,
 * bestLapTimeLapNum 1, bestSector1LapNum 1, bestSector2LapNum 1, bestSector3LapNum 1,
 * then 100 × LapHistoryData (14 bytes each), then 8 × TyreStintHistoryData (3 bytes each).
 * LapHistoryData: lapTimeInMS 4, sector1TimeInMS 2, sector1TimeMinutes 1, sector2TimeInMS 2,
 * sector2TimeMinutes 1, sector3TimeInMS 2, sector3TimeMinutes 1, lapValidBitFlags 1.
 */
export interface SessionHistoryBestSectors {
  bestSector1Ms: number | null;
  bestSector2Ms: number | null;
  bestSector3Ms: number | null;
}

const SESSION_HISTORY_HEADER = 29;
const SESSION_HISTORY_CAR_IDX = 29;
const SESSION_HISTORY_BEST_S1_LAP_NUM = 33;
const SESSION_HISTORY_BEST_S2_LAP_NUM = 34;
const SESSION_HISTORY_BEST_S3_LAP_NUM = 35;
const SESSION_HISTORY_LAP_HISTORY_START = 36;
const SESSION_HISTORY_LAP_SIZE = 14;
const SESSION_HISTORY_LAP_S1_MS = 4;
const SESSION_HISTORY_LAP_S1_MIN = 6;
const SESSION_HISTORY_LAP_S2_MS = 7;
const SESSION_HISTORY_LAP_S2_MIN = 9;
const SESSION_HISTORY_LAP_S3_MS = 10;
const SESSION_HISTORY_LAP_S3_MIN = 12;

export function parseSessionHistoryPacket(
  buffer: ArrayBuffer | Uint8Array,
  playerCarIndex: number
): SessionHistoryBestSectors | null {
  const data =
    buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  const packetFormat = view.getUint16(0, true);
  if (packetFormat < 2025) return null;

  const packetId = view.getUint8(6);
  if (packetId !== PACKET_ID_SESSION_HISTORY) return null;

  const minLength =
    SESSION_HISTORY_LAP_HISTORY_START + 100 * SESSION_HISTORY_LAP_SIZE;
  if (data.length < minLength) return null;

  const carIdx = view.getUint8(SESSION_HISTORY_CAR_IDX);
  if (carIdx !== playerCarIndex) return null;

  const readLapSectorMs = (lapIndex: number, sMsOffset: number, sMinOffset: number): number | null => {
    if (lapIndex < 0 || lapIndex >= 100) return null;
    const base = SESSION_HISTORY_LAP_HISTORY_START + lapIndex * SESSION_HISTORY_LAP_SIZE;
    const sMin = view.getUint8(base + sMinOffset);
    const sMs = view.getUint16(base + sMsOffset, true);
    const raw = sMin * 60000 + sMs;
    if (raw <= 0 || raw >= 300000 || sMs >= 60000) return null;
    return raw;
  };

  const bestS1Lap = view.getUint8(SESSION_HISTORY_BEST_S1_LAP_NUM);
  const bestS2Lap = view.getUint8(SESSION_HISTORY_BEST_S2_LAP_NUM);
  const bestS3Lap = view.getUint8(SESSION_HISTORY_BEST_S3_LAP_NUM);
  const lapIdx = (lapNum: number) => (lapNum >= 1 && lapNum <= 100 ? lapNum - 1 : -1);
  const bestSector1Ms = readLapSectorMs(lapIdx(bestS1Lap), SESSION_HISTORY_LAP_S1_MS, SESSION_HISTORY_LAP_S1_MIN);
  const bestSector2Ms = readLapSectorMs(lapIdx(bestS2Lap), SESSION_HISTORY_LAP_S2_MS, SESSION_HISTORY_LAP_S2_MIN);
  const bestSector3Ms = readLapSectorMs(lapIdx(bestS3Lap), SESSION_HISTORY_LAP_S3_MS, SESSION_HISTORY_LAP_S3_MIN);

  return {
    bestSector1Ms: bestSector1Ms ?? null,
    bestSector2Ms: bestSector2Ms ?? null,
    bestSector3Ms: bestSector3Ms ?? null,
  };
}

/** F1 2024/25 session type IDs (appendix). 0 used for Time Trial in some builds. */
const SESSION_TYPE_NAMES: Record<number, string> = {
  0: "Time Trial", // game often sends 0 for Time Trial
  1: "Practice 1",
  2: "Practice 2",
  3: "Practice 3",
  4: "Short Practice",
  5: "Q1",
  6: "Q2",
  7: "Q3",
  8: "Short Qualifying",
  9: "One Shot Qualifying",
  10: "Race",
  11: "Race 2",
  12: "Time Trial",
  13: "Time Trial", // F1 25 may use 13
};

/** F1 2024 track IDs (appendix) – subset; -1 and unknown IDs show as "Unknown". */
const TRACK_NAMES: Record<number, string> = {
  0: "Melbourne",
  1: "Paul Ricard",
  2: "Shanghai",
  3: "Sakhir",
  4: "Catalunya",
  5: "Monaco",
  6: "Montreal",
  7: "Silverstone",
  8: "Hockenheim",
  9: "Hungaroring",
  10: "Spa",
  11: "Monza",
  12: "Singapore",
  13: "Suzuka",
  14: "Abu Dhabi",
  15: "Texas",
  16: "Brazil",
  17: "Austria",
  18: "Sochi",
  19: "Mexico",
  20: "Baku",
  21: "Bahrain Short",
  22: "Silverstone Short",
  23: "Texas Short",
  24: "Suzuka Short",
  25: "Hanoi",
  26: "Zandvoort",
  27: "Imola",
  28: "Portimão",
  29: "Jeddah",
  30: "Miami",
  31: "Las Vegas",
  32: "Losail",
};

export interface SessionSnapshot {
  sessionUID: string;
  trackId: number;
  sessionType: number;
  circuitName: string;
  sessionTypeName: string;
  weather: number;
  weatherName: string;
  airTempC: number;
  trackTempC: number;
  totalLaps: number;
  /** Track length in metres (uint16 from session packet). */
  trackLengthM: number;
}

/** F1 2024 weather IDs (appendix). */
const WEATHER_NAMES: Record<number, string> = {
  0: "Clear",
  1: "Light cloud",
  2: "Overcast",
  3: "Light rain",
  4: "Heavy rain",
  5: "Storm",
};

export interface CarStatusSnapshot {
  fuelRemaining: number;
  fuelCapacity: number;
}

/** F1 2023/24/25 team IDs (appendix). Maps m_teamId to display name. */
const TEAM_NAMES: Record<number, string> = {
  0: "Mercedes",
  1: "Ferrari",
  2: "Red Bull Racing",
  3: "Williams",
  4: "Aston Martin",
  5: "Alpine",
  6: "RB",
  7: "Haas",
  8: "McLaren",
  9: "Sauber",
  41: "F1 Generic",
  104: "F1 Custom Team",
  129: "Konnersport",
  255: "Unknown",
};

/** ParticipantData: m_teamId at offset 3. F1 2023: 58 bytes/car, F1 2024/25: ~56–62. */
const PARTICIPANT_SIZE_2023 = 58;
const PARTICIPANT_SIZE_2025 = 62;

export interface ParticipantsSnapshot {
  /** Player car team name from m_teamId. */
  teamName: string;
}

/** CarSetupData: F1 2023/24 = 49 bytes, F1 2025 = 50 bytes (adds m_engineBraking between brakeBias and tyre pressures). */
const CAR_SETUP_SIZE_2023 = 49;
const CAR_SETUP_SIZE_2025 = 50;

export interface CarSetupSnapshot {
  frontWing: number;
  rearWing: number;
  onThrottle: number;
  offThrottle: number;
  frontCamber: number;
  rearCamber: number;
  frontToe: number;
  rearToe: number;
  frontSuspension: number;
  rearSuspension: number;
  frontAntiRollBar: number;
  rearAntiRollBar: number;
  frontSuspensionHeight: number;
  rearSuspensionHeight: number;
  brakePressure: number;
  brakeBias: number;
  engineBraking?: number; // F1 2025 only
  rearLeftTyrePressure: number;
  rearRightTyrePressure: number;
  frontLeftTyrePressure: number;
  frontRightTyrePressure: number;
  ballast: number;
  fuelLoad: number;
}

/**
 * Parse F1 UDP Session packet (packet id 1). F1 2024/25 format.
 * Returns session metadata for race records.
 */
export function parseSessionPacket(
  buffer: ArrayBuffer | Uint8Array
): SessionSnapshot | null {
  const data =
    buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  if (data.length < SESSION_TRACK_ID_OFFSET + 1) return null;

  const packetFormat = view.getUint16(0, true);
  if (packetFormat < 2024) return null;

  const packetId = view.getUint8(6);
  if (packetId !== PACKET_ID_SESSION) return null;

  const sessionUID = view.getBigUint64(SESSION_UID_OFFSET, true).toString();
  const sessionType = view.getUint8(SESSION_TYPE_OFFSET);
  const trackId = view.getInt8(SESSION_TRACK_ID_OFFSET);
  const weather = data.length > SESSION_WEATHER_OFFSET ? view.getUint8(SESSION_WEATHER_OFFSET) : 0;
  const trackTempC = data.length > SESSION_TRACK_TEMP_OFFSET ? view.getInt8(SESSION_TRACK_TEMP_OFFSET) : 0;
  const airTempC = data.length > SESSION_AIR_TEMP_OFFSET ? view.getInt8(SESSION_AIR_TEMP_OFFSET) : 0;
  const totalLaps = data.length > SESSION_TOTAL_LAPS_OFFSET ? view.getUint8(SESSION_TOTAL_LAPS_OFFSET) : 0;
  const trackLengthM = data.length > SESSION_TRACK_LENGTH_OFFSET + 1 ? view.getUint16(SESSION_TRACK_LENGTH_OFFSET, true) : 0;

  return {
    sessionUID,
    trackId,
    sessionType,
    circuitName: TRACK_NAMES[trackId] ?? "Unknown",
    sessionTypeName: SESSION_TYPE_NAMES[sessionType] ?? "Unknown",
    weather,
    weatherName: WEATHER_NAMES[weather] ?? "Unknown",
    airTempC,
    trackTempC,
    totalLaps,
    trackLengthM,
  };
}

/**
 * Parse F1 UDP Participants packet (packet id 4).
 * Returns player car team name from m_teamId.
 */
export function parseParticipantsPacket(
  buffer: ArrayBuffer | Uint8Array
): ParticipantsSnapshot | null {
  const data =
    buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  if (data.length < 30) return null;

  const packetFormat = view.getUint16(0, true);
  const layout = getHeaderLayout(packetFormat);

  if (data.length < layout.headerSize + 1) return null;

  const packetId = view.getUint8(layout.packetIdOffset);
  if (packetId !== PACKET_ID_PARTICIPANTS) return null;

  const playerCarIndex = view.getUint8(layout.playerCarIndexOffset);
  const participantSize =
    packetFormat >= 2025 ? PARTICIPANT_SIZE_2025 : PARTICIPANT_SIZE_2023;
  const participantOffset =
    layout.headerSize + 1 + playerCarIndex * participantSize;

  if (data.length < participantOffset + 4) return null;

  const teamId = view.getUint8(participantOffset + 3);
  const teamName = TEAM_NAMES[teamId] ?? "Unknown";

  return { teamName };
}

/**
 * Parse F1 UDP Car Setup packet (packet id 5).
 * F1 2025 adds m_engineBraking (uint8) between brakeBias and tyre pressures, shifting offsets.
 */
export function parseCarSetupPacket(
  buffer: ArrayBuffer | Uint8Array
): CarSetupSnapshot | null {
  const data =
    buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  if (data.length < 30) return null;

  const packetFormat = view.getUint16(0, true);
  const layout = getHeaderLayout(packetFormat);

  const packetId = view.getUint8(layout.packetIdOffset);
  if (packetId !== PACKET_ID_CAR_SETUP) return null;

  const playerCarIndex = view.getUint8(layout.playerCarIndexOffset);
  const carSetupSize =
    packetFormat >= 2025 ? CAR_SETUP_SIZE_2025 : CAR_SETUP_SIZE_2023;
  const setupOffset = layout.headerSize + playerCarIndex * carSetupSize;

  if (data.length < setupOffset + carSetupSize) return null;

  const isF1_2025 = packetFormat >= 2025;
  const tyreBase = isF1_2025 ? 29 : 28; // m_engineBraking pushes tyre pressures +1
  const ballastOff = isF1_2025 ? 45 : 44;
  const fuelOff = isF1_2025 ? 46 : 45;

  const snapshot: CarSetupSnapshot = {
    frontWing: view.getUint8(setupOffset + 0),
    rearWing: view.getUint8(setupOffset + 1),
    onThrottle: view.getUint8(setupOffset + 2),
    offThrottle: view.getUint8(setupOffset + 3),
    frontCamber: view.getFloat32(setupOffset + 4, true),
    rearCamber: view.getFloat32(setupOffset + 8, true),
    frontToe: view.getFloat32(setupOffset + 12, true),
    rearToe: view.getFloat32(setupOffset + 16, true),
    frontSuspension: view.getUint8(setupOffset + 20),
    rearSuspension: view.getUint8(setupOffset + 21),
    frontAntiRollBar: view.getUint8(setupOffset + 22),
    rearAntiRollBar: view.getUint8(setupOffset + 23),
    frontSuspensionHeight: view.getUint8(setupOffset + 24),
    rearSuspensionHeight: view.getUint8(setupOffset + 25),
    brakePressure: view.getUint8(setupOffset + 26),
    brakeBias: view.getUint8(setupOffset + 27),
    rearLeftTyrePressure: view.getFloat32(setupOffset + tyreBase + 0, true),
    rearRightTyrePressure: view.getFloat32(setupOffset + tyreBase + 4, true),
    frontLeftTyrePressure: view.getFloat32(setupOffset + tyreBase + 8, true),
    frontRightTyrePressure: view.getFloat32(setupOffset + tyreBase + 12, true),
    ballast: view.getUint8(setupOffset + ballastOff),
    fuelLoad: view.getFloat32(setupOffset + fuelOff, true),
  };

  if (isF1_2025) {
    snapshot.engineBraking = view.getUint8(setupOffset + 28);
  }

  return snapshot;
}

/**
 * Parse F1 UDP Car Status packet (packet id 7). F1 2024/25 format.
 * Returns player car fuel data. Tries 60 and 62 bytes per car for compatibility.
 */
export function parseCarStatusPacket(
  buffer: ArrayBuffer | Uint8Array
): CarStatusSnapshot | null {
  const data =
    buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  const packetFormat = view.getUint16(0, true);
  if (packetFormat < 2024) return null;

  const packetId = view.getUint8(6);
  if (packetId !== PACKET_ID_CAR_STATUS) return null;

  const playerCarIndex = view.getUint8(27);
  const carSize =
    packetFormat >= 2025 ? CAR_STATUS_SIZE_2025 : CAR_STATUS_SIZE_2024;
  const carOffset = 29 + playerCarIndex * carSize;

  if (data.length < carOffset + CAR_STATUS_FUEL_CAPACITY_OFFSET + 4)
    return null;

  const fuelRemaining = view.getFloat32(
    carOffset + CAR_STATUS_FUEL_REMAINING_OFFSET,
    true
  );
  const fuelCapacity = view.getFloat32(
    carOffset + CAR_STATUS_FUEL_CAPACITY_OFFSET,
    true
  );

  if (fuelCapacity <= 0 || !Number.isFinite(fuelCapacity)) return null;

  return {
    fuelRemaining: Math.max(0, fuelRemaining),
    fuelCapacity: Math.max(0.01, fuelCapacity),
  };
}
