import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Switch,
  Alert,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RaceRecordsList } from "../components/RaceRecordsList";
import { LapCard } from "../components/LapCard";
import { RaceRecordDetailScreen } from "./RaceRecordDetailScreen";
import { TelemetryLineChart } from "../components/TelemetryLineChart";
import { CircuitTrackMap } from "../components/CircuitTrackMap";
import type { GameTelemetry, LapRecord, RaceRecord, SectorMetricTriplet } from "../lib/types";
import type { TelemetryHistoryPoint, SessionInfo, FuelInfo, FuelMetrics, CarPosition, CurrentLapSectors } from "../hooks/useUdpTelemetry";
import type { CarSetupSnapshot } from "../lib/parser";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DASHBOARD_VISIBILITY_KEY = "f1_mobile_dashboard_visibility_v1";

// F1 Team Colors (2024 season)
const TEAM_COLORS: Record<string, string> = {
  "Mercedes": "#27F4D2",
  "Ferrari": "#E8002D",
  "Red Bull Racing": "#3671C6",
  "Williams": "#64C4FF",
  "Aston Martin": "#229971",
  "Alpine": "#FF87BC",
  "RB": "#6692FF",
  "Haas": "#B6BABD",
  "McLaren": "#FF8000",
  "Sauber": "#52E252",
  "F1 Generic": "#E10600",
  "F1 Custom Team": "#E10600",
  "Konnersport": "#E10600",
  "Unknown": "#E10600",
};

function getTeamColor(teamName: string | null): string {
  if (!teamName) return "#E10600"; // Default F1 Red
  return TEAM_COLORS[teamName] ?? "#E10600";
}

type DashboardSectionKey = "showSessionStrip" | "showLiveGauges" | "showSpeedChart" | "showBrakeChart" | "showThrottleChart" | "showLapProfile" | "showLapHistory" | "showCircuitMap" | "showRaceRecords";
type DashboardVisibility = Record<DashboardSectionKey, boolean>;

const DEFAULT_DASHBOARD_VISIBILITY: DashboardVisibility = {
  showSessionStrip: true, showLiveGauges: true, showSpeedChart: true, showBrakeChart: true,
  showThrottleChart: true, showLapProfile: true, showLapHistory: true, showCircuitMap: true, showRaceRecords: true,
};

const DASHBOARD_SECTION_OPTIONS: Array<{ key: DashboardSectionKey; label: string; hint: string }> = [
  { key: "showSessionStrip", label: "Session strip", hint: "Session, weather, and fuel summary" },
  { key: "showLiveGauges", label: "Live gauges", hint: "Speed, RPM, pedals, gear, DRS" },
  { key: "showSpeedChart", label: "Speed chart", hint: "Live speed trend" },
  { key: "showBrakeChart", label: "Brake chart", hint: "Live brake trend" },
  { key: "showThrottleChart", label: "Throttle chart", hint: "Live throttle trend" },
  { key: "showLapProfile", label: "Lap speed profile", hint: "Top/min corner and sector speed" },
  { key: "showLapHistory", label: "Lap history table", hint: "Lap times, sector deltas, top/min speed" },
  { key: "showCircuitMap", label: "Circuit map", hint: "Live car position on track" },
  { key: "showRaceRecords", label: "Race records", hint: "Historical sessions and lap telemetry" },
];

function toDashboardVisibility(raw: unknown): DashboardVisibility {
  const out: DashboardVisibility = { ...DEFAULT_DASHBOARD_VISIBILITY };
  if (raw == null || typeof raw !== "object") return out;
  const record = raw as Partial<Record<DashboardSectionKey, unknown>>;
  (Object.keys(DEFAULT_DASHBOARD_VISIBILITY) as DashboardSectionKey[]).forEach((key) => {
    if (typeof record[key] === "boolean") out[key] = record[key];
  });
  return out;
}

function minLapMetric(laps: LapRecord[], select: (lap: LapRecord) => number | null | undefined): number | null {
  let best: number | null = null;
  laps.forEach((lap) => { const value = select(lap); if (value != null && value > 0 && Number.isFinite(value) && (best == null || value < best)) best = value; });
  return best;
}

function formatLapTime(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms) || ms <= 0) return "--:--.---";
  const totalSeconds = ms / 1000;
  return `${Math.floor(totalSeconds / 60)}:${(totalSeconds % 60).toFixed(3).padStart(6, "0")}`;
}

function formatSpeedKph(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value) ? "—" : `${Math.round(value)} km/h`;
}

function formatSectorTriplet(metrics: SectorMetricTriplet | undefined): string {
  if (!metrics) return "S1 — · S2 — · S3 —";
  return `S1 ${formatSpeedKph(metrics.s1)} · S2 ${formatSpeedKph(metrics.s2)} · S3 ${formatSpeedKph(metrics.s3)}`;
}

