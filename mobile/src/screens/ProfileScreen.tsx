import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { RaceRecord } from "../lib/types";

// Apple Sign In is iOS-only; import only when available to avoid Android issues
let AppleAuth: typeof import("expo-apple-authentication") | null = null;
if (Platform.OS === "ios") {
  try {
    AppleAuth = require("expo-apple-authentication");
  } catch {
    AppleAuth = null;
  }
}

const APPLE_USER_KEY = "f1_profile_apple_user";
const APPLE_USER_NAME_KEY = "f1_profile_apple_name";

interface ProfileScreenProps {
  raceRecords: RaceRecord[];
  onClearHistory?: () => Promise<void> | void;
}

function formatLapTime(ms: number): string {
  const totalSec = ms / 1000;
  const min = Math.floor(totalSec / 60);
  const sec = (totalSec % 60).toFixed(3);
  return `${min}:${sec.padStart(6, "0")}`;
}

function useProfileStats(raceRecords: RaceRecord[]) {
  return useMemo(() => {
    const totalSessions = raceRecords.length;
    const allLaps = raceRecords.flatMap((r) => r.laps);
    const totalLaps = allLaps.length;

    let bestLapMs: number | null = null;
    let topSpeedKph: number | null = null;
    const circuitCount = new Map<string, number>();

    for (const lap of allLaps) {
      if (lap.lapTimeMs > 0 && Number.isFinite(lap.lapTimeMs)) {
        if (bestLapMs == null || lap.lapTimeMs < bestLapMs) {
          bestLapMs = lap.lapTimeMs;
        }
      }
      if (lap.topSpeedKph != null && lap.topSpeedKph > 0) {
        if (topSpeedKph == null || lap.topSpeedKph > topSpeedKph) {
          topSpeedKph = lap.topSpeedKph;
        }
      }
    }

    for (const r of raceRecords) {
      if (r.laps.length > 0) {
        circuitCount.set(r.circuit, (circuitCount.get(r.circuit) ?? 0) + 1);
      }
    }
    const favoriteCircuit =
      circuitCount.size > 0
        ? [...circuitCount.entries()].sort((a, b) => b[1] - a[1])[0][0]
        : null;

    return {
      totalSessions,
      totalLaps,
      bestLapMs,
      topSpeedKph,
      favoriteCircuit,
    };
  }, [raceRecords]);
}

