import { Suspense } from "react";
import { getOpenF1Safe } from "@/lib/api/openf1-server";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { StandingsView } from "./standings-view";
import { YearSelect } from "./year-select";

export const dynamic = "force-dynamic";

export default async function StandingsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { year } = await searchParams;
  const currentYear = new Date().getFullYear();
  const minYear = Math.max(2018, currentYear - 7);
  const parsedYear = Number(year);
  const selectedYear =
    Number.isInteger(parsedYear) &&
    parsedYear >= minYear &&
    parsedYear <= currentYear
      ? parsedYear
      : currentYear;
  const seasonYears = Array.from(
    { length: currentYear - minYear + 1 },
    (_, i) => currentYear - i
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Season {selectedYear}</h2>
        <YearSelect year={selectedYear} years={seasonYears} />
      </div>

      <Suspense key={selectedYear} fallback={<PageSkeleton />}>
        <StandingsData year={selectedYear} />
      </Suspense>
    </div>
  );
}

async function StandingsData({ year }: { year: number }) {
  const sessions = await getOpenF1Safe("sessions", {
    year,
    session_type: "Race",
  });

  const latestSessionKey = sessions
    .filter((s) => new Date(s.date_start) < new Date())
    .sort(
      (a, b) =>
        new Date(b.date_start).getTime() - new Date(a.date_start).getTime()
    )[0]
    ?.session_key?.toString();

  if (!latestSessionKey) {
    return (
      <StandingsView
        year={year}
        driverStandings={[]}
        teamStandings={[]}
        driverInfo={[]}
      />
    );
  }

  const [driverStandings, teamStandings, driverInfo] = await Promise.all([
    getOpenF1Safe("championship_drivers", { session_key: latestSessionKey }),
    getOpenF1Safe("championship_teams", { session_key: latestSessionKey }),
    getOpenF1Safe("drivers", { session_key: latestSessionKey }),
  ]);

  return (
    <StandingsView
      year={year}
      driverStandings={driverStandings}
      teamStandings={teamStandings}
      driverInfo={driverInfo}
    />
  );
}
