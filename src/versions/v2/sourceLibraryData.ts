import type { Source } from "./SourceLibraryDialog";

export interface LibraryGroup {
  id: string;
  name: string;
  current?: boolean;
  sources: Source[];
}

export const INITIAL_SOURCES: Source[] = [
  { id: 1, name: "Greek_Mythology_Overview.pdf", type: "file", active: true, dropdownLabel: "Balanced", note: "" },
  { id: 2, name: "The_Olympian_Gods_and_Goddesses.docx", type: "file", active: true, dropdownLabel: "Balanced", note: "Use this file as a general knowledge base for this course and pay attention to deity relationships." },
  { id: 3, name: "Mythical_Creatures_of_Greece.pptx", type: "file", active: true, dropdownLabel: "Balanced", note: "" },
  { id: 4, name: "Homer's_Iliad_and_Odyssey_Study_Guide.pdf", type: "file", active: false, dropdownLabel: "Balanced", note: "" },
  { id: 5, name: "Famous_Myths_and_Legends_of_Greece.docx", type: "file", active: false, dropdownLabel: "Balanced", note: "" },
  { id: 6, name: "The_Story_of_Persephone_and_the_Seasons.pptx", type: "file", active: false, dropdownLabel: "Balanced", note: "" },
  { id: 7, name: "Greek_Heroes_and_Villains.pdf", type: "file", active: false, dropdownLabel: "Balanced", note: "" },
  { id: 8, name: "The_Influence_of_Greek_Mythology_on_Modern_Literature.pdf", type: "file", active: false, dropdownLabel: "Balanced", note: "" },
];

// Mock libraries belonging to other courses (ids kept well clear of the course's own).
export const OTHER_LIBRARIES: LibraryGroup[] = [
  {
    id: "roman-history",
    name: "Roman History",
    sources: [
      { id: 1001, name: "The_Roman_Republic.pdf", type: "file", active: false, dropdownLabel: "Balanced", note: "Use for political institutions, major offices, and republican-era chronology." },
      { id: 1002, name: "Julius_Caesar_and_the_Civil_War.docx", type: "file", active: false, dropdownLabel: "Balanced", note: "" },
      { id: 1003, name: "Daily_Life_in_Ancient_Rome.pptx", type: "file", active: false, dropdownLabel: "Balanced", note: "" },
      { id: 1004, name: "The_Fall_of_the_Western_Empire.pdf", type: "file", active: false, dropdownLabel: "Balanced", note: "" },
    ],
  },
  {
    id: "world-literature",
    name: "World Literature",
    sources: [
      { id: 1101, name: "Introduction_to_the_Epic_Form.pdf", type: "file", active: false, dropdownLabel: "Balanced", note: "Use as a structural reference when comparing epic traditions and narrative conventions." },
      { id: 1102, name: "Shakespeare_Tragedies_Overview.docx", type: "file", active: false, dropdownLabel: "Balanced", note: "" },
      { id: 1103, name: "Modernist_Poetry_Anthology.pdf", type: "file", active: false, dropdownLabel: "Balanced", note: "" },
    ],
  },
];
