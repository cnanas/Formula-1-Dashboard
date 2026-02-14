export type GlossaryCategory =
  | "Beginner"
  | "Sessions"
  | "Strategy"
  | "Technical"
  | "Rules";

export interface GlossaryTerm {
  id: string;
  term: string;
  category: GlossaryCategory;
  definition: string;
  whyItMatters: string;
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    id: "drs",
    term: "DRS",
    category: "Technical",
    definition:
      "Drag Reduction System opens a flap in the rear wing to reduce drag and increase top speed.",
    whyItMatters:
      "DRS helps create overtakes, especially on long straights where cars are close.",
  },
  {
    id: "ers",
    term: "ERS",
    category: "Technical",
    definition:
      "Energy Recovery System stores electrical energy and gives drivers a temporary power boost.",
    whyItMatters:
      "Smart ERS deployment is key for overtakes and defending position.",
  },
  {
    id: "undercut",
    term: "Undercut",
    category: "Strategy",
    definition:
      "Pitting earlier than a rival to gain time on fresh tires, then jumping ahead when they stop.",
    whyItMatters:
      "An undercut can flip race positions even when overtaking on track is difficult.",
  },
  {
    id: "overcut",
    term: "Overcut",
    category: "Strategy",
    definition:
      "Staying out longer than a rival and using clear air to set faster laps before pitting.",
    whyItMatters:
      "The overcut works when tire pace holds and traffic is minimal.",
  },
  {
    id: "pit-window",
    term: "Pit Window",
    category: "Strategy",
    definition:
      "Range of laps where a pit stop can be made without losing excessive time or track position.",
    whyItMatters:
      "Stopping outside the window can trap a driver in traffic or force another stop later.",
  },
  {
    id: "track-position",
    term: "Track Position",
    category: "Beginner",
    definition:
      "A driver’s running place on circuit, independent of raw pace.",
    whyItMatters:
      "At circuits where passing is hard, being ahead can matter more than pure speed.",
  },
  {
    id: "pole",
    term: "Pole Position",
    category: "Sessions",
    definition:
      "The front-most starting spot, awarded to the fastest driver in qualifying.",
    whyItMatters:
      "Starting first often gives the cleanest run into Turn 1 and strategic control.",
  },
  {
    id: "parc-ferme",
    term: "Parc Ferme",
    category: "Rules",
    definition:
      "Restricted period where teams cannot freely change car setup after qualifying starts.",
    whyItMatters:
      "A strong setup choice before parc ferme can decide race competitiveness.",
  },
  {
    id: "delta-time",
    term: "Delta Time",
    category: "Technical",
    definition:
      "Difference between a driver’s current pace and a target reference pace.",
    whyItMatters:
      "During safety car or VSC periods, missing delta targets can trigger penalties.",
  },
  {
    id: "vsc",
    term: "Virtual Safety Car (VSC)",
    category: "Rules",
    definition:
      "Neutralization where drivers must slow to a prescribed pace without a physical safety car.",
    whyItMatters:
      "Pit timing under VSC can create major gains due to lower overall race speed.",
  },
  {
    id: "safety-car",
    term: "Safety Car",
    category: "Rules",
    definition:
      "A lead car that controls the field speed during incidents or hazardous conditions.",
    whyItMatters:
      "Safety cars compress gaps and can completely change strategy and race outcomes.",
  },
  {
    id: "formation-lap",
    term: "Formation Lap",
    category: "Sessions",
    definition:
      "Warm-up lap before the race start where cars prepare tires and brakes.",
    whyItMatters:
      "Tire temperature at the end of the formation lap strongly affects launch performance.",
  },
  {
    id: "dirty-air",
    term: "Dirty Air",
    category: "Technical",
    definition:
      "Turbulent airflow behind another car that reduces aerodynamic grip.",
    whyItMatters:
      "Dirty air makes it harder to follow closely and preserve tire life.",
  },
  {
    id: "slipstream",
    term: "Slipstream",
    category: "Technical",
    definition:
      "Reduced air resistance when following another car closely on a straight.",
    whyItMatters:
      "Slipstream helps set up overtakes or improve qualifying lap times.",
  },
  {
    id: "stint",
    term: "Stint",
    category: "Strategy",
    definition:
      "Continuous run of laps on one set of tires between pit stops.",
    whyItMatters:
      "Managing each stint length is central to one-stop and two-stop strategies.",
  },
  {
    id: "deg",
    term: "Tire Degradation",
    category: "Strategy",
    definition:
      "Performance loss as tires wear and overheat through a run.",
    whyItMatters:
      "High degradation forces earlier stops and can expose drivers late in stints.",
  },
  {
    id: "warmup",
    term: "Tire Warm-Up",
    category: "Strategy",
    definition:
      "How quickly a tire reaches the ideal operating temperature range.",
    whyItMatters:
      "Faster warm-up can decide restarts, out-laps, and qualifying runs.",
  },
  {
    id: "out-lap",
    term: "Out-Lap",
    category: "Sessions",
    definition:
      "First lap after leaving the pits on a new tire set.",
    whyItMatters:
      "A strong out-lap determines whether an undercut attempt succeeds.",
  },
  {
    id: "in-lap",
    term: "In-Lap",
    category: "Sessions",
    definition:
      "Lap immediately before entering the pits.",
    whyItMatters:
      "Pushing on the in-lap can protect position against undercuts.",
  },
  {
    id: "q1-q2-q3",
    term: "Q1 / Q2 / Q3",
    category: "Sessions",
    definition:
      "Three knockout qualifying segments that decide the race starting grid.",
    whyItMatters:
      "Reaching Q3 gives access to top grid spots and often determines race ceiling.",
  },
  {
    id: "sprint",
    term: "Sprint",
    category: "Sessions",
    definition:
      "Short race session awarding points and setting the race weekend narrative.",
    whyItMatters:
      "Sprint results can reshape momentum and influence main race risk choices.",
  },
  {
    id: "stewards",
    term: "Stewards",
    category: "Rules",
    definition:
      "Officials who review incidents and issue penalties during a race weekend.",
    whyItMatters:
      "Steward decisions can alter final classification long after the checkered flag.",
  },
  {
    id: "penalty",
    term: "Time Penalty",
    category: "Rules",
    definition:
      "Added time (for example 5 or 10 seconds) for infractions such as causing a collision.",
    whyItMatters:
      "A small penalty can drop a driver several positions in tight finishes.",
  },
  {
    id: "dnf",
    term: "DNF",
    category: "Beginner",
    definition:
      "Did Not Finish. A driver retires before completing the race distance.",
    whyItMatters:
      "DNFs heavily impact championships and often reshape race strategy for teams.",
  },
  {
    id: "constructors",
    term: "Constructors’ Championship",
    category: "Beginner",
    definition:
      "Season-long team standings based on points scored by both drivers.",
    whyItMatters:
      "Constructors’ position affects prize money and team momentum across seasons.",
  },
];

export const GLOSSARY_CATEGORIES: Array<"All" | GlossaryCategory> = [
  "All",
  "Beginner",
  "Sessions",
  "Strategy",
  "Technical",
  "Rules",
];

export function getGlossaryTermById(termId: string): GlossaryTerm | null {
  return GLOSSARY_TERMS.find((term) => term.id === termId) ?? null;
}
