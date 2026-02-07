"use client";

import { redirect } from "next/navigation";
import { use } from "react";

// Results page redirects to race analysis
export default function ResultsPage({
  params,
}: {
  params: Promise<{ meetingKey: string; sessionKey: string }>;
}) {
  const { meetingKey, sessionKey } = use(params);
  redirect(`/race/${meetingKey}/${sessionKey}`);
}