// Speed Display Component (no arc, simple display)
function SpeedDisplay({ speed, rpm, gear, drs, throttle, brake, teamColor }: { speed: number; rpm: number; gear: number; drs: number; throttle: number; brake: number; teamColor: string }) {
  const gearText = gear === 0 ? "N" : gear === -1 ? "R" : String(gear);
  const isDrsOpen = drs >= 10;

  return (
    <View style={styles.speedDisplayContainer}>
      {/* Throttle bar on left */}
      <View style={styles.sideBarContainer}>
        <View style={styles.sideBarTrack}>
          <View style={[styles.sideBarFill, { height: `${throttle}%`, backgroundColor: teamColor }]} />
        </View>
        <Text style={styles.sideBarLabel}>THR</Text>
        <Text style={styles.sideBarValue}>{Math.round(throttle)}%</Text>
      </View>

      {/* Center speed display */}
      <View style={styles.speedCenterArea}>
        <Text style={[styles.speedValue, { color: teamColor }]}>{Math.round(speed)}</Text>
        <Text style={styles.speedUnit}>KM/H</Text>
        
        {/* RPM row with gear on left, DRS on right */}
        <View style={styles.rpmRow}>
          <View style={styles.gearSmall}>
            <Text style={styles.gearSmallText}>{gearText}</Text>
          </View>
          <View style={styles.rpmCenter}>
            <Text style={[styles.rpmValue, { color: teamColor }]}>{Math.round(rpm)}</Text>
            <Text style={styles.rpmUnit}>RPM</Text>
          </View>
          <View style={[styles.drsSmall, isDrsOpen && styles.drsSmallActive]}>
            <Text style={[styles.drsSmallText, isDrsOpen && styles.drsSmallTextActive]}>DRS</Text>
          </View>
        </View>
      </View>

      {/* Brake bar on right */}
      <View style={styles.sideBarContainer}>
        <View style={styles.sideBarTrack}>
          <View style={[styles.sideBarFill, styles.brakeFill, { height: `${brake}%` }]} />
        </View>
        <Text style={styles.sideBarLabel}>BRK</Text>
        <Text style={styles.sideBarValue}>{Math.round(brake)}%</Text>
      </View>
    </View>
  );
}


/** Live sector display: sector times and delta. Prefer F1 game best (Session History); fall back to recorded best so delta always shows. */
function SectorDisplay({ sector1Ms, sector2Ms, sector3Ms, gameBestS1Ms, gameBestS2Ms, gameBestS3Ms, fallbackBestS1Ms, fallbackBestS2Ms, fallbackBestS3Ms, currentSector, teamColor }: {
  sector1Ms: number | null; sector2Ms: number | null; sector3Ms: number | null;
  gameBestS1Ms: number | null; gameBestS2Ms: number | null; gameBestS3Ms: number | null;
  fallbackBestS1Ms?: number | null; fallbackBestS2Ms?: number | null; fallbackBestS3Ms?: number | null;
  currentSector: number; // 0 = S1, 1 = S2, 2 = S3
  teamColor: string;
}) {
  const formatSector = (ms: number | null) => ms == null || ms <= 0 ? "---.---" : (ms / 1000).toFixed(3);

  const refS1 = gameBestS1Ms != null && gameBestS1Ms > 0 ? gameBestS1Ms : fallbackBestS1Ms ?? null;
  const refS2 = gameBestS2Ms != null && gameBestS2Ms > 0 ? gameBestS2Ms : fallbackBestS2Ms ?? null;
  const refS3 = gameBestS3Ms != null && gameBestS3Ms > 0 ? gameBestS3Ms : fallbackBestS3Ms ?? null;

  const formatDelta = (current: number | null, reference: number | null): string => {
    if (current == null || current <= 0 || reference == null || reference <= 0) return "—";
    const deltaSec = (current - reference) / 1000;
    if (Math.abs(deltaSec) < 0.0005) return "0.000";
    if (deltaSec < 0) return deltaSec.toFixed(3);
    return `+${deltaSec.toFixed(3)}`;
  };

  const getSectorColor = (sectorIndex: number, current: number | null, reference: number | null) => {
    if (currentSector === sectorIndex && (current == null || current <= 0)) return teamColor;
    if (current == null || current <= 0) return "#d1d1d6";
    if (reference == null || reference <= 0) return "#007AFF";
    if (current <= reference) return "#34c759";
    if (current <= reference * 1.01) return "#ff9500";
    return "#ff3b30";
  };

  const getSectorBarStyle = (sectorIndex: number, current: number | null, reference: number | null) => {
    const color = getSectorColor(sectorIndex, current, reference);
    const isActive = currentSector === sectorIndex && (current == null || current <= 0);
    return {
      backgroundColor: color,
      opacity: isActive ? 1 : (current == null || current <= 0) ? 0.3 : 1,
    };
  };

  return (
    <View style={styles.sectorContainer}>
      <View style={styles.sectorItem}>
        <Text style={[styles.sectorLabel, currentSector === 0 && { color: teamColor }]}>S1</Text>
        <View style={[styles.sectorBar, getSectorBarStyle(0, sector1Ms, refS1)]} />
        <Text style={[styles.sectorTime, { color: getSectorColor(0, sector1Ms, refS1) }]}>{formatSector(sector1Ms)}</Text>
        <Text style={[styles.sectorDelta, { color: getSectorColor(0, sector1Ms, refS1) }]}>{formatDelta(sector1Ms, refS1)}</Text>
      </View>
      <View style={styles.sectorItem}>
        <Text style={[styles.sectorLabel, currentSector === 1 && { color: teamColor }]}>S2</Text>
        <View style={[styles.sectorBar, getSectorBarStyle(1, sector2Ms, refS2)]} />
        <Text style={[styles.sectorTime, { color: getSectorColor(1, sector2Ms, refS2) }]}>{formatSector(sector2Ms)}</Text>
        <Text style={[styles.sectorDelta, { color: getSectorColor(1, sector2Ms, refS2) }]}>{formatDelta(sector2Ms, refS2)}</Text>
      </View>
      <View style={styles.sectorItem}>
        <Text style={[styles.sectorLabel, currentSector === 2 && { color: teamColor }]}>S3</Text>
        <View style={[styles.sectorBar, getSectorBarStyle(2, sector3Ms, refS3)]} />
        <Text style={[styles.sectorTime, { color: getSectorColor(2, sector3Ms, refS3) }]}>{formatSector(sector3Ms)}</Text>
        <Text style={[styles.sectorDelta, { color: getSectorColor(2, sector3Ms, refS3) }]}>{formatDelta(sector3Ms, refS3)}</Text>
      </View>
    </View>
  );
}

