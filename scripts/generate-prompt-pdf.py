#!/usr/bin/env python3
"""Genereer de TTB schrijfprompt als PDF."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable,
    Table, TableStyle, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import Flowable
import os

OUTPUT = os.path.join(os.path.dirname(__file__), "..", "TTB_Schrijfprompt.pdf")

# Kleuren
BEIGE       = HexColor("#f5f0eb")
PRIMARY     = HexColor("#6d84a8")
PRIMARY_DARK= HexColor("#4a6080")
STONE_800   = HexColor("#292524")
STONE_600   = HexColor("#57534e")
STONE_400   = HexColor("#a8a29e")
STONE_100   = HexColor("#f5f5f4")
AMBER       = HexColor("#d97706")
RED_SOFT    = HexColor("#fef2f2")
RED_BORDER  = HexColor("#fca5a5")
GREEN_SOFT  = HexColor("#f0fdf4")
GREEN_BORDER= HexColor("#86efac")
CODE_BG     = HexColor("#f1f5f9")
CODE_BORDER = HexColor("#cbd5e1")

W, H = A4
MARGIN_L = 2.2 * cm
MARGIN_R = 2.2 * cm
CONTENT_W = W - MARGIN_L - MARGIN_R


def styles():
    base = getSampleStyleSheet()

    def s(name, **kw):
        return ParagraphStyle(name, **kw)

    return {
        "cover_title": s("cover_title",
            fontName="Helvetica-Bold", fontSize=26, textColor=STONE_800,
            leading=32, spaceAfter=8),
        "cover_sub": s("cover_sub",
            fontName="Helvetica", fontSize=13, textColor=STONE_600,
            leading=18, spaceAfter=4),
        "cover_url": s("cover_url",
            fontName="Helvetica", fontSize=11, textColor=PRIMARY,
            leading=16),
        "section": s("section",
            fontName="Helvetica-Bold", fontSize=13, textColor=white,
            leading=18, spaceAfter=0, spaceBefore=0,
            leftIndent=10, rightIndent=10),
        "subsection": s("subsection",
            fontName="Helvetica-Bold", fontSize=11, textColor=PRIMARY_DARK,
            leading=15, spaceAfter=4, spaceBefore=10),
        "body": s("body",
            fontName="Helvetica", fontSize=9.5, textColor=STONE_600,
            leading=14, spaceAfter=5, alignment=TA_JUSTIFY),
        "body_bold": s("body_bold",
            fontName="Helvetica-Bold", fontSize=9.5, textColor=STONE_800,
            leading=14, spaceAfter=5),
        "code": s("code",
            fontName="Courier", fontSize=8.5, textColor=STONE_800,
            leading=13, spaceAfter=2, leftIndent=6),
        "code_label": s("code_label",
            fontName="Helvetica-Bold", fontSize=8, textColor=STONE_400,
            leading=12, spaceAfter=2, leftIndent=6),
        "label": s("label",
            fontName="Helvetica-Bold", fontSize=9, textColor=PRIMARY_DARK,
            leading=13, spaceAfter=2),
        "label_val": s("label_val",
            fontName="Helvetica", fontSize=9, textColor=STONE_600,
            leading=13, spaceAfter=6, leftIndent=12),
        "note": s("note",
            fontName="Helvetica-Oblique", fontSize=8.5, textColor=STONE_400,
            leading=12, spaceAfter=4),
        "example_title": s("example_title",
            fontName="Helvetica-Bold", fontSize=9, textColor=AMBER,
            leading=13, spaceAfter=2),
        "example_body": s("example_body",
            fontName="Helvetica", fontSize=9, textColor=STONE_600,
            leading=13, spaceAfter=2, leftIndent=8),
    }


class SectionHeader(Flowable):
    def __init__(self, text, w=CONTENT_W):
        super().__init__()
        self.text = text
        self.w = w
        self.h = 26

    def wrap(self, availWidth, availHeight):
        return self.w, self.h

    def draw(self):
        c = self.canv
        c.setFillColor(PRIMARY)
        c.roundRect(0, 0, self.w, self.h, 4, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(10, 8, self.text)


class CodeBlock(Flowable):
    def __init__(self, lines, w=CONTENT_W, label=None):
        super().__init__()
        self.lines = lines
        self.w = w
        self.label = label
        line_h = 13
        pad = 10
        label_h = 16 if label else 0
        self.h = len(lines) * line_h + pad * 2 + label_h

    def wrap(self, availWidth, availHeight):
        return self.w, self.h

    def draw(self):
        c = self.canv
        c.setFillColor(CODE_BG)
        c.setStrokeColor(CODE_BORDER)
        c.roundRect(0, 0, self.w, self.h, 4, fill=1, stroke=1)
        line_h = 13
        pad = 10
        label_h = 16 if self.label else 0
        if self.label:
            c.setFillColor(STONE_400)
            c.setFont("Helvetica-Bold", 7.5)
            c.drawString(8, self.h - pad - 8, self.label)
        y = self.h - pad - label_h - 10
        for line in self.lines:
            color = PRIMARY_DARK if line.startswith("#") or line.startswith("//") else STONE_800
            if ":" in line and not line.startswith(" "):
                parts = line.split(":", 1)
                c.setFont("Helvetica-Bold", 8.5)
                c.setFillColor(PRIMARY_DARK)
                c.drawString(8, y, parts[0] + ":")
                c.setFont("Courier", 8.5)
                c.setFillColor(STONE_600)
                key_w = c.stringWidth(parts[0] + ":", "Helvetica-Bold", 8.5)
                c.drawString(8 + key_w + 2, y, parts[1])
            else:
                c.setFont("Courier", 8.5)
                c.setFillColor(color)
                c.drawString(8, y, line)
            y -= line_h


class NoteBox(Flowable):
    def __init__(self, text, w=CONTENT_W, color=None, border=None):
        super().__init__()
        self.text = text
        self.w = w
        self.bg = color or STONE_100
        self.border = border or STONE_400
        # Estimate height
        chars_per_line = int(w / 5.5)
        lines = max(1, len(text) // chars_per_line + text.count("\n") + 1)
        self.h = lines * 13 + 16

    def wrap(self, availWidth, availHeight):
        return self.w, self.h

    def draw(self):
        c = self.canv
        c.setFillColor(self.bg)
        c.setStrokeColor(self.border)
        c.roundRect(0, 0, self.w, self.h, 4, fill=1, stroke=1)
        c.setFillColor(STONE_800)
        c.setFont("Helvetica", 8.5)
        # Word-wrap manually
        words = self.text.replace("\n", " \n ").split(" ")
        chars_per_line = int((self.w - 20) / 5.4)
        lines_out = []
        cur = ""
        for w2 in words:
            if w2 == "\n":
                lines_out.append(cur.strip()); cur = ""; continue
            if len(cur) + len(w2) + 1 > chars_per_line:
                lines_out.append(cur.strip()); cur = w2 + " "
            else:
                cur += w2 + " "
        if cur.strip(): lines_out.append(cur.strip())
        y = self.h - 12
        for line in lines_out:
            c.drawString(10, y, line)
            y -= 13


class Divider(Flowable):
    def __init__(self, w=CONTENT_W):
        super().__init__()
        self.w = w
        self.h = 1

    def wrap(self, availWidth, availHeight):
        return self.w, self.h

    def draw(self):
        c = self.canv
        c.setStrokeColor(HexColor("#e7e5e4"))
        c.setLineWidth(0.5)
        c.line(0, 0, self.w, 0)


def section(title):
    return [Spacer(1, 0.35 * cm), SectionHeader(title), Spacer(1, 0.25 * cm)]


def sub(text, ST):
    return Paragraph(text, ST["subsection"])


def body(text, ST):
    return Paragraph(text, ST["body"])


def bold(text, ST):
    return Paragraph(text, ST["body_bold"])


def note(text, ST):
    return Paragraph(text, ST["note"])


def build_pdf():
    doc = SimpleDocTemplate(
        OUTPUT,
        pagesize=A4,
        leftMargin=MARGIN_L,
        rightMargin=MARGIN_R,
        topMargin=1.8 * cm,
        bottomMargin=1.8 * cm,
        title="TTB Schrijfprompt",
        author="Talk To Benji",
    )
    ST = styles()
    story = []

    # ── COVER ──────────────────────────────────────────────────────────────
    story += [
        Spacer(1, 0.6 * cm),
        Paragraph("Vaste schrijfprompt", ST["cover_title"]),
        Paragraph("Talk To Benji · talktobenji.com", ST["cover_url"]),
        Spacer(1, 0.3 * cm),
        Paragraph(
            "Gebruik deze prompt telkens wanneer je een nieuw artikel, pagina of blogtekst wilt laten schrijven. "
            "Kopieer de volledige prompt, vul de variabelen tussen [BLOKHAKEN] in en stuur op.",
            ST["body"]),
        Spacer(1, 0.2 * cm),
        HRFlowable(width=CONTENT_W, thickness=0.5, color=HexColor("#e7e5e4")),
        Spacer(1, 0.1 * cm),
    ]

    # ── 1. INVULVELDEN ─────────────────────────────────────────────────────
    story += section("1 · Invulvelden — kopieer en vul in")
    story.append(body(
        "Schrijf een <b>[SOORT CONTENT: blogartikel / pillar page / landingspagina]</b> voor Talk To Benji "
        "(talktobenji.com) over het onderwerp: <b>[ONDERWERP]</b>.", ST))
    story.append(Spacer(1, 0.15 * cm))
    story.append(body("Het primaire zoekwoord is: <b>[HOOFDZOEKWOORD]</b>", ST))
    story.append(body("Secundaire zoekwoorden: <b>[ZOEKWOORD 2]</b>, <b>[ZOEKWOORD 3]</b>, <b>[ZOEKWOORD 4]</b>", ST))

    # ── 2. OVER BENJI ──────────────────────────────────────────────────────
    story += section("2 · Over Talk To Benji")
    story.append(body(
        "Benji is een AI-gesprekspartner voor mensen die verdriet of verlies dragen. Benji is geen therapeut, "
        "geen hulpverlener en geen medische dienst. Benji is een warme, aandachtige aanwezigheid die luistert "
        "zonder te oordelen, 24 uur per dag, 7 dagen per week. Benji kan mensen wel zacht wijzen op professionele "
        "hulp als dat gepast lijkt, maar doet dat nooit opdringerig.", ST))

    # ── 3. TOON & STIJL ────────────────────────────────────────────────────
    story += section("3 · Toon en stijl")

    rows = [
        ("Perspectief", "Tweede persoon (jij/je)"),
        ("Toon", "Warm, menselijk, dichtbij — geen klinische taal"),
        ("Bullets & streepjes", "NOOIT gebruiken — ook niet als tijdelijke opmaak"),
        ("Vet in zinnen", "Nergens — alleen in de FAQ-vragen"),
        ("Alinea's", "Volledige alinea's; wissel lengte bewust af"),
        ("Korte alinea's", "Regelmatig één of twee zinnen tussendoor voor lucht en ritme"),
        ("Niveau", "Aanspreekbaar voor breed publiek, niet academisch"),
        ("Stem", "Vertrouwde vriend die ook goed geïnformeerd is"),
    ]
    tbl = Table(
        [[Paragraph(k, ST["label"]), Paragraph(v, ST["body"])] for k, v in rows],
        colWidths=[3.8 * cm, CONTENT_W - 3.8 * cm],
        spaceBefore=4, spaceAfter=4,
    )
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), STONE_100),
        ("BACKGROUND", (0, 0), (0, -1), HexColor("#e8eef5")),
        ("GRID", (0, 0), (-1, -1), 0.4, HexColor("#e7e5e4")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [white, STONE_100]),
    ]))
    story.append(tbl)

    # ── 4. INHOUD & STRUCTUUR ─────────────────────────────────────────────
    story += section("4 · Inhoud en structuur")

    structs = [
        ("Haak (opening)",
         "Begin met een concreet, herkenbaar moment — geen definitie, geen inleiding. "
         "3 tot 4 zinnen: één scherpe beeldende zin die de lezer ergens in de tijd plaatst, "
         "gevolgd door 2 à 3 zinnen die de emotie scherper maken."),
        ("In het kort-blok",
         "Direct na de haak. Begin altijd met de zin die aanzet tot verder lezen, gevolgd door "
         "4 tot 6 zinnen die de kern samenvatten. Spreek de lezer direct aan. "
         "Schrijf NIET 'dit artikel gaat over...'."),
        ("Zoekwoorden",
         "Verwerk organisch in de tekst, nooit geforceerd."),
        ("Koppen",
         "H2 en H3 — zoekwoordrijk én menselijk. Schrijf na elke H2 minimaal twee alinea's "
         "voordat een nieuwe H2 of H3 volgt."),
        ("Afsluiting",
         "Zachte CTA naar Benji — geen harde verkoop, een uitnodiging."),
        ("FAQ-blok",
         "Minimaal 4 vragen en antwoorden over dit onderwerp. "
         "Wordt opgepikt door AI-zoekmachines zoals ChatGPT, Perplexity en Google AI Overviews."),
    ]
    for title_s, desc in structs:
        story.append(KeepTogether([
            Paragraph(title_s, ST["subsection"]),
            Paragraph(desc, ST["body"]),
        ]))

    # ── 5. OPMAAKFORMAT ───────────────────────────────────────────────────
    story += section("5 · Opmaakformat voor CMS-import (verplicht)")

    story.append(body(
        "Lever elk artikel aan in <b>twee delen</b>. De website importeert de output automatisch — "
        "gebruik exact deze opmaak, anders moet alles handmatig worden bijgewerkt.", ST))

    story += [Spacer(1, 0.15 * cm), sub("Deel 1 — Markdown voor het importeerveld", ST)]
    story.append(body(
        "Begint altijd met de <b># Artikeltitel</b> op regel 1, "
        "direct gevolgd door de koptekst-labels (zie hieronder). "
        "Geen extra regels, geen header boven de titel.", ST))
    story.append(Spacer(1, 0.1 * cm))
    story.append(CodeBlock([
        "# Artikeltitel",
        "Slug: de-exacte-url-slug",
        "SEO-titel: max 60 tekens",
        "Meta description: 140-155 tekens",
        'Ankerzinnen: "ankerzin 1" | "ankerzin 2" | "ankerzin 3"',
        'Interne links: "ankerzin" → /blog/slug | "ankerzin" → /blog/slug',
        "",
        "[volledige artikeltekst in markdown]",
        "",
        "## Veelgestelde vragen",
        "**Vraag 1?**",
        "Antwoord op vraag 1.",
        "",
        "## Bronnen",
        "Auteursnaam (jaar). Titel. Uitgever.",
    ], label="MARKDOWN — kopieer dit veld naar het importeerveld"))
    story.append(NoteBox(
        "Slug: maximaal 6-7 woorden, geen lidwoorden, alleen koppeltekens. "
        "Baseer op de artikeltitel, niet op de SEO-titel. "
        "Voorbeeld: 'Waarom komt het verdriet steeds terug?' → waarom-komt-verdriet-steeds-terug-golven",
        color=HexColor("#eff6ff"), border=PRIMARY))

    story += [Spacer(1, 0.25 * cm), sub("Deel 2 — Losse velden (handmatig invoeren)", ST)]
    story.append(body(
        "Alleen de velden die NIET al in de koptekst of het artikel staan. "
        "Zet deze direct onder het artikel.", ST))
    story.append(Spacer(1, 0.1 * cm))
    story.append(CodeBlock([
        "SAMENVATTING: 2-3 zinnen voor de kennisbank + social media caption.",
        "              Op zichzelf staande tekst, niet als aankondiging.",
        "",
        "FOCUSZOEKWOORD: het primaire zoekwoord (één woord of korte combinatie)",
    ], label="LOSSE VELDEN — van boven naar beneden in het CMS invoeren"))
    story.append(NoteBox(
        "TITEL, SLUG, SEO-TITEL, META DESCRIPTION en BRONNEN hoeven hier NIET meer — "
        "die worden automatisch uit de koptekst en de ## Bronnen-sectie gehaald.",
        color=GREEN_SOFT, border=GREEN_BORDER))

    # ── 6. OPMAAK DETAILS ────────────────────────────────────────────────
    story += section("6 · Opmaakdetails")

    details = [
        ("Vet (**vet**)",
         "Gebruik ALLEEN voor de vragen in het FAQ-blok. Nergens anders."),
        ("Citaten",
         "Zet op eigen regel met > ervoor. Verschijnt als geciteerd blok in het artikel."),
        ("Opsommingen",
         "GEEN streepjes of bullets — ook niet in de bronnenlijst. "
         "Schrijf als lopende zinnen of losse alinea's. Elke bron op eigen alinea."),
        ("Bronnen",
         "Alleen als het artikel wetenschappelijke modellen of onderzoek bevat. "
         "Sectie ## Bronnen. Elke bron op eigen alinea, beginnend met de auteursnaam."),
        ("FAQ-sectie",
         "Kopnaam altijd: ## Veelgestelde vragen. "
         "Elke vraag als **Vraag?** op eigen regel, antwoord direct eronder als gewone alinea."),
    ]
    for t, d in details:
        story.append(KeepTogether([
            Paragraph(t, ST["subsection"]),
            Paragraph(d, ST["body"]),
        ]))

    # ── 7. FEATURE-BLOKKEN ────────────────────────────────────────────────
    story += section("7 · Feature-blokken (Benji-tags)")

    story.append(body(
        "Voeg op relevante plekken een actief feature-blok in. Maximaal 2 per artikel. "
        "Zet de tag op een eigen regel, omringd door witruimte, met één korte aansprekende zin erboven.", ST))
    story.append(Spacer(1, 0.1 * cm))

    tags = [
        ("[benji:reflectie]", "Moment van zelfinzicht of stilte"),
        ("[benji:nacht]", "'s Nachts wakker liggen of donkere uren"),
        ("[benji:herinnering]", "Herinneringen ophalen of iemand eren"),
        ("[benji:emotie]", "Emoties benoemen of voelen"),
        ("[benji:checkin]", "Moment om bij jezelf in te checken"),
        ("[benji:memories]", "Herinnering vastleggen of delen"),
        ("[benji:landing]", "Algemene uitnodiging aan het einde"),
    ]
    tag_tbl = Table(
        [[Paragraph(t, ST["code"]), Paragraph(d, ST["body"])] for t, d in tags],
        colWidths=[4.2 * cm, CONTENT_W - 4.2 * cm],
        spaceBefore=4, spaceAfter=4,
    )
    tag_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), CODE_BG),
        ("GRID", (0, 0), (-1, -1), 0.4, CODE_BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("ROWBACKGROUNDS", (1, 0), (-1, -1), [white, STONE_100]),
    ]))
    story.append(tag_tbl)

    story.append(Spacer(1, 0.15 * cm))
    story.append(CodeBlock([
        "Als je merkt dat de woorden blijven hangen, hoef je ze niet alleen te dragen.",
        "",
        "[benji:reflectie]",
        "",
        "Benji is er ook als het drie uur 's nachts is en je de gedachten",
        "nergens kwijt kunt.",
        "",
        "[benji:nacht]",
    ], label="VOORBEELD — feature-blokken in de tekst"))

    # ── 8. FEITELIJKE EISEN ───────────────────────────────────────────────
    story += section("8 · Feitelijke eisen (verplicht)")

    eisen = [
        "Schrijf geen beweringen op die je niet zeker weet. "
        "Gebruik 'onderzoek suggereert' of 'uit studies blijkt' in plaats van absolute claims.",
        "Schrijf NOOIT dat Benji therapie, behandeling of professionele hulp biedt. "
        "Benji luistert. Benji is er. Dat is alles.",
        "Gebruik correcte Nederlandse spelling en grammatica.",
    ]
    for e in eisen:
        story.append(NoteBox(e, color=RED_SOFT, border=RED_BORDER))
        story.append(Spacer(1, 0.1 * cm))

    # ── 9. LENGTE ─────────────────────────────────────────────────────────
    story += section("9 · Lengte")

    len_data = [
        ("Blogartikel", "700 – 1.000 woorden"),
        ("Pillar page", "1.400 – 1.800 woorden"),
        ("Landingspagina", "400 – 600 woorden"),
    ]
    len_tbl = Table(
        [[Paragraph(t, ST["body_bold"]), Paragraph(v, ST["body"])] for t, v in len_data],
        colWidths=[4.5 * cm, CONTENT_W - 4.5 * cm],
    )
    len_tbl.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.4, HexColor("#e7e5e4")),
        ("BACKGROUND", (0, 0), (-1, -1), STONE_100),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [white, STONE_100]),
    ]))
    story.append(len_tbl)

    # ── 10. EXTRA CONTEXT ─────────────────────────────────────────────────
    story += section("10 · Extra context voor dit artikel")

    story.append(body(
        "Vul hier aanvullende context in:", ST))
    for item in [
        "Doelgroep en specifieke invalshoek",
        "Persoonlijke noot die je wil meegeven",
        "Links naar eerder gepubliceerde content om intern naar te linken",
        "Feature-blok voorkeur (bijv. gebruik [benji:nacht] na het stuk over 's nachts wakker liggen)",
    ]:
        story.append(Paragraph(f"· {item}", ST["body"]))

    # ── 11. MEERDERE ARTIKELEN ────────────────────────────────────────────
    story += section("11 · Meerdere artikelen in één opdracht")

    story.append(body(
        "Voeg onderaan je prompt toe:", ST))
    story.append(Spacer(1, 0.1 * cm))
    story.append(CodeBlock([
        "MEERDERE ARTIKELEN:",
        "Schrijf elk artikel volledig af voordat je begint aan het volgende.",
        "Sluit elk artikel af met deze scheidingslijn op een eigen regel:",
        "",
        "---EINDE ARTIKEL [NUMMER]: [ARTIKELTITEL]---",
        "",
        "Begin het volgende artikel daarna direct op een nieuwe regel.",
    ], label="TOEVOEGEN AAN JE PROMPT"))

    # ── 12. VERIFICATIE ───────────────────────────────────────────────────
    story += section("12 · Verificatie na het schrijven")

    story.append(body(
        "Vraag na het schrijven altijd:", ST))
    story.append(NoteBox(
        '"Controleer of er beweringen in staan die niet zeker zijn '
        'of die Benji positioneren als hulpverlener."',
        color=HexColor("#fffbeb"), border=AMBER))

    # ── SNELSTART VOORBEELD ───────────────────────────────────────────────
    story += section("Snelstart voorbeeld")

    story.append(body(
        "Zo gebruik je de prompt voor het artikel over niet kunnen slapen van verdriet:", ST))
    story.append(Spacer(1, 0.1 * cm))
    story.append(CodeBlock([
        "Soort content:         blogartikel",
        "Onderwerp:             waarom verdriet 's nachts zwaarder voelt",
        "                       en wat je kunt doen als je wakker ligt",
        "Primair zoekwoord:     niet kunnen slapen van verdriet",
        "Secundaire zoekwoorden: verdriet s nachts wakker, slapeloosheid na verlies,",
        "                        wakker liggen van gemis",
        "Extra context:         linkt naar pillar page over rouw en verdriet.",
        "                       Doelgroep: mensen kort na een verlies, nachten als zwaarst.",
        "Feature-blok:          gebruik [benji:nacht] na het stuk over 's nachts wakker.",
    ], label="INGEVULD VOORBEELD"))

    # ── FOOTER ────────────────────────────────────────────────────────────
    story += [
        Spacer(1, 0.5 * cm),
        HRFlowable(width=CONTENT_W, thickness=0.5, color=HexColor("#e7e5e4")),
        Spacer(1, 0.15 * cm),
        Paragraph(
            "Talk To Benji · talktobenji.com · Schrijfprompt v2",
            ParagraphStyle("footer", fontName="Helvetica", fontSize=8,
                           textColor=STONE_400, alignment=TA_CENTER)),
    ]

    doc.build(story)
    print(f"PDF aangemaakt: {OUTPUT}")


if __name__ == "__main__":
    build_pdf()
