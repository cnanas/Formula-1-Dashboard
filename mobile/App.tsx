import React, { useEffect, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import * as ExpoBlur from "expo-blur";
import Constants from "expo-constants";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useUdpTelemetry } from "./src/hooks/useUdpTelemetry";
import { SetupScreen } from "./src/screens/SetupScreen";
import { GameTelemetryScreen } from "./src/screens/GameTelemetryScreen";
import { HistoryScreen } from "./src/screens/HistoryScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";

// Check if we're running in Expo Go (which doesn't support native blur)
const isExpoGo = Constants.appOwnership === "expo";

// Floating tab bar – Light mode style
function FloatingTabBarBackground({ children }: { children: React.ReactNode }) {
  if (isExpoGo || !ExpoBlur.BlurView) {
    return (
      <View style={[styles.floatingTabBarContainer, styles.floatingTabBarFallback]}>
        {children}
      </View>
    );
  }
  return (
    <ExpoBlur.BlurView
      tint="light"
      intensity={80}
      style={[styles.floatingTabBarContainer, styles.floatingTabBarBlur]}
    >
      {children}
    </ExpoBlur.BlurView>
  );
}

type RootTab = "setup" | "telemetry" | "history" | "profile" | "stats";

// Placeholder screen for tabs not yet implemented
function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View style={styles.placeholderScreen}>
      <Text style={styles.placeholderTitle}>{title}</Text>
      <Text style={styles.placeholderSubtitle}>Coming soon</Text>
    </View>
  );
}

