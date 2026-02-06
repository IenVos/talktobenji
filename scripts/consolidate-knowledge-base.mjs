#!/usr/bin/env node
/**
 * Consolideer knowledge base:
 * - Verwijder 7 mindfulness Q&As
 * - Voeg 1 samengevoegde mindfulness Q&A toe
 * - Verwijder overige duplicaten waar nodig
 */

import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const MINDFULNESS_QUESTIONS_TO_REMOVE = [
  "Welke eenvoudige mindfulness-oefeningen kan ik thuis doen?",
  "Kan mindfulness helpen als ik niet kan slapen door verdriet?",
  "Hoe begin ik met mindfulness?",
  "Wat zijn de 7 pijlers van mindfulness?",
  "Wat zijn de voordelen van mindfulness bij rouw?",
  "Hoe kan mindfulness helpen bij rouw?",
  "Wat is mindfulness?",
];

const CONSOLIDATED_MINDFULNESS = {
  question: "Wat is mindfulness en hoe kan het helpen bij rouw?",
  answer: "Mindfulness is opmerkzaamheid: bewust in het huidige moment zijn, zonder oordeel over je gedachten en gevoelens. Bij rouw kan het helpen om emoties te observeren in plaats van erin vast te zitten, stress en angst te verlagen, en meer innerlijke rust te vinden. Het neemt de pijn niet weg, maar kan je helpen om er anders mee om te gaan.\n\nEenvoudige oefeningen om te starten: ademhalingsmeditatie (5 minuten, focus op je adem), bodyscan (aandacht van tenen tot hoofd, spanning loslaten), mindful wandelen. Bij slaapproblemen: bodyscan of 4-7-8 ademhaling voor het slapengaan (in 4 sec, vast 7 sec, uit 8 sec).\n\nKernprincipes: niet-oordelen, geduld, acceptatie van wat is. Begin met 5 minuten per dag. Het is geen quick fix, maar een vaardigheid die je ontwikkelt.",
  category: "Dagelijks leven",
  tags: ["mindfulness", "meditatie", "rouw", "slaap", "ademhaling", "bodyscan"],
  alternativeQuestions: [
    "Wat is mindfulness?",
    "Hoe kan mindfulness helpen bij rouw?",
    "Hoe begin ik met mindfulness?",
    "Welke mindfulness-oefeningen kan ik doen?",
    "Kan mindfulness helpen als ik niet kan slapen?",
    "Wat zijn de voordelen van mindfulness?",
    "Wat zijn de 7 pijlers van mindfulness?",
  ],
  priority: 8,
};

// Extra duplicaten om te verwijderen (optioneel)
const DUPLICATES_TO_REMOVE = [];

function loadJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch (e) {
    return [];
  }
}

const main = () => {
  const basePath = join(__dirname, "..");
  const cleaned = loadJson(join(basePath, "knowledge-base-cleaned.json"));
  const new50 = loadJson(join(basePath, "knowledge-base-nieuwe-50.json"));
  const new50part2 = loadJson(join(basePath, "knowledge-base-nieuwe-50-deel2.json"));

  const all = [...cleaned, ...new50, ...new50part2];
  const toRemove = new Set([
    ...MINDFULNESS_QUESTIONS_TO_REMOVE,
    ...DUPLICATES_TO_REMOVE,
  ]);

  const filtered = all.filter((q) => !toRemove.has(q.question));
  filtered.push(CONSOLIDATED_MINDFULNESS);

  const outPath = join(basePath, "knowledge-base-opgeruimd.json");
  writeFileSync(outPath, JSON.stringify(filtered, null, 2), "utf-8");

  console.log(`✅ Opgeruimd: ${outPath}`);
  console.log(`   Was: ${all.length} Q&As`);
  console.log(`   Nu: ${filtered.length} Q&As`);
  console.log(`   Verwijderd: ${all.length - filtered.length + 1} (7 mindfulness + 1 consolidate = netto -6)`);
};

main();
