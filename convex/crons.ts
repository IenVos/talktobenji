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
  "process trials avond",
  { hourUTC: 18, minuteUTC: 0 },
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

// Even Houvast opvolgreeks — één keer per dag in de avond, zodat mensen rustig
// de dag kunnen doornemen en meer tijd nemen om te lezen. Doet niets tot env
// EH_OPVOLG_ACTIEF === "true".
// 17:30 UTC = 19:30 NL in de zomer (CEST). In de winter (CET) wordt dit 18:30 NL;
// pas dan eventueel aan naar 18:30 UTC als je het exact op 19:30 wilt houden.
crons.daily(
  "even houvast opvolgmails",
  { hourUTC: 17, minuteUTC: 30 },
  internal.evenHouvastOpvolg.processEvenHouvastOpvolg,
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
  internal.chat.markSessionsAsAbandoned,
  {}
);

// Controleer inactieve accounts dagelijks: stuur waarschuwingen + verwijder verlopen accounts
crons.daily(
  "check inactive accounts",
  { hourUTC: 10, minuteUTC: 0 },
  internal.inactiveAccounts.checkInactiveAccounts,
  {}
);

// Verwerk ingeplande cadeau-mails (ontvanger-mail op gewenste datum)
crons.daily(
  "process scheduled gifts",
  { hourUTC: 9, minuteUTC: 0 },
  internal.giftScheduled.processScheduledGifts,
  {}
);

export default crons;
