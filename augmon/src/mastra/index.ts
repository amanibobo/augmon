
import 'dotenv/config';
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { weatherWorkflow } from './workflows/weather-workflow';
import { weatherAgent } from './agents/weather-agent';
import { pokemonAgent } from './agents/pokemon-agent';
import { MDocument, rerankWithScorer as rerank, CohereRelevanceScorer } from '@mastra/rag';
import card_data from '../../../data';
import { GoogleGenAI } from '@google/genai';
import { PineconeVector } from '@mastra/pinecone';

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { weatherAgent, pokemonAgent },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});


void (async () => {
  try {
    const doc = MDocument.fromJSON(JSON.stringify(card_data));
    const chunks = await doc.chunk({
      maxSize: 100,
    });
    if (!chunks.length) {
      console.warn('No chunks to embed');
      return;
    }

    // 1) Embed all chunks using Google Gemini Embeddings
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });
    const batch = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: chunks.map((c) => c.text),
    });

    const embeddings = (batch.embeddings || []).map((e: any) => e.values as number[]);
    if (!embeddings.length) {
      console.warn('No embeddings returned');
      return;
    }

    // Determine dimension from first embedding
    const dimension = embeddings[0].length;
    console.log(`Generated ${embeddings.length} embeddings (dimension=${dimension}).`);

    // 2) Upsert into Pinecone
    const pinecone = new PineconeVector({
      apiKey: process.env.PINECONE_API_KEY!,
      // Optional but recommended if your org uses index-specific hosts
      host: process.env.PINECONE_INDEX_HOST,
    });

    await pinecone.createIndex({
      indexName: 'testindex',
      dimension,
    });

    await pinecone.upsert({
      indexName: 'testindex',
      vectors: embeddings,
      metadata: chunks.map((chunk: any) => ({ text: chunk.text })),
    });

    console.log(`Upserted ${embeddings.length} vectors into Pinecone.`);

    // 3) Retrieve: similarity search on the first embedding
    const topK = 10;
    const results = await pinecone.query({
      indexName: 'testindex',
      queryVector: embeddings[0],
      topK,
    });

    console.log('Query results:', JSON.stringify(results, null, 2));

    // Prepare results for reranking
    const searchResults = (results?.matches || [])
      .map((m: any, i: number) => ({
        id: String(m?.id ?? i),
        text: String(m?.metadata?.text ?? ''),
        score: Number(m?.score ?? 0),
        position: i,
      }))
      .filter((r: any) => r.text.length > 0);

    if (searchResults.length) {
      const reranked = await rerank({
        results: searchResults,
        query: process.env.RAG_QUERY ?? 'deployment configuration',
        scorer: new CohereRelevanceScorer('rerank-v3.5'),
        topK: 5,
        weights: { semantic: 0.4, vector: 0.4, position: 0.2 },
      });
      console.log('Cohere reranked results:', reranked);
    }
  } catch (err) {
    console.error('Error chunking data:', err);
  }
})();


