import type { TransitionMatrix } from '../types.js';


export const CATEGORIES = ["COMPLETE", "EVASIVE", "DENIAL", "ERROR" /*, "UNKNOWN"*/];
export const COLOR_MAP: Record<string, string> = {
    "BASE": 'rgba(0,0,0,0)', // Transparent for the base of flow bars
    "COMPLETE": "#10b981",
    "EVASIVE": "#f59e0b",
    "DENIAL": "#ef4444",
    "ERROR": "#8b5cf6",
    /*"UNKNOWN": "#6b7280"*/
};


interface Segment {
  category_label: string;
  value: number;
}

interface PlotStage {
  stage_name: string;
  segments: Segment[];
}

export function generateWaterfallData(
  matrix: TransitionMatrix,
  judge1Name: string,
  judge2Name: string
): PlotStage[] {
  const plotStages: PlotStage[] = [];

  // 1. Calculate initial counts for Judge 1
  const initialJ1Counts = CATEGORIES.reduce((acc, cat) => {
    const fromCat = matrix[cat] || {};
    acc[cat] = Object.values(fromCat).reduce((sum, count) => sum + count, 0);
    return acc;
  }, {} as Record<string, number>);

  const numItems = Object.values(initialJ1Counts).reduce((sum, count) => sum + count, 0);
  if (numItems === 0) return [];

  // 2. Create the first "Initial" bar
  const initialStage: PlotStage = {
    stage_name: `${judge1Name} Initial`,
    segments: [{ category_label: 'BASE', value: 0 }],
  };
  for (const cat of CATEGORIES) {
    if (initialJ1Counts[cat] > 0) {
      initialStage.segments.push({ category_label: cat, value: initialJ1Counts[cat] });
    }
  }
  plotStages.push(initialStage);
  
  // 3. Loop through categories to create flow and state bars
  const intermediateState = { ...initialJ1Counts };
  const j1ProcessingOrder = CATEGORIES.filter(cat => initialJ1Counts[cat] > 0);

  j1ProcessingOrder.forEach((j1Cat, i) => {
    let baseHeight = Object.values(intermediateState).reduce((sum, val, j) => {
      if (j <= i) return sum + val;
      return sum;
    }, 0);

    // Create "flow" bars showing items leaving this category
    for (const j2Cat of CATEGORIES) {
      const flowCount = matrix[j1Cat]?.[j2Cat] || 0;
      if (flowCount > 0 && j2Cat !== j1Cat) {
        baseHeight -= flowCount;
        const baseValue = baseHeight
        intermediateState[j1Cat] -= flowCount;
        intermediateState[j2Cat] = (intermediateState[j2Cat] || 0) + flowCount;
        
        plotStages.push({
          stage_name: `${j1Cat} → ${j2Cat}`,
          segments: [
            { category_label: 'BASE', value: baseValue },
            { category_label: j2Cat, value: flowCount },
          ],
        });
      }
    }

    // Create the "intermediate state" or "final" bar
    const isFinalBar = i === j1ProcessingOrder.length - 1;
    const stageName = isFinalBar
      ? `${judge2Name} Final`
      : `State after ${j1Cat}`;

    const stateSegments: Segment[] = [{ category_label: 'BASE', value: 0 }];
    for (const cat of CATEGORIES) {
      if (intermediateState[cat] > 0) {
        stateSegments.push({ category_label: cat, value: intermediateState[cat] });
      }
    }
    plotStages.push({ stage_name: stageName, segments: stateSegments });
  });

  return plotStages;
}


// export function generateHeatmapData(matrix: TransitionMatrix) : Data {
//   // Create a 2D array (z-axis) for the heatmap values
//   const z = CATEGORIES.map(j1Cat => 
//     CATEGORIES.map(j2Cat => matrix[j1Cat]?.[j2Cat] || 0)
//   );
//   return {
//     type: 'heatmap' as const, // <--- ADD THIS
//     z,
//     x: CATEGORIES,
//     y: CATEGORIES,
//     colorscale: 'Viridis' as const, // Optional: add a colorscale for better visuals
//     hoverongaps: false,
//   };
// }