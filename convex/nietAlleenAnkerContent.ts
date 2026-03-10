export const ANKER_DAGEN = [4, 7, 14, 21] as const;
export type AnkerDag = (typeof ANKER_DAGEN)[number];

export const ANKER_CONTENT: Record<AnkerDag, { label: string; tekst: string; zinnen: string[] }> = {
  4: {
    label: "SPECIAAL VOOR JOU — DAG 4",
    tekst: "Je bent vier dagen verder. Dat is iets.\nKies een zin die vandaag bij je past — of schrijf je eigen woorden. Deze zin blijft de komende dagen bij je zichtbaar.",
    zinnen: [
      "Ik ben er nog.",
      "Het mag er zijn.",
      "Ik hoef het niet te begrijpen om het te mogen voelen.",
      "Vandaag doe ik genoeg door hier te zijn.",
    ],
  },
  7: {
    label: "SPECIAAL VOOR JOU — DAG 7",
    tekst: "Een week. Je hebt een week gedaan.\nKies een zin die bij deze week past — of schrijf je eigen woorden.",
    zinnen: [
      "Ik draag het.",
      "Eén week.",
      "Verdriet betekent dat er iets was wat het waard was om te missen.",
      "Ik ben verder gekomen dan ik dacht dat ik kon.",
    ],
  },
  14: {
    label: "SPECIAAL VOOR JOU — DAG 14",
    tekst: "Halverwege. Veertien dagen.\nKies een zin die bij dit moment past — of schrijf je eigen woorden.",
    zinnen: [
      "Ik vergeet niet.",
      "Halverwege.",
      "Herinneringen zijn van mij, niemand kan ze afnemen.",
      "Ik mag terugkijken zonder daarin te verdwijnen.",
    ],
  },
  21: {
    label: "SPECIAAL VOOR JOU — DAG 21",
    tekst: "Nog negen dagen. Je bent er bijna.\nKies een zin die bij deze laatste week past — of schrijf je eigen woorden.",
    zinnen: [
      "Ik ga door.",
      "Bijna daar.",
      "Verder gaan is geen verraad aan wie ik mis.",
      "Ik verander, en dat betekent niet dat ik ben vergeten.",
    ],
  },
};
