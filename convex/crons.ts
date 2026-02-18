import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "process trials",
  { hourUTC: 8, minuteUTC: 0 },
  internal.trials.checkAndProcessTrials
);

export default crons;
