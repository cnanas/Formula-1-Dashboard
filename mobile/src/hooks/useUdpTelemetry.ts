import { useEffect, useState, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dgram from "react-native-udp";
import NetInfo from "@react-native-community/netinfo";
import {
  parseCarTelemetryPacket,
  parseLapDataPacket,
  parseSessionPacket,
  parseSessionHistoryPacket,
  parseCarStatusPacket,
  parseParticipantsPacket,
  parseCarSetupPacket,
  type LapDataSnapshot,
  type CarSetupSnapshot,
} from "../lib/parser";
import type {
  GameTelemetry,
  LapRecord,
  LapTelemetryPoint,
  RaceRecord,
  SectorMetricTriplet,
} from "../lib/types";

const UDP_PORT = 20777;
const UI_UPDATE_MS = 20; // ~50fps for live gauges
const MAX_LAP_HISTORY = 50;
const MAX_RACE_RECORDS = 50;
const RACE_RECORDS_KEY = "f1_race_records";
const TELEMETRY_SAMPLE_MS = 50; // ~20fps sampling for charts/lap history
const TELEMETRY_HISTORY_MAX = 120; // ~6 sec at 20fps
const TELEMETRY_HISTORY_UPDATE_MS = 100; // 10fps chart state updates
const CURRENT_LAP_TELEMETRY_MAX = 2500; // full lap buffer (~2 min at 20fps)
const DEFAULT_TRACK_LENGTH_M = 5000; // fallback for lap progress (metres)
const FUEL_BURN_SAMPLE_WINDOW = 6;
const MIN_VALID_FUEL_BURN_L = 0.02;
const MAX_VALID_FUEL_BURN_L = 10;
const MIN_MOVING_SPEED_KPH = 30;
const CORNER_BRAKE_THRESHOLD = 10;
const CORNER_THROTTLE_THRESHOLD = 20;
const CAR_POSITION_MIN_DELTA = 0.002;

export interface TelemetryHistoryPoint {
  t: number;
  speed: number;
  brake: number;
  throttle: number;
}

export interface SessionInfo {
  weather: string;
  airTempC: number;
  trackTempC: number;
  totalLaps: number;
}

export interface FuelInfo {
  remaining: number;
  capacity: number;
}

export interface FuelMetrics {
  burnPerLap: number | null;
  lapsRemaining: number | null;
  sampleCount: number;
}

export interface CarPosition {
  /** Progress around lap 0–1 (from lap distance / track length). */
  progress: number;
  /** Current sector 0/1/2. */
  sector: number;
}

export interface CurrentLapSectors {
  /** Sector 1 time in ms (null if not yet completed). */
  sector1Ms: number | null;
  /** Sector 2 time in ms (null if not yet completed). */
  sector2Ms: number | null;
  /** Sector 3 time in ms from last completed lap (null if no lap completed). */
  sector3Ms: number | null;
  /** Running time for the current sector being driven (ms). */
  currentSectorTimeMs: number;
  /** Current sector index (0, 1, or 2). */
  currentSector: number;
  /** F1 game's best sector times from Session History (F1 2025); used for delta so reset is correct. */
  gameBestSector1Ms: number | null;
  gameBestSector2Ms: number | null;
  gameBestSector3Ms: number | null;
}

export interface UseUdpTelemetryResult {
  data: GameTelemetry | null;
  connected: boolean;
  listening: boolean;
  isRecordingHistory: boolean;
  localIp: string | null;
  error: string | null;
  lapHistory: LapRecord[];
  raceRecords: RaceRecord[];
  telemetryHistory: TelemetryHistoryPoint[];
  sessionInfo: SessionInfo | null;
  fuel: FuelInfo | null;
  fuelMetrics: FuelMetrics;
  carPosition: CarPosition;
  currentLapSectors: CurrentLapSectors;
  playerTeam: string | null;
  carSetup: CarSetupSnapshot | null;
  toggleRecordingHistory: () => void;
  clearHistory: () => Promise<void>;
  deleteRecordsForCircuit: (circuitName: string) => void;
  refreshLocalIp: () => Promise<void>;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  const sum = values.reduce((acc, value) => acc + value, 0);
  return sum / values.length;
}

function maxOrNull(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.max(...values);
}

function minOrNull(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.min(...values);
}

function estimateLapsRemaining(
  fuel: FuelInfo | null,
  burnPerLap: number | null
): number | null {
  if (!fuel || burnPerLap == null || burnPerLap <= 0) return null;
  return fuel.remaining / burnPerLap;
}

function computeLapSpeedMetrics(points: LapTelemetryPoint[]): {
  topSpeedKph: number | null;
  minCornerSpeedKph: number | null;
  topSpeedBySectorKph: SectorMetricTriplet;
  minCornerSpeedBySectorKph: SectorMetricTriplet;
} {
  const topSpeedBySectorKph: SectorMetricTriplet = {
    s1: null,
    s2: null,
    s3: null,
  };
  const minCornerSpeedBySectorKph: SectorMetricTriplet = {
    s1: null,
    s2: null,
    s3: null,
  };

  const movingPoints = points.filter(
    (p) => Number.isFinite(p.speed) && p.speed >= MIN_MOVING_SPEED_KPH
  );
  const cornerPredicate = (p: LapTelemetryPoint) =>
    p.brake >= CORNER_BRAKE_THRESHOLD || p.throttle <= CORNER_THROTTLE_THRESHOLD;
  const cornerPoints = movingPoints.filter(cornerPredicate);

  const sectors: Array<{ idx: 0 | 1 | 2; key: keyof SectorMetricTriplet }> = [
    { idx: 0, key: "s1" },
    { idx: 1, key: "s2" },
    { idx: 2, key: "s3" },
  ];

  sectors.forEach(({ idx, key }) => {
    const sectorMoving = movingPoints.filter((p) => p.sector === idx);
    const sectorCorner = sectorMoving.filter(cornerPredicate);
    const sectorMinSource = sectorCorner.length > 0 ? sectorCorner : sectorMoving;
    topSpeedBySectorKph[key] = maxOrNull(sectorMoving.map((p) => p.speed));
    minCornerSpeedBySectorKph[key] = minOrNull(
      sectorMinSource.map((p) => p.speed)
    );
  });

  const minCornerSource = cornerPoints.length > 0 ? cornerPoints : movingPoints;

  return {
    topSpeedKph: maxOrNull(movingPoints.map((p) => p.speed)),
    minCornerSpeedKph: minOrNull(minCornerSource.map((p) => p.speed)),
    topSpeedBySectorKph,
    minCornerSpeedBySectorKph,
  };
}

export function useUdpTelemetry(): UseUdpTelemetryResult {
  const [data, setData] = useState<GameTelemetry | null>(null);
  const [listening, setListening] = useState(false);
  const [connected, setConnected] = useState(false);
  const [isRecordingHistory, setIsRecordingHistory] = useState(true);
  const [localIp, setLocalIp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lapHistory, setLapHistory] = useState<LapRecord[]>([]);
  const [raceRecords, setRaceRecords] = useState<RaceRecord[]>([]);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryHistoryPoint[]>([]);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [fuel, setFuel] = useState<FuelInfo | null>(null);
  const [fuelMetrics, setFuelMetrics] = useState<FuelMetrics>({
    burnPerLap: null,
    lapsRemaining: null,
    sampleCount: 0,
  });
  const [carPosition, setCarPosition] = useState<CarPosition>({ progress: 0, sector: 0 });
  const [currentLapSectors, setCurrentLapSectors] = useState<CurrentLapSectors>({ sector1Ms: null, sector2Ms: null, sector3Ms: null, currentSectorTimeMs: 0, currentSector: 0, gameBestSector1Ms: null, gameBestSector2Ms: null, gameBestSector3Ms: null });
  const [playerTeam, setPlayerTeam] = useState<string | null>(null);
  const [carSetup, setCarSetup] = useState<CarSetupSnapshot | null>(null);
  const latestRef = useRef<GameTelemetry | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const historyTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastLapNumRef = useRef<number>(0);
  const lastLapSnapRef = useRef<LapDataSnapshot | null>(null);
  const lapHistoryRef = useRef<LapRecord[]>([]);
  const raceRecordsRef = useRef<RaceRecord[]>([]);
  const currentRaceRef = useRef<RaceRecord | null>(null);
  const telemetryHistoryRef = useRef<TelemetryHistoryPoint[]>([]);
  const currentLapTelemetryRef = useRef<LapTelemetryPoint[]>([]);
  const historyDirtyRef = useRef(false);
  const lastTelemetrySampleAtRef = useRef(0);
  const lapStartTimeRef = useRef<number>(0); // Track when a new lap started to skip stale data
  const lastRenderedTelemetryRef = useRef<GameTelemetry | null>(null);
  const latestFuelRef = useRef<FuelInfo | null>(null);
  const lastLapFuelRemainingRef = useRef<number | null>(null);
  const fuelBurnSamplesRef = useRef<number[]>([]);
  const trackLengthRef = useRef<number>(DEFAULT_TRACK_LENGTH_M);
  const isRecordingHistoryRef = useRef(true);
  const gameBestSectorsRef = useRef<{ gameBestSector1Ms: number | null; gameBestSector2Ms: number | null; gameBestSector3Ms: number | null }>({ gameBestSector1Ms: null, gameBestSector2Ms: null, gameBestSector3Ms: null });
  const sessionInfoRef = useRef<SessionInfo | null>(null);
  const playerTeamRef = useRef<string | null>(null);
  const carSetupRef = useRef<CarSetupSnapshot | null>(null);
  const lapJustResetRef = useRef(false);

  // Fetch local IP from NetInfo
  const refreshLocalIp = useCallback(async () => {
    const state = await NetInfo.fetch();
    const ip =
      state.details && "ipAddress" in state.details
        ? (state.details as { ipAddress?: string }).ipAddress ?? null
        : null;
    setLocalIp(ip);
  }, []);

  useEffect(() => {
    refreshLocalIp();
  }, [refreshLocalIp]);

  useEffect(() => {
    isRecordingHistoryRef.current = isRecordingHistory;
    if (!isRecordingHistory) {
      currentLapTelemetryRef.current = [];
    }
  }, [isRecordingHistory]);

  // Load persisted race records on mount (requires native rebuild for AsyncStorage)
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(RACE_RECORDS_KEY)
      .then((raw) => {
        if (cancelled || raw == null) return;
        try {
          const parsed = JSON.parse(raw) as RaceRecord[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            raceRecordsRef.current = parsed.slice(-MAX_RACE_RECORDS);
            setRaceRecords(raceRecordsRef.current);
          }
        } catch {
          // Ignore parse errors
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  // Persist race records whenever they change
  useEffect(() => {
    const persistableRecords = raceRecords.filter(
      (record) => record.laps.length > 0
    );
    if (persistableRecords.length === 0) {
      AsyncStorage.removeItem(RACE_RECORDS_KEY).catch(() => {});
      return;
    }
    AsyncStorage.setItem(
      RACE_RECORDS_KEY,
      JSON.stringify(persistableRecords)
    ).catch(() => {});
  }, [raceRecords]);

  const toggleRecordingHistory = useCallback(() => {
    setIsRecordingHistory((prev) => {
      const next = !prev;
      // Keep ref in sync immediately so tick/handleMessage see the new value without waiting for useEffect
      isRecordingHistoryRef.current = next;
      if (!next) {
        currentLapTelemetryRef.current = [];
      }
      return next;
    });
    // When turning recording back on, force a display sync so the live page re-renders with current data
    // (avoids having to tab away and back for updates to show again)
    if (isRecordingHistoryRef.current) {
      const latest = latestRef.current;
      if (latest) setData(latest);
      setTelemetryHistory([...telemetryHistoryRef.current]);
    }
  }, []);

  const clearHistory = useCallback(async () => {
    lapHistoryRef.current = [];
    raceRecordsRef.current = [];
    currentLapTelemetryRef.current = [];
    if (currentRaceRef.current) {
      currentRaceRef.current = {
        ...currentRaceRef.current,
        laps: [],
      };
    }
    setLapHistory([]);
    setRaceRecords([]);
    try {
      await AsyncStorage.removeItem(RACE_RECORDS_KEY);
    } catch {
      // Ignore storage clear errors
    }
  }, []);

  const deleteRecordsForCircuit = useCallback((circuitName: string) => {
    const next = raceRecordsRef.current.filter(
      (record) => record.circuit !== circuitName
    );
    raceRecordsRef.current = next;
    setRaceRecords(next);
    // Persistence is handled by useEffect when raceRecords changes
  }, []);

  // Single socket for app lifetime; empty deps so we don't re-run on re-renders (was causing socket churn).
  useEffect(() => {
    setError(null);
    const socket = dgram.createSocket({ type: "udp4" });
    const updateFuelMetrics = (fuelSnapshot: FuelInfo | null) => {
      const burnPerLap = average(fuelBurnSamplesRef.current);
      setFuelMetrics({
        burnPerLap,
        lapsRemaining: estimateLapsRemaining(fuelSnapshot, burnPerLap),
        sampleCount: fuelBurnSamplesRef.current.length,
      });
    };

    const handleMessage = (msg: Buffer) => {
      try {
        const playerCarIndex = msg.length >= 28 ? msg[27] : 0;
        const sessionHistory = parseSessionHistoryPacket(msg, playerCarIndex);
        if (sessionHistory) {
          gameBestSectorsRef.current = {
            gameBestSector1Ms: sessionHistory.bestSector1Ms,
            gameBestSector2Ms: sessionHistory.bestSector2Ms,
            gameBestSector3Ms: sessionHistory.bestSector3Ms,
          };
        }
        const telemetry = parseCarTelemetryPacket(msg);
        if (telemetry) {
          latestRef.current = telemetry;
          setConnected(true);
        }
        const sessionSnap = parseSessionPacket(msg);
        if (sessionSnap) {
          sessionInfoRef.current = {
            weather: sessionSnap.weatherName,
            airTempC: sessionSnap.airTempC,
            trackTempC: sessionSnap.trackTempC,
            totalLaps: sessionSnap.totalLaps,
          };
          if (sessionSnap.trackLengthM > 0) {
            trackLengthRef.current = sessionSnap.trackLengthM;
          }
          if (sessionSnap.sessionUID !== currentRaceRef.current?.id) {
            if (currentRaceRef.current) {
              raceRecordsRef.current = [...raceRecordsRef.current, currentRaceRef.current].slice(
                -MAX_RACE_RECORDS
              );
            }
            currentRaceRef.current = {
              id: sessionSnap.sessionUID,
              circuit: sessionSnap.circuitName,
              sessionType: sessionSnap.sessionTypeName,
              date: new Date().toISOString(),
              laps: [],
            };
            lapHistoryRef.current = [];
            lastLapNumRef.current = 0;
            currentLapTelemetryRef.current = [];
            telemetryHistoryRef.current = [];
            historyDirtyRef.current = true;
            lastTelemetrySampleAtRef.current = 0;
            lastLapFuelRemainingRef.current = null;
            fuelBurnSamplesRef.current = [];
            setLapHistory([]);
            setTelemetryHistory([]);
            setSessionInfo(sessionInfoRef.current);
            updateFuelMetrics(latestFuelRef.current);
            setRaceRecords([...raceRecordsRef.current, currentRaceRef.current]);
          }
        }
        const participants = parseParticipantsPacket(msg);
        if (participants) {
          playerTeamRef.current = participants.teamName;
        }
        const setup = parseCarSetupPacket(msg);
        if (setup) {
          carSetupRef.current = setup;
        }
        const carStatus = parseCarStatusPacket(msg);
        if (carStatus) {
          latestFuelRef.current = {
            remaining: carStatus.fuelRemaining,
            capacity: carStatus.fuelCapacity,
          };
        }
        const lapSnap = parseLapDataPacket(msg);
        if (lapSnap) {
          const prevLap = lastLapNumRef.current;
          const prevSnap = lastLapSnapRef.current;
          lastLapSnapRef.current = lapSnap;
          lastLapNumRef.current = lapSnap.currentLapNum;
          
          // Detect new lap start (crossing start/finish line)
          const isNewLapStart = lapSnap.currentLapNum !== prevLap && lapSnap.currentLapNum > prevLap;
          
          // Detect lap restart/flashback (lap distance went backwards significantly or lap time reset)
          const prevLapDistance = prevSnap?.lapDistance ?? 0;
          const prevLapTimeMs = prevSnap?.currentLapTimeMs ?? 0;
          const isLapRestart = (
            // Lap distance went backwards by more than 100m (flashback/restart)
            (prevLapDistance > 100 && lapSnap.lapDistance < prevLapDistance - 100) ||
            // Lap time reset significantly (more than 1 second backwards)
            (prevLapTimeMs > 1000 && lapSnap.currentLapTimeMs < prevLapTimeMs - 1000)
          );
          
          // Calculate running sector time based on current sector
          const currentLapTimeMs = lapSnap.currentLapTimeMs;
          let currentSectorTimeMs = currentLapTimeMs;
          if (lapSnap.sector === 1 && lapSnap.sector1Ms != null && lapSnap.sector1Ms > 0) {
            // In S2: subtract S1 time
            currentSectorTimeMs = currentLapTimeMs - lapSnap.sector1Ms;
          } else if (lapSnap.sector === 2 && lapSnap.sector1Ms != null && lapSnap.sector2Ms != null && lapSnap.sector1Ms > 0 && lapSnap.sector2Ms > 0) {
            // In S3: subtract S1 + S2 time
            currentSectorTimeMs = currentLapTimeMs - lapSnap.sector1Ms - lapSnap.sector2Ms;
          }
          
          // Reset sectors when a new lap starts OR when lap is restarted (tick will flush)
          if (isNewLapStart || isLapRestart) {
            lapJustResetRef.current = true;
          }
          
          // Process completed lap when recording (BEFORE clearing the buffer)
          if (
            isRecordingHistoryRef.current &&
            lapSnap.lastLapTimeMs > 0 &&
            isNewLapStart
          ) {
            const completedLapNum = lapSnap.currentLapNum - 1;
            const s1 = prevSnap?.sector1Ms ?? lapSnap.sector1Ms ?? 0;
            const s2 = prevSnap?.sector2Ms ?? lapSnap.sector2Ms ?? 0;
            const sector1Ms = prevSnap?.sector1Ms ?? lapSnap.sector1Ms ?? null;
            const sector2Ms = prevSnap?.sector2Ms ?? lapSnap.sector2Ms ?? null;
            const sector3Ms =
              sector1Ms != null && sector2Ms != null
                ? Math.max(0, lapSnap.lastLapTimeMs - s1 - s2)
                : null;
            // Copy telemetry BEFORE clearing the buffer
            const lapTelemetry: LapTelemetryPoint[] =
              currentLapTelemetryRef.current.map((p) => ({ ...p }));
            const speedMetrics = computeLapSpeedMetrics(lapTelemetry);
            const fuelRemainingL = latestFuelRef.current?.remaining;
            let fuelUsedL: number | null = null;
            if (fuelRemainingL != null && Number.isFinite(fuelRemainingL)) {
              const previousFuelRemaining = lastLapFuelRemainingRef.current;
              if (
                previousFuelRemaining != null &&
                Number.isFinite(previousFuelRemaining)
              ) {
                const delta = previousFuelRemaining - fuelRemainingL;
                if (delta >= MIN_VALID_FUEL_BURN_L && delta <= MAX_VALID_FUEL_BURN_L) {
                  fuelUsedL = delta;
                  fuelBurnSamplesRef.current = [
                    ...fuelBurnSamplesRef.current,
                    delta,
                  ].slice(-FUEL_BURN_SAMPLE_WINDOW);
                } else if (delta >= 0 && delta < MIN_VALID_FUEL_BURN_L) {
                  fuelUsedL = 0;
                }
              }
              lastLapFuelRemainingRef.current = fuelRemainingL;
            }
            updateFuelMetrics(latestFuelRef.current);
            const record: LapRecord = {
              lapNum: completedLapNum,
              lapTimeMs: lapSnap.lastLapTimeMs,
              sector1Ms,
              sector2Ms,
              sector3Ms,
              telemetry: lapTelemetry.length >= 2 ? lapTelemetry : undefined,
              fuelRemainingL,
              fuelUsedL,
              topSpeedKph: speedMetrics.topSpeedKph,
              minCornerSpeedKph: speedMetrics.minCornerSpeedKph,
              topSpeedBySectorKph: speedMetrics.topSpeedBySectorKph,
              minCornerSpeedBySectorKph: speedMetrics.minCornerSpeedBySectorKph,
            };
            currentLapTelemetryRef.current = [];
            lapStartTimeRef.current = Date.now(); // Mark lap start time
            lapHistoryRef.current = [...lapHistoryRef.current, record].slice(
              -MAX_LAP_HISTORY
            );
            setLapHistory(lapHistoryRef.current);
            if (!currentRaceRef.current) {
              currentRaceRef.current = {
                id: `unknown-${Date.now()}`,
                circuit: "Unknown",
                sessionType: "Unknown",
                date: new Date().toISOString(),
                laps: [],
              };
            }
            currentRaceRef.current = {
              ...currentRaceRef.current,
              laps: [...currentRaceRef.current.laps, record].slice(-MAX_LAP_HISTORY),
            };
            setRaceRecords([...raceRecordsRef.current, currentRaceRef.current]);
          } else if (isNewLapStart) {
            // New lap started but either not recording or no valid lap time (e.g., first lap)
            // Clear the buffer to start fresh for the new lap
            currentLapTelemetryRef.current = [];
            lapStartTimeRef.current = Date.now(); // Mark lap start time
          }
        }
      } catch {
        // Ignore parse errors
      }
    };

    const handleError = (err: Error) => {
      // Provide more helpful error messages
      let errorMessage = err.message;
      if (err.message.includes("bind")) {
        errorMessage = "UDP socket error. Make sure you're running a development build (not Expo Go) and port 20777 is available.";
      }
      setError(errorMessage);
      setListening(false);
    };

    const handleListening = () => {
      setError(null); // Clear any previous errors
      setListening(true);
      refreshLocalIp();
    };

    socket.on("message", handleMessage);
    socket.on("error", handleError);
    socket.once("listening", handleListening);

    // Wrap bind in try-catch for better error handling
    try {
      socket.bind(UDP_PORT, "0.0.0.0");
    } catch (bindError) {
      const err = bindError as Error;
      setError(`Failed to start UDP listener: ${err.message}. Ensure you're using a development build.`);
      setListening(false);
    }

    tickRef.current = setInterval(() => {
      const latest = latestRef.current;
      if (latest !== lastRenderedTelemetryRef.current) {
        lastRenderedTelemetryRef.current = latest;
        setData(latest);
      }

      const snap = lastLapSnapRef.current;
      if (snap) {
        let progress: number;
        if (snap.lapDistance > 0 && Number.isFinite(snap.lapDistance)) {
          progress = Math.min(1, snap.lapDistance / trackLengthRef.current);
        } else {
          progress = (snap.sector + 0.5) / 3;
        }
        setCarPosition((prev) => {
          if (
            prev.sector === snap.sector &&
            Math.abs(prev.progress - progress) < CAR_POSITION_MIN_DELTA
          ) {
            return prev;
          }
          return { progress, sector: snap.sector };
        });

        // Flush currentLapSectors from refs (single update per tick instead of every packet)
        const gameBest = gameBestSectorsRef.current;
        if (lapJustResetRef.current) {
          lapJustResetRef.current = false;
          setCurrentLapSectors({
            sector1Ms: null,
            sector2Ms: null,
            sector3Ms: null,
            currentSectorTimeMs: 0,
            currentSector: 0,
            gameBestSector1Ms: gameBest.gameBestSector1Ms,
            gameBestSector2Ms: gameBest.gameBestSector2Ms,
            gameBestSector3Ms: gameBest.gameBestSector3Ms,
          });
        } else {
          const currentLapTimeMs = snap.currentLapTimeMs;
          let currentSectorTimeMs = currentLapTimeMs;
          if (snap.sector === 1 && snap.sector1Ms != null && snap.sector1Ms > 0) {
            currentSectorTimeMs = currentLapTimeMs - snap.sector1Ms;
          } else if (snap.sector === 2 && snap.sector1Ms != null && snap.sector2Ms != null && snap.sector1Ms > 0 && snap.sector2Ms > 0) {
            currentSectorTimeMs = currentLapTimeMs - snap.sector1Ms - snap.sector2Ms;
          }
          setCurrentLapSectors({
            sector1Ms: snap.sector1Ms != null && snap.sector1Ms > 0 ? snap.sector1Ms : null,
            sector2Ms: snap.sector2Ms != null && snap.sector2Ms > 0 ? snap.sector2Ms : null,
            sector3Ms: null,
            currentSectorTimeMs: Math.max(0, currentSectorTimeMs),
            currentSector: snap.sector,
            gameBestSector1Ms: gameBest.gameBestSector1Ms,
            gameBestSector2Ms: gameBest.gameBestSector2Ms,
            gameBestSector3Ms: gameBest.gameBestSector3Ms,
          });
        }
      }

      setSessionInfo(sessionInfoRef.current);
      setFuel(latestFuelRef.current);
      setFuelMetrics({
        burnPerLap: average(fuelBurnSamplesRef.current),
        lapsRemaining: estimateLapsRemaining(latestFuelRef.current, average(fuelBurnSamplesRef.current)),
        sampleCount: fuelBurnSamplesRef.current.length,
      });
      setPlayerTeam(playerTeamRef.current);
      setCarSetup(carSetupRef.current);

      if (latest) {
        const now = Date.now();
        if (now - lastTelemetrySampleAtRef.current >= TELEMETRY_SAMPLE_MS) {
          const current = latestRef.current;
          if (!current) return;
          lastTelemetrySampleAtRef.current = now;
          const historyPoint: TelemetryHistoryPoint = {
            t: now,
            speed: current.speed,
            brake: current.brake,
            throttle: current.throttle,
          };
          const history = telemetryHistoryRef.current;
          history.push(historyPoint);
          if (history.length > TELEMETRY_HISTORY_MAX) {
            history.splice(0, history.length - TELEMETRY_HISTORY_MAX);
          }
          if (isRecordingHistoryRef.current) {
            const LAP_START_GRACE_MS = 100;
            const timeSinceLapStart = now - lapStartTimeRef.current;
            const inGracePeriod = lapStartTimeRef.current > 0 && timeSinceLapStart < LAP_START_GRACE_MS;
            if (!inGracePeriod) {
              const lapPoint: LapTelemetryPoint = {
                ...historyPoint,
                sector: snap?.sector,
              };
              const lapTelemetry = currentLapTelemetryRef.current;
              lapTelemetry.push(lapPoint);
              if (lapTelemetry.length > CURRENT_LAP_TELEMETRY_MAX) {
                lapTelemetry.splice(0, lapTelemetry.length - CURRENT_LAP_TELEMETRY_MAX);
              }
            }
          }
          historyDirtyRef.current = true;
        }
      }
    }, UI_UPDATE_MS);

    historyTickRef.current = setInterval(() => {
      if (!historyDirtyRef.current) return;
      historyDirtyRef.current = false;
      setTelemetryHistory([...telemetryHistoryRef.current]);
    }, TELEMETRY_HISTORY_UPDATE_MS);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (historyTickRef.current) clearInterval(historyTickRef.current);
      tickRef.current = null;
      historyTickRef.current = null;
      latestRef.current = null;
      lastRenderedTelemetryRef.current = null;
      latestFuelRef.current = null;
      lastLapFuelRemainingRef.current = null;
      fuelBurnSamplesRef.current = [];
      telemetryHistoryRef.current = [];
      currentLapTelemetryRef.current = [];
      historyDirtyRef.current = false;
      lastTelemetrySampleAtRef.current = 0;
      lapStartTimeRef.current = 0;
      lastLapSnapRef.current = null;
      socket.removeAllListeners();
      try {
        socket.close();
      } catch {
        // Ignore close errors
      }
      setListening(false);
      setConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentionally run once on mount; refreshLocalIp called in handleListening.
  }, []);

  return {
    data,
    connected,
    listening,
    isRecordingHistory,
    localIp,
    error,
    lapHistory,
    raceRecords,
    telemetryHistory,
    sessionInfo,
    fuel,
    fuelMetrics,
    carPosition,
    currentLapSectors,
    playerTeam,
    carSetup,
    toggleRecordingHistory,
    clearHistory,
    deleteRecordsForCircuit,
    refreshLocalIp,
  };
}
