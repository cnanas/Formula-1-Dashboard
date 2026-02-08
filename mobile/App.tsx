import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { useUdpTelemetry } from "./src/hooks/useUdpTelemetry";
import { SetupScreen } from "./src/screens/SetupScreen";
import { GameTelemetryScreen } from "./src/screens/GameTelemetryScreen";

export default function App() {
  const [forceSetup, setForceSetup] = useState(false);
  const { data, connected, listening, localIp, error, refreshLocalIp } =
    useUdpTelemetry();

  // When connected and receiving data, show telemetry screen (unless user forced setup view)
  const showTelemetry = !forceSetup && connected && data !== null;

  if (showTelemetry) {
    return (
      <>
        <StatusBar style="light" />
        <GameTelemetryScreen
          data={data}
          connected={connected}
          localIp={localIp}
          onBackToSetup={() => setForceSetup(true)}
        />
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <SetupScreen
        localIp={localIp}
        listening={listening}
        error={error}
        connected={connected}
        onRefreshIp={refreshLocalIp}
        onViewTelemetry={() => setForceSetup(false)}
      />
    </>
  );
}
