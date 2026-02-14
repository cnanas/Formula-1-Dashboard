export interface ChangelogEntry {
  id: string;
  dateLabel: string;
  title: string;
  updates: string[];
}

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    id: "2026-02-14-dashboard-updates",
    dateLabel: "Feb 14, 2026",
    title: "Casual Fan Experience Update",
    updates: [
      "Added a full YouTube hub page with searchable videos and in-app modal playback.",
      "Added a YouTube dashboard widget powered by the public channel feed.",
      "Added Weekend Hub: one-stop page for race weekend timing, schedule, watch links, top headlines, and latest videos.",
      "Added F1 Glossary: searchable, category-filtered terms with plain-English explanations.",
      "Added reliability UX strips with refresh controls and source status on Weekend Hub, News, and YouTube pages.",
      "Added Smart Race Recap page and dashboard widget with winner, podium, movers, incidents, and quick links to full analysis.",
      "Updated navigation with Weekend Hub and Glossary for faster access.",
      "Set new default dashboard widget set and layout to match the latest preferred arrangement.",
      "Hardened weekend rendering for invalid dates and hydration edge cases.",
    ],
  },
];
