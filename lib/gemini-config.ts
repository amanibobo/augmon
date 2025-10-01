export const GEMINI_API_KEY = 'AIzaSyD15fdCAzYJbEamMVsFxM1xXfz7PXWpwdk';

export const GEMINI_MODELS = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Most capable model for complex tasks'
  },
] as const;

export type GeminiModel = typeof GEMINI_MODELS[number]['id'];
