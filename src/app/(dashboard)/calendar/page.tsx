import { Suspense } from "react";
import { getOpenF1Safe } from "@/lib/api/openf1-server";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { CalendarView } from "./calendar-view";

export const dynamic = "force-dynamic";

export default function CalendarPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CalendarData />
    </Suspense>
  );
}

async function CalendarData() {
  const defaultYear = new Date().getFullYear();
  const [meetings, sessions] = await Promise.all([
    getOpenF1Safe("meetings", { year: defaultYear }),
    getOpenF1Safe("sessions", { year: defaultYear }),
  ]);

  return (
    <CalendarView
      defaultYear={defaultYear}
      initialMeetings={meetings}
      initialSessions={sessions}
    />
  );
}