export function ProfileScreen({
  raceRecords = [],
  onClearHistory,
}: ProfileScreenProps) {
  const [appleAvailable, setAppleAvailable] = useState<boolean | null>(null);
  const [user, setUser] = useState<{ id: string; name: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);

  const stats = useProfileStats(raceRecords);
  const hasStats =
    stats.totalSessions > 0 ||
    stats.totalLaps > 0 ||
    stats.bestLapMs != null ||
    stats.topSpeedKph != null;

  const loadStoredUser = useCallback(async () => {
    try {
      const [id, name] = await Promise.all([
        AsyncStorage.getItem(APPLE_USER_KEY),
        AsyncStorage.getItem(APPLE_USER_NAME_KEY),
      ]);
      if (id) setUser({ id, name });
      else setUser(null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStoredUser();
  }, [loadStoredUser]);

  useEffect(() => {
    if (Platform.OS !== "ios" && !AppleAuth) {
      setAppleAvailable(false);
      return;
    }
    let cancelled = false;
    const check = async () => {
      if (AppleAuth?.isAvailableAsync) {
        try {
          const available = await AppleAuth.isAvailableAsync();
          if (!cancelled) setAppleAvailable(available);
        } catch {
          if (!cancelled) setAppleAvailable(false);
        }
      } else {
        if (!cancelled) setAppleAvailable(false);
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAppleSignIn = useCallback(async () => {
    if (Platform.OS !== "ios" || !AppleAuth) return;
    setSigningIn(true);
    try {
      const credential = await AppleAuth.signInAsync({
        requestedScopes: [
          AppleAuth.AppleAuthenticationScope.FULL_NAME,
          AppleAuth.AppleAuthenticationScope.EMAIL,
        ],
      });
      const name =
        credential.fullName && AppleAuth.formatFullName
          ? AppleAuth.formatFullName(credential.fullName)
          : null;
      await AsyncStorage.multiSet([
        [APPLE_USER_KEY, credential.user],
        [APPLE_USER_NAME_KEY, name ?? ""],
      ]);
      setUser({ id: credential.user, name: name ?? null });
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err?.code !== "ERR_REQUEST_CANCELED") {
        Alert.alert(
          "Sign in failed",
          e instanceof Error ? e.message : "Please try again."
        );
      }
    } finally {
      setSigningIn(false);
    }
  }, []);

  const handleSignOut = useCallback(() => {
    Alert.alert(
      "Sign out",
      "Clear your account from this device? Your race history on this device is not deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.multiRemove([
              APPLE_USER_KEY,
              APPLE_USER_NAME_KEY,
            ]);
            setUser(null);
          },
        },
      ]
    );
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Account section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          {loading ? (
            <ActivityIndicator size="small" color="#A91D3A" />
          ) : user ? (
            <>
              <View style={styles.userRow}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={28} color="#fff" />
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>
                    {user.name && user.name.trim()
                      ? user.name.trim()
                      : "Signed in with Apple"}
                  </Text>
                  <Text style={styles.userId} numberOfLines={1}>
                    Apple ID connected
                  </Text>
                </View>
              </View>
              <Text
                style={styles.signOutLink}
                onPress={handleSignOut}
                accessibilityRole="button"
              >
                Sign out
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.signInPrompt}>
                Sign in with your Apple account to sync your profile and race
                stats (Face ID / passkey supported).
              </Text>
              {appleAvailable === true && (
                <View style={styles.appleButtonWrap}>
                  <AppleSignInButton
                    onPress={handleAppleSignIn}
                    disabled={signingIn}
                  />
                </View>
              )}
              {appleAvailable === false && (
                <Text style={styles.unavailable}>
                  Sign in with Apple is not available on this device.
                </Text>
              )}
            </>
          )}
        </View>
      </View>

      {/* Connect F1 2025 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connect F1 2025</Text>
        <View style={[styles.card, styles.comingSoonCard]}>
          <Ionicons name="game-controller-outline" size={40} color="#8e8e93" />
          <Text style={styles.comingSoonTitle}>Coming soon</Text>
          <Text style={styles.comingSoonText}>
            Link your F1 2025 game to this app to sync race and driving stats
            across devices. We’re working on the best way to connect your game
            account.
          </Text>
        </View>
      </View>

      {/* Race / driving stats (from local telemetry) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your stats</Text>
        <View style={styles.card}>
          {hasStats ? (
            <View style={styles.statsGrid}>
              <StatBlock
                label="Sessions"
                value={String(stats.totalSessions)}
                icon="flag-outline"
              />
              <StatBlock
                label="Total laps"
                value={String(stats.totalLaps)}
                icon="speedometer-outline"
              />
              {stats.bestLapMs != null && (
                <StatBlock
                  label="Best lap"
                  value={formatLapTime(stats.bestLapMs)}
                  icon="trophy-outline"
                />
              )}
              {stats.topSpeedKph != null && (
                <StatBlock
                  label="Top speed"
                  value={`${Math.round(stats.topSpeedKph)} km/h`}
                  icon="flash-outline"
                />
              )}
              {stats.favoriteCircuit && (
                <StatBlock
                  label="Favorite circuit"
                  value={stats.favoriteCircuit}
                  icon="location-outline"
                />
              )}
            </View>
          ) : (
            <Text style={styles.noStats}>
              Drive with the app connected to see your session count, laps, best
              lap times, and more here.
            </Text>
          )}
        </View>
      </View>

      {onClearHistory && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <Text
            style={styles.clearHistoryLink}
            onPress={() => {
              Alert.alert(
                "Clear history",
                "Remove all stored race and lap history from this device?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Clear",
                    style: "destructive",
                    onPress: () => onClearHistory?.(),
                  },
                ]
              );
            }}
            accessibilityRole="button"
          >
            Clear race history on this device
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function StatBlock({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}) {
  return (
    <View style={styles.statBlock}>
      <Ionicons name={icon} size={20} color="#A91D3A" />
      <View style={styles.statContent}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function AppleSignInButton({
  onPress,
  disabled,
}: {
  onPress: () => void;
  disabled: boolean;
}) {
  if (!AppleAuth?.AppleAuthenticationButton) return null;
  const Button = AppleAuth.AppleAuthenticationButton;
  return (
    <View style={styles.appleButtonWrap} pointerEvents={disabled ? "none" : "auto"}>
      {disabled && (
        <View style={[StyleSheet.absoluteFillObject, styles.appleButtonOverlay]}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      )}
      <Button
        buttonType={AppleAuth.AppleAuthenticationButtonType.SIGN_UP}
        buttonStyle={AppleAuth.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={8}
        style={{ width: 220, height: 44 }}
        onPress={onPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f7",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8e8e93",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#A91D3A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1c1c1e",
  },
  userId: {
    fontSize: 13,
    color: "#8e8e93",
    marginTop: 2,
  },
  signOutLink: {
    fontSize: 15,
    color: "#A91D3A",
    fontWeight: "500",
  },
  signInPrompt: {
    fontSize: 15,
    color: "#3a3a3c",
    lineHeight: 22,
    marginBottom: 16,
  },
  appleButtonWrap: {
    alignItems: "center",
    position: "relative",
  },
  appleButtonOverlay: {
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  unavailable: {
    fontSize: 14,
    color: "#8e8e93",
  },
  comingSoonCard: {
    alignItems: "center",
    paddingVertical: 24,
  },
  comingSoonTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1c1c1e",
    marginTop: 12,
    marginBottom: 6,
  },
  comingSoonText: {
    fontSize: 14,
    color: "#8e8e93",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  statsGrid: {
    gap: 12,
  },
  statBlock: {
    flexDirection: "row",
    alignItems: "center",
  },
  statContent: {
    marginLeft: 12,
    flex: 1,
  },
  statLabel: {
    fontSize: 13,
    color: "#8e8e93",
  },
  statValue: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1c1c1e",
    marginTop: 2,
  },
  noStats: {
    fontSize: 14,
    color: "#8e8e93",
    lineHeight: 20,
  },
  clearHistoryLink: {
    fontSize: 15,
    color: "#ff3b30",
    fontWeight: "500",
  },
});
