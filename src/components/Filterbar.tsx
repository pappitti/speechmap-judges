import type { Theme } from '../types.js';

interface FilterBarProps {
  themes: Theme[];
  judges: string[];
  selectedTheme: string;
  onThemeChange: (value: string) => void;
  selectedJudge1: string;
  onJudge1Change: (value: string) => void;
  selectedJudge2: string;
  onJudge2Change: (value: string) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  themes,
  judges,
  selectedTheme,
  onThemeChange,
  selectedJudge1,
  onJudge1Change,
  selectedJudge2,
  onJudge2Change,
}) => {
  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label className="filter-label">Theme</label>
        <select 
          className="filter-select"
          value={selectedTheme}
          onChange={(e) => onThemeChange(e.target.value)}
        >
          <option value="">All Themes</option>
          {themes.map((theme) => (
            <option key={theme.slug} value={theme.slug}>
              {theme.slug} ({theme.name})
            </option>
          ))}
        </select>
      </div>
      
      <div className="filter-group">
        <label className="filter-label">Judge 1</label>
        <select 
          className="filter-select"
          value={selectedJudge1}
          onChange={(e) => onJudge1Change(e.target.value)}
        >
          {judges.map((judge) => (
            <option key={judge} value={judge}>
              {judge}
            </option>
          ))}
        </select>
      </div>
      
      <div className="filter-group">
        <label className="filter-label">Judge 2</label>
        <select 
          className="filter-select"
          value={selectedJudge2}
          onChange={(e) => onJudge2Change(e.target.value)}
        >
          {judges.map((judge) => (
            <option key={judge} value={judge}>
              {judge}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default FilterBar;