import type { FilterBarProps, Judges } from '../types.js';

const findJudgeByName = (judges: Judges[], name: string) => judges.find(j => j.name === name);

const FilterBar: React.FC<FilterBarProps> = ({
  themes,
  judges,
  models,
  modelFamilies,
  providers,
  selectedTheme,
  onThemeChange,
  selectedModel,
  onModelChange,
  selectedModelFamily,
  onModelFamilyChange,
  selectedProvider,
  onProviderChange,
  selectedJudge1,
  selectedJudge2,
  onJudge1NameChange,
  onJudge1ClassificationChange,
  onJudge2NameChange,
  onJudge2ClassificationChange,
}) => {
  const judge1Object = selectedJudge1 ? findJudgeByName(judges, selectedJudge1.name) : null;
  const judge2Object = selectedJudge2 ? findJudgeByName(judges, selectedJudge2.name) : null;

  return (
    <div className="filter-bar">
      
      <div className="filter-group">
        <div className="filter-block">
          <label className="filter-label" htmlFor='judge1-select'>Judge 1</label>
          <select 
            className="filter-select"
            id='judge1-select'
            value={selectedJudge1?.name || ''}
            onChange={(e) => onJudge1NameChange(e.target.value)}
          >
            {judges.map((judge) => (
              <option key={judge.name} value={judge.name}>
                {judge.name} ({judge.judge_type})
              </option>
            ))}
          </select>
        </div>

        <div className="filter-block">
          <label className="filter-label" htmlFor='judge1-classification-select'>Class.</label>
          <select 
            className="filter-select"
            id='judge1-classification-select'
            value={selectedJudge1?.classification || ''}
            onChange={(e) => onJudge1ClassificationChange(e.target.value)}
            disabled={!judge1Object} // Disable if no judge is selected
          >
            {judge1Object && Object.entries(judge1Object.classifications)
              .filter(([_, count]) => count > 0)
              .map(([classification]) => (
                <option key={classification} value={classification}>
                  {classification}
                </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="filter-group">
        <div className="filter-block">
          <label className="filter-label" htmlFor='judge2-select'>Judge 2</label>
          <select 
            className="filter-select"
            id='judge2-select'
            value={selectedJudge2?.name || ''}
            onChange={(e) => onJudge2NameChange(e.target.value)}
          >
            {judges.map((judge) => (
              <option key={judge.name} value={judge.name}>
                {judge.name} ({judge.judge_type})
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-block">
          <label className="filter-label" htmlFor='judge2-classification-select'>Class.</label>
          <select 
            className="filter-select"
            id='judge2-classification-select'
            value={selectedJudge2?.classification || ''}
            onChange={(e) => onJudge2ClassificationChange(e.target.value)}
            disabled={!judge2Object}
          >
            {judge2Object && Object.entries(judge2Object.classifications)
              .filter(([_, count]) => count > 0)
              .map(([classification]) => (
                <option key={classification} value={classification}>
                  {classification}
                </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="filter-group">
        <div className="filter-block">
          <label className="filter-label" htmlFor='model-select'>Model</label>
          <select 
            className="filter-select"
            id='model-select'
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value)}
          >
            <option value="">All Models</option>
            {models.map((model) => (
              <option key={model.model} value={model.model}>
                {model.model}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-block">
          <label className="filter-label" htmlFor='model-family-select'>Model Family</label>
          <select 
            className="filter-select"
            id='model-family-select'
            value={selectedModelFamily}
            onChange={(e) => onModelFamilyChange(e.target.value)}
          >
            <option value="">All Families</option>
            {modelFamilies.map((family) => (
              <option key={family.family} value={family.family}>
                {family.family}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="filter-group">
        <div className="filter-block">
          <label className="filter-label" htmlFor='theme-select'>Theme</label>
          <select 
            className="filter-select"
            id='theme-select'
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

        <div className="filter-block">
          <label className="filter-label" htmlFor='provider-select'>Provider</label>
          <select 
            className="filter-select"
            id='provider-select'
            value={selectedProvider}
            onChange={(e) => onProviderChange(e.target.value)}
          >
            <option value="">All Providers</option>
            {providers.map((provider) => (
              <option key={provider.provider} value={provider.provider}>
                {provider.provider}
              </option>
            ))}
          </select>
        </div>

      </div>
    </div>
  );
};

export default FilterBar;