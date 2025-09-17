import { useState, useEffect} from 'react';
// import Waterfall from './components/Waterfall.js';
import SankeyDiagram from './components/Sankey.js';
import Heatmap from './components/Heatmap.js';
import AssessmentItems from './components/itemList.js';
import { getThemes, getJudges, getReclassificationData, getAssessmentItems } from './utils/apiUtils.js';
import { modelSort } from './utils/chartUtils.js';
import type { Theme, Judges, SelectedJudge, TransitionMatrix, AssessmentItem } from './types';
import FilterBar from './components/Filterbar';

function App() {

  const [themes, setThemes] = useState<Theme[]>([]);
  const [judges, setJudges] = useState<Judges[]>([]);
  const [matrix, setMatrix] = useState<TransitionMatrix | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);

  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [selectedJudge1, setSelectedJudge1] = useState<SelectedJudge | null >(null);
  const [selectedJudge2, setSelectedJudge2] = useState<SelectedJudge | null >(null);
  const [selectedCategory, setSelectedCategory] = useState<string[] | null>(null);
  const [selectedItems, setSelectedItems] = useState<AssessmentItem[]>([]);

  const getFirstClassification = (judge: Judges): string => {
    return Object.keys(judge.classifications).filter(key => judge.classifications[key] > 0)[0] || '';
  };

  // Fetch initial data when the component mounts
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [themesData, judgesData] = await Promise.all([
          getThemes(),
          getJudges()
        ]);
        setThemes(themesData);
        setJudges(judgesData.sort(modelSort));

        // Set default selections
        if (judgesData.length >= 2) {
          setSelectedJudge1({
            name: judgesData[0].name,
            classification: getFirstClassification(judgesData[0]),
          });
          setSelectedJudge2({
            name: judgesData[1].name,
            classification: getFirstClassification(judgesData[1]),
          });
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
        const result = await getReclassificationData(
          selectedJudge1.name,
          selectedJudge1.classification,
          selectedJudge2.name,
          selectedJudge2.classification,
          selectedTheme
        );
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

  const handleJudge1NameChange = (newName: string) => {
    const newJudge = judges.find(j => j.name === newName);
    if (newJudge) {
      // When judge changes, reset classification to the first available one
      setSelectedJudge1({
        name: newName,
        classification: getFirstClassification(newJudge),
      });
    }
  };

  const handleJudge1ClassificationChange = (newClassification: string) => {
    if (selectedJudge1) {
      setSelectedJudge1({ ...selectedJudge1, classification: newClassification });
    }
  };
  
  const handleJudge2NameChange = (newName: string) => {
    const newJudge = judges.find(j => j.name === newName);
    if (newJudge) {
      setSelectedJudge2({
        name: newName,
        classification: getFirstClassification(newJudge),
      });
    }
  };
  
  const handleJudge2ClassificationChange = (newClassification: string) => {
    if (selectedJudge2) {
      setSelectedJudge2({ ...selectedJudge2, classification: newClassification });
    }
  };

  // Handle cell click to fetch assessment items
  const handleCellClick = async (fromCategory: string, toCategory: string) => {
    if (selectedJudge1 && selectedJudge2 && fromCategory && toCategory) {
      setLoadingItems(true);
      try {
        const items = await getAssessmentItems(
          selectedJudge1.name,
          selectedJudge1.classification,
          fromCategory, 
          selectedJudge2.name, 
          selectedJudge2.classification,
          toCategory, 
          selectedTheme
        )
        setSelectedItems(items);
        setSelectedCategory([fromCategory, toCategory]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setLoadingItems(false);
      };
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
            selectedJudge2={selectedJudge2}
            onJudge1NameChange={handleJudge1NameChange}
            onJudge1ClassificationChange={handleJudge1ClassificationChange}
            onJudge2NameChange={handleJudge2NameChange}
            onJudge2ClassificationChange={handleJudge2ClassificationChange}
          />

          {isLoading && (
            <div className="loading-indicator">
              <div className="loading-spinner"></div>
              <p>Loading data...</p>
            </div>
          )}

         {!isLoading && matrix && (
          <div className="charts-container">
            <SankeyDiagram
              matrix={matrix}
              judge1={selectedJudge1!.name}
              judge2={selectedJudge2!.name}
              onCellClick={handleCellClick}
            />
            
            <Heatmap
              matrix={matrix}
              judge1={selectedJudge1!.name}
              judge2={selectedJudge2!.name}
              onCellClick={handleCellClick}
            />
          </div>
        )}

        {!loadingItems && selectedItems.length > 0 && (
          <AssessmentItems
            judge1={selectedJudge1!.name}
            judge2={selectedJudge2!.name}
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