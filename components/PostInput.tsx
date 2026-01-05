import React, { useState, useEffect } from 'react';
import { SocialPlatform } from '../types';
import SparklesIcon from './icons/SparklesIcon';

interface PostInputProps {
  selectedPlatform: SocialPlatform;
  onAnalyze: (post: string) => void;
  isLoading: boolean;
}

const DEFAULT_GOOGLE_LOCATION = 'Dream Green CSC, C. Rociega, 2, 35510 Tías, Las Palmas, Spain';
const DEFAULT_INSTAGRAM_URL = 'https://www.instagram.com/dreamgreencsc/?hl=en';

const PostInput: React.FC<PostInputProps> = ({ selectedPlatform, onAnalyze, isLoading }) => {
  const [postContent, setPostContent] = useState('');

  useEffect(() => {
    if (selectedPlatform === SocialPlatform.Google) {
        setPostContent(DEFAULT_GOOGLE_LOCATION);
    } else if (selectedPlatform === SocialPlatform.Instagram) {
        setPostContent(DEFAULT_INSTAGRAM_URL);
    } else {
        setPostContent('');
    }
  }, [selectedPlatform]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (postContent.trim()) {
      onAnalyze(postContent);
    }
  };
  
  const isAnalyzeButtonDisabled = isLoading || !postContent.trim();

  const getPlaceholder = () => {
    switch (selectedPlatform) {
      case SocialPlatform.Instagram:
        return 'Enter an Instagram post or profile URL...';
      case SocialPlatform.Google:
        return 'e.g., "Cafe du Monde, New Orleans"';
      case SocialPlatform.TikTok:
        return 'e.g., "My new dance challenge #fyp #trending" or a URL...';
      default:
        return `e.g., "Just dropped a new video! Check it out!" or a URL to a post...`;
    }
  };

  const getButtonText = () => {
    switch (selectedPlatform) {
      case SocialPlatform.Google:
        return 'Analyze Dream Green Google Reviews';
      case SocialPlatform.Instagram:
        return 'Analyze Dream Green Instagram';
      default:
        return 'Analyze';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="mb-4">
        <label htmlFor="postContent" className="block text-lg font-semibold text-gray-300 mb-2">
          {selectedPlatform === SocialPlatform.Google ? 'Enter Business Name & Location' : 'Enter Post Content or URL'}
        </label>
        <textarea
          id="postContent"
          value={postContent}
          onChange={(e) => setPostContent(e.target.value)}
          className="w-full h-32 p-3 bg-gray-700/50 border-2 border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
          placeholder={getPlaceholder()}
          disabled={isLoading}
        />
      </div>
      
      <button
        type="submit"
        disabled={isAnalyzeButtonDisabled}
        className="w-full flex items-center justify-center bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              {/* FIX: The file was truncated here. Completed the SVG, button content, and added the default export. */}
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Analyzing...
          </>
        ) : (
          <>
            <SparklesIcon className="-ml-1 mr-2 h-5 w-5" />
            {getButtonText()}
          </>
        )}
      </button>
    </form>
  );
};

export default PostInput;
