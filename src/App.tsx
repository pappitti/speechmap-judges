import { useState, useEffect, useCallback } from 'react';
import { useDuckDB } from './hooks/useDuckDB';

import { getThemes, getJudges, getReclassificationData, getAssessmentItems } from './db/api.ts';
import type { Theme, TransitionMatrix, AssessmentItem } from './types';

import FilterBar from './components/Filterbar';
// import Waterfall from './components/Waterfall.tsx'; // Removed for now
import SankeyDiagram from './components/Sankey.tsx';
import Heatmap from './components/Heatmap.tsx';
import AssessmentItems from './components/itemList.tsx';


function App() {

  const { db, loading: dbLoading, error: dbError, repairDatabase } = useDuckDB();

  const [themes, setThemes] = useState<Theme[]>([]);
  const [judges, setJudges] = useState<string[]>([]);
  const [matrix, setMatrix] = useState<TransitionMatrix | null>(null);

  const [isFetchingMatrix, setIsFetchingMatrix] = useState(false);
  const [isFetchingItems, setIsFetchingItems] = useState(false);

  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [selectedJudge1, setSelectedJudge1] = useState<string>('');
  const [selectedJudge2, setSelectedJudge2] = useState<string>('');

  const [selectedItems, setSelectedItems] = useState<AssessmentItem[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[] | null>(null);

  useEffect(() => {
    if (!db) return;

    const loadFilters = async () => {
      try {
        const [themesData, judgesData] = await Promise.all([
          getThemes(db),
          getJudges(db)
        ]);

        setThemes(themesData);
        setJudges(judgesData);

        if (judgesData.length >= 2) {
          setSelectedJudge1(judgesData[0]);
          setSelectedJudge2(judgesData[1]);
        }
      } catch (err) {
        console.error("Failed to load filter data:", err);
    };
    }

    loadFilters();
  }, [db]); 

  // Data fetching logic
  useEffect(() => {
    if (!db || !selectedJudge1 || !selectedJudge2) return;

    const fetchData = async () => {
      setIsFetchingMatrix(true);
      setMatrix(null); 
      setSelectedItems([]); 
      setSelectedCategories(null);
      try {
        const result = await getReclassificationData(db, {
            judge1: selectedJudge1,
            judge2: selectedJudge2,
            theme: selectedTheme || null 
        });
        setMatrix(result);
      } catch (err) {
        console.error("Failed to fetch reclassification matrix:", err);
      } finally {
        setIsFetchingMatrix(false);
      }
    };

    fetchData();
  }, [db, selectedTheme, selectedJudge1, selectedJudge2]);

  // Handle cell click to fetch assessment items
  const handleCellClick = useCallback(async (fromCategory: string, toCategory: string) => {
    if (!db || !selectedJudge1 || !selectedJudge2) return;

    setIsFetchingItems(true);
    setSelectedItems([]);
    try {
    const items = await getAssessmentItems(db, {
        judge1: selectedJudge1,
        fromCategory: fromCategory,
        judge2: selectedJudge2,
        toCategory: toCategory,
        theme: selectedTheme || null
      });
      setSelectedItems(items);
      setSelectedCategories([fromCategory, toCategory]);
    } catch (err) {
      console.error("Failed to fetch assessment items:", err);
    } finally {
      setIsFetchingItems(false);
    }
  }, [db, selectedJudge1, selectedJudge2, selectedTheme]);

  const handleRebuild = async () => {
    setThemes([]);
    setJudges([]);
    setMatrix(null);
    setSelectedItems([]);
    setSelectedJudge1('');
    setSelectedJudge2('');
    await repairDatabase();
  };

  if (dbLoading) {
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
          <div className="loading-indicator">
              <div className="loading-spinner"></div>
              <p>Initializing and building database... This may take a moment on first load.</p>
              <button onClick={handleRebuild} disabled>Rebuild Database</button>
          </div>
        </main>
      </div>
    );
  }

  if (dbError) {
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
            <h2>A critical error occurred</h2>
            <p>{dbError.message}</p>
            <p>The database failed to initialize. You can try rebuilding it.</p>
            <button onClick={handleRebuild}>Rebuild Database</button>
        </main>
      </div>
    );
  }

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

          {(isFetchingMatrix) && (
            <div className="loading-indicator">
              <div className="loading-spinner"></div>
              <p>Loading data...</p>
            </div>
          )}

         {!isFetchingMatrix && matrix && (
          <div className="charts-container">
            {/* <Waterfall
              matrix={matrix}
              judge1={selectedJudge1}
              judge2={selectedJudge2}
              onCellClick={handleCellClick}
            /> */}

            <SankeyDiagram
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

        {!isFetchingItems && selectedItems.length > 0 && (
          <AssessmentItems
            judge1={selectedJudge1}
            judge2={selectedJudge2}
            items={selectedItems}
            selectedCategory={selectedCategories}
          />
        )}
        {isFetchingItems && (
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