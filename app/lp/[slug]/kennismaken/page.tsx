"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// Formulier-inhoud per verliestype. De rest van de vragen is gedeeld.
const GEDEELDE_LEDE = "Dit is geen inschrijving, maar een eerste kennismaking. Kosteloos en vrijblijvend. Ik lees alles zelf, en ik ben eerlijk: Zij aan Zij past niet bij iedereen, en dat is oke. Deze vragen helpen ons allebei om te voelen of het klopt.";

type FormCfg = {
  lede: string;
  situatieLegend: string;
  wieLabel: string; wieKey: string; wieOpties: string[];
  wanneerLabel: string; wanneerKey: string; wanneerOpties: string[];
  zwaarstLabel: string;
};

const FORMS: Record<string, FormCfg> = {
  persoon: {
    lede: GEDEELDE_LEDE,
    situatieLegend: "Je verlies",
    wieLabel: "Wie ben je verloren?", wieKey: "Wie verloren",
    wieOpties: ["Mijn partner", "Mijn kind", "Mijn vader of moeder", "Een broer of zus", "Een ander familielid", "Een dierbare vriend(in)", "Iemand anders"],
    wanneerLabel: "Hoe lang geleden?", wanneerKey: "Hoe lang geleden",
    wanneerOpties: ["Korter dan 3 maanden", "3 tot 12 maanden", "1 tot 3 jaar", "Langer dan 3 jaar"],
    zwaarstLabel: "Wat is op dit moment het zwaarst voor je?",
  },
  kinderloos: {
    lede: GEDEELDE_LEDE,
    situatieLegend: "Je situatie",
    wieLabel: "Wat past het beste bij jouw situatie?", wieKey: "Situatie",
    wieOpties: [
      "We hebben het lang geprobeerd, het is niet gelukt",
      "Om medische redenen kan het niet (meer)",
      "Geen partner om het mee te doen",
      "Ik heb een zwangerschap of kindje verloren",
      "Mijn kinderwens is onvervuld gebleven",
      "Anders",
    ],
    wanneerLabel: "Hoe lang draag je dit al?", wanneerKey: "Hoe lang al",
    wanneerOpties: ["Korter dan 3 maanden", "3 tot 12 maanden", "1 tot 3 jaar", "Langer dan 3 jaar"],
    zwaarstLabel: "Wat is op dit moment het zwaarst voor je?",
  },
};

