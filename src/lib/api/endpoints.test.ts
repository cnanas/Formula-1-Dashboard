import { describe, expect, it } from "vitest";
import {
  buildProxyPath,
  buildQueryString,
  buildUrl,
  getEndpointCacheTTL,
  getEndpointPriority,
} from "./endpoints";
import { CacheTTL } from "./cache";

describe("buildQueryString", () => {
  it("returns an empty string for no params", () => {
    expect(buildQueryString({})).toBe("");
  });

  it("serializes params with a leading question mark", () => {
    expect(buildQueryString({ year: 2026, session_type: "Race" })).toBe(
      "?year=2026&session_type=Race"
    );
  });

  it("drops undefined and empty-string values", () => {
    expect(
      buildQueryString({ year: 2026, session_key: undefined, driver: "" })
    ).toBe("?year=2026");
  });

  it("URL-encodes values", () => {
    expect(buildQueryString({ team_name: "Red Bull Racing" })).toBe(
      "?team_name=Red+Bull+Racing"
    );
  });
});

describe("buildUrl / buildProxyPath", () => {
  it("builds the absolute OpenF1 URL", () => {
    expect(buildUrl("sessions", { year: 2026 })).toBe(
      "https://api.openf1.org/v1/sessions?year=2026"
    );
  });

  it("builds the relative proxy path", () => {
    expect(buildProxyPath("sessions", { year: 2026 })).toBe(
      "/sessions?year=2026"
    );
  });
});

describe("getEndpointCacheTTL", () => {
  it("persists slow-changing endpoints to localStorage", () => {
    expect(getEndpointCacheTTL("meetings")).toEqual({
      ttl: CacheTTL.MEETINGS,
      persist: true,
    });
    expect(getEndpointCacheTTL("drivers").persist).toBe(true);
  });

  it("never persists live data", () => {
    for (const endpoint of ["car_data", "location", "position", "intervals"] as const) {
      expect(getEndpointCacheTTL(endpoint).persist).toBe(false);
    }
  });

  it("uses the telemetry TTL for car data", () => {
    expect(getEndpointCacheTTL("car_data").ttl).toBe(CacheTTL.TELEMETRY);
  });
});

describe("getEndpointPriority", () => {
  it("ranks live position data highest", () => {
    expect(getEndpointPriority("position")).toBe(3);
    expect(getEndpointPriority("intervals")).toBe(3);
  });

  it("ranks supporting live data above historical data", () => {
    expect(getEndpointPriority("weather")).toBe(2);
    expect(getEndpointPriority("meetings")).toBe(1);
  });
});
