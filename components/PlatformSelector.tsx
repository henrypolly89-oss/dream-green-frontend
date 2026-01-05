import React from 'react';
import { SocialPlatform } from '../types';
import GoogleReviewsIcon from './icons/GoogleReviewsIcon';
import InstagramIcon from './icons/InstagramIcon';

interface PlatformSelectorProps {
  selectedPlatform: SocialPlatform;
  onSelectPlatform: (platform: SocialPlatform) => void;
}

const platformOptions = [
  { id: SocialPlatform.Google, label: 'Dream Green Google Reviews', icon: GoogleReviewsIcon },
  { id: SocialPlatform.Instagram, label: 'Dream Green Instagram', icon: InstagramIcon },
];

const PlatformSelector: React.FC<PlatformSelectorProps> = ({ selectedPlatform, onSelectPlatform }) => {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-300 mb-4 text-center">Select a platform to analyze</h2>
      <div className="flex justify-center flex-wrap gap-4">
        {platformOptions.map(({ id, label, icon: Icon }) => {
          const isSelected = selectedPlatform === id;
          return (
            <button
              key={id}
              onClick={() => onSelectPlatform(id)}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200 ease-in-out transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 w-56
                ${isSelected 
                  ? 'bg-cyan-500/20 border-cyan-500 scale-105 shadow-lg' 
                  : 'bg-gray-700/50 border-gray-600 hover:bg-gray-700 hover:border-gray-500'
                }`}
            >
              <Icon className="w-8 h-8 mb-2" />
              <span className={`font-medium text-center ${isSelected ? 'text-white' : 'text-gray-300'}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PlatformSelector;