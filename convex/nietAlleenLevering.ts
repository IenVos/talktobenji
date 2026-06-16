/**
 * Niet Alleen — leveringsstatus van de dagmails.
 *
 * Pure rekenhelper (geen Convex-wrappers) zodat zowel het admin-overzicht
 * (nietAlleen.getLeveringsStatus) als klantbeheer dezelfde logica gebruiken.
 *
 * Belangrijk: het verzend-logboek (verzondenDagen) bestaat pas sinds de
 * leveringslogboek-functie live ging. Mails die dáárvoor verstuurd zijn, staan
 * nergens geregistreerd. Die dagen mogen dus NIET als "gemist" gelden — we weten
 * het simpelweg niet. Daarom de status "onbekend" voor dagen die vielen vóór
 * het logboek bestond bij een profiel dat nog nooit een geregistreerde dag heeft.
 */

const DAG_MS = 86_400_000;

// De ochtend-cron (dagmails) draait om 08:00 UTC.
const CRON_OCHTEND_UUR_UTC = 8;

// De avond-cron (speciale mails: dag 15/28/30) draait om 18:00 UTC.
const CRON_AVOND_UUR_UTC = 18;

/**
 * Effectieve startdag = de dag waarop dag 1 dáádwerkelijk wordt verstuurd: de eerste
 * ochtendcron (08:00 UTC) op of ná het aanmeldmoment. Wie zich ná de cron van de
 * aanmelddag aanmeldt, krijgt dag 1 pas de volgende ochtend. Door hierop te ankeren
 * loopt het dagnummer gelijk met wat de klant echt ontvangt, in plaats van één dag
 * vooruit te rennen bij late aanmeldingen.
 */
export function effectieveStartDatum(startDatum: number): number {
  const d = new Date(startDatum);
  let cron = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), CRON_OCHTEND_UUR_UTC, 0, 0);
  if (startDatum > cron) cron += DAG_MS; // aangemeld ná de cron → dag 1 gaat morgen
  return cron;
}

/**
 * Dagnummer (1-gebaseerd) op KALENDERDAGEN in Europe/Amsterdam, niet op verstreken
 * 24-uursblokken vanaf het activatiemoment. Zo wijzigt het nummer alleen om
 * middernacht (NL), is het overal gelijk (account, cron, mail) en heeft het geen
 * last van zomertijd of tijdzone. Geankerd op de effectieve startdag (zie boven),
 * zodat het gelijk loopt met wat de klant echt heeft gekregen. Dit is de enige plek
 * waar het dagnummer berekend wordt; alle andere plekken roepen deze functie aan.
 */
export function berekenDagNummer(startDatum: number, now: number): number {
  const nlMidnight = (ts: number): number => {
    const p = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Amsterdam",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date(ts));
    const val = (t: string) => Number(p.find((x) => x.type === t)!.value);
    return Date.UTC(val("year"), val("month") - 1, val("day"));
  };
  return Math.floor((nlMidnight(now) - nlMidnight(effectieveStartDatum(startDatum))) / DAG_MS) + 1;
}

// Eerste cron-run met het leveringslogboek live (10 juni 2026, 08:00 UTC).
// Dagmails die hiervóór gepland stonden zijn niet betrouwbaar geregistreerd.
export const LEVERING_LOGBOEK_VANAF = Date.UTC(2026, 5, 10, 8, 0);

// Het tijdstip van de laatste cron-run (op `uurUTC`) op of vóór `now`.
function laatsteCron(now: number, uurUTC: number): number {
  const d = new Date(now);
  const vandaag = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), uurUTC, 0, 0);
  return now >= vandaag ? vandaag : vandaag - DAG_MS;
}

export type DagStatus = "verzonden" | "gemist" | "onbekend" | "tekomen";

export type LeveringProfiel = {
  startDatum: number;
  verzondenDagen?: number[];
  inhaalWachtrij?: number[];
  inhaalExcuusPending?: boolean;
  dag15MailVerzonden?: boolean;
  dag28MailVerzonden?: boolean;
  dag30MailVerzonden?: boolean;
};

