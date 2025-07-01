// packages/frontend/src/components/Dashboard.tsx
import { useMemo } from 'react';
import { Box, CircularProgress, Typography} from '@mui/material';
import Plot from 'react-plotly.js';
import type { Data } from 'plotly.js';
import { generateWaterfallData, generateHeatmapData, COLOR_MAP } from '../utils/chartUtils.js';
import type { TransitionMatrix } from '../types';

interface DashboardProps {
  matrix: TransitionMatrix | null;
  judge1: string;
  judge2: string;
  isLoading?: boolean;
  error?: string | null;
}

// Shorten judge names for display if they are long
const shortenName = (name: string) => name.split('/')[1] || name;

const Dashboard = ({ matrix, judge1, judge2, isLoading, error }: DashboardProps) => {
  // Memoize chart data generation to prevent re-computation on every render
  const waterfallPlotData : Data[] = useMemo(() => {
    if (!matrix) return [];
    const plotStages = generateWaterfallData(matrix, shortenName(judge1), shortenName(judge2));
    const x_axis_labels = plotStages.map(stage => stage.stage_name);
    
    // Transform plotStages into Plotly traces
    return Object.keys(COLOR_MAP).map(cat => ({
      type: 'bar' as const,
      name: cat,
      x: x_axis_labels,
      y: plotStages.map(stage => stage.segments.find(s => s.category_label === cat)?.value || 0),
      marker: { color: COLOR_MAP[cat] },
      text: plotStages.map(stage => {
        const value = stage.segments.find(s => s.category_label === cat)?.value || 0;
        return stage.stage_name.includes('→') && value > 0 && cat != "BASE" ? value.toString() : '';
      }),
      textposition: 'outside' as const,
      hoverinfo: 'y+name' as const,
    }));
  
  }, [matrix, judge1, judge2]);

  const heatmapPlotData : Data[] = useMemo(() => {
    if (!matrix) return [];
    return [generateHeatmapData(matrix)];
  }, [matrix]);

  console.log(matrix, waterfallPlotData, heatmapPlotData);

  const renderContent = () => {
    if (isLoading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height={400}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Typography color="error" align="center" sx={{ my: 4 }}>
          Error fetching data: {error}
        </Typography>
      );
    }
    
    if (!matrix || Object.keys(matrix).length === 0) {
      return <Typography color="text.secondary" align="center" sx={{ my: 4 }}>No data available for the selected filters.</Typography>;
    }

    // We will render the charts here in the next step
    return (
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2, alignItems: 'stretch' }}>
        <Box sx={{ flex: 3, minWidth: 0, p: 2, border: '1px solid #444', borderRadius: 1 }}>
          <Plot
            data={waterfallPlotData} // This is now correctly typed
            layout={{
              title: {text : `Classification Flow: ${shortenName(judge1)} vs. ${shortenName(judge2)}`},
              barmode: 'stack',
              paper_bgcolor: 'rgba(0,0,0,0)',
              plot_bgcolor: 'rgba(0,0,0,0)',
              font: { color: 'rgba(0,0,0,1)' },
              xaxis: { tickangle: -45 },
              yaxis: { title: {text : 'Number of Responses'}, gridcolor: '#444' },
              legend: { orientation: 'h', y: -0.3, yanchor: 'top' },
              height: 600,
            }}
            style={{ width: '100%', height: '100%' }}
            config={{ responsive: true }}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0, p: 2, border: '1px solid #444', borderRadius: 1 }}>
           <Plot
            data={heatmapPlotData} // Heatmap data must be in an array
            layout={{
              title: {text : 'Transition Matrix'},
              paper_bgcolor: 'rgba(0,0,0,0)',
              plot_bgcolor: 'rgba(0,0,0,0)',
              font: { color: 'rgba(0,0,0,1)' },
              xaxis: { 
                title: { text: shortenName(judge2), standoff: 20 }, 
                side: 'bottom' as const, 
                gridcolor: '#444' 
            },
              yaxis: { 
                    title: {text : shortenName(judge1)}, 
                    autorange: 'reversed' as const, 
                    gridcolor: '#444' 
              },
              autosize: true,
            }}
            style={{ width: '100%', height: '100%' }}
            config={{ responsive: true }}
          />
        </Box>
      </Box>
    );
  };

  return <Box sx={{ mt: 4 }}>{renderContent()}</Box>;
};

export default Dashboard;