/**
 * Deck Manager
 * Handles adding detected cards to the deck and managing deck state
 */

import { CardInfo, cardDatabase } from './card-database';

export interface DeckCard extends CardInfo {
  quantity: number;
  dateAdded: Date;
}

export class DeckManager {
  private static instance: DeckManager;
  private deck: DeckCard[] = [];

  private constructor() {}

  public static getInstance(): DeckManager {
    if (!DeckManager.instance) {
      DeckManager.instance = new DeckManager();
    }
    return DeckManager.instance;
  }

  /**
   * Add a detected card to the deck
   */
  public addCardToDeck(cardName: string): boolean {
    const cardInfo = cardDatabase.getCard(cardName);
    
    if (!cardInfo) {
      console.log(`Card "${cardName}" not found in database`);
      return false;
    }

    // Check if card already exists in deck
    const existingCardIndex = this.deck.findIndex(
      card => card.name.toLowerCase() === cardName.toLowerCase()
    );

    if (existingCardIndex >= 0) {
      // Increase quantity of existing card
      this.deck[existingCardIndex].quantity += 1;
      console.log(`Increased quantity of ${cardName} to ${this.deck[existingCardIndex].quantity}`);
    } else {
      // Add new card to deck
      const deckCard: DeckCard = {
        ...cardInfo,
        quantity: 1,
        dateAdded: new Date()
      };
      this.deck.push(deckCard);
      console.log(`Added ${cardName} to deck`);
    }

    return true;
  }

  /**
   * Remove a card from the deck
   */
  public removeCardFromDeck(cardName: string, quantity: number = 1): boolean {
    const cardIndex = this.deck.findIndex(
      card => card.name.toLowerCase() === cardName.toLowerCase()
    );

    if (cardIndex === -1) {
      return false;
    }

    if (this.deck[cardIndex].quantity <= quantity) {
      // Remove card completely
      this.deck.splice(cardIndex, 1);
      console.log(`Removed ${cardName} from deck`);
    } else {
      // Decrease quantity
      this.deck[cardIndex].quantity -= quantity;
      console.log(`Decreased quantity of ${cardName} to ${this.deck[cardIndex].quantity}`);
    }

    return true;
  }

  /**
   * Get all cards in the deck
   */
  public getDeck(): DeckCard[] {
    return [...this.deck]; // Return copy to prevent external mutations
  }

  /**
   * Get deck size (total number of cards)
   */
  public getDeckSize(): number {
    return this.deck.reduce((total, card) => total + card.quantity, 0);
  }

  /**
   * Get unique card count
   */
  public getUniqueCardCount(): number {
    return this.deck.length;
  }

  /**
   * Clear the entire deck
   */
  public clearDeck(): void {
    this.deck = [];
    console.log('Deck cleared');
  }

  /**
   * Get cards by type
   */
  public getCardsByType(type: string): DeckCard[] {
    return this.deck.filter(card => 
      card.type.toLowerCase() === type.toLowerCase()
    );
  }

  /**
   * Get cards by rarity
   */
  public getCardsByRarity(rarity: string): DeckCard[] {
    return this.deck.filter(card => card.rarity === rarity);
  }

  /**
   * Check if deck contains a specific card
   */
  public hasCard(cardName: string): boolean {
    return this.deck.some(card => 
      card.name.toLowerCase() === cardName.toLowerCase()
    );
  }

  /**
   * Get quantity of a specific card in deck
   */
  public getCardQuantity(cardName: string): number {
    const card = this.deck.find(card => 
      card.name.toLowerCase() === cardName.toLowerCase()
    );
    return card ? card.quantity : 0;
  }

  /**
   * Get a specific card from the deck
   */
  public getCard(cardName: string): DeckCard | undefined {
    return this.deck.find(card => 
      card.name.toLowerCase() === cardName.toLowerCase()
    );
  }
}

export const deckManager = DeckManager.getInstance();