function BestSectorsWidget({ bestS1Ms, bestS2Ms, bestS3Ms }: { bestS1Ms: number | null; bestS2Ms: number | null; bestS3Ms: number | null }) {
  const formatSector = (ms: number | null) => ms == null || ms <= 0 ? "---.---" : (ms / 1000).toFixed(3);
  return (
    <View style={styles.bestSectorsWidget}>
      <Text style={styles.bestSectorsTitle}>BEST SECTORS</Text>
      <View style={styles.bestSectorsList}>
        <View style={styles.bestSectorRow}><Text style={styles.bestSectorLabel}>S1</Text><Text style={styles.bestSectorValue}>{formatSector(bestS1Ms)}</Text></View>
        <View style={styles.bestSectorRow}><Text style={styles.bestSectorLabel}>S2</Text><Text style={styles.bestSectorValue}>{formatSector(bestS2Ms)}</Text></View>
        <View style={[styles.bestSectorRow, styles.bestSectorRowLast]}><Text style={styles.bestSectorLabel}>S3</Text><Text style={styles.bestSectorValue}>{formatSector(bestS3Ms)}</Text></View>
      </View>
    </View>
  );
}

function LapTimesCard({ currentLapTime, lastLapTime, bestLapTime, lapCount }: { currentLapTime: string; lastLapTime: number | null; bestLapTime: number | null; lapCount: number }) {
  const isPersonalBest = lastLapTime != null && bestLapTime != null && lastLapTime <= bestLapTime;
  return (
    <View style={styles.lapTimesCard}>
      <View style={styles.currentLapRow}><Text style={styles.currentLapLabel}>LAP {lapCount + 1}</Text><Text style={styles.currentLapTime}>{currentLapTime}</Text></View>
      <View style={styles.lapTimeDivider} />
      <View style={styles.lapTimeRow}><Text style={styles.lapTimeLabel}>LAST</Text><Text style={[styles.lapTimeValue, isPersonalBest && styles.lapTimeBest]}>{formatLapTime(lastLapTime)}</Text></View>
      <View style={styles.lapTimeRow}><Text style={styles.lapTimeLabel}>BEST</Text><Text style={[styles.lapTimeValue, styles.lapTimeBest]}>{formatLapTime(bestLapTime)}</Text></View>
    </View>
  );
}

function getTyreCompoundColor(compound: string) {
  switch (compound.toUpperCase()) {
    case "S": return "#FF4444";
    case "M": return "#FFD700";
    case "H": return "#FFFFFF";
    case "I": return "#00FF88";
    case "W": return "#00D4FF";
    default: return "#6B7280";
  }
}
function getTyreCompoundName(compound: string) {
  switch (compound.toUpperCase()) {
    case "S": return "Soft";
    case "M": return "Medium";
    case "H": return "Hard";
    case "I": return "Inter";
    case "W": return "Wet";
    default: return compound;
  }
}

/** Tyres as a single session row with small icon, matching TRACK / SESSION / etc. */
function TyreRow({ compound = "S", age = 0 }: { compound?: string; age?: number }) {
  const color = getTyreCompoundColor(compound);
  const name = getTyreCompoundName(compound);
  return (
    <View style={styles.sessionRow}>
      <Text style={styles.sessionLabel}>TYRES</Text>
      <View style={styles.sessionTyreValue}>
        <View style={[styles.tyreIconSmall, { borderColor: color }]}>
          <Text style={[styles.tyreIconText, { color }]}>{compound}</Text>
        </View>
        <Text style={styles.sessionValue}>{name} · {age}</Text>
      </View>
    </View>
  );
}

function LapHistorySection({ lapHistory }: { lapHistory: LapRecord[] }) {
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const bestLapMs = minLapMetric(lapHistory, (lap) => lap.lapTimeMs);
  const bestS1Ms = minLapMetric(lapHistory, (lap) => lap.sector1Ms);
  const bestS2Ms = minLapMetric(lapHistory, (lap) => lap.sector2Ms);
  const bestS3Ms = minLapMetric(lapHistory, (lap) => lap.sector3Ms);
  if (lapHistory.length === 0) return null;
  return (
    <View style={styles.historySection}>
      <TouchableOpacity style={styles.historyHeader} onPress={() => setHistoryExpanded((v) => !v)} activeOpacity={0.7}>
        <View style={styles.historyHeaderLeft}><View style={styles.historyIcon}><Text style={styles.historyIconText}>≡</Text></View><Text style={styles.historyTitle}>Lap History</Text></View>
        <View style={styles.historyHeaderRight}><Text style={styles.historyCount}>{lapHistory.length}</Text><Text style={styles.historyToggle}>{historyExpanded ? "▼" : "▶"}</Text></View>
      </TouchableOpacity>
      {historyExpanded && <ScrollView style={styles.historyScroll} contentContainerStyle={styles.historyContent} showsVerticalScrollIndicator={false}>{[...lapHistory].reverse().map((lap, index) => <LapCard key={`lap-${index}`} lap={lap} bestLapMs={bestLapMs} bestS1Ms={bestS1Ms} bestS2Ms={bestS2Ms} bestS3Ms={bestS3Ms} />)}</ScrollView>}
    </View>
  );
}

