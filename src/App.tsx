import { useState, useEffect } from 'react';
import Waterfall from './components/Waterfall.js';
import Heatmap from './components/Heatmap.js';
import AssessmentItems from './components/itemList.js';
import { getThemes, getJudges, getReclassificationData, getAssessmentItems } from './utils/apiUtils.js';
import type { Theme, TransitionMatrix, AssessmentItem } from './types';
import FilterBar from './components/Filterbar';

function App() {

  const [themes, setThemes] = useState<Theme[]>([]);
  const [judges, setJudges] = useState<string[]>([]);
  const [matrix, setMatrix] = useState<TransitionMatrix | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);

  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [selectedJudge1, setSelectedJudge1] = useState<string>('');
  const [selectedJudge2, setSelectedJudge2] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string[] | null>(null);
  const [selectedItems, setSelectedItems] = useState<AssessmentItem[]>([]);

  // Fetch initial data when the component mounts
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [themesData, judgesData] = await Promise.all([
          getThemes(),
          getJudges()
        ]);
        setThemes(themesData);
        setJudges(judgesData);

        // Set default selections
        if (judgesData.length >= 2) {
            setSelectedJudge1(judgesData[0]);
            setSelectedJudge2(judgesData[1]);
        }

      } catch (err) {
        setError('Failed to load filter data. Is the backend server running?');
        console.error(err);
      }
    };
    loadFilters();
  }, []); 

  // Data fetching logic
  useEffect(() => {
    if (!selectedJudge1 || !selectedJudge2) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setMatrix(null);
      try {
        const result = await getReclassificationData(selectedJudge1, selectedJudge2, selectedTheme);
        setMatrix(result);
        setSelectedItems([]); 
        setSelectedCategory(null); 
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedTheme, selectedJudge1, selectedJudge2]);

  // Handle cell click to fetch assessment items
  const handleCellClick = (fromCategory: string, toCategory: string) => {
    if (selectedJudge1 && selectedJudge2 && fromCategory && toCategory) {
      setLoadingItems(true);
      getAssessmentItems(selectedJudge1, selectedJudge2, fromCategory, toCategory, selectedTheme)
        .then(setSelectedItems)
        .catch(err => {
          setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        })
        .finally(() => {
          setLoadingItems(false);
        });

      setSelectedCategory([fromCategory, toCategory]);
    }

    return;
  };

  return (
      <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <svg width="40" height="40" viewBox="0 0 40 40" className="logo">
              <circle cx="20" cy="20" r="18" fill="#10b981" />
              <path d="M12 20l6 6 10-12" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h1 className="app-title">LLM Assessment Explorer</h1>
          </div>
        </div>
      </header>

      <main className="main-content">
          <FilterBar
              themes={themes}
              judges={judges}
              selectedTheme={selectedTheme}
              onThemeChange={setSelectedTheme}
              selectedJudge1={selectedJudge1}
              onJudge1Change={setSelectedJudge1}
              selectedJudge2={selectedJudge2}
              onJudge2Change={setSelectedJudge2}
          />

          {isLoading && (
            <div className="loading-indicator">
              <div className="loading-spinner"></div>
              <p>Loading data...</p>
            </div>
          )}

         {!isLoading && matrix && (
          <div className="charts-container">
            <Waterfall
              matrix={matrix}
              judge1={selectedJudge1}
              judge2={selectedJudge2}
              onCellClick={handleCellClick}
            />
            
            <Heatmap
              matrix={matrix}
              judge1={selectedJudge1}
              judge2={selectedJudge2}
              onCellClick={handleCellClick}
            />
          </div>
        )}

        {!loadingItems && selectedItems.length > 0 && (
          <AssessmentItems
            judge1={selectedJudge1}
            judge2={selectedJudge2}
            items={selectedItems}
            selectedCategory={selectedCategory}
          />
        )}
        {loadingItems && (
            <div className="loading-indicator">
              <div className="loading-spinner"></div>
              <p>Loading data...</p>
            </div>
          )}
      </main>
    </div>
  );
}

export default App;