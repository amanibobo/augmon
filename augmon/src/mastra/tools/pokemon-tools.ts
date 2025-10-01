import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const API_BASE = 'https://api.pokemontcg.io/v2';

// Type definitions based on Pokémon TCG API v2
interface PokemonCard {
  id: string;
  name: string;
  supertype: string;
  subtypes?: string[];
  hp?: string;
  types?: string[];
  evolesFrom?: string;
  evolvesTo?: string[];
  rules?: string[];
  ancientTrait?: {
    name: string;
    text: string;
  };
  abilities?: Array<{
    name: string;
    text: string;
    type: string;
  }>;
  attacks?: Array<{
    cost: string[];
    name: string;
    text: string;
    damage?: string;
    convertedEnergyCost: number;
  }>;
  weaknesses?: Array<{
    type: string;
    value: string;
  }>;
  resistances?: Array<{
    type: string;
    value: string;
  }>;
  retreatCost?: string[];
  convertedRetreatCost?: number;
  set: {
    id: string;
    name: string;
    series: string;
    printedTotal: number;
    total: number;
    legalities: Record<string, string>;
    ptcgoCode?: string;
    releaseDate: string;
    updatedAt: string;
    images: {
      symbol: string;
      logo: string;
    };
  };
  number: string;
  artist?: string;
  rarity: string;
  flavorText?: string;
  nationalPokedexNumbers?: number[];
  legalities: Record<string, string>;
  regulationMark?: string;
  images: {
    small: string;
    large: string;
  };
  tcgplayer?: {
    url: string;
    updatedAt: string;
    prices: {
      holofoil?: { low: number; mid: number; high: number; market: number; directLow: number };
      reverseHolofoil?: { low: number; mid: number; high: number; market: number; directLow: number };
      normal?: { low: number; mid: number; high: number; market: number; directLow: number };
      '1stEditionHolofoil'?: { low: number; mid: number; high: number; market: number; directLow: number };
      unlimitedHolofoil?: { low: number; mid: number; high: number; market: number; directLow: number };
    };
  };
  cardmarket?: {
    url: string;
    updatedAt: string;
    prices: {
      averageSellPrice?: number;
      lowPrice?: number;
      trendPrice?: number;
      germanProLow?: number;
      suggestedPrice?: number;
      reverseHoloSell?: number;
      reverseHoloLow?: number;
      reverseHoloTrend?: number;
      lowPriceExPlus?: number;
      avg1?: number;
      avg7?: number;
      avg30?: number;
      reverseHoloAvg1?: number;
      reverseHoloAvg7?: number;
      reverseHoloAvg30?: number;
    };
  };
}

interface PokemonSet {
  id: string;
  name: string;
  series: string;
  printedTotal: number;
  total: number;
  legalities: Record<string, string>;
  ptcgoCode?: string;
  releaseDate: string;
  updatedAt: string;
  images: {
    symbol: string;
    logo: string;
  };
}

interface ApiResponse<T> {
  data: T;
  page: number;
  pageSize: number;
  count: number;
  totalCount: number;
}

