import type { Judges } from '../types.js';

const SORTED_CATEGORIES = ["COMPLETE", "EVASIVE", "REBUTTAL", "DENIAL", "REFUSAL", "BLOCKED", "ERROR", "FAILED", "UNKNOWN"];

const CATEGORY_SORT_MAP = new Map(
  SORTED_CATEGORIES.map((category, index) => [category, index])
);

const SORTED_MODELS = ["openai/gpt-4o-2024-11-20", "mistral-small-3.2-24b-instruct-2506-q8", "mistral-small-3.1-24b-instruct-2503", 'pitti/pap'];

const MODEL_SORT_MAP = new Map(
  SORTED_MODELS.map((model, index) => [model, index])
);

export const categorySort = (a: string, b: string) => {
  const indexA = CATEGORY_SORT_MAP.get(a) ?? Infinity;
  const indexB = CATEGORY_SORT_MAP.get(b) ?? Infinity;

  if (indexA === indexB) {
    return a.localeCompare(b);
  }
  return indexA - indexB;
};

export const modelSort = (a: Judges, b: Judges) => {
  const indexA = MODEL_SORT_MAP.get(a.name) ?? Infinity;
  const indexB = MODEL_SORT_MAP.get(b.name) ?? Infinity;

  if (indexA === indexB) {
    return a.name.localeCompare(b.name);
  }
  return indexA - indexB;
}