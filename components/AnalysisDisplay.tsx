import React from 'react';
import { AnalysisResult, GroundingChunk, SocialPlatform, ImprovementSuggestion, StructuredPositiveFeedback, StructuredNegativeFeedback } from '../types';
import StarIcon from './icons/StarIcon';
import LinkIcon from './icons/LinkIcon';
import HistoryIcon from './icons/HistoryIcon';

interface AnalysisDisplayProps {
  analysis: AnalysisResult | null;
  sources: GroundingChunk[] | null;
  platform: SocialPlatform;
}

const ScoreCircle: React.FC<{ score: number }> = ({ score }) => {
  const getColor = (s: number) => {
    if (s >= 75) return 'text-green-400';
    if (s >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full" viewBox="0 0 36 36">
        <path
          className="text-gray-700"
          d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className={getColor(score)}
          d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray={`${score}, 100`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-4xl font-bold ${getColor(score)}`}>{score}</span>
      </div>
    </div>
  );
};

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis, sources, platform }) => {
  if (!analysis) return null;

  const renderPositiveFeedback = () => {
    const feedback = analysis.positive_feedback;
    const hasThemes = feedback.common_themes && feedback.common_themes.length > 0;
    const hasLoves = feedback.what_customers_love && feedback.what_customers_love.length > 0;

    if (!hasThemes && !hasLoves) {
      return <li>No specific positive feedback identified.</li>;
    }

    return (
        <>
            {hasThemes && (
                <>
                    <h4 className="font-semibold text-green-300 mt-2 mb-1 list-none -ml-4">Common Themes</h4>
                    {feedback.common_themes.map((item, i) => <li key={`p-theme-${i}`} className="whitespace-pre-wrap">{item}</li>)}
                </>
            )}
            {hasLoves && (
                <>
                    <h4 className="font-semibold text-green-300 mt-2 mb-1 list-none -ml-4">What Customers Love</h4>
                    {feedback.what_customers_love.map((item, i) => <li key={`p-love-${i}`} className="whitespace-pre-wrap">{item}</li>)}
                </>
            )}
        </>
    );
  };

  const renderNegativeFeedback = () => {
    const feedback = analysis.negative_feedback;
    const hasThemes = feedback.common_themes && feedback.common_themes.length > 0;
    const hasDissatisfaction = feedback.key_areas_of_dissatisfaction && feedback.key_areas_of_dissatisfaction.length > 0;

    if (!hasThemes && !hasDissatisfaction) {
      return <li>No specific negative feedback identified.</li>;
    }
    
    return (
        <>
            {hasThemes && (
                <>
                    <h4 className="font-semibold text-red-300 mt-2 mb-1 list-none -ml-4">Common Themes</h4>
                    {feedback.common_themes.map((item, i) => <li key={`n-theme-${i}`} className="whitespace-pre-wrap">{item}</li>)}
                </>
            )}
            {hasDissatisfaction && (
                <>
                    <h4 className="font-semibold text-red-300 mt-2 mb-1 list-none -ml-4">Key Areas of Dissatisfaction</h4>
                    {feedback.key_areas_of_dissatisfaction.map((item, i) => <li key={`n-diss-${i}`} className="whitespace-pre-wrap">{item}</li>)}
                </>
            )}
        </>
    );
  };

  const renderSources = () => {
    if (!sources || sources.length === 0) return null;
    return (
      <div className="mt-8 p-4 bg-gray-800/50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-300 mb-3 flex items-center"><LinkIcon className="w-5 h-5 mr-2" /> Sources</h3>
        <ul className="list-disc list-inside space-y-2">
          {sources.flatMap((source, index) => {
            if (source.web) {
              return (
                <li key={`web-${index}`}>
                  <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                    {source.web.title || source.web.uri}
                  </a>
                </li>
              );
            }
             if (source.maps) {
                const mainLink = (
                    <li key={`map-${index}`}>
                        <a href={source.maps.uri} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                           {source.maps.title || 'Google Maps Source'}
                        </a>
                    </li>
                );
                const reviewLinks = source.maps.placeAnswerSources?.reviewSnippets?.map((snippet, sIndex) => (
                    <li key={`map-review-${index}-${sIndex}`} className="ml-4">
                         <a href={snippet.uri} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                           Review by {snippet.author}
                        </a>
                        <p className="text-gray-400 italic text-sm">"{snippet.text}"</p>
                    </li>
                ));

                return [mainLink, ...(reviewLinks || [])];
            }
            return [];
          })}
        </ul>
      </div>
    );
  };

  return (
    <div className="w-full bg-gray-900/50 p-6 rounded-xl shadow-lg mt-8 animate-fade-in">
      <h2 className="text-3xl font-bold text-center text-white mb-6">Analysis Result</h2>
      <div className="flex justify-center mb-8">
        <ScoreCircle score={analysis.overall_score} />
      </div>
      <div className="grid md:grid-cols-3 gap-6 text-gray-300">
        <div className="bg-green-500/10 p-4 rounded-lg">
          <h3 className="text-xl font-semibold text-green-400 mb-2">👍 Positive Feedback</h3>
          <ul className="list-disc list-inside space-y-1">
            {renderPositiveFeedback()}
          </ul>
        </div>
        <div className="bg-red-500/10 p-4 rounded-lg">
          <h3 className="text-xl font-semibold text-red-400 mb-2">👎 Negative Feedback</h3>
          <ul className="list-disc list-inside space-y-1">
            {renderNegativeFeedback()}
          </ul>
        </div>
        <div className="bg-cyan-500/10 p-4 rounded-lg">
          <h3 className="text-xl font-semibold text-cyan-400 mb-2">💡 Suggested Improvements</h3>
          <ul className="list-disc list-inside space-y-2">
            {analysis.suggested_improvements.length > 0
              ? analysis.suggested_improvements.map((item, i) => {
                  if (typeof item === 'string') {
                    return <li key={i} className="whitespace-pre-wrap">{item}</li>;
                  }
                  if (item && typeof item === 'object' && 'suggestion' in item) {
                    return (
                      <li key={i} className="whitespace-pre-wrap">
                        {item.area && <strong className="font-semibold text-cyan-300">{item.area}: </strong>}
                        {item.suggestion}
                      </li>
                    );
                  }
                  return null;
                })
              : <li>No specific improvements suggested.</li>}
          </ul>
        </div>
      </div>
      
      {analysis.historical_analysis && (
        <div className="mt-6 bg-gray-800/50 p-4 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-300 mb-3 flex items-center"><HistoryIcon className="w-5 h-5 mr-2" /> Historical Performance</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            {analysis.historical_analysis.content_evolution?.length > 0 && (
              <div>
                <h4 className="font-bold text-gray-200 mb-2">Content Evolution</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-400">
                  {analysis.historical_analysis.content_evolution.map((item, i) => <li key={`evo-${i}`} className="whitespace-pre-wrap">{item}</li>)}
                </ul>
              </div>
            )}
            {analysis.historical_analysis.engagement_trends?.length > 0 && (
              <div>
                <h4 className="font-bold text-gray-200 mb-2">Engagement Trends</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-400">
                  {analysis.historical_analysis.engagement_trends.map((item, i) => <li key={`trend-${i}`} className="whitespace-pre-wrap">{item}</li>)}
                </ul>
              </div>
            )}
            {analysis.historical_analysis.key_milestones?.length > 0 && (
              <div>
                <h4 className="font-bold text-gray-200 mb-2">Key Milestones</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-400">
                  {analysis.historical_analysis.key_milestones.map((item, i) => <li key={`mile-${i}`} className="whitespace-pre-wrap">{item}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {analysis.competitor_comparison && analysis.competitor_comparison.length > 0 && (
         <div className="mt-6 bg-gray-800/50 p-4 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-300 mb-3">⚔️ Competitor Comparison</h3>
            <div className="space-y-3">
                {analysis.competitor_comparison.map((comp, i) => (
                    <div key={i}>
                        <h4 className="font-bold text-gray-200">{comp.name}</h4>
                        <p className="whitespace-pre-wrap text-gray-400">{comp.analysis}</p>
                    </div>
                ))}
            </div>
         </div>
      )}
      {renderSources()}
    </div>
  );
};

export default AnalysisDisplay;