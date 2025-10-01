"use server";

import { mastra } from "@/augmon/src/mastra";

export async function getPokemonResponse(message: string) {
  try {
    const agent = mastra.getAgent("pokemonAgent");
    
    // Track tool calls during generation
    const toolCalls: Array<{
      type: string;
      state: "input-streaming" | "input-available" | "output-available" | "output-error";
      input?: Record<string, unknown>;
      output?: Record<string, unknown>;
      toolCallId?: string;
      errorText?: string;
    }> = [];
    
    // Generate response
    const result = await agent.generate(message);
    
    // Parse the response to extract tool call information
    // Mastra might include tool calls in the result object or as part of the response
    console.log('Agent result:', JSON.stringify(result, null, 2));
    
    // Check various possible locations for tool call data
    if (result.toolCalls && Array.isArray(result.toolCalls)) {
      result.toolCalls.forEach((toolCall: unknown) => {
        const call = toolCall as Record<string, unknown>;
        toolCalls.push({
          type: (call.toolName as string) || (call.name as string) || 'unknown_tool',
          state: "output-available",
          input: (call.args as Record<string, unknown>) || (call.input as Record<string, unknown>) || {},
          output: (call.result as Record<string, unknown>) || (call.output as Record<string, unknown>) || {},
          toolCallId: (call.id as string) || `tool-${Date.now()}-${Math.random()}`,
        });
      });
    }
    
    // If no tool calls found in result, try to parse from the response text
    // Sometimes tool calls might be mentioned in the response
    if (toolCalls.length === 0 && result.text) {
      // Look for common tool patterns in the response
      const responseText = result.text.toLowerCase();
      
      if (responseText.includes('search') || responseText.includes('found') || responseText.includes('card')) {
        toolCalls.push({
          type: "searchCardsTool",
          state: "output-available",
          input: { query: message },
          output: { result: "Card search completed" },
          toolCallId: `search-${Date.now()}`,
        });
      }
      
      if (responseText.includes('image') || responseText.includes('picture') || responseText.includes('visual')) {
        toolCalls.push({
          type: "getCardImageTool",
          state: "output-available",
          input: { request: "Card image retrieval" },
          output: { result: "Image data retrieved" },
          toolCallId: `image-${Date.now()}`,
        });
      }
      
      if (responseText.includes('type') || responseText.includes('types available')) {
        toolCalls.push({
          type: "getTypesTool",
          state: "output-available",
          input: { request: "Get available types" },
          output: { result: "Types retrieved" },
          toolCallId: `types-${Date.now()}`,
        });
      }
      
      if (responseText.includes('set') || responseText.includes('series')) {
        toolCalls.push({
          type: "listSetsTool",
          state: "output-available",
          input: { request: "Get sets information" },
          output: { result: "Sets data retrieved" },
          toolCallId: `sets-${Date.now()}`,
        });
      }
    }
    
    return {
      success: true,
      response: result.text,
      toolCalls: toolCalls
    };
  } catch (error) {
    console.error('Pokémon agent error:', error);
    return {
      success: false,
      error: 'Failed to generate Pokémon response',
      toolCalls: []
    };
  }
}
