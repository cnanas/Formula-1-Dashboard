#!/bin/bash
# Double-click this file (Mac) to start the F1 telemetry relay.
# Keep this window open while using the dashboard.

cd "$(dirname "$0")"
echo "Starting F1 Telemetry Relay..."
echo "Leave this window open. Close it to stop the relay."
echo ""
node scripts/telemetry-relay.js
echo ""
echo "Relay stopped. Press Enter to close."
read -r
