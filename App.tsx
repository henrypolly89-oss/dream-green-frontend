import React, { useState, useEffect } from 'react';
import { SocialPlatform, AnalysisResult, GroundingChunk, AnalysisHistoryEntry } from './types';
import { analyzePost } from './services/geminiService';
import PlatformSelector from './components/PlatformSelector';
import PostInput from './components/PostInput';
import AnalysisDisplay from './components/AnalysisDisplay';
import SparklesIcon from './components/icons/SparklesIcon';
import Dashboard from './components/Dashboard';
import PencilSquareIcon from './components/icons/PencilSquareIcon';
import ChartBarIcon from './components/icons/ChartBarIcon';


const ANALYSIS_HISTORY_KEY = 'socialAnalyzerHistory';
const MAX_HISTORY_LENGTH = 20;

type View = 'analyzer' | 'dashboard';

const loadHistory = (): AnalysisHistoryEntry[] => {
  try {
    const savedHistoryJSON = localStorage.getItem(ANALYSIS_HISTORY_KEY);
    return savedHistoryJSON ? JSON.parse(savedHistoryJSON) : [];
  } catch (error) {
    console.error("Could not load history from localStorage", error);
    return [];
  }
};

function App() {
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>(SocialPlatform.Google);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [sources, setSources] = useState<GroundingChunk[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<View>('analyzer');
  const [history, setHistory] = useState<AnalysisHistoryEntry[]>(loadHistory);

  useEffect(() => {
    try {
      localStorage.setItem(ANALYSIS_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error("Failed to save history to localStorage", error);
    }
  }, [history]);

  const handleAnalyze = async (post: string) => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setSources(null);

    try {
      if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
      }
      const { analysis, sources: fetchedSources } = await analyzePost(selectedPlatform, post);
      setAnalysisResult(analysis);
      setSources(fetchedSources);

      const postIdentifier = post.trim();
      const newHistoryEntry: AnalysisHistoryEntry = {
        id: new Date().toISOString() + Math.random(),
        analysis,
        platform: selectedPlatform,
        post: postIdentifier === '' ? `Default ${selectedPlatform} analysis` : postIdentifier,
        date: new Date().toISOString(),
      };

      setHistory(prevHistory => {
        const updatedHistory = [newHistoryEntry, ...prevHistory];
        return updatedHistory.slice(0, MAX_HISTORY_LENGTH);
      });

    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during analysis.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSelectPlatform = (platform: SocialPlatform) => {
    setSelectedPlatform(platform);
    setAnalysisResult(null);
    setError(null);
    setSources(null);
  }

  const NavButton: React.FC<{
    targetView: View;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    children: React.ReactNode;
  }> = ({ targetView, icon: Icon, children }) => {
    const isActive = view === targetView;
    return (
      <button
        onClick={() => setView(targetView)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors font-semibold
          ${isActive ? 'bg-cyan-600 text-white' : 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'}`}
      >
        <Icon className="w-5 h-5" />
        <span>{children}</span>
      </button>
    );
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-10">
            <div className="inline-flex items-center justify-center bg-cyan-500/10 p-3 rounded-full mb-4">
                <SparklesIcon className="w-10 h-10 text-cyan-400" />
            </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            AI-Powered Content Analyzer
          </h1>
          <p className="mt-3 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
            Get instant feedback and data-driven insights on your social media posts or business reviews.
          </p>
        </header>

        <nav className="flex justify-center mb-8 space-x-4">
            <NavButton targetView="analyzer" icon={PencilSquareIcon}>Analyzer</NavButton>
            <NavButton targetView="dashboard" icon={ChartBarIcon}>Dashboard</NavButton>
        </nav>

        {view === 'analyzer' && (
          <div className="animate-fade-in">
            <div className="max-w-4xl mx-auto bg-gray-800/40 p-6 md:p-8 rounded-2xl shadow-2xl shadow-cyan-500/10">
              <PlatformSelector 
                selectedPlatform={selectedPlatform} 
                onSelectPlatform={handleSelectPlatform} 
              />
              
              <div className="mt-8 pt-8 border-t border-gray-700">
                <PostInput 
                  selectedPlatform={selectedPlatform}
                  onAnalyze={handleAnalyze} 
                  isLoading={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="max-w-4xl mx-auto mt-8 p-4 bg-red-500/20 border border-red-500 text-red-300 rounded-lg">
                <p className="font-semibold text-center">Analysis Failed</p>
                <p className="text-center mt-2">{error}</p>
              </div>
            )}

            <div className="max-w-4xl mx-auto">
              {analysisResult && <AnalysisDisplay analysis={analysisResult} sources={sources} platform={selectedPlatform} />}
            </div>
          </div>
        )}

        {view === 'dashboard' && <Dashboard history={history} />}

      </main>
      <footer className="text-center py-6 text-gray-500 text-sm">
        <p>Powered by Google Gemini API</p>
      </footer>
    </div>
  );
}

export default App;