export type SpecialStatus = { due: boolean; verzonden: boolean; status: DagStatus };

export type Levering = {
  dagNummer: number;
  verzonden: number[];
  gemist: number[];
  onbekend: number[];
  dagen: { dag: number; status: DagStatus }[];
  wachtrij: number[];
  excuusPending: boolean;
  specials: { dag15: SpecialStatus; dag28: SpecialStatus; dag30: SpecialStatus };
};

function statusVoor(dag: number, verwachtTot: number, dueAt: number, geregistreerd: boolean, heeftLog: boolean): DagStatus {
  if (geregistreerd) return "verzonden";
  // Nog niet verwacht: de ochtend-cron is nog niet aan dit dagnummer toegekomen.
  if (dag > verwachtTot) return "tekomen";
  // Niet geregistreerd én had verstuurd moeten zijn. Alleen "gemist" als we het ook
  // écht zouden moeten weten: het logboek was live (dueAt >= cutover) of dit profiel
  // heeft al geregistreerde dagen (dan is de lijst leidend en is een gat een gat).
  if (heeftLog || dueAt >= LEVERING_LOGBOEK_VANAF) return "gemist";
  return "onbekend";
}

export function berekenLevering(p: LeveringProfiel, now: number): Levering {
  const dagNummer = berekenDagNummer(p.startDatum, now);
  // Tot welk dagnummer de cron daadwerkelijk verstuurd zou hebben: berekend op het
  // tijdstip van de laatste ochtend-cron (08:00 UTC), niet op kijk-moment. Zo toont
  // de huidige dag niet ten onrechte rood vóór de cron 'm verstuurt.
  const verwachtTot = berekenDagNummer(p.startDatum, laatsteCron(now, CRON_OCHTEND_UUR_UTC));
  // Speciale mails (dag 15/28/30) worden door de avond-cron (18:00 UTC) verstuurd,
  // niet door de ochtend-cron. Tot die cron gedraaid heeft, zijn ze "nog te komen"
  // en niet "gemist" — anders staan ze tussen ochtend en avond ten onrechte rood.
  const verwachtTotAvond = berekenDagNummer(p.startDatum, laatsteCron(now, CRON_AVOND_UUR_UTC));
  const verzondenSet = new Set(p.verzondenDagen ?? []);
  const heeftLog = (p.verzondenDagen?.length ?? 0) > 0;
  const eff = effectieveStartDatum(p.startDatum);

  const dagen: { dag: number; status: DagStatus }[] = [];
  const verzonden: number[] = [];
  const gemist: number[] = [];
  const onbekend: number[] = [];

  for (let d = 1; d <= 30; d++) {
    const dueAt = eff + (d - 1) * DAG_MS;
    const status = statusVoor(d, verwachtTot, dueAt, verzondenSet.has(d), heeftLog);
    dagen.push({ dag: d, status });
    if (status === "verzonden") verzonden.push(d);
    else if (status === "gemist") gemist.push(d);
    else if (status === "onbekend") onbekend.push(d);
  }

  const special = (dag: number, vlag: boolean): SpecialStatus => {
    const dueAt = eff + (dag - 1) * DAG_MS;
    const status = statusVoor(dag, verwachtTotAvond, dueAt, vlag, heeftLog);
    return { due: dag <= verwachtTotAvond, verzonden: vlag, status };
  };

  const wachtrij = (p.inhaalWachtrij ?? []).filter((d) => !verzondenSet.has(d)).sort((a, b) => a - b);

  return {
    dagNummer,
    verzonden: verzonden.sort((a, b) => a - b),
    gemist,
    onbekend,
    dagen,
    wachtrij,
    excuusPending: p.inhaalExcuusPending === true,
    specials: {
      dag15: special(15, p.dag15MailVerzonden === true),
      dag28: special(28, p.dag28MailVerzonden === true),
      dag30: special(30, p.dag30MailVerzonden === true),
    },
  };
}
