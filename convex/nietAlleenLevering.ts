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

// Eerste cron-run met het leveringslogboek live (10 juni 2026, 08:00 UTC).
// Dagmails die hiervóór gepland stonden zijn niet betrouwbaar geregistreerd.
export const LEVERING_LOGBOEK_VANAF = Date.UTC(2026, 5, 10, 8, 0);

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

function statusVoor(dueAt: number, geregistreerd: boolean, heeftLog: boolean, now: number): DagStatus {
  if (geregistreerd) return "verzonden";
  if (dueAt > now) return "tekomen";
  // Niet geregistreerd én de dag is geweest. Alleen "gemist" als we het ook écht
  // zouden moeten weten: het logboek was live (dueAt >= cutover) of dit profiel
  // heeft al geregistreerde dagen (dan is de lijst leidend en is een gat een gat).
  if (heeftLog || dueAt >= LEVERING_LOGBOEK_VANAF) return "gemist";
  return "onbekend";
}

export function berekenLevering(p: LeveringProfiel, now: number): Levering {
  const dagNummer = Math.floor((now - p.startDatum) / DAG_MS) + 1;
  const verzondenSet = new Set(p.verzondenDagen ?? []);
  const heeftLog = (p.verzondenDagen?.length ?? 0) > 0;

  const dagen: { dag: number; status: DagStatus }[] = [];
  const verzonden: number[] = [];
  const gemist: number[] = [];
  const onbekend: number[] = [];

  for (let d = 1; d <= 30; d++) {
    const dueAt = p.startDatum + (d - 1) * DAG_MS;
    const status = statusVoor(dueAt, verzondenSet.has(d), heeftLog, now);
    dagen.push({ dag: d, status });
    if (status === "verzonden") verzonden.push(d);
    else if (status === "gemist") gemist.push(d);
    else if (status === "onbekend") onbekend.push(d);
  }

  const special = (dag: number, vlag: boolean): SpecialStatus => {
    const dueAt = p.startDatum + (dag - 1) * DAG_MS;
    const status = statusVoor(dueAt, vlag, heeftLog, now);
    return { due: dueAt <= now, verzonden: vlag, status };
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
