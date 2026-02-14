"use client";

import dynamic from "next/dynamic";

const WeekendHubPage = dynamic(() => import("./weekend-page-client"), {
  ssr: false,
});

export default WeekendHubPage;
