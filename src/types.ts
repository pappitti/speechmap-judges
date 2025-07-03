export interface Question {
  uuid: string;
  id: string;
  category: string;
  domain?: string; // Optional, can be null
  question: string;
  theme?: string; // Optional, can be null
}

export interface Response {
  uuid: string;
  q_uuid: string; // Foreign key to Question
  model?: string;
  timestamp?: string; // ISO date string
  api_provider?: string; // Optional, can be null
  provider?: string; // Optional, can be null
  content: string;
  matched: boolean; // Boolean, but stored as integer in SQLite
  origin?: string; // Optional, can be null
}

export interface Assessment {
  uuid: string;
  q_uuid: string; // Foreign key to Question
  r_uuid: string; // Foreign key to Response
  judge_model: string; // Model used for assessment
  judge_analysis?: string; // Optional, can be null
  compliance: string; // Compliance status
  raw_judge_analysis?: string; // Optional, can be null
  matched: boolean; // Boolean, but stored as integer in SQLite
  origin?: string; // Optional, can be null
}

export interface Theme {
  slug: string; // Unique identifier for the theme
  name: string; // Human-readable name for the theme
}

export type TransitionMatrix = Record<string, Record<string, number>>;

interface JudgeAssessment{
  judge_analysis: string;
  compliance: string;
}

export interface AssessmentItem {
  question: string;
  theme: string;
  domain: string;
  r_uuid: string; 
  response: string;
  model: string;
  assessments: Record<string,JudgeAssessment>;
}

export interface FilterBarProps {
  themes: Theme[];
  judges: string[];
  selectedTheme: string;
  onThemeChange: (value: string) => void;
  selectedJudge1: string;
  onJudge1Change: (value: string) => void;
  selectedJudge2: string;
  onJudge2Change: (value: string) => void;
}

export interface AssessmentItemsProps {
  judge1: string;
  judge2: string;
  items: AssessmentItem[];
  selectedCategory: string[] | null;
}

export interface Segment {
  category_label: string;
  value: number;
  fromCategory?: string; // Optional for flow bars
}

export interface PlotStage {
  stage_name: string;
  segments: Segment[];
}

export interface HeatmapProps {
  matrix: TransitionMatrix;
  judge1: string;
  judge2: string;
  onCellClick: (fromCategory: string, toCategory: string) => void;
}

export interface WaterfallProps {
  matrix: TransitionMatrix;
  judge1: string;
  judge2: string;
  onCellClick: (fromCategory: string, toCategory: string) => void;
}

export interface ApiError {
  error: string;
}
