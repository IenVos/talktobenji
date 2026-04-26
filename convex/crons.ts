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

crons.daily(
  "jaar renewal emails avond",
  { hourUTC: 18, minuteUTC: 0 },
  internal.jaarRenewal.checkJaarRenewal,
  {}
);

crons.daily(
  "kwartaal renewal emails",
  { hourUTC: 9, minuteUTC: 0 },
  internal.jaarRenewal.checkKwartaalRenewal,
  {}
);

crons.daily(
  "kwartaal renewal emails avond",
  { hourUTC: 18, minuteUTC: 0 },
  internal.jaarRenewal.checkKwartaalRenewal,
  {}
);

crons.daily(
  "maand renewal emails",
  { hourUTC: 9, minuteUTC: 0 },
  internal.jaarRenewal.checkMaandRenewal,
  {}
);

crons.daily(
  "maand renewal emails avond",
  { hourUTC: 18, minuteUTC: 0 },
  internal.jaarRenewal.checkMaandRenewal,
  {}
);

// Markeer inactieve sessies als abandoned (elke 30 min) + genereer rapporten
crons.interval(
  "mark abandoned sessions",
  { minutes: 30 },
  api.chat.markSessionsAsAbandoned,
  {}
);

// Controleer inactieve accounts dagelijks: stuur waarschuwingen + verwijder verlopen accounts
crons.daily(
  "check inactive accounts",
  { hourUTC: 10, minuteUTC: 0 },
  internal.inactiveAccounts.checkInactiveAccounts,
  {}
);

export default crons;