interface GameTelemetryScreenProps {
  data: GameTelemetry | null; connected: boolean; localIp: string | null; lapHistory: LapRecord[]; raceRecords: RaceRecord[];
  telemetryHistory: TelemetryHistoryPoint[]; sessionInfo: SessionInfo | null; fuel: FuelInfo | null; fuelMetrics: FuelMetrics;
  carPosition: CarPosition; currentLapSectors: CurrentLapSectors; playerTeam: string | null; carSetup: CarSetupSnapshot | null; isRecordingHistory: boolean;
  onToggleRecording: () => void; onClearHistory: () => Promise<void> | void; onBackToSetup?: () => void;
}

export function GameTelemetryScreen({ data, connected, localIp, lapHistory, raceRecords, telemetryHistory, sessionInfo, fuel, fuelMetrics, carPosition, currentLapSectors, playerTeam, carSetup, isRecordingHistory, onToggleRecording, onClearHistory }: GameTelemetryScreenProps) {
  const [editDashboardOpen, setEditDashboardOpen] = useState(false);
  const [carSetupModalOpen, setCarSetupModalOpen] = useState(false);
  const [visibilityLoaded, setVisibilityLoaded] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [selectedRaceRecord, setSelectedRaceRecord] = useState<RaceRecord | null>(null);
  const [dashboardVisibility, setDashboardVisibility] = useState<DashboardVisibility>(DEFAULT_DASHBOARD_VISIBILITY);

  useEffect(() => { let cancelled = false; AsyncStorage.getItem(DASHBOARD_VISIBILITY_KEY).then((raw) => { if (cancelled || raw == null) return; try { setDashboardVisibility(toDashboardVisibility(JSON.parse(raw))); } catch {} }).finally(() => { if (!cancelled) setVisibilityLoaded(true); }); return () => { cancelled = true; }; }, []);
  useEffect(() => { if (!visibilityLoaded) return; AsyncStorage.setItem(DASHBOARD_VISIBILITY_KEY, JSON.stringify(dashboardVisibility)).catch(() => {}); }, [dashboardVisibility, visibilityLoaded]);

  const latestLap = lapHistory.length > 0 ? lapHistory[lapHistory.length - 1] : null;
  const latestSessionRecord = raceRecords.length > 0 ? raceRecords[raceRecords.length - 1] : null;
  const raceRecordsWithLaps = raceRecords.filter((record) => record.laps.length > 0);
  const hasStoredHistory = lapHistory.length > 0 || raceRecordsWithLaps.length > 0;
  const bestLapMs = minLapMetric(lapHistory, (lap) => lap.lapTimeMs);
  const bestS1Ms = minLapMetric(lapHistory, (lap) => lap.sector1Ms);
  const bestS2Ms = minLapMetric(lapHistory, (lap) => lap.sector2Ms);
  const bestS3Ms = minLapMetric(lapHistory, (lap) => lap.sector3Ms);
  const hasAnyVisibleSection = DASHBOARD_SECTION_OPTIONS.some(({ key }) => dashboardVisibility[key]);

  const setSectionVisible = (key: DashboardSectionKey, value: boolean) => setDashboardVisibility((prev) => ({ ...prev, [key]: value }));
  const resetDashboardVisibility = () => setDashboardVisibility({ ...DEFAULT_DASHBOARD_VISIBILITY });
  const handleClearHistory = () => { if (clearingHistory || !hasStoredHistory) return; Alert.alert("Delete historical records?", "This will remove all saved laps and race sessions from this device.", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => { setClearingHistory(true); Promise.resolve(onClearHistory()).finally(() => setClearingHistory(false)); } }]); };

  if (!connected || !data) {
    return (
      <View style={styles.container}>
        <View style={styles.waiting}><View style={styles.waitingIcon}><Text style={styles.waitingIconText}>📡</Text></View><Text style={styles.waitingTitle}>Waiting for telemetry</Text><Text style={styles.waitingText}>Configure your game to send telemetry to</Text><Text style={styles.waitingIp}>{localIp || "this device"}</Text><Text style={styles.waitingPort}>Port: 20777</Text></View>
      </View>
    );
  }

  if (selectedRaceRecord != null) return <RaceRecordDetailScreen record={selectedRaceRecord} onBack={() => setSelectedRaceRecord(null)} />;

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.containerContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBar}>
          <View style={styles.headerLeft}><View style={styles.driverBadge}><View style={[styles.positionBadge, { backgroundColor: getTeamColor(playerTeam) }]}><Text style={styles.positionText}>P1</Text></View><Text style={styles.driverName}>{playerTeam || "DRIVER"}</Text></View></View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={onToggleRecording} style={[styles.recordBtn, isRecordingHistory && styles.recordBtnActive]} activeOpacity={0.7}><View style={[styles.recordDot, isRecordingHistory && styles.recordDotActive]} /></TouchableOpacity>
            <TouchableOpacity onPress={() => setEditDashboardOpen(true)} style={styles.settingsBtn} activeOpacity={0.7}><Text style={styles.settingsBtnText}>⚙</Text></TouchableOpacity>
          </View>
        </View>

        {!hasAnyVisibleSection && <View style={styles.emptyStateCard}><Text style={styles.emptyStateTitle}>Dashboard is hidden</Text><Text style={styles.emptyStateText}>Turn sections back on in Edit dashboard.</Text><TouchableOpacity style={styles.emptyStateBtn} onPress={() => setEditDashboardOpen(true)} activeOpacity={0.8}><Text style={styles.emptyStateBtnText}>Edit dashboard</Text></TouchableOpacity></View>}

        {dashboardVisibility.showLiveGauges && <View style={styles.mainTelemetryCard}><SpeedDisplay speed={data.speed} rpm={data.rpm} gear={data.n_gear} drs={data.drs} throttle={data.throttle} brake={data.brake} teamColor={getTeamColor(playerTeam)} /></View>}

        {dashboardVisibility.showLapProfile && <View style={styles.sectorCard}><SectorDisplay sector1Ms={currentLapSectors.sector1Ms} sector2Ms={currentLapSectors.sector2Ms} sector3Ms={currentLapSectors.sector3Ms} gameBestS1Ms={currentLapSectors.gameBestSector1Ms} gameBestS2Ms={currentLapSectors.gameBestSector2Ms} gameBestS3Ms={currentLapSectors.gameBestSector3Ms} fallbackBestS1Ms={bestS1Ms} fallbackBestS2Ms={bestS2Ms} fallbackBestS3Ms={bestS3Ms} currentSector={currentLapSectors.currentSector} teamColor={getTeamColor(playerTeam)} /></View>}

        {dashboardVisibility.showSessionStrip && <View style={styles.infoRow}><LapTimesCard currentLapTime="--:--.---" lastLapTime={latestLap?.lapTimeMs ?? null} bestLapTime={bestLapMs} lapCount={lapHistory.length} /><View style={styles.infoRowRight}><BestSectorsWidget bestS1Ms={bestS1Ms} bestS2Ms={bestS2Ms} bestS3Ms={bestS3Ms} /></View></View>}

        {dashboardVisibility.showSessionStrip && latestSessionRecord && (
          <View style={styles.sessionCard}>
            <TyreRow compound="S" age={lapHistory.length} />
            <View style={styles.sessionRow}><Text style={styles.sessionLabel}>TRACK</Text><Text style={styles.sessionValue}>{latestSessionRecord.circuit}</Text></View>
            <View style={styles.sessionRow}><Text style={styles.sessionLabel}>SESSION</Text><Text style={styles.sessionValue}>{latestSessionRecord.sessionType}</Text></View>
            {sessionInfo && <><View style={styles.sessionRow}><Text style={styles.sessionLabel}>WEATHER</Text><Text style={styles.sessionValue}>{sessionInfo.weather}</Text></View><View style={styles.sessionRow}><Text style={styles.sessionLabel}>TEMP</Text><Text style={styles.sessionValue}>Air {sessionInfo.airTempC}°C · Track {sessionInfo.trackTempC}°C</Text></View></>}
            <TouchableOpacity style={styles.setupBtn} onPress={() => setCarSetupModalOpen(true)} activeOpacity={0.7}><Text style={styles.setupBtnText}>View Car Setup →</Text></TouchableOpacity>
          </View>
        )}

        {dashboardVisibility.showSpeedChart && <TelemetryLineChart data={telemetryHistory} metric="speed" title="Speed (last ~6 s)" max={370} unit="km/h" color="#00D4FF" />}
        {dashboardVisibility.showBrakeChart && <TelemetryLineChart data={telemetryHistory} metric="brake" title="Brake (last ~6 s)" max={100} unit="%" color="#FF4444" />}
        {dashboardVisibility.showThrottleChart && <TelemetryLineChart data={telemetryHistory} metric="throttle" title="Throttle (last ~6 s)" max={100} unit="%" color="#00FF88" />}

        {dashboardVisibility.showLapProfile && latestLap && <View style={styles.lapMetricsCard}><Text style={styles.lapMetricsTitle}>Lap {latestLap.lapNum + 1} speed profile</Text><Text style={styles.lapMetricsLine}>Top {formatSpeedKph(latestLap.topSpeedKph)} · Min corner {formatSpeedKph(latestLap.minCornerSpeedKph)}{latestLap.fuelUsedL != null ? ` · Fuel ${latestLap.fuelUsedL.toFixed(2)} L` : ""}</Text><Text style={styles.lapMetricsSubline}>Top by sector: {formatSectorTriplet(latestLap.topSpeedBySectorKph)}</Text><Text style={styles.lapMetricsSubline}>Min by sector: {formatSectorTriplet(latestLap.minCornerSpeedBySectorKph)}</Text></View>}

        {dashboardVisibility.showLapHistory && <LapHistorySection lapHistory={lapHistory} />}
        {dashboardVisibility.showCircuitMap && <CircuitTrackMap circuitName={raceRecords.length > 0 ? raceRecords[raceRecords.length - 1].circuit : ""} carPosition={carPosition} />}
        {dashboardVisibility.showRaceRecords && raceRecordsWithLaps.length > 0 && <RaceRecordsList raceRecords={raceRecordsWithLaps} title="Race records" onRecordPress={(record) => setSelectedRaceRecord(record)} />}
      </ScrollView>

      <Modal visible={editDashboardOpen} animationType="slide" transparent onRequestClose={() => setEditDashboardOpen(false)}>
        <View style={styles.editModalBackdrop}>
          <View style={styles.editModalCard}>
            <View style={styles.editModalHeader}><Text style={styles.editModalTitle}>Edit dashboard</Text><TouchableOpacity onPress={() => setEditDashboardOpen(false)} style={styles.editModalDoneBtn} activeOpacity={0.8}><Text style={styles.editModalDoneText}>Done</Text></TouchableOpacity></View>
            <ScrollView style={styles.editModalList} contentContainerStyle={styles.editModalListContent} showsVerticalScrollIndicator={false}>
              {DASHBOARD_SECTION_OPTIONS.map((option) => (
                <View key={option.key} style={styles.editOptionRow}>
                  <View style={styles.editOptionTextWrap}><Text style={styles.editOptionTitle}>{option.label}</Text><Text style={styles.editOptionHint}>{option.hint}</Text></View>
                  <Switch value={dashboardVisibility[option.key]} onValueChange={(value) => setSectionVisible(option.key, value)} trackColor={{ false: "#3a3a3c", true: "#00D4FF" }} thumbColor={dashboardVisibility[option.key] ? "#ffffff" : "#f4f4f5"} />
                </View>
              ))}
            </ScrollView>
            <View style={styles.editModalFooter}>
              <View style={styles.editModalFooterRow}>
                <TouchableOpacity style={styles.resetBtn} onPress={resetDashboardVisibility} activeOpacity={0.8}><Text style={styles.resetBtnText}>Reset defaults</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.clearHistoryBtn, (!hasStoredHistory || clearingHistory) && styles.clearHistoryBtnDisabled]} onPress={handleClearHistory} disabled={!hasStoredHistory || clearingHistory} activeOpacity={0.8}><Text style={styles.clearHistoryBtnText}>{clearingHistory ? "Deleting…" : "Delete history"}</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={carSetupModalOpen} animationType="slide" transparent onRequestClose={() => setCarSetupModalOpen(false)}>
        <View style={styles.editModalBackdrop}>
          <View style={styles.editModalCard}>
            <View style={styles.editModalHeader}><Text style={styles.editModalTitle}>Car Setup</Text><TouchableOpacity onPress={() => setCarSetupModalOpen(false)} style={styles.editModalDoneBtn} activeOpacity={0.8}><Text style={styles.editModalDoneText}>Done</Text></TouchableOpacity></View>
            {carSetup != null ? (
              <ScrollView style={styles.editModalList} contentContainerStyle={styles.editModalListContent} showsVerticalScrollIndicator={false}>
                <View style={styles.setupSection}><Text style={styles.setupSectionTitle}>AERO</Text><View style={styles.setupRow}><Text style={styles.setupRowLabel}>Front wing</Text><Text style={styles.setupRowValue}>{carSetup.frontWing}</Text></View><View style={styles.setupRow}><Text style={styles.setupRowLabel}>Rear wing</Text><Text style={styles.setupRowValue}>{carSetup.rearWing}</Text></View></View>
                <View style={styles.setupSection}><Text style={styles.setupSectionTitle}>DIFFERENTIAL</Text><View style={styles.setupRow}><Text style={styles.setupRowLabel}>On throttle</Text><Text style={styles.setupRowValue}>{carSetup.onThrottle}%</Text></View><View style={styles.setupRow}><Text style={styles.setupRowLabel}>Off throttle</Text><Text style={styles.setupRowValue}>{carSetup.offThrottle}%</Text></View></View>
                <View style={styles.setupSection}><Text style={styles.setupSectionTitle}>SUSPENSION</Text><View style={styles.setupRow}><Text style={styles.setupRowLabel}>Front camber</Text><Text style={styles.setupRowValue}>{carSetup.frontCamber.toFixed(2)}°</Text></View><View style={styles.setupRow}><Text style={styles.setupRowLabel}>Rear camber</Text><Text style={styles.setupRowValue}>{carSetup.rearCamber.toFixed(2)}°</Text></View><View style={styles.setupRow}><Text style={styles.setupRowLabel}>Front toe</Text><Text style={styles.setupRowValue}>{carSetup.frontToe.toFixed(3)}</Text></View><View style={styles.setupRow}><Text style={styles.setupRowLabel}>Rear toe</Text><Text style={styles.setupRowValue}>{carSetup.rearToe.toFixed(3)}</Text></View></View>
                <View style={styles.setupSection}><Text style={styles.setupSectionTitle}>BRAKES</Text><View style={styles.setupRow}><Text style={styles.setupRowLabel}>Brake pressure</Text><Text style={styles.setupRowValue}>{carSetup.brakePressure}%</Text></View><View style={styles.setupRow}><Text style={styles.setupRowLabel}>Brake bias</Text><Text style={styles.setupRowValue}>{carSetup.brakeBias}%</Text></View></View>
                <View style={styles.setupSection}><Text style={styles.setupSectionTitle}>TYRES (PSI)</Text><View style={styles.setupRow}><Text style={styles.setupRowLabel}>Front left</Text><Text style={styles.setupRowValue}>{carSetup.frontLeftTyrePressure.toFixed(1)}</Text></View><View style={styles.setupRow}><Text style={styles.setupRowLabel}>Front right</Text><Text style={styles.setupRowValue}>{carSetup.frontRightTyrePressure.toFixed(1)}</Text></View><View style={styles.setupRow}><Text style={styles.setupRowLabel}>Rear left</Text><Text style={styles.setupRowValue}>{carSetup.rearLeftTyrePressure.toFixed(1)}</Text></View><View style={styles.setupRow}><Text style={styles.setupRowLabel}>Rear right</Text><Text style={styles.setupRowValue}>{carSetup.rearRightTyrePressure.toFixed(1)}</Text></View></View>
              </ScrollView>
            ) : (
              <View style={styles.setupEmptyState}><Text style={styles.setupEmptyText}>No setup data yet</Text><Text style={styles.setupEmptyHint}>Start a session in the F1 game to see your car setup</Text></View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f2f7" },
  containerContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 48 },
  
  // Waiting state
  waiting: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  waitingIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(225, 6, 0, 0.1)", justifyContent: "center", alignItems: "center", marginBottom: 24 },
  waitingIconText: { fontSize: 36 },
  waitingTitle: { fontSize: 24, fontWeight: "700", color: "#1c1c1e", marginBottom: 12 },
  waitingText: { fontSize: 15, color: "#8e8e93", textAlign: "center" },
  waitingIp: { fontSize: 18, fontWeight: "600", color: "#E10600", marginTop: 8 },
  waitingPort: { fontSize: 14, color: "#8e8e93", marginTop: 4 },
  
  // Header
  headerBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, marginBottom: 16 },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  driverBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#ffffff", borderRadius: 20, paddingRight: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  positionBadge: { backgroundColor: "#E10600", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 10 },
  positionText: { fontSize: 14, fontWeight: "800", color: "#ffffff" },
  driverName: { fontSize: 14, fontWeight: "600", color: "#1c1c1e" },
  recordBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#ffffff", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  recordBtnActive: { backgroundColor: "rgba(255, 59, 48, 0.15)" },
  recordDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#d1d1d6" },
  recordDotActive: { backgroundColor: "#ff3b30" },
  settingsBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#ffffff", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  settingsBtnText: { fontSize: 18, color: "#1c1c1e" },
  
  // Empty state
  emptyStateCard: { backgroundColor: "#ffffff", borderRadius: 16, padding: 24, alignItems: "center", marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  emptyStateTitle: { fontSize: 18, fontWeight: "700", color: "#1c1c1e", marginBottom: 8 },
  emptyStateText: { fontSize: 14, color: "#8e8e93", marginBottom: 16, textAlign: "center" },
  emptyStateBtn: { backgroundColor: "#E10600", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  emptyStateBtnText: { fontSize: 14, fontWeight: "700", color: "#ffffff" },
  
  // Main telemetry card
  mainTelemetryCard: { backgroundColor: "#ffffff", borderRadius: 20, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  
  // Speed Display (new layout)
  speedDisplayContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  speedCenterArea: { flex: 1, alignItems: "center" },
  speedValue: { fontSize: 72, fontWeight: "800", fontFamily: "monospace" },
  speedUnit: { fontSize: 14, fontWeight: "600", color: "#8e8e93", marginTop: -8 },
  
  // RPM row with gear and DRS
  rpmRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 12, gap: 16 },
  rpmCenter: { flexDirection: "row", alignItems: "baseline" },
  rpmValue: { fontSize: 22, fontWeight: "700", color: "#E10600", fontFamily: "monospace" },
  rpmUnit: { fontSize: 11, fontWeight: "600", color: "#8e8e93", marginLeft: 4 },
  
  // Small gear indicator (left of RPM)
  gearSmall: { width: 36, height: 36, borderRadius: 8, backgroundColor: "#f2f2f7", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#d1d1d6" },
  gearSmallText: { fontSize: 20, fontWeight: "800", color: "#1c1c1e", fontFamily: "monospace" },
  
  // Small DRS indicator (right of RPM)
  drsSmall: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: "#e5e5ea" },
  drsSmallActive: { backgroundColor: "#34c759" },
  drsSmallText: { fontSize: 11, fontWeight: "700", color: "#8e8e93" },
  drsSmallTextActive: { color: "#ffffff" },
  
  // Side bars (throttle/brake)
  sideBarContainer: { alignItems: "center", width: 50 },
  sideBarTrack: { width: 20, height: 100, backgroundColor: "#e5e5ea", borderRadius: 10, overflow: "hidden", justifyContent: "flex-end" },
  sideBarFill: { width: "100%", borderRadius: 10 },
  throttleFill: { backgroundColor: "#E10600" },
  brakeFill: { backgroundColor: "#ff3b30" },
  sideBarLabel: { fontSize: 10, fontWeight: "700", color: "#8e8e93", marginTop: 6 },
  sideBarValue: { fontSize: 12, fontWeight: "600", color: "#1c1c1e", fontFamily: "monospace" },
  
  // Sectors
  sectorCard: { backgroundColor: "#ffffff", borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  sectorContainer: { flexDirection: "row", justifyContent: "space-between" },
  sectorItem: { flex: 1, alignItems: "center" },
  sectorLabel: { fontSize: 12, fontWeight: "700", color: "#8e8e93", marginBottom: 8 },
  sectorLabelActive: { color: "#E10600" },
  sectorBar: { width: "80%", height: 4, borderRadius: 2, marginBottom: 8 },
  sectorTime: { fontSize: 14, fontWeight: "700", fontFamily: "monospace" },
  sectorDelta: { fontSize: 11, fontWeight: "600", fontFamily: "monospace", marginTop: 4 },
  
  // Info row
  infoRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  infoRowRight: { flex: 1, gap: 12 },
  
  // Lap times card
  lapTimesCard: { flex: 1, backgroundColor: "#ffffff", borderRadius: 16, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  currentLapRow: { marginBottom: 12 },
  currentLapLabel: { fontSize: 11, fontWeight: "700", color: "#8e8e93", marginBottom: 4 },
  currentLapTime: { fontSize: 28, fontWeight: "800", color: "#1c1c1e", fontFamily: "monospace" },
  lapTimeDivider: { height: 1, backgroundColor: "#e5e5ea", marginBottom: 12 },
  lapTimeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  lapTimeLabel: { fontSize: 11, fontWeight: "700", color: "#8e8e93" },
  lapTimeValue: { fontSize: 14, fontWeight: "600", color: "#1c1c1e", fontFamily: "monospace" },
  lapTimeBest: { color: "#34c759" },
  
  // Best sectors widget (one row per sector)
  bestSectorsWidget: { backgroundColor: "#ffffff", borderRadius: 16, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  bestSectorsTitle: { fontSize: 13, fontWeight: "700", color: "#8e8e93", marginBottom: 16, textAlign: "center" },
  bestSectorsList: { gap: 0 },
  bestSectorRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#e5e5ea" },
  bestSectorRowLast: { borderBottomWidth: 0 },
  bestSectorLabel: { fontSize: 14, fontWeight: "700", color: "#8e8e93" },
  bestSectorValue: { fontSize: 18, fontWeight: "700", color: "#34c759", fontFamily: "monospace" },
  
  
  // Session card
  sessionCard: { backgroundColor: "#ffffff", borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  sessionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#e5e5ea" },
  sessionTyreValue: { flexDirection: "row", alignItems: "center", gap: 8 },
  tyreIconSmall: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, justifyContent: "center", alignItems: "center", backgroundColor: "#f2f2f7" },
  tyreIconText: { fontSize: 12, fontWeight: "800" },
  sessionLabel: { fontSize: 11, fontWeight: "700", color: "#8e8e93" },
  sessionValue: { fontSize: 13, fontWeight: "600", color: "#1c1c1e" },
  setupBtn: { marginTop: 12, backgroundColor: "rgba(225, 6, 0, 0.1)", paddingVertical: 10, borderRadius: 12, alignItems: "center" },
  setupBtnText: { fontSize: 13, fontWeight: "700", color: "#E10600" },
  
  // Lap metrics
  lapMetricsCard: { backgroundColor: "#ffffff", borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  lapMetricsTitle: { fontSize: 14, fontWeight: "700", color: "#1c1c1e", marginBottom: 8 },
  lapMetricsLine: { fontSize: 12, color: "#1c1c1e", fontFamily: "monospace", marginBottom: 4 },
  lapMetricsSubline: { fontSize: 11, color: "#8e8e93", fontFamily: "monospace" },
  
  // History section
  historySection: { backgroundColor: "#ffffff", borderRadius: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2, overflow: "hidden" },
  historyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  historyHeaderLeft: { flexDirection: "row", alignItems: "center" },
  historyHeaderRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  historyIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: "#f2f2f7", justifyContent: "center", alignItems: "center", marginRight: 10 },
  historyIconText: { fontSize: 16, color: "#1c1c1e" },
  historyTitle: { fontSize: 15, fontWeight: "700", color: "#1c1c1e" },
  historyCount: { fontSize: 14, fontWeight: "600", color: "#E10600", backgroundColor: "rgba(225, 6, 0, 0.1)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  historyToggle: { fontSize: 12, color: "#8e8e93" },
  historyScroll: { maxHeight: 300 },
  historyContent: { paddingHorizontal: 16, paddingBottom: 16 },
  
  // Edit modal
  editModalBackdrop: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.4)", justifyContent: "flex-end" },
  editModalCard: { backgroundColor: "#ffffff", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "85%" },
  editModalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#e5e5ea" },
  editModalTitle: { fontSize: 20, fontWeight: "700", color: "#1c1c1e" },
  editModalDoneBtn: { backgroundColor: "#E10600", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
  editModalDoneText: { fontSize: 14, fontWeight: "700", color: "#ffffff" },
  editModalList: { maxHeight: 400 },
  editModalListContent: { paddingVertical: 8 },
  editOptionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#e5e5ea" },
  editOptionTextWrap: { flex: 1, paddingRight: 16 },
  editOptionTitle: { fontSize: 15, fontWeight: "600", color: "#1c1c1e", marginBottom: 2 },
  editOptionHint: { fontSize: 12, color: "#8e8e93" },
  editModalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: "#e5e5ea" },
  editModalFooterRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  resetBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: "#d1d1d6", alignItems: "center" },
  resetBtnText: { fontSize: 14, fontWeight: "600", color: "#1c1c1e" },
  clearHistoryBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: "rgba(255, 59, 48, 0.1)", alignItems: "center" },
  clearHistoryBtnDisabled: { opacity: 0.4 },
  clearHistoryBtnText: { fontSize: 14, fontWeight: "600", color: "#ff3b30" },
  
  // Setup modal
  setupSection: { paddingHorizontal: 20, paddingVertical: 12 },
  setupSectionTitle: { fontSize: 12, fontWeight: "800", color: "#E10600", letterSpacing: 1, marginBottom: 12 },
  setupRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#e5e5ea" },
  setupRowLabel: { fontSize: 14, color: "#8e8e93" },
  setupRowValue: { fontSize: 15, fontWeight: "700", color: "#1c1c1e", fontFamily: "monospace" },
  setupEmptyState: { padding: 40, alignItems: "center" },
  setupEmptyText: { fontSize: 18, fontWeight: "600", color: "#1c1c1e", marginBottom: 8 },
  setupEmptyHint: { fontSize: 14, color: "#8e8e93", textAlign: "center" },
});
