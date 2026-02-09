import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";

const DEFAULT_REGION = {
  latitude: 51.5074,
  longitude: -0.1278,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export function LocationMap() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<"idle" | "granted" | "denied">("idle");
  const [tracking, setTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<MapView | null>(null);
  const watchSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        setPermissionStatus(status === "granted" ? "granted" : "denied");
        if (status !== "granted") {
          setError("Location permission denied");
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!cancelled) setLocation(loc);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to get location");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!tracking || permissionStatus !== "granted") return;
    let active = true;
    void Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 2000,
        distanceInterval: 10,
      },
      (loc) => {
        setLocation(loc);
        mapRef.current?.animateToRegion(
          {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          },
          500
        );
      }
    )
      .then((subscription) => {
        if (!active) {
          subscription.remove();
          return;
        }
        watchSubscriptionRef.current = subscription;
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to track location");
      });
    return () => {
      active = false;
      watchSubscriptionRef.current?.remove();
      watchSubscriptionRef.current = null;
    };
  }, [tracking, permissionStatus]);

  const region = location
    ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }
    : DEFAULT_REGION;

  if (permissionStatus === "denied" || error) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Map</Text>
        <View style={[styles.mapPlaceholder, styles.mapContainer]}>
          <Text style={styles.placeholderText}>
            {error || "Location access is required to show the map."}
          </Text>
          <Text style={styles.placeholderHint}>
            Enable location in Settings to track your position.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Map</Text>
        <TouchableOpacity
          style={[styles.trackButton, tracking && styles.trackButtonActive]}
          onPress={() => setTracking((t) => !t)}
          activeOpacity={0.8}
        >
          <Text style={[styles.trackButtonText, tracking && styles.trackButtonTextActive]}>
            {tracking ? "Tracking" : "Track my location"}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.mapContainer}>
        <MapView
          ref={(r) => {
            mapRef.current = r;
          }}
          style={styles.map}
          initialRegion={region}
          showsUserLocation={false}
          showsMyLocationButton={false}
        >
          {location && (
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title="You are here"
              pinColor="#3b82f6"
            />
          )}
        </MapView>
      </View>
      {location && (
        <Text style={styles.coordsText}>
          {location.coords.latitude.toFixed(5)}, {location.coords.longitude.toFixed(5)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e5e5e5",
  },
  trackButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#27272a",
  },
  trackButtonActive: {
    backgroundColor: "#3b82f6",
  },
  trackButtonText: {
    fontSize: 13,
    color: "#a1a1aa",
  },
  trackButtonTextActive: {
    color: "#fff",
  },
  mapContainer: {
    height: 220,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#18181b",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  placeholderText: {
    color: "#a1a1aa",
    textAlign: "center",
    marginBottom: 8,
  },
  placeholderHint: {
    color: "#71717a",
    fontSize: 12,
    textAlign: "center",
  },
  coordsText: {
    fontSize: 11,
    color: "#71717a",
    marginTop: 6,
    paddingHorizontal: 4,
  },
});
