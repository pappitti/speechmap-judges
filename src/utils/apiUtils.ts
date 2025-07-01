import type { Theme, TransitionMatrix, AssessmentItem } from '../types.js';

interface ApiError {
  error: string;
}

// --- Reusable Fetch Helper ---
// This helper centralizes our fetch logic and error handling.
async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);

  // Manually check for HTTP errors, as fetch doesn't reject on them
  if (!response.ok) {
    // Try to get a more specific error message from the response body
    const errorBody = (await response.json().catch(() => ({ error: 'An unknown error occurred' }))) as ApiError;
    const errorMessage = errorBody.error || `HTTP error! Status: ${response.status}`;
    throw new Error(errorMessage);
  }

  // If the request was successful, parse and return the JSON body
  return response.json() as Promise<T>;
}


// --- API Functions ---

export const getThemes = (): Promise<Theme[]> => {
  return fetchAPI<Theme[]>('/api/themes');
};

export const getJudges = (): Promise<string[]> => {
  return fetchAPI<string[]>('/api/judges');
};

// New function to get the reclassification data
export const getReclassificationData = (
  judge1: string,
  judge2: string,
  theme?: string
): Promise<TransitionMatrix> => {
  // Build the query string from the parameters
  const params = new URLSearchParams({
    judge1,
    judge2,
  });

  // Only add the theme parameter if it's provided
  if (theme) {
    params.append('theme', theme);
  }

  return fetchAPI<TransitionMatrix>(`/api/reclassification?${params.toString()}`);
};

export const getAssessmentItems = (
  judge1: string,
  judge2: string,
  fromCategory: string,
  toCategory: string,
  theme?: string
): Promise<any[]> => {
  // Build the query string from the parameters
  const params = new URLSearchParams({
    judge1,
    judge2,
    fromCategory,
    toCategory,
  });

  // Only add the theme parameter if it's provided
  if (theme) {
    params.append('theme', theme);
  }

  return fetchAPI<AssessmentItem[]>(`/api/mismatches?${params.toString()}`);
}