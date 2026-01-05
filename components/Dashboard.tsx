import React, { useMemo } from 'react';
import { AnalysisHistoryEntry, SocialPlatform } from '../types';
import InstagramIcon from './icons/InstagramIcon';
import XIcon from './icons/XIcon';
import FacebookIcon from './icons/FacebookIcon';
import GoogleReviewsIcon from './icons/GoogleReviewsIcon';
import TikTokIcon from './icons/TikTokIcon';
import ChartBarIcon from './icons/ChartBarIcon';

interface DashboardProps {
  history: AnalysisHistoryEntry[];
}

const platformIcons: { [key in SocialPlatform]: React.FC<React.SVGProps<SVGSVGElement>> } = {
  [SocialPlatform.X]: XIcon,
  [SocialPlatform.Instagram]: InstagramIcon,
  [SocialPlatform.TikTok]: TikTokIcon,
  [SocialPlatform.Facebook]: FacebookIcon,
  [SocialPlatform.Google]: GoogleReviewsIcon,
};

const PlatformIcon: React.FC<{ platform: SocialPlatform; className?: string }> = ({ platform, className }) => {
  const Icon = platformIcons[platform];
  return Icon ? <Icon className={className} /> : null;
};

const ScoreTrendChart: React.FC<{ data: AnalysisHistoryEntry[] }> = ({ data }) => {
  const maxScore = 100;
  return (
    <div className="bg-gray-800/40 p-6 rounded-xl">
      <h3 className="text-xl font-semibold text-white mb-4">Overall Score Trend</h3>
      <div className="flex justify-around items-end h-48 space-x-2">
        {data.length > 0 ? data.slice(0, 10).reverse().map(entry => (
          <div key={entry.id} className="flex-1 flex flex-col items-center group">
            <div className="relative w-full h-full flex items-end justify-center">
              <div 
                className="w-3/4 bg-cyan-600 hover:bg-cyan-500 rounded-t-md transition-all duration-300 ease-in-out"
                style={{ height: `${(entry.analysis.overall_score / maxScore) * 100}%` }}
              >
                 <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 px-2 py-1 text-xs rounded-md">
                    {entry.analysis.overall_score}
                 </div>
              </div>
            </div>
            <PlatformIcon platform={entry.platform} className="w-5 h-5 mt-2 text-gray-400" />
            <span className="text-xs text-gray-500 mt-1">{new Date(entry.date).toLocaleDateString()}</span>
          </div>
        )) : <p className="text-gray-500">No data available.</p>}
      </div>
    </div>
  );
};

const TopThemes: React.FC<{ data: AnalysisHistoryEntry[] }> = ({ data }) => {
  const topThemes = useMemo(() => {
    const themeCounts = new Map<string, number>();
    data.forEach(entry => {
      entry.analysis.positive_feedback.common_themes?.forEach(theme => {
        themeCounts.set(theme, (themeCounts.get(theme) || 0) + 1);
      });
    });
    return Array.from(themeCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [data]);

  return (
    <div className="bg-gray-800/40 p-6 rounded-xl h-full">
      <h3 className="text-xl font-semibold text-white mb-4">Top Positive Themes</h3>
      {topThemes.length > 0 ? (
        <ol className="list-decimal list-inside space-y-2 text-gray-300">
          {topThemes.map(([theme, count]) => (
            <li key={theme}>
              <span className="font-medium text-cyan-400">{theme}</span>
              <span className="text-sm text-gray-400 ml-2">({count} mentions)</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-gray-500">Not enough data to determine top themes.</p>
      )}
    </div>
  );
};

const FeedbackBreakdown: React.FC<{ data: AnalysisHistoryEntry[] }> = ({ data }) => {
  const { positive, negative, total, positivePercent, negativePercent } = useMemo(() => {
    let positive = 0;
    let negative = 0;
    data.forEach(entry => {
      positive += entry.analysis.positive_feedback?.what_customers_love?.length || 0;
      negative += entry.analysis.negative_feedback?.key_areas_of_dissatisfaction?.length || 0;
    });
    const total = positive + negative;
    if (total === 0) return { positive: 0, negative: 0, total: 0, positivePercent: 0, negativePercent: 0 };
    return {
      positive,
      negative,
      total,
      positivePercent: (positive / total) * 100,
      negativePercent: (negative / total) * 100,
    };
  }, [data]);

  return (
    <div className="bg-gray-800/40 p-6 rounded-xl h-full">
      <h3 className="text-xl font-semibold text-white mb-4">Feedback Breakdown</h3>
      {total > 0 ? (
        <div className="flex items-center space-x-6">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle
                  className="text-red-500/30"
                  cx="18" cy="18" r="15.9155"
                  fill="none" stroke="currentColor" strokeWidth="3"
                />
                <circle
                  className="text-green-400"
                  cx="18" cy="18" r="15.9155"
                  fill="none" stroke="currentColor" strokeWidth="3"
                  strokeDasharray={`${positivePercent}, 100`}
                />
              </svg>
               <div className="absolute inset-0 flex items-center justify-center">
                 <span className={`text-3xl font-bold text-white`}>{Math.round(positivePercent)}%</span>
               </div>
            </div>
            <div className="space-y-2">
                <div>
                    <div className="flex items-center">
                        <span className="w-3 h-3 rounded-full bg-green-400 mr-2"></span>
                        <span className="font-semibold text-gray-300">Positive</span>
                    </div>
                    <span className="text-gray-400 ml-5 text-sm">{positive} points ({Math.round(positivePercent)}%)</span>
                </div>
                 <div>
                    <div className="flex items-center">
                        <span className="w-3 h-3 rounded-full bg-red-500/30 mr-2"></span>
                        <span className="font-semibold text-gray-300">Negative</span>
                    </div>
                    <span className="text-gray-400 ml-5 text-sm">{negative} points ({Math.round(negativePercent)}%)</span>
                </div>
            </div>
        </div>
      ) : (
         <p className="text-gray-500">No feedback points to analyze.</p>
      )}
    </div>
  );
};


const Dashboard: React.FC<DashboardProps> = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="max-w-4xl mx-auto bg-gray-800/40 p-8 rounded-2xl text-center animate-fade-in">
        <ChartBarIcon className="w-16 h-16 mx-auto text-gray-500 mb-4" />
        <h2 className="text-2xl font-bold text-white">Your Dashboard is Ready</h2>
        <p className="text-gray-400 mt-2">
          Analyze a post or business review, and your performance data will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <ScoreTrendChart data={history} />
      <div className="grid md:grid-cols-2 gap-6">
        <TopThemes data={history} />
        <FeedbackBreakdown data={history} />
      </div>
    </div>
  );
};

export default Dashboard;
