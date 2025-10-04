"use client";

import { useState, useEffect } from 'react';
import { DeckCard, deckManager } from '@/lib/deck-manager';
import { Trash2, Grid3X3 } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';

interface DeckDisplayProps {
  className?: string;
  onAddCardToCanvas?: (cardName: string) => void;
}

export default function DeckDisplay({ className = "", onAddCardToCanvas }: DeckDisplayProps) {
  const [deck, setDeck] = useState<DeckCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<DeckCard | null>(null);

  // Convex hooks
  const deleteScannedCard = useMutation(api.scannedCards.deleteScannedCard);
  const { user } = useUser();

  // Get all scanned cards for the current user
  const scannedCards = useQuery(api.scannedCards.getScannedCards, user?.id ? { userId: user.id } : "skip");

  // Update deck when component mounts or when deck/scanned cards change
  useEffect(() => {
    const updateDeck = () => {
      if (user?.id && scannedCards) {
        // For authenticated users, load from Convex data
        deckManager.setUserId(user.id);
        deckManager.loadDeckFromConvex(scannedCards);
      }
      setDeck(deckManager.getDeck());
    };

    updateDeck();

    // Set up interval to check for deck changes
    const interval = setInterval(updateDeck, 1000);

    return () => clearInterval(interval);
  }, [user?.id, scannedCards]);

  const handleRemoveCard = async (cardName: string) => {
    const quantity = deckManager.getCardQuantity(cardName);
    deckManager.removeCardFromDeck(cardName, quantity);
    setDeck(deckManager.getDeck());

    // Also delete from Convex database if user is authenticated
    if (user?.id && scannedCards) {
      try {
        // Find the scanned card in the query result
        const scannedCard = scannedCards.find(card => card.cardName.toLowerCase() === cardName.toLowerCase());
        if (scannedCard) {
          await deleteScannedCard({ cardId: scannedCard._id });
          console.log(`✅ Deleted ${cardName} from Convex database`);
        } else {
          console.log(`⚠️ Card ${cardName} not found in Convex database`);
        }
      } catch (error) {
        console.error(`❌ Failed to delete ${cardName} from Convex:`, error);
      }
    } else {
      console.log(`⚠️ User not authenticated or no scanned cards data, skipping Convex deletion for ${cardName}`);
    }
  };

  const handleClearDeck = async () => {
    if (confirm('Are you sure you want to clear the entire deck?')) {
      deckManager.clearDeck();
      setDeck([]);

      // Also delete all scanned cards from Convex database if user is authenticated
      if (user?.id && scannedCards) {
        try {
          // Delete all scanned cards for this user
          await Promise.all(
            scannedCards.map(card => deleteScannedCard({ cardId: card._id }))
          );
          console.log(`✅ Deleted all ${scannedCards.length} cards from Convex database`);
        } catch (error) {
          console.error(`❌ Failed to delete cards from Convex:`, error);
        }
      } else {
        console.log(`⚠️ User not authenticated or no scanned cards data, skipping Convex deletion`);
      }
    }
  };

  const handleViewCard = (card: DeckCard) => {
    setSelectedCard(card);
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">My Deck</h3>
            <p className="text-sm text-gray-600">
              {deckManager.getDeckSize()} cards • {deckManager.getUniqueCardCount()} unique
            </p>
          </div>
          {deck.length > 0 && (
            <button
              onClick={handleClearDeck}
              className="text-red-600 hover:text-red-800 transition-colors"
              title="Clear deck"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Deck Content */}
      <div className="p-4">
        {deck.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No cards in deck yet</p>
            <p className="text-gray-400 text-xs mt-1">Scan cards to add them to your deck</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deck.map((card, index) => (
              <div 
                key={`${card.id}-${index}`}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                {/* Card Image */}
                <div className="flex-shrink-0">
                  <img 
                    src={card.imagePath} 
                    alt={card.name}
                    className="w-12 h-16 object-cover rounded border border-gray-300 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleViewCard(card)}
                  />
                </div>

                {/* Card Info */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900 capitalize">{card.name}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      card.rarity === 'rare' ? 'bg-purple-100 text-purple-800' :
                      card.rarity === 'holo' ? 'bg-yellow-100 text-yellow-800' :
                      card.rarity === 'ultra' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {card.rarity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{card.type} • HP: {card.hp}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onAddCardToCanvas?.(card.name)}
                    className="p-1 rounded-full hover:bg-blue-100 text-blue-600 transition-colors"
                    title="Add to canvas"
                  >
                    <Grid3X3 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleRemoveCard(card.name)}
                    className="p-1 rounded-full hover:bg-red-100 text-red-600 transition-colors"
                    title="Remove from deck"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Card Details Modal */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">{selectedCard.name}</h3>
                <button
                  onClick={() => setSelectedCard(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-center">
                  <img
                    src={selectedCard.imagePath}
                    alt={selectedCard.name}
                    className="w-48 h-auto rounded-lg border border-gray-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Type</span>
                    <p className="text-lg font-semibold text-gray-900">{selectedCard.type}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">HP</span>
                    <p className="text-lg font-semibold text-gray-900">{selectedCard.hp || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Rarity</span>
                    <p className="text-lg font-semibold text-gray-900 capitalize">{selectedCard.rarity}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Quantity</span>
                    <p className="text-lg font-semibold text-gray-900">{selectedCard.quantity}</p>
                  </div>
                </div>

                {selectedCard.description && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Description</span>
                    <p className="text-sm text-gray-700 mt-1">{selectedCard.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
