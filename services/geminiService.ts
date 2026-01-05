import { GoogleGenAI, Type } from '@google/genai';
import { SocialPlatform, AnalysisResult, GroundingChunk } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const DREAMGREEN_INSTAGRAM_URL = 'https://www.instagram.com/dreamgreencsc/?hl=en';

const parseJsonFromResponse = (text: string): any => {
  // Attempt to find and parse a JSON code block first
  const jsonBlockMatch = text.match(/```json\n([\s\S]*?)\n```/);
  if (jsonBlockMatch && jsonBlockMatch[1]) {
    try {
      return JSON.parse(jsonBlockMatch[1]);
    } catch (e) {
      console.error("Failed to parse JSON from code block, falling back.", e);
    }
  }

  // If no code block, or if it failed, find the first and last brackets
  const firstBracket = text.indexOf('{');
  const firstSquare = text.indexOf('[');
  
  if (firstBracket === -1 && firstSquare === -1) {
    // No JSON object found at all.
    // The text itself might be the intended "error" or informational message.
    return null;
  }

  let startIndex = -1;
  if (firstBracket === -1) startIndex = firstSquare;
  else if (firstSquare === -1) startIndex = firstBracket;
  else startIndex = Math.min(firstBracket, firstSquare);

  const lastBracket = text.lastIndexOf('}');
  const lastSquare = text.lastIndexOf(']');
  const endIndex = Math.max(lastBracket, lastSquare);

  if (startIndex > -1 && endIndex > -1 && endIndex > startIndex) {
    const jsonString = text.substring(startIndex, endIndex + 1);
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      console.error("Failed to parse extracted JSON substring:", e);
      // Fall through to throw an error
    }
  }
  
  throw new Error("Could not parse a valid JSON object from the model's response.");
};


/**
 * Safely converts a value to a string array. If the value is a string, it's wrapped in an array.
 * If it's already an array, it's returned as is. Otherwise, an empty array is returned.
 * @param value The value to convert.
 * @returns A string array.
 */
const ensureArray = (value: any): string[] => {
    if (Array.isArray(value)) {
        return value.filter(item => typeof item === 'string');
    }
    if (typeof value === 'string' && value.trim() !== "") {
        return [value];
    }
    return [];
};


/**
 * Normalizes different potential AI response structures into a consistent AnalysisResult format.
 * This makes the application resilient to variations in the model's output by checking for multiple
 * possible field names and structures, and safely constructing a valid object for the UI.
 * @param data The raw parsed JSON from the AI response.
 * @returns A standardized AnalysisResult object.
 */
const normalizeAnalysisData = (data: any): AnalysisResult => {
  if (typeof data !== 'object' || data === null) {
    console.error("Received non-object data for normalization:", data);
    throw new Error("Received invalid data structure from the AI model.");
  }

  const pos = data.positive_feedback || data.positiveFeedback || {};
  const neg = data.negative_feedback || data.negativeFeedback || {};
  const sugg = data.suggested_improvements || data.suggestedImprovements;
  const hist = data.historical_analysis;

  const result: AnalysisResult = {
    overall_score: data.overall_score || data.overallPerformance?.score || data.overall_performance_score || 0,
    positive_feedback: {
        common_themes: ensureArray(pos.common_themes || pos.commonThemes),
        what_customers_love: ensureArray(pos.what_customers_love || pos.whatCustomersLove),
    },
    negative_feedback: {
        common_themes: ensureArray(neg.common_themes || neg.commonThemes),
        key_areas_of_dissatisfaction: ensureArray(neg.key_areas_of_dissatisfaction || neg.keyAreasOfDissatisfaction),
    },
    suggested_improvements: [],
    competitor_comparison: data.competitor_comparison || undefined,
    historical_analysis: undefined,
  };
  
  if (hist && typeof hist === 'object') {
    result.historical_analysis = {
      content_evolution: ensureArray(hist.content_evolution),
      engagement_trends: ensureArray(hist.engagement_trends),
      key_milestones: ensureArray(hist.key_milestones),
    };
  }

  // Normalize Suggested Improvements, handling multiple structures
  if (Array.isArray(sugg)) {
    result.suggested_improvements = sugg
      .map(item => {
        if (typeof item === 'string') {
          return item;
        }
        if (typeof item === 'object' && item !== null) {
          if ('area' in item && 'suggestion' in item) return { area: item.area, suggestion: item.suggestion };
          if ('category' in item && 'advice' in item) return { area: item.category, suggestion: item.advice };
        }
        return null;
      })
      .filter(Boolean);
  } else if (typeof sugg === 'object' && sugg !== null) {
    if (Array.isArray(sugg.recommendations)) {
      result.suggested_improvements = sugg.recommendations;
    } else if (sugg.summary) {
      result.suggested_improvements = [{ area: "General", suggestion: sugg.summary }];
    } else {
      // Handle the key-value pair structure e.g. { "Customer Service": "Do better." }
      result.suggested_improvements = Object.entries(sugg).map(([area, suggestion]) => {
        if (typeof suggestion === 'string') {
          return { area, suggestion };
        }
        return null;
      }).filter(Boolean);
    }
  }

  return result;
};


const historicalAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        content_evolution: { type: Type.ARRAY, items: { type: Type.STRING }, description: "How their content style, themes, and quality have changed over time." },
        engagement_trends: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Patterns in likes, comments, and follower growth over time." },
        key_milestones: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Significant events, successful campaigns, or major shifts in strategy." },
    },
    required: ['content_evolution', 'engagement_trends', 'key_milestones']
};

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    overall_score: {
      type: Type.NUMBER,
      description: 'Overall score from 0 to 100 based on engagement, sentiment, and content quality.',
    },
    positive_feedback: {
      type: Type.OBJECT,
      description: 'Structured positive feedback about the post.',
      properties: {
        common_themes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Common themes found in positive feedback." },
        what_customers_love: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific aspects that are highly praised." },
      },
      required: ['common_themes', 'what_customers_love'],
    },
    negative_feedback: {
      type: Type.OBJECT,
      description: 'Structured negative feedback about the post.',
      properties: {
        common_themes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Common themes found in negative feedback." },
        key_areas_of_dissatisfaction: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific aspects that are sources of dissatisfaction." },
      },
      required: ['common_themes', 'key_areas_of_dissatisfaction'],
    },
    suggested_improvements: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          area: { type: Type.STRING, description: 'The specific area of improvement (e.g., "Hashtags", "Caption", "Visuals").' },
          suggestion: { type: Type.STRING, description: 'The concrete suggestion for that area.' },
        },
        required: ['area', 'suggestion'],
      },
      description: 'Actionable suggestions to improve future posts, categorized by area.',
    },
    competitor_comparison: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          analysis: { type: Type.STRING },
        },
        required: ['name', 'analysis'],
      },
      description: 'Optional: Brief analysis of how this post compares to competitors.',
    },
    historical_analysis: historicalAnalysisSchema,
  },
  required: ['overall_score', 'positive_feedback', 'negative_feedback', 'suggested_improvements'],
};

const getBasePrompt = (platform: SocialPlatform, post: string): string => {
  const isUrl = post.startsWith('http');
  const postIdentifier = isUrl ? `the post at this URL: ${post}` : `the following post content: "${post}"`;

  return `
    Analyze ${postIdentifier}.
    The post is from the platform: ${platform}.
    Provide a detailed analysis covering the following areas:
    - Overall performance score (0-100)
    - Positive feedback as an object with 'common_themes' (an array of strings) and 'what_customers_love' (an array of short, distinct string bullet points, each highlighting a specific praised aspect).
    - Negative feedback as an object with 'common_themes' (an array of strings) and 'key_areas_of_dissatisfaction' (an array of short, distinct string bullet points, each highlighting a specific issue).
    - Suggested improvements (actionable advice, categorized by area like "Hashtags" or "Caption").
    - (Optional) Competitor comparison if relevant information is available.
    
    Format your response as a JSON object that adheres to the provided schema. The values for 'what_customers_love' and 'key_areas_of_dissatisfaction' must be arrays of separate, short strings. Do not combine multiple points into a single long string. If using a search tool, just return the JSON object directly.
  `;
};

