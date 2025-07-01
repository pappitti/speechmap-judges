import { COLOR_MAP, generateWaterfallData } from '../utils/chartUtils.js';
import type { TransitionMatrix } from '../types';

interface WaterfallProps {
  matrix: TransitionMatrix;
  judge1: string;
  judge2: string;
}

// Shorten judge names for display if they are long
const shortenName = (name: string) => name.split('/')[1] || name;

const Waterfall: React.FC<WaterfallProps> = ({ matrix, judge1, judge2 }) => {
    const totalCount = Object.values(matrix).reduce((sum, fromCat) => {
        return sum + Object.values(fromCat).reduce((innerSum, count) => innerSum + count, 0);
    }, 0);

    const plotStages = generateWaterfallData(matrix, shortenName(judge1), shortenName(judge2));

    return (
        <div className="waterfall-container">
            <h3 className="chart-title">
                Reclassification from {judge1.split('/')[1] || judge1} to {judge2.split('/')[1] || judge2}
            </h3>
            <div className="waterfall-chart">
                <div className="waterfall-bars">
                {plotStages.map(stage => {
                    const stage_name = stage.stage_name;
                   
                    return (
                    <div key={stage_name} className="waterfall-bar-container">
                        {stage.segments.map(segment => {
                            const { category_label, value } = segment;
                            const count = value || 0;
                            const height = (count / totalCount) * 100;
                            const color = COLOR_MAP[category_label] || 'rgba(0,0,0,0)'; // Default to transparent if not found
                            return (
                                <div 
                                    className="waterfall-bar"
                                    key={`${stage_name}&${category_label}`}
                                    style={{
                                        height: `${height}%`,
                                        backgroundColor: color,
                                    }}
                                    title={`${category_label} (${count})`} 
                                >
                                {(count > 0 && category_label != 'BASE' && stage_name.includes('→')) && <span className="bar-value">{count}</span>}
                            </div>
                            );
                        })}
                        
                    </div>
                    );
                })}
                </div>
                <div className="waterfall-x-axis">
                    {plotStages.map(stage => (
                        <div key={stage.stage_name} className="bar-label">
                            {stage.stage_name}
                        </div>
                    ))}
                </div>
                <div className="waterfall-legend">
                {Object.entries(COLOR_MAP).map(([cat, color]) => (
                    <div key={cat} className="legend-item">
                        <span className="legend-color" style={{ backgroundColor: color }}></span>
                        {cat}
                    </div>
                ))}
                </div>
            </div>
        </div>
    );
};

export default Waterfall;