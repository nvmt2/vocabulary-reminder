export interface VocabularyCard {
  id: string;
  word: string;
  pronunciation?: string;
  partOfSpeech?: string;
  definition: string;
  example: string;
  customContext?: string;
  imageUrl: string;
  colorTheme: string; // "rose" | "emerald" | "violet" | "amber" | "sky" | "indigo"
  status?: "learning" | "mastered";
  createdAt: number;
}

export type MealType =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "snack"
  | "dessert"
  | "drink";

export const MEAL_TYPES: MealType[] = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "dessert",
  "drink",
];

export interface FoodCard {
  id: string;
  name: string;
  mealType: MealType;
  notes?: string;
  imageUrl: string;
  colorTheme: string; // "rose" | "emerald" | "violet" | "amber" | "sky" | "indigo"
  createdAt: number;
}

export type ColorThemeName = "rose" | "emerald" | "violet" | "amber" | "sky" | "indigo";

export interface ColorThemeConfig {
  bg: string;
  border: string;
  text: string;
  accent: string;
  gradient: string;
  badge: string;
}

export const COLOR_THEMES: Record<ColorThemeName, ColorThemeConfig> = {
  rose: {
    bg: "bg-rose-50/50",
    border: "border-rose-100",
    text: "text-rose-700",
    accent: "bg-rose-500",
    gradient: "from-rose-400 to-pink-500",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
  },
  emerald: {
    bg: "bg-emerald-50/50",
    border: "border-emerald-100",
    text: "text-emerald-700",
    accent: "bg-emerald-500",
    gradient: "from-emerald-400 to-teal-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  violet: {
    bg: "bg-violet-50/50",
    border: "border-violet-100",
    text: "text-violet-700",
    accent: "bg-violet-500",
    gradient: "from-violet-400 to-purple-500",
    badge: "bg-violet-50 text-violet-700 border-violet-200",
  },
  amber: {
    bg: "bg-amber-50/50",
    border: "border-amber-100",
    text: "text-amber-700",
    accent: "bg-amber-500",
    gradient: "from-amber-400 to-orange-500",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  sky: {
    bg: "bg-sky-50/50",
    border: "border-sky-100",
    text: "text-sky-700",
    accent: "bg-sky-500",
    gradient: "from-sky-400 to-blue-500",
    badge: "bg-sky-50 text-sky-700 border-sky-200",
  },
  indigo: {
    bg: "bg-indigo-50/50",
    border: "border-indigo-100",
    text: "text-indigo-700",
    accent: "bg-indigo-500",
    gradient: "from-indigo-400 to-blue-600",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
};
