/**
 * Pokemon Card Database
 * Maps detected card names to their image paths and metadata
 */

export interface CardInfo {
  id: string;
  name: string;
  imagePath: string;
  type: string;
  hp?: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'holo' | 'ultra';
  description?: string;
}

export class CardDatabase {
  private static instance: CardDatabase;
  private cardMap: Map<string, CardInfo> = new Map();

  private constructor() {
    this.initializeCards();
  }

  public static getInstance(): CardDatabase {
    if (!CardDatabase.instance) {
      CardDatabase.instance = new CardDatabase();
    }
    return CardDatabase.instance;
  }

  private initializeCards(): void {
    // Add ninetales card
    this.addCard({
      id: 'ninetales-001',
      name: 'ninetales',
      imagePath: 'https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/LTR/LTR_021_R_EN_LG.png', // Using existing ninetales image
      type: 'Fire',
      hp: 120,
      rarity: 'rare',
      description: 'The Fox Pokémon with nine beautiful tails'
    });

    // Add scraggy card
    this.addCard({
      id: 'scraggy-001',
      name: 'scraggy',
      imagePath: 'https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/FFI/FFI_066_R_EN_LG.png',
      type: 'Dark',
      hp: 70,
      rarity: 'uncommon',
      description: 'The Shedding Pokémon with loose, saggy skin'
    });

    // Add more cards as they become available
    // this.addCard({
    //   id: 'pikachu-001',
    //   name: 'pikachu',
    //   imagePath: '/images/pikachu.png',
    //   type: 'Electric',
    //   hp: 60,
    //   rarity: 'common',
    //   description: 'The Mouse Pokémon'
    // });
  }

  /**
   * Add a new card to the database
   */
  public addCard(card: CardInfo): void {
    this.cardMap.set(card.name.toLowerCase(), card);
  }

  /**
   * Get card information by name
   */
  public getCard(cardName: string): CardInfo | null {
    return this.cardMap.get(cardName.toLowerCase()) || null;
  }

  /**
   * Check if a card exists in the database
   */
  public hasCard(cardName: string): boolean {
    return this.cardMap.has(cardName.toLowerCase());
  }

  /**
   * Get all available cards
   */
  public getAllCards(): CardInfo[] {
    return Array.from(this.cardMap.values());
  }

  /**
   * Get cards by type
   */
  public getCardsByType(type: string): CardInfo[] {
    return this.getAllCards().filter(card => 
      card.type.toLowerCase() === type.toLowerCase()
    );
  }

  /**
   * Get cards by rarity
   */
  public getCardsByRarity(rarity: string): CardInfo[] {
    return this.getAllCards().filter(card => 
      card.rarity === rarity
    );
  }
}

export const cardDatabase = CardDatabase.getInstance();
