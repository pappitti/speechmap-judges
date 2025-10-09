import type { Theme, Judges, Model, TransitionMatrix, AssessmentItem, ApiError } from '../types.js';



// This helper centralizes our fetch logic and error handling.
async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({ error: 'An unknown error occurred' }))) as ApiError;
    const errorMessage = errorBody.error || `HTTP error! Status: ${response.status}`;
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}


// --- API Functions ---

export const getThemes = (): Promise<Theme[]> => {
  return fetchAPI<Theme[]>('/api/themes');
};


export const getJudges = async (): Promise<Judges[]> => {
  return fetchAPI<Judges[]>('/api/judges')
};

export const getModels = async (): Promise<Model[]> => {
  return fetchAPI<Model[]>('/api/models')
}


export const getReclassificationData = (
  judge1: string,
  judge1Classification: string,
  judge2: string,
  judge2Classification: string,
  theme?: string,
  model?: string
): Promise<TransitionMatrix> => {
  // Build the query string from the parameters
  const params = new URLSearchParams({
    judge1,
    judge1Classification,
    judge2,
    judge2Classification
  });

  // Only add the theme parameter if it's provided
  if (theme) {
    params.append('theme', theme);
  }
  if (model) {
    params.append('model', model);
  }

  return fetchAPI<TransitionMatrix>(`/api/reclassification?${params.toString()}`);
};


export const getAssessmentItems = (
  judge1: string,
  judge1Classification: string,
  fromCategory: string,
  judge2: string,
  judge2Classification: string,
  toCategory: string,
  theme?: string,
  model?: string
): Promise<any[]> => {

  const params = new URLSearchParams({
    judge1,
    judge1Classification,
    fromCategory,
    judge2,
    judge2Classification,
    toCategory,
  });

  if (theme) {
    params.append('theme', theme);
  }
  if (model) {
    params.append('model', model);
  }

  return fetchAPI<AssessmentItem[]>(`/api/mismatches?${params.toString()}`);
}