const CSS = `
.kmk{--ground:#ecefe9;--surface:#fff;--ink:#212b24;--ink-soft:#485349;--muted:#7c8a7f;--line:#d6ddd3;--accent:#4a7c59;--accent-strong:#3b6448;--accent-wash:#e5efe7;--warn:#a8442f;--warn-wash:#f6e7e2;--serif:"Spectral",Georgia,serif;--sans:"Mulish",system-ui,-apple-system,"Segoe UI",sans-serif;min-height:100vh;background:var(--ground);color:var(--ink);font-family:var(--sans);line-height:1.6;-webkit-font-smoothing:antialiased}
.kmk *{box-sizing:border-box}
.kmk .wrap{max-width:40rem;margin:0 auto;padding:0 1.5rem}
.kmk h1,.kmk h2{font-family:var(--serif);font-weight:500;letter-spacing:-.005em;line-height:1.16;margin:0}
.kmk a{color:var(--accent-strong)}
.kmk .eyebrow{font-size:.72rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--accent)}
.kmk .top{padding:2.6rem 0 1.4rem}
.kmk .brand{display:flex;align-items:center;gap:.6rem;margin-bottom:1.6rem}
.kmk .brand img{width:34px;height:34px;border-radius:9px;display:block}
.kmk .brand b{font-weight:700;font-size:.9rem;color:var(--ink)}
.kmk .brand span{font-size:.78rem;color:var(--muted);font-weight:600}
.kmk .top h1{font-size:clamp(1.9rem,4.6vw,2.5rem);margin-bottom:.9rem}
.kmk .top .lede{color:var(--ink-soft);font-size:1.06rem;max-width:34rem}
.kmk .top .lede b{color:var(--ink);font-weight:700}
.kmk form{padding-bottom:1rem}
.kmk fieldset{border:0;margin:0;padding:0;border-top:1px solid var(--line);padding-top:2rem;margin-top:2rem}
.kmk fieldset:first-of-type{border-top:0;margin-top:1.4rem;padding-top:0}
.kmk legend{padding:0;margin-bottom:1.1rem}
.kmk legend .eyebrow{display:block;margin-bottom:.35rem}
.kmk legend .hint{font-size:.92rem;color:var(--muted);font-weight:400}
.kmk .field{margin-bottom:1.15rem}
.kmk .field:last-child{margin-bottom:0}
.kmk label.q{display:block;font-weight:700;font-size:.97rem;margin-bottom:.45rem;color:var(--ink)}
.kmk label.q .opt{font-weight:500;color:var(--muted);font-size:.85rem}
.kmk .sub{font-size:.88rem;color:var(--muted);margin:-.2rem 0 .5rem}
.kmk input[type=text],.kmk input[type=email],.kmk input[type=tel],.kmk select,.kmk textarea{width:100%;font-family:var(--sans);font-size:1rem;color:var(--ink);background:var(--surface);border:1px solid var(--line);border-radius:11px;padding:.7rem .85rem;transition:border-color .15s ease,box-shadow .15s ease}
.kmk textarea{min-height:5.5rem;resize:vertical;line-height:1.55}
.kmk select{appearance:none;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%237c8a7f' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'><path d='M6 9l6 6 6-6'/></svg>");background-repeat:no-repeat;background-position:right .8rem center;padding-right:2.3rem}
.kmk input:focus,.kmk select:focus,.kmk textarea:focus{outline:0;border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-wash)}
.kmk ::placeholder{color:var(--muted);opacity:.8}
.kmk .choices{display:flex;flex-direction:column;gap:.5rem}
.kmk .choice{display:flex;align-items:flex-start;gap:.65rem;background:var(--surface);border:1px solid var(--line);border-radius:11px;padding:.7rem .85rem;cursor:pointer;transition:border-color .15s ease,background .15s ease}
.kmk .choice:hover{border-color:var(--accent)}
.kmk .choice input{margin:.15rem 0 0;accent-color:var(--accent);width:1.05rem;height:1.05rem;flex-shrink:0}
.kmk .choice span{font-size:.96rem;color:var(--ink-soft)}
.kmk .choice span b{color:var(--ink);font-weight:700}
.kmk .choice:has(input:checked){border-color:var(--accent);background:var(--accent-wash)}
.kmk .grid2{display:grid;grid-template-columns:1fr 1fr;gap:.9rem}
@media (max-width:520px){.kmk .grid2{grid-template-columns:1fr}}
.kmk .crisis{margin-top:.7rem;border:1px solid var(--warn);background:var(--warn-wash);border-radius:12px;padding:1rem 1.15rem;font-size:.95rem;color:var(--ink)}
.kmk .crisis b{color:var(--warn)}
.kmk .crisis p{margin:.4rem 0 0;color:var(--ink-soft)}
.kmk .send{margin-top:2rem;border-top:1px solid var(--line);padding-top:1.7rem}
.kmk .btn{display:inline-flex;align-items:center;gap:.5rem;font-weight:700;font-size:1rem;padding:.85rem 1.7rem;border-radius:999px;border:0;cursor:pointer;background:var(--accent);color:#fff;transition:background .18s ease,transform .14s ease}
.kmk .btn:hover{background:var(--accent-strong);transform:translateY(-1px)}
.kmk .btn:disabled{opacity:.5;cursor:default;transform:none}
.kmk .send .note{font-size:.9rem;color:var(--muted);margin:1rem 0 0;max-width:32rem}
.kmk .foutmelding{color:var(--warn);font-size:.92rem;margin:.8rem 0 0}
.kmk .done{padding:3rem 0 1rem}
.kmk .done .mark{width:3.2rem;height:3.2rem;border-radius:50%;background:var(--accent-wash);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;margin-bottom:1.4rem}
.kmk .done .mark svg{width:1.5rem;height:1.5rem;color:var(--accent)}
.kmk .done h2{font-size:clamp(1.6rem,4vw,2.1rem);margin-bottom:.9rem}
.kmk .done p{color:var(--ink-soft);font-size:1.05rem;max-width:33rem;margin:0 0 1rem}
.kmk footer{border-top:1px solid var(--line);margin-top:2.4rem;padding:1.6rem 0 2.4rem}
.kmk footer p{font-size:.86rem;color:var(--muted);margin:0}
`;

