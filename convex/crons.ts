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

export default crons;
