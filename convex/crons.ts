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

// Dagelijkse Niet Alleen-mail in 3 voorkeurmomenten. De klant kiest bij de
// onboarding ochtend/middag/avond; elke run pakt alleen die groep.
// Vaste UTC-tijden, dus zomer/wintertijd schuiven mee:
//   06:00 UTC = 08:00 NL zomer / 07:00 NL winter (ochtend)
//   12:00 UTC = 14:00 NL zomer / 13:00 NL winter (middag)
//   18:00 UTC = 20:00 NL zomer / 19:00 NL winter (avond)
crons.daily(
  "process niet alleen ochtend",
  { hourUTC: 6, minuteUTC: 0 },
  internal.nietAlleen.processNietAlleenUsers,
  { slot: "ochtend" }
);

crons.daily(
  "process niet alleen middag",
  { hourUTC: 12, minuteUTC: 0 },
  internal.nietAlleen.processNietAlleenUsers,
  { slot: "middag" }
);

crons.daily(
  "process niet alleen avond-dagmail",
  { hourUTC: 18, minuteUTC: 0 },
  internal.nietAlleen.processNietAlleenUsers,
  { slot: "avond" }
);

// Onboarding-vangnet: klanten die hun verliestype nog niet kozen, staan met hun
// programma in de wacht. Deze run stuurt hooguit 2 herinneringen (gespreid, binnen
// een week) om ze naar de welkomstap te leiden. 08:00 UTC = 10:00 NL zomer.
crons.daily(
  "niet alleen onboarding-herinneringen",
  { hourUTC: 8, minuteUTC: 0 },
  internal.nietAlleen.processNietAlleenOnboardingHerinneringen,
  {}
);

// Speciale mijlpaal-mails (dag 15/28/30) blijven voor iedereen 's avonds (18:00 UTC).
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

// Herinner mensen die op de checkout hun gegevens invulden maar niet betaalden.
// Staat standaard uit; de cron kijkt zelf of de admin hem heeft aangezet.
crons.interval(
  "checkout herstel herinneringen",
  { hours: 1 },
  internal.checkoutHerstel.processHerinneringen,
  {}
);

export default crons;
