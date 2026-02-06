#!/usr/bin/env node
/**
 * Opschonen van knowledge base export
 * - Verwijder streepjes ( - ) → vervang door ", "
 * - Identificeer potentiële dubbele/overlappende Q&As
 */

import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const cleanStreepjes = (text) => {
  if (!text || typeof text !== "string") return text;
  return text
    .replace(/\s+[-\u2013\u2014]\s+/g, ", ")  // - en – en —
    .replace(/\n-{2,}\s*\n/g, "\n\n")
    .replace(/^\s*-\s+/gm, "• ")
    .replace(/\s{2,}/g, " ")
    .trim();
};

const inputPath = process.argv[2] || join(__dirname, "../knowledge-base-export.json");
const outputPath = process.argv[3] || join(__dirname, "../knowledge-base-cleaned.json");
const reportPath = join(__dirname, "../KNOWLEDGE_BASE_REVIEW.md");

// Vergelijkbare woorden voor duplicate detectie (simplified)
const normalizeForCompare = (s) =>
  s
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const main = () => {
  let data;
  try {
    data = JSON.parse(readFileSync(inputPath, "utf-8"));
  } catch (e) {
    console.error(`Kan bestand niet lezen: ${inputPath}`);
    process.exit(1);
  }

  const items = Array.isArray(data) ? data : [data];
  const report = [];
  let streepjesCount = 0;

  // Schoonmaken
  const cleaned = items.map((q) => {
    const origQ = q.question || "";
    const origA = q.answer || "";
    const cleanQ = cleanStreepjes(origQ);
    const cleanA = cleanStreepjes(origA);
    const cleanAltQ = (q.alternativeQuestions || []).map(cleanStreepjes).filter(Boolean);
    const cleanAltA = (q.alternativeAnswers || []).map(cleanStreepjes).filter(Boolean);

    if (origQ !== cleanQ || origA !== cleanA) streepjesCount++;

    return {
      question: cleanQ,
      answer: cleanA,
      category: q.category || "Overig",
      tags: q.tags || [],
      alternativeQuestions: cleanAltQ.length ? cleanAltQ : undefined,
      alternativeAnswers: cleanAltA.length ? cleanAltA : undefined,
      priority: q.priority ?? 1,
    };
  });

  // Dubbele detectie (eenvoudig: vraag begint metzelfde woorden of bevatzelfde kern)
  const duplicates = [];
  const questions = cleaned.map((q) => q.question);
  for (let i = 0; i < questions.length; i++) {
    for (let j = i + 1; j < questions.length; j++) {
      const a = normalizeForCompare(questions[i]);
      const b = normalizeForCompare(questions[j]);
      const wordsA = a.split(" ").filter((w) => w.length > 3);
      const wordsB = b.split(" ").filter((w) => w.length > 3);
      const overlap = wordsA.filter((w) => wordsB.includes(w)).length;
      const minLen = Math.min(wordsA.length, wordsB.length);
      if (minLen > 0 && overlap / minLen > 0.6) {
        duplicates.push({ q1: questions[i], q2: questions[j], overlap: (overlap / minLen * 100).toFixed(0) + "%" });
      }
    }
  }

  // Schrijf cleaned JSON (zonder _id etc voor bulk import)
  writeFileSync(outputPath, JSON.stringify(cleaned, null, 2), "utf-8");
  console.log(`✅ Opgeschoond: ${outputPath}`);
  console.log(`   ${streepjesCount} Q&As hadden streepjes die zijn aangepast`);
  console.log(`   ${duplicates.length} mogelijke dubbele paren gevonden`);

  // Rapportsectie
  report.push("# Knowledge Base Review – " + new Date().toISOString().slice(0, 10));
  report.push("");
  report.push("## Samenvatting");
  report.push(`- **Totaal Q&As:** ${cleaned.length}`);
  report.push(`- **Streepjes opgeschoond:** ${streepjesCount} Q&As`);
  report.push(`- **Mogelijke dubbele/overlappende vragen:** ${duplicates.length} paren`);
  report.push("");
  report.push("## Streepjes verwijderd");
  report.push("De volgende patronen zijn vervangen: ` - ` → `, ` in alle vraag-, antwoord- en alternatieven-teksten.");
  report.push("");
  report.push("## Mogelijke dubbele of overlappende Q&As");
  if (duplicates.length === 0) {
    report.push("Geen duidelijke duplicaten gevonden.");
  } else {
    report.push("Overweeg om deze te combineren of de ene te laten verwijzen naar de andere:");
    report.push("");
    duplicates.slice(0, 20).forEach((d, i) => {
      report.push(`### ${i + 1}. Overlap ~${d.overlap}`);
      report.push(`- **A:** ${d.q1}`);
      report.push(`- **B:** ${d.q2}`);
      report.push("");
    });
    if (duplicates.length > 20) {
      report.push(`... en ${duplicates.length - 20} andere paren.`);
    }
  }
  report.push("");
  report.push("## Aanbevelingen");
  report.push("1. **Bulk import:** Het bestand `knowledge-base-cleaned.json` is klaar voor import via Admin → Knowledge Base → Bulk Import.");
  report.push("2. **Let op:** Bij een volledige herimport worden bestaande Q&As niet verwijderd. Gebruik eventueel eerst 'Clear all data' in Convex of verwijder handmatig oude Q&As.");
  report.push("3. **alternativeAnswers:** Veel Q&As hebben 4–5 alternatieve antwoorden die bijna hetzelfde zeggen. Overweeg om dit terug te brengen naar 1–2 per Q&A voor duidelijkere antwoorden.");
  report.push("");

  writeFileSync(reportPath, report.join("\n"), "utf-8");
  console.log(`📋 Rapport: ${reportPath}`);
};

main();
