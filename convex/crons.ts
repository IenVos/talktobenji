import { cronJobs } from "convex/server";
import { api, internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "process trials",
  { hourUTC: 8, minuteUTC: 0 },
  api.trials.checkAndProcessTrials,
  {}
);

crons.daily(
  "process niet alleen",
  { hourUTC: 8, minuteUTC: 0 },
  internal.nietAlleen.processNietAlleenUsers,
  {}
);

crons.daily(
  "process niet alleen avond",
  { hourUTC: 18, minuteUTC: 0 },
  internal.nietAlleen.processNietAlleenAvondMails,
  {}
);

crons.daily(
  "jaar renewal emails",
  { hourUTC: 9, minuteUTC: 0 },
  internal.jaarRenewal.checkJaarRenewal,
  {}
);

// Markeer inactieve sessies als abandoned (elke 30 min) + genereer rapporten
crons.interval(
  "mark abandoned sessions",
  { minutes: 30 },
  api.chat.markSessionsAsAbandoned,
  {}
);

export default crons;