const LEEG = {
  naam: "", email: "", tel: "", wie: "", wanneer: "", zwaarst: "", hoop: "", waarom: "",
  safety: "", hulp: "", akkoord_therapie: false, akkoord_ien: false, akkoord_benji: false,
  budget: "", extra: "",
};

export default function KennismakenPage() {
  const params = useParams<{ slug: string }>();
  const slug = (params?.slug as string) ?? "";
  const verstuur = useMutation(api.blokPaginas.verstuurIntake);
  const meta = useQuery(api.blokPaginas.intakeMeta, slug ? { slug } : "skip");
  const cfg = FORMS[meta?.verliestype ?? ""] ?? FORMS.persoon;
  const [f, setF] = useState({ ...LEEG });
  const [bezig, setBezig] = useState(false);
  const [klaar, setKlaar] = useState(false);
  const [fout, setFout] = useState("");

  const set = (k: keyof typeof LEEG, v: any) => setF((s) => ({ ...s, [k]: v }));
  const toonCrisis = f.safety === "soms" || f.safety === "acuut";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFout("");
    setBezig(true);
    try {
      const velden: Record<string, string> = {
        "Telefoon": f.tel,
        [cfg.wieKey]: f.wie,
        [cfg.wanneerKey]: f.wanneer,
        "Wat is nu het zwaarst": f.zwaarst,
        "Wat hoop je dat de 8 weken brengen": f.hoop,
        "Waarom nu": f.waarom,
        "Hoe gaat het echt": f.safety,
        "Professionele hulp": f.hulp,
        "Begrijpt wat het wel/niet is": [
          f.akkoord_therapie ? "geen therapie/crisishulp" : "",
          f.akkoord_ien ? "Ien niet dag en nacht" : "",
          f.akkoord_benji ? "oke met Benji (AI)" : "",
        ].filter(Boolean).join(" · "),
        "Investering €425 past": f.budget,
        "Nog vooraf te weten": f.extra,
      };
      await verstuur({
        paginaSlug: slug,
        naam: f.naam.trim(),
        email: f.email.trim(),
        veldenJson: JSON.stringify(velden),
      });
      setKlaar(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setFout(err?.message || "Er ging iets mis, probeer het opnieuw.");
    } finally {
      setBezig(false);
    }
  }

  return (
    <div className="kmk">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Mulish:wght@400;500;600;700;800&display=swap" />
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="wrap">
        <div className="top">
          <div className="brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/benji-logo-2.png" alt="" />
            <b>Talk To Benji</b><span>· Zij aan Zij</span>
          </div>

          {klaar ? (
            <div className="done">
              <div className="mark">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
              </div>
              <h2>Dank je wel. Het is bij me binnen.</h2>
              <p>Ik lees je bericht zelf, rustig, en neem binnen twee werkdagen contact met je op. Je hebt ook een bevestiging in je mail gekregen.</p>
              <p>Mocht het tot die tijd zwaar worden: Benji is er dag en nacht.</p>
            </div>
          ) : (
            <>
              <span className="eyebrow" style={{ display: "block", marginBottom: ".8rem" }}>Even kennismaken</span>
              <h1>Vertel me kort wie je bent</h1>
              <p className="lede">Dit is geen inschrijving, maar een eerste kennismaking. <b>Kosteloos en vrijblijvend.</b> Ik lees alles zelf, en ik ben eerlijk: Zij aan Zij past niet bij iedereen, en dat is oke. Deze vragen helpen ons allebei om te voelen of het klopt.</p>
            </>
          )}
        </div>

        {!klaar && (
          <form onSubmit={onSubmit}>
            <fieldset>
              <legend><span className="eyebrow">Over jou</span></legend>
              <div className="grid2">
                <div className="field">
                  <label className="q" htmlFor="naam">Je naam</label>
                  <input type="text" id="naam" required autoComplete="name" value={f.naam} onChange={(e) => set("naam", e.target.value)} />
                </div>
                <div className="field">
                  <label className="q" htmlFor="email">E-mailadres</label>
                  <input type="email" id="email" required autoComplete="email" value={f.email} onChange={(e) => set("email", e.target.value)} />
                </div>
              </div>
              <div className="field">
                <label className="q" htmlFor="tel">Telefoonnummer <span className="opt">(optioneel)</span></label>
                <input type="tel" id="tel" autoComplete="tel" value={f.tel} onChange={(e) => set("tel", e.target.value)} />
              </div>
            </fieldset>

            <fieldset>
              <legend><span className="eyebrow">{cfg.situatieLegend}</span></legend>
              <div className="grid2">
                <div className="field">
                  <label className="q" htmlFor="wie">{cfg.wieLabel}</label>
                  <select id="wie" required value={f.wie} onChange={(e) => set("wie", e.target.value)}>
                    <option value="" disabled>Kies wat past</option>
                    {cfg.wieOpties.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="q" htmlFor="wanneer">{cfg.wanneerLabel}</label>
                  <select id="wanneer" required value={f.wanneer} onChange={(e) => set("wanneer", e.target.value)}>
                    <option value="" disabled>Kies wat past</option>
                    {cfg.wanneerOpties.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <label className="q" htmlFor="zwaarst">{cfg.zwaarstLabel}</label>
                <p className="sub">In je eigen woorden. Een paar zinnen is genoeg, je hoeft het niet mooi te maken.</p>
                <textarea id="zwaarst" required value={f.zwaarst} onChange={(e) => set("zwaarst", e.target.value)} />
              </div>
            </fieldset>

            <fieldset>
              <legend><span className="eyebrow">Wat je zoekt</span></legend>
              <div className="field">
                <label className="q" htmlFor="hoop">Wat hoop je dat deze acht weken je brengen?</label>
                <p className="sub">Er is geen goed antwoord. Ik wil vooral weten wat je verwacht.</p>
                <textarea id="hoop" required value={f.hoop} onChange={(e) => set("hoop", e.target.value)} />
              </div>
              <div className="field">
                <label className="q" htmlFor="waarom">Waarom nu? <span className="opt">(optioneel)</span></label>
                <p className="sub">Is er iets dat maakt dat je juist op dit moment de stap zet?</p>
                <textarea id="waarom" value={f.waarom} onChange={(e) => set("waarom", e.target.value)} />
              </div>
            </fieldset>

            <fieldset>
              <legend>
                <span className="eyebrow">Belangrijk, voor jou en voor mij</span>
                <span className="hint">Zodat we allebei weten waar we aan toe zijn.</span>
              </legend>

              <div className="field">
                <label className="q">Hoe gaat het op dit moment echt met je?</label>
                <p className="sub">Ik vraag dit serieus, omdat Zij aan Zij geen crisishulp is. Je antwoord verandert niks aan of je welkom bent.</p>
                <div className="choices">
                  {[
                    { v: "stabiel", t: "Ik heb verdriet, maar ik ben veilig bij mezelf." },
                    { v: "soms", t: "Ik heb soms donkere gedachten, maar niet acuut." },
                    { v: "acuut", t: "Ik denk er soms aan om er niet meer te zijn." },
                  ].map((o) => (
                    <label className="choice" key={o.v}><input type="radio" name="safety" required checked={f.safety === o.v} onChange={() => set("safety", o.v)} /><span>{o.t}</span></label>
                  ))}
                </div>
                {toonCrisis && (
                  <div className="crisis">
                    <b>Fijn dat je dit eerlijk deelt.</b>
                    <p>Dit bespreken we samen in het kennismakingsgesprek, en ik denk met je mee over wat je op dit moment het beste kan helpen. Je bent hier welkom.</p>
                  </div>
                )}
              </div>

              <div className="field">
                <label className="q">Krijg je op dit moment professionele hulp?</label>
                <p className="sub">Bijvoorbeeld van je huisarts, een psycholoog of therapeut.</p>
                <div className="choices">
                  {[{ v: "nee", t: "Nee" }, { v: "ja", t: "Ja" }, { v: "ooit", t: "Niet nu, wel eerder gehad" }].map((o) => (
                    <label className="choice" key={o.v}><input type="radio" name="hulp" required checked={f.hulp === o.v} onChange={() => set("hulp", o.v)} /><span>{o.t}</span></label>
                  ))}
                </div>
              </div>

              <div className="field agree">
                <label className="q">Weet je wat Zij aan Zij wel en niet is?</label>
                <div className="choices">
                  <label className="choice"><input type="checkbox" required checked={f.akkoord_therapie} onChange={(e) => set("akkoord_therapie", e.target.checked)} /><span>Ik begrijp dat dit <b>geen therapie of crisishulp</b> is.</span></label>
                  <label className="choice"><input type="checkbox" required checked={f.akkoord_ien} onChange={(e) => set("akkoord_ien", e.target.checked)} /><span>Ik weet dat <b>Ien er niet dag en nacht is</b>, en dat Benji dat deel opvangt.</span></label>
                  <label className="choice"><input type="checkbox" required checked={f.akkoord_benji} onChange={(e) => set("akkoord_benji", e.target.checked)} /><span>Ik ben oke met <b>chatten met Benji</b> (AI) tussen de gesprekken door.</span></label>
                </div>
              </div>

              <div className="field">
                <label className="q">De investering is &euro;425 voor acht weken. Past dat bij je?</label>
                <div className="choices">
                  {[{ v: "ja", t: "Ja, dat is duidelijk." }, { v: "overleg", t: "Ik wil er graag eerst even over praten." }].map((o) => (
                    <label className="choice" key={o.v}><input type="radio" name="budget" required checked={f.budget === o.v} onChange={() => set("budget", o.v)} /><span>{o.t}</span></label>
                  ))}
                </div>
              </div>
            </fieldset>

            <fieldset>
              <legend><span className="eyebrow">Tot slot</span></legend>
              <div className="field">
                <label className="q" htmlFor="extra">Is er iets wat ik vooraf zou moeten weten? <span className="opt">(optioneel)</span></label>
                <textarea id="extra" value={f.extra} onChange={(e) => set("extra", e.target.value)} />
              </div>
            </fieldset>

            <div className="send">
              <button className="btn" type="submit" disabled={bezig}>{bezig ? "Versturen..." : "Versturen naar Ien"}</button>
              {fout && <p className="foutmelding">{fout}</p>}
              <p className="note">Ik lees je bericht zelf en neem binnen twee werkdagen contact met je op. Je krijgt zo een bevestiging in je mail.</p>
            </div>
          </form>
        )}

        <footer>
          <p>Ik lees je bericht zelf, rustig. Je zit nergens aan vast.</p>
        </footer>
      </div>
    </div>
  );
}