function TabButton({
  label,
  activeIcon,
  inactiveIcon,
  active,
  onPress,
  badge,
}: {
  label: string;
  activeIcon: React.ComponentProps<typeof Ionicons>["name"];
  inactiveIcon: React.ComponentProps<typeof Ionicons>["name"];
  active: boolean;
  onPress: () => void;
  badge?: string;
}) {
  const activeColor = "#E10600"; // F1 Red accent
  const inactiveColor = "#8e8e93";
  
  return (
    <Pressable
      style={({ pressed }) => [
        styles.tabBtn,
        pressed && styles.tabBtnPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      {/* Top indicator line for active tab - or spacer for inactive */}
      <View style={[styles.tabIndicator, active ? { backgroundColor: activeColor } : { backgroundColor: "transparent" }]} />
      
      <View style={styles.tabBtnContent}>
        <View style={styles.tabIconWrap}>
          <Ionicons
            name={active ? activeIcon : inactiveIcon}
            size={24}
            color={active ? activeColor : inactiveColor}
          />
          {badge ? (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.tabBtnText, active && { color: activeColor }]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<RootTab>("setup");
  const userSelectedTabRef = useRef(false);
  const {
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
  } = useUdpTelemetry();

  useEffect(() => {
    // Preserve previous behavior: auto-open telemetry once connected unless user picked a tab.
    if (!userSelectedTabRef.current && connected && data != null) {
      setActiveTab("telemetry");
    }
  }, [connected, data]);

  const selectTab = (tab: RootTab) => {
    userSelectedTabRef.current = true;
    setActiveTab(tab);
  };
  const setupBadge = error ? "!" : undefined;
  const liveBadge = connected && activeTab !== "telemetry" ? "1" : undefined;

  const renderScreen = () => {
    switch (activeTab) {
      case "telemetry":
        return (
          <GameTelemetryScreen
            data={data}
            connected={connected}
            localIp={localIp}
            lapHistory={lapHistory}
            raceRecords={raceRecords}
            telemetryHistory={telemetryHistory}
            sessionInfo={sessionInfo}
            fuel={fuel}
            fuelMetrics={fuelMetrics}
            carPosition={carPosition}
            currentLapSectors={currentLapSectors}
            playerTeam={playerTeam}
            carSetup={carSetup}
            isRecordingHistory={isRecordingHistory}
            onToggleRecording={toggleRecordingHistory}
            onClearHistory={clearHistory}
          />
        );
      case "setup":
        return (
          <SetupScreen
            localIp={localIp}
            listening={listening}
            error={error}
            connected={connected}
            raceRecords={raceRecords}
            onRefreshIp={refreshLocalIp}
            onClearHistory={clearHistory}
          />
        );
      case "history":
        return (
          <HistoryScreen
            raceRecords={raceRecords}
            onClearHistory={clearHistory}
            onDeleteCircuit={deleteRecordsForCircuit}
            onRefreshIp={refreshLocalIp}
          />
        );
      case "profile":
        return (
          <ProfileScreen
            raceRecords={raceRecords}
            onClearHistory={clearHistory}
          />
        );
      case "stats":
        return <PlaceholderScreen title="Statistics" />;
      default:
        return null;
    }
  };

  const topInset = Platform.OS === "ios" ? (Constants.statusBarHeight ?? 44) : 0;

  return (
    <View style={styles.app}>
      <StatusBar style="dark" />
      <View style={[styles.content, { paddingTop: topInset }]}>
        {renderScreen()}
      </View>

      {/* Floating Tab Bar - iOS Style */}
      <View style={styles.floatingTabBarWrapper}>
        <FloatingTabBarBackground>
          <View style={styles.floatingTabBar}>
            <TabButton
              label="Setup"
              activeIcon="settings"
              inactiveIcon="settings-outline"
              active={activeTab === "setup"}
              onPress={() => selectTab("setup")}
              badge={setupBadge}
            />
            <TabButton
              label="History"
              activeIcon="time"
              inactiveIcon="time-outline"
              active={activeTab === "history"}
              onPress={() => selectTab("history")}
            />
            <TabButton
              label="Live"
              activeIcon="speedometer"
              inactiveIcon="speedometer-outline"
              active={activeTab === "telemetry"}
              onPress={() => selectTab("telemetry")}
              badge={liveBadge}
            />
            <TabButton
              label="Profile"
              activeIcon="person"
              inactiveIcon="person-outline"
              active={activeTab === "profile"}
              onPress={() => selectTab("profile")}
            />
            <TabButton
              label="Stats"
              activeIcon="stats-chart"
              inactiveIcon="stats-chart-outline"
              active={activeTab === "stats"}
              onPress={() => selectTab("stats")}
            />
          </View>
        </FloatingTabBarBackground>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: "#f2f2f7",
  },
  content: {
    flex: 1,
    paddingBottom: Platform.OS === "ios" ? 90 : 74, // Space for tab bar
  },
  // Placeholder Screen
  placeholderScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f2f2f7",
  },
  placeholderTitle: {
    fontSize: 28,
    fontWeight: "600",
    color: "#1c1c1e",
    marginBottom: 8,
  },
  placeholderSubtitle: {
    fontSize: 17,
    color: "#8e8e93",
  },
  // Tab Bar – Light mode style
  floatingTabBarWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "stretch",
    justifyContent: "center",
    pointerEvents: "box-none",
  },
  floatingTabBarContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingTabBarBlur: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  floatingTabBarFallback: {
    backgroundColor: "#ffffff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(60, 60, 67, 0.12)",
  },
  floatingTabBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-evenly",
    paddingHorizontal: 0,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 28 : 12,
    minHeight: Platform.OS === "ios" ? 80 : 64,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  tabBtnPressed: {
    opacity: 0.7,
  },
  tabIndicator: {
    width: 28,
    height: 3,
    borderRadius: 1.5,
    marginBottom: 6,
  },
  tabBtnContent: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tabIconWrap: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  tabBtnText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#8e8e93",
    lineHeight: 12,
  },
  tabBadge: {
    position: "absolute",
    top: -2,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: "#E10600",
    justifyContent: "center",
    alignItems: "center",
  },
  tabBadgeText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "700",
  },
});
