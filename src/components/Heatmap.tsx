import { CATEGORIES, COLOR_MAP } from '../utils/chartUtils.js';
import type { TransitionMatrix } from '../types';

interface HeatmapProps {
  matrix: TransitionMatrix;
  judge1: string;
  judge2: string;
  onCellClick: (fromCategory: string, toCategory: string) => void;
}

const Heatmap: React.FC<HeatmapProps> = ({ matrix, judge1, judge2, onCellClick }) => {
  const maxValue = Math.max(
    ...CATEGORIES.flatMap(cat1 => 
      CATEGORIES.map(cat2 => matrix[cat1]?.[cat2] || 0)
    )
  ) || 1; // Avoid division by zero

  const getOpacity = (value: number) => {
    return value === 0 ? 0.05 : 0.05 + (value / maxValue) * 0.95;
  };

  return (
    <div className="heatmap-container">
      <h3 className="chart-title">Transition Matrix</h3>
      <div className="heatmap">
        <div className="heatmap-main">
            <div className="heatmap-y-axis">
                <div className="y-axis-label">{judge1.split('/')[1] || judge1}</div>
                <div className="y-ticks">
                    {CATEGORIES.map(cat => (
                    <div key={cat} className="y-tick">{cat}</div>
                    ))}
                </div>
            </div>
            <div className="heatmap-grid">
                {CATEGORIES.map(fromCat => (
                <div key={fromCat} className="heatmap-row">
                    {CATEGORIES.map(toCat => {
                    const value = matrix[fromCat]?.[toCat] || 0;
                    return (
                        <div
                        key={`${fromCat}-${toCat}`}
                        className="heatmap-cell"
                        onClick={() => onCellClick(fromCat, toCat)}
                        title={`${fromCat} → ${toCat}: ${value}`}
                        >
                          <div  
                            className='heatmap-cell-bg' 
                            style={{ backgroundColor: COLOR_MAP[toCat], opacity: getOpacity(value) }}>
                          </div>
                            {value > 0 && <span className="cell-value">{value}</span>}
                        </div>
                    );
                    })}
                </div>
                ))}
            </div>
        </div>
        <div className="heatmap-x-axis">
            <div className="x-ticks">
              {CATEGORIES.map(cat => (
                <div key={cat} className="x-tick">{cat}</div>
              ))}
            </div>
            <div className="x-axis-label">{judge2.split('/')[1] || judge2}</div>
        </div>
      </div>
    </div>
  );
};

export default Heatmap;