async function doFetch(path: string, params?: Record<string, string>) {
  const url = new URL(API_BASE + path);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const headers: Record<string, string> = {};
  if (process.env.POKEMON_TCG_API_KEY) {
    headers['X-Api-Key'] = process.env.POKEMON_TCG_API_KEY as string;
  }
  const res = await fetch(url.toString(), { headers });
  if (!res.ok) {
    throw new Error(`Pokémon TCG API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

export const searchCardsTool = createTool({
  id: 'pokemon-search-cards',
  description: 'Search Pokémon TCG cards by name, type, set, rarity, etc. Returns detailed card information including images, attacks, abilities, and pricing.',
  inputSchema: z.object({
    q: z.string().describe('Search query. Examples: "name:Ninetales", "set:Base", "type:Fire", "rarity:Rare", "hp:90"'),
    page: z.number().int().min(1).optional().default(1),
    pageSize: z.number().int().min(1).max(250).optional().default(25),
  }),
  outputSchema: z.object({
    cards: z.array(z.object({
      id: z.string(),
      name: z.string(),
      supertype: z.string(),
      subtypes: z.array(z.string()).optional(),
      hp: z.string().optional(),
      types: z.array(z.string()).optional(),
      rarity: z.string(),
      set: z.object({
        id: z.string(),
        name: z.string(),
        series: z.string(),
        releaseDate: z.string(),
      }),
      images: z.object({
        small: z.string(),
        large: z.string(),
      }),
      attacks: z.array(z.object({
        name: z.string(),
        cost: z.array(z.string()),
        damage: z.string().optional(),
        text: z.string(),
      })).optional(),
      abilities: z.array(z.object({
        name: z.string(),
        text: z.string(),
        type: z.string(),
      })).optional(),
      weaknesses: z.array(z.object({
        type: z.string(),
        value: z.string(),
      })).optional(),
      resistances: z.array(z.object({
        type: z.string(),
        value: z.string(),
      })).optional(),
      retreatCost: z.array(z.string()).optional(),
    })),
    totalCount: z.number(),
    page: z.number(),
    pageSize: z.number(),
  }),
  execute: async ({ context }) => {
    const data: ApiResponse<PokemonCard[]> = await doFetch('/cards', {
      q: context.q,
      page: String(context.page ?? 1),
      pageSize: String(context.pageSize ?? 25),
    });
    
    const cards = data.data.map(card => ({
      id: card.id,
      name: card.name,
      supertype: card.supertype,
      subtypes: card.subtypes,
      hp: card.hp,
      types: card.types,
      rarity: card.rarity,
      set: {
        id: card.set.id,
        name: card.set.name,
        series: card.set.series,
        releaseDate: card.set.releaseDate,
      },
      images: card.images,
      attacks: card.attacks?.map(attack => ({
        name: attack.name,
        cost: attack.cost,
        damage: attack.damage,
        text: attack.text,
      })),
      abilities: card.abilities?.map(ability => ({
        name: ability.name,
        text: ability.text,
        type: ability.type,
      })),
      weaknesses: card.weaknesses,
      resistances: card.resistances,
      retreatCost: card.retreatCost,
    }));

    return {
      cards,
      totalCount: data.totalCount,
      page: data.page,
      pageSize: data.pageSize,
    };
  },
});

export const getCardTool = createTool({
  id: 'pokemon-get-card',
  description: 'Get detailed information about a specific Pokémon TCG card by its ID.',
  inputSchema: z.object({ 
    id: z.string().describe('Card ID, e.g. xy1-1, base1-4, sm12-150') 
  }),
  outputSchema: z.object({ 
    card: z.object({
      id: z.string(),
      name: z.string(),
      supertype: z.string(),
      subtypes: z.array(z.string()).optional(),
      hp: z.string().optional(),
      types: z.array(z.string()).optional(),
      rarity: z.string(),
      flavorText: z.string().optional(),
      set: z.object({
        id: z.string(),
        name: z.string(),
        series: z.string(),
        releaseDate: z.string(),
      }),
      images: z.object({
        small: z.string(),
        large: z.string(),
      }),
      attacks: z.array(z.object({
        name: z.string(),
        cost: z.array(z.string()),
        damage: z.string().optional(),
        text: z.string(),
        convertedEnergyCost: z.number(),
      })).optional(),
      abilities: z.array(z.object({
        name: z.string(),
        text: z.string(),
        type: z.string(),
      })).optional(),
      weaknesses: z.array(z.object({
        type: z.string(),
        value: z.string(),
      })).optional(),
      resistances: z.array(z.object({
        type: z.string(),
        value: z.string(),
      })).optional(),
      retreatCost: z.array(z.string()).optional(),
      convertedRetreatCost: z.number().optional(),
      artist: z.string().optional(),
      number: z.string(),
      legalities: z.record(z.string(), z.string()),
    })
  }),
  execute: async ({ context }) => {
    const data: ApiResponse<PokemonCard> = await doFetch(`/cards/${encodeURIComponent(context.id)}`);
    
    const card = data.data;
    return {
      card: {
        id: card.id,
        name: card.name,
        supertype: card.supertype,
        subtypes: card.subtypes,
        hp: card.hp,
        types: card.types,
        rarity: card.rarity,
        flavorText: card.flavorText,
        set: {
          id: card.set.id,
          name: card.set.name,
          series: card.set.series,
          releaseDate: card.set.releaseDate,
        },
        images: card.images,
        attacks: card.attacks?.map(attack => ({
          name: attack.name,
          cost: attack.cost,
          damage: attack.damage,
          text: attack.text,
          convertedEnergyCost: attack.convertedEnergyCost,
        })),
        abilities: card.abilities?.map(ability => ({
          name: ability.name,
          text: ability.text,
          type: ability.type,
        })),
        weaknesses: card.weaknesses,
        resistances: card.resistances,
        retreatCost: card.retreatCost,
        convertedRetreatCost: card.convertedRetreatCost,
        artist: card.artist,
        number: card.number,
        legalities: card.legalities,
      }
    };
  },
});

export const listSetsTool = createTool({
  id: 'pokemon-list-sets',
  description: 'List Pokémon TCG sets with pagination. Returns set information including release dates, series, and card counts.',
  inputSchema: z.object({ 
    page: z.number().int().min(1).optional().default(1), 
    pageSize: z.number().int().min(1).max(250).optional().default(25) 
  }),
  outputSchema: z.object({ 
    sets: z.array(z.object({
      id: z.string(),
      name: z.string(),
      series: z.string(),
      printedTotal: z.number(),
      total: z.number(),
      releaseDate: z.string(),
      legalities: z.record(z.string(), z.string()),
      images: z.object({
        symbol: z.string(),
        logo: z.string(),
      }),
    })),
    totalCount: z.number(),
    page: z.number(),
    pageSize: z.number(),
  }),
  execute: async ({ context }) => {
    const data: ApiResponse<PokemonSet[]> = await doFetch('/sets', { 
      page: String(context.page ?? 1), 
      pageSize: String(context.pageSize ?? 25) 
    });
    
    const sets = data.data.map(set => ({
      id: set.id,
      name: set.name,
      series: set.series,
      printedTotal: set.printedTotal,
      total: set.total,
      releaseDate: set.releaseDate,
      legalities: set.legalities,
      images: set.images,
    }));

    return { 
      sets,
      totalCount: data.totalCount,
      page: data.page,
      pageSize: data.pageSize,
    };
  },
});

export const getSetTool = createTool({
  id: 'pokemon-get-set',
  description: 'Get detailed information about a specific Pokémon TCG set by its ID.',
  inputSchema: z.object({ 
    id: z.string().describe('Set ID, e.g. xy1, base1, sm12') 
  }),
  outputSchema: z.object({ 
    set: z.object({
      id: z.string(),
      name: z.string(),
      series: z.string(),
      printedTotal: z.number(),
      total: z.number(),
      releaseDate: z.string(),
      legalities: z.record(z.string(), z.string()),
      ptcgoCode: z.string().optional(),
      images: z.object({
        symbol: z.string(),
        logo: z.string(),
      }),
    })
  }),
  execute: async ({ context }) => {
    const data: ApiResponse<PokemonSet> = await doFetch(`/sets/${encodeURIComponent(context.id)}`);
    
    const set = data.data;
    return {
      set: {
        id: set.id,
        name: set.name,
        series: set.series,
        printedTotal: set.printedTotal,
        total: set.total,
        releaseDate: set.releaseDate,
        legalities: set.legalities,
        ptcgoCode: set.ptcgoCode,
        images: set.images,
      }
    };
  },
});

export const getTypesTool = createTool({
  id: 'pokemon-get-types',
  description: 'Get all available Pokémon types (Fire, Water, Grass, etc.)',
  inputSchema: z.object({}),
  outputSchema: z.object({
    types: z.array(z.string()),
  }),
  execute: async () => {
    const data: ApiResponse<string[]> = await doFetch('/types');
    return {
      types: data.data,
    };
  },
});

export const searchSetsTool = createTool({
  id: 'pokemon-search-sets',
  description: 'Search Pokémon TCG sets by name, series, etc.',
  inputSchema: z.object({
    q: z.string().describe('Search query for sets. Examples: "name:Base", "series:XY"'),
    page: z.number().int().min(1).optional().default(1),
    pageSize: z.number().int().min(1).max(250).optional().default(25),
  }),
  outputSchema: z.object({
    sets: z.array(z.object({
      id: z.string(),
      name: z.string(),
      series: z.string(),
      printedTotal: z.number(),
      total: z.number(),
      releaseDate: z.string(),
      legalities: z.record(z.string(), z.string()),
      images: z.object({
        symbol: z.string(),
        logo: z.string(),
      }),
    })),
    totalCount: z.number(),
    page: z.number(),
    pageSize: z.number(),
  }),
  execute: async ({ context }) => {
    const data: ApiResponse<PokemonSet[]> = await doFetch('/sets', {
      q: context.q,
      page: String(context.page ?? 1),
      pageSize: String(context.pageSize ?? 25),
    });
    
    const sets = data.data.map(set => ({
      id: set.id,
      name: set.name,
      series: set.series,
      printedTotal: set.printedTotal,
      total: set.total,
      releaseDate: set.releaseDate,
      legalities: set.legalities,
      images: set.images,
    }));

    return {
      sets,
      totalCount: data.totalCount,
      page: data.page,
      pageSize: data.pageSize,
    };
  },
});

export const getCardImageTool = createTool({
  id: 'pokemon-get-card-image',
  description: 'Get card image data for rendering in chat. Returns the image URL and metadata for display.',
  inputSchema: z.object({
    id: z.string().describe('Card ID, e.g. xy1-1, base1-4, sm12-150'),
    size: z.enum(['small', 'large']).optional().default('large').describe('Image size: small (245x342) or large (672x936)'),
  }),
  outputSchema: z.object({
    card: z.object({
      id: z.string(),
      name: z.string(),
      imageUrl: z.string(),
      imageSize: z.string(),
      set: z.object({
        id: z.string(),
        name: z.string(),
        series: z.string(),
      }),
      types: z.array(z.string()).optional(),
      rarity: z.string(),
      hp: z.string().optional(),
    }),
    imageData: z.object({
      url: z.string(),
      width: z.number(),
      height: z.number(),
      format: z.string(),
    }),
  }),
  execute: async ({ context }) => {
    const data: ApiResponse<PokemonCard> = await doFetch(`/cards/${encodeURIComponent(context.id)}`);
    const card = data.data;
    
    const imageUrl = context.size === 'small' ? card.images.small : card.images.large;
    const dimensions = context.size === 'small' ? { width: 245, height: 342 } : { width: 672, height: 936 };
    
    return {
      card: {
        id: card.id,
        name: card.name,
        imageUrl: imageUrl,
        imageSize: context.size,
        set: {
          id: card.set.id,
          name: card.set.name,
          series: card.set.series,
        },
        types: card.types,
        rarity: card.rarity,
        hp: card.hp,
      },
      imageData: {
        url: imageUrl,
        width: dimensions.width,
        height: dimensions.height,
        format: 'png',
      },
    };
  },
});

export const searchCardsWithImagesTool = createTool({
  id: 'pokemon-search-cards-with-images',
  description: 'Search Pokémon TCG cards and return them with image data for rendering in chat.',
  inputSchema: z.object({
    q: z.string().describe('Search query. Examples: "name:Ninetales", "set:Base", "type:Fire"'),
    page: z.number().int().min(1).optional().default(1),
    pageSize: z.number().int().min(1).max(25).optional().default(5).describe('Max 25 for image rendering'),
    imageSize: z.enum(['small', 'large']).optional().default('small').describe('Image size for rendering'),
  }),
  outputSchema: z.object({
    cards: z.array(z.object({
      id: z.string(),
      name: z.string(),
      supertype: z.string(),
      types: z.array(z.string()).optional(),
      hp: z.string().optional(),
      rarity: z.string(),
      set: z.object({
        id: z.string(),
        name: z.string(),
        series: z.string(),
      }),
      imageUrl: z.string(),
      imageSize: z.string(),
      attacks: z.array(z.object({
        name: z.string(),
        cost: z.array(z.string()),
        damage: z.string().optional(),
        text: z.string(),
      })).optional(),
      abilities: z.array(z.object({
        name: z.string(),
        text: z.string(),
        type: z.string(),
      })).optional(),
    })),
    totalCount: z.number(),
    page: z.number(),
    pageSize: z.number(),
  }),
  execute: async ({ context }) => {
    const data: ApiResponse<PokemonCard[]> = await doFetch('/cards', {
      q: context.q,
      page: String(context.page ?? 1),
      pageSize: String(Math.min(context.pageSize ?? 5, 25)), // Limit for image rendering
    });
    
    const cards = data.data.map(card => {
      const imageUrl = context.imageSize === 'small' ? card.images.small : card.images.large;
      
      return {
        id: card.id,
        name: card.name,
        supertype: card.supertype,
        types: card.types,
        hp: card.hp,
        rarity: card.rarity,
        set: {
          id: card.set.id,
          name: card.set.name,
          series: card.set.series,
        },
        imageUrl: imageUrl,
        imageSize: context.imageSize,
        attacks: card.attacks?.map(attack => ({
          name: attack.name,
          cost: attack.cost,
          damage: attack.damage,
          text: attack.text,
        })),
        abilities: card.abilities?.map(ability => ({
          name: ability.name,
          text: ability.text,
          type: ability.type,
        })),
      };
    });

    return {
      cards,
      totalCount: data.totalCount,
      page: data.page,
      pageSize: data.pageSize,
    };
  },
});