const getDreamGreenInstagramPrompt = (): string => {
    return `
      Analyze the Instagram profile at this URL: ${DREAMGREEN_INSTAGRAM_URL}
      
      You are an expert social media analyst. Your task is to provide a detailed analysis of the given Instagram profile's overall strategy, recent posts, and engagement. Include a historical analysis of their performance over time.
      
      Your analysis must cover these specific areas:
      1.  **Overall performance score**: A single number from 0-100 based on content strategy, engagement, and profile presentation.
      2.  **Positive feedback**: An object containing 'common_themes' (an array of strings) and 'what_customers_love' (an array of short, distinct string bullet points, each highlighting a specific praised aspect).
      3.  **Negative feedback**: An object containing 'common_themes' (an array of strings) and 'key_areas_of_dissatisfaction' (an array of short, distinct string bullet points, each highlighting a specific issue).
      4.  **Suggested improvements**: An array of objects, each with an 'area' (e.g., "Bio", "Content Strategy") and a 'suggestion' (actionable advice).
      5.  **Historical analysis**: An object containing 'content_evolution', 'engagement_trends', and 'key_milestones', each being an array of strings.
      
      **IMPORTANT**: Your entire response MUST be a single, valid JSON object. Do not include any text, greetings, or explanations before or after the JSON object. The JSON object should strictly adhere to the structure described above. Ensure that all string arrays contain separate, distinct points and do not combine multiple ideas into one long string with newlines.
    `;
};

const getGoogleReviewsPrompt = (businessInfo: string): string => {
    return `
      Analyze the online reputation of the business: "${businessInfo}".

      IMPORTANT: You may not have access to the full text of individual Google Reviews. Base your analysis on the available aggregate data from Google Maps (like average star rating and review count) and supplement it with information from Google Search (like news articles, social media mentions, or other web pages discussing the business).

      Provide a detailed analysis covering the following areas:
      - Overall performance score (0-100) based on average rating, review volume, and overall online sentiment.
      - Positive feedback as an object with 'common_themes' (an array of strings) and 'what_customers_love' (an array of short, distinct string bullet points, each highlighting a praised aspect inferred from your search).
      - Negative feedback as an object with 'common_themes' (an array of strings) and 'key_areas_of_dissatisfaction' (an array of short, distinct string bullet points, each highlighting a potential issue inferred from your search).
      - Suggested improvements (actionable advice for the business based on the overall reputation, categorized by area like "Online Presence", "Customer Service Perception").
      
      If you cannot find sufficient information to perform an analysis, respond with a clear message explaining the issue instead of a JSON object.
      
      Otherwise, your entire response must be a single, valid JSON object that adheres to the structure described. The values for 'what_customers_love' and 'key_areas_of_dissatisfaction' must be arrays of separate, short strings.
    `;
};


export const analyzePost = async (platform: SocialPlatform, post: string): Promise<{ analysis: AnalysisResult, sources: GroundingChunk[] }> => {
  const isAnyGoogleAnalysis = platform === SocialPlatform.Google;
  
  // Robust check: match if the post string contains the key identifiers of the profile, 
  // ignoring minor differences like http vs https or query params.
  const cleanPost = post.trim().toLowerCase();
  const isDreamGreenAnalysis = platform === SocialPlatform.Instagram && cleanPost.includes('instagram.com/dreamgreencsc');

  const isUrl = post.startsWith('http');
  const useGrounding = isUrl || isDreamGreenAnalysis || isAnyGoogleAnalysis;
  
  let prompt: string;
  if (isDreamGreenAnalysis) {
    prompt = getDreamGreenInstagramPrompt();
  } else if (isAnyGoogleAnalysis) {
    prompt = getGoogleReviewsPrompt(post);
  } else {
    prompt = getBasePrompt(platform, post);
  }
    
  // Use gemini-3-pro-preview only for Dream Green Instagram analysis.
  // Google Maps analysis must use gemini-2.5-flash as the Maps tool is not supported on 3-pro yet.
  const model = isDreamGreenAnalysis ? 'gemini-3-pro-preview' : 'gemini-2.5-flash';

  const config: any = {};

  if (useGrounding) {
    // Grounding with Google Search or Maps. Cannot be used with responseSchema.
    config.tools = isAnyGoogleAnalysis ? [{ googleMaps: {} }, { googleSearch: {} }] : [{ googleSearch: {} }];
  } else {
    // No grounding, we can enforce a JSON response.
    config.responseMimeType = 'application/json';
    config.responseSchema = analysisSchema;
  }

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config,
  });

  const responseText = response.text.trim();

  const rawAnalysis = parseJsonFromResponse(responseText);
  
  if (!rawAnalysis) {
    // If parsing returns null, it means no JSON was found.
    // Treat the response text as a human-readable message from the model.
    throw new Error(responseText);
  }
  
  const sources = useGrounding ? response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] || [] : [];
  
  const analysis = normalizeAnalysisData(rawAnalysis);
  
  return { analysis, sources };
};