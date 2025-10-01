import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { GEMINI_API_KEY, GeminiModel } from './gemini-config';

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private models: Map<GeminiModel, GenerativeModel> = new Map();

  constructor() {
    this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }

  private getModel(modelId: GeminiModel): GenerativeModel {
    if (!this.models.has(modelId)) {
      const model = this.genAI.getGenerativeModel({ model: modelId });
      this.models.set(modelId, model);
    }
    return this.models.get(modelId)!;
  }

  async generateContent(
    prompt: string, 
    modelId: GeminiModel = 'gemini-2.5-flash',
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    try {
      const model = this.getModel(modelId);
      
      if (onChunk) {
        // For streaming responses
        const result = await model.generateContentStream(prompt);
        let fullResponse = '';
        
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          fullResponse += chunkText;
          onChunk(chunkText);
        }
        
        return fullResponse;
      } else {
        // For non-streaming responses
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      }
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to generate content. Please try again.');
    }
  }

  async generateCardAnalysis(
    cardData: string,
    context: string[] = [],
    modelId: GeminiModel = 'gemini-2.5-flash'
  ): Promise<string> {
    const contextText = context.length > 0 ? `\n\nContext from other cards: ${context.join(', ')}` : '';
    
    const prompt = `You are an AI assistant helping with Pokémon card analysis and deck building. 
    
Card data: ${cardData}${contextText}

Please provide:
1. Card analysis (type, rarity, stats if available)
2. Strategic value for deck building
3. Synergies with other cards
4. Battle recommendations

Keep your response concise but informative.`;

    return this.generateContent(prompt, modelId);
  }

  async generateBattleSimulation(
    card1: string,
    card2: string,  
    modelId: GeminiModel = 'gemini-2.5-flash'
  ): Promise<string> {
    const prompt = `Simulate a battle between these two Pokémon cards:

Card 1: ${card1}
Card 2: ${card2}

Provide a detailed battle simulation including:
1. Turn-by-turn breakdown
2. Attack descriptions
3. Winner determination
4. Strategy analysis

Make it engaging and educational.`;

    return this.generateContent(prompt, modelId);
  }

  async generateDeckOptimization(
    currentDeck: string[],
    modelId: GeminiModel = 'gemini-2.5-flash'
  ): Promise<string> {
    const deckText = currentDeck.join('\n');
    
    const prompt = `Analyze this Pokémon deck and provide optimization suggestions:

Current deck:
${deckText}

Please provide:
1. Deck balance analysis
2. Missing card types/strategies
3. Specific card recommendations
4. Alternative strategies
5. Weakness analysis

Focus on practical improvements.`;

    return this.generateContent(prompt, modelId);
  }

  // Check if the message is Pokémon-related
  isPokemonQuery(message: string): boolean {
    const pokemonKeywords = [
      'pokemon', 'pokémon', 'pokemon tcg', 'pokémon tcg', 'tcg',
      'card', 'cards', 'deck', 'battle', 'attack', 'type', 'fire', 'water', 'grass', 'electric',
      'psychic', 'fighting', 'darkness', 'metal', 'fairy', 'dragon', 'colorless',
      'ninetales', 'charizard', 'pikachu', 'blastoise', 'venusaur', 'mewtwo',
      'set', 'series', 'base set', 'legendary', 'rare', 'holo', 'ex', 'gx', 'v', 'vmax',
      'energy', 'trainer', 'stadium', 'supporter', 'item', 'tool',
      'weakness', 'resistance', 'retreat', 'hp', 'damage',
      'show', 'display', 'image', 'picture', 'visual'
    ];
    
    const lowerMessage = message.toLowerCase();
    return pokemonKeywords.some(keyword => lowerMessage.includes(keyword));
  }
}

export const geminiService = new GeminiService();
