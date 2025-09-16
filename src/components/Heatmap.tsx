import { useMemo } from 'react';
import type { HeatmapProps } from '../types';
import { categorySort} from '../utils/chartUtils';


const Heatmap: React.FC<HeatmapProps> = ({ matrix, judge1, judge2, onCellClick }) => {
  const { judge1Cat, judge2Cat, maxValue } = useMemo(() => {
    const j1Categories = Object.keys(matrix).sort(categorySort);

    let newMaxValue = 1;
    const allSubCats = new Set<string>();

    j1Categories.forEach(cat => {
      Object.keys(matrix[cat] || {}).forEach(subCat => {
        allSubCats.add(subCat);
        const value = matrix[cat][subCat];
        if (value > newMaxValue) newMaxValue = value;
      });
    });

    // Convert Set to Array and sort
    const j2Categories = Array.from(allSubCats).sort(categorySort);

    return {
      judge1Cat: j1Categories,
      judge2Cat: j2Categories,
      maxValue: newMaxValue
    };
  }, [matrix]);
  

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
                    {judge1Cat.map(cat => (
                    <div key={cat} className="y-tick">{cat}</div>
                    ))}
                </div>
            </div>
            <div className="heatmap-grid">
                {judge1Cat.map(fromCat => (
                <div key={fromCat} className="heatmap-row">
                    {judge2Cat.map(toCat => {
                    const value = matrix[fromCat]?.[toCat] || 0;
                    return (
                        <div
                        key={`${fromCat}-${toCat}`}
                        className="heatmap-cell"
                        onClick={() => value < 10000 
                          ? onCellClick(fromCat, toCat)
                          : alert("Details only available for values < 10000. Please refine your selection.")
                        }
                        title={`${fromCat} → ${toCat}: ${value}`}
                        >
                          <div  
                            className='heatmap-cell-bg' 
                            style={{ backgroundColor: `var(--${toCat.toLowerCase()}, #fff)`, opacity: getOpacity(value) }}>
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
              {judge2Cat.map(cat => (
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