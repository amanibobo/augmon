"use client";

import { useState, useEffect } from "react";
import AROverlay from "./AROverlay";
import { gltfManager } from "@/lib/gltf-manager";
import { cardDatabase } from "@/lib/card-database";
import { deckManager } from "@/lib/deck-manager";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";

interface WebcamCaptureProps {
  onCardDetected?: (cardClass: string) => void;
}

export default function WebcamCapture({ onCardDetected }: WebcamCaptureProps = {}) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string>("");
  const [lastDetection, setLastDetection] = useState<string>("");
  const [detectedCards, setDetectedCards] = useState<string[]>([]);
  const [currentModel, setCurrentModel] = useState<string | null>(null);
  const [showAR, setShowAR] = useState(false);

  // Convex hooks
  const saveScannedCard = useMutation(api.scannedCards.saveScannedCard);
  const { user } = useUser();

  // Test connection on component mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        // Try to load the video feed directly
        const img = new Image();
        img.onload = () => {
          console.log("Flask video feed is accessible");
          setStreamUrl("http://localhost:5000/video_feed");
        };
        img.onerror = () => {
          console.error("Cannot access Flask video feed");
          setStreamUrl("");
        };
        img.src = "http://localhost:5000/video_feed";
      } catch (err) {
        console.error("Error testing connection:", err);
        setStreamUrl("");
      }
    };
    
    testConnection();
  }, []);

  // Periodic detection checking when streaming
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isStreaming && streamUrl) {
      interval = setInterval(async () => {
        try {
          // Instead of using canvas, we'll make a direct request to capture a frame
          // This avoids the tainted canvas issue
          const response = await fetch('http://localhost:5000/predict_card', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              // Send a flag to indicate we want to use the current camera frame
              use_camera_frame: true 
            })
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.detections && result.detections.length > 0) {
              const detectedCard = result.detections[0].class;
              if (detectedCard && detectedCard !== lastDetection) {
                setLastDetection(detectedCard);
                setDetectedCards(prev => [...prev, detectedCard]);
                onCardDetected?.(detectedCard);
                console.log('Card detected:', detectedCard);
                
                // Check if we have a card in our database
                if (cardDatabase.hasCard(detectedCard)) {
                  // Add card to deck
                  const success = deckManager.addCardToDeck(detectedCard);
                  if (success) {
                    console.log(`✅ Added ${detectedCard} to deck`);
                    console.log(`Current deck size: ${deckManager.getDeckSize()} cards`);

                    // Save to Convex if user is authenticated
                    if (user?.id) {
                      try {
                        const cardInfo = cardDatabase.getCard(detectedCard);
                        if (cardInfo) {
                          saveScannedCard({
                            cardName: cardInfo.name,
                            cardId: cardInfo.id,
                            type: cardInfo.type,
                            hp: cardInfo.hp,
                            rarity: cardInfo.rarity,
                            description: cardInfo.description,
                            imagePath: cardInfo.imagePath,
                            userId: user.id,
                          });
                          console.log(`✅ Saved ${detectedCard} to Convex for user ${user.id}`);
                        }
                      } catch (error) {
                        console.error(`❌ Failed to save ${detectedCard} to Convex:`, error);
                      }
                    } else {
                      console.log(`⚠️ User not authenticated, skipping Convex save for ${detectedCard}`);
                    }
                  } else {
                    console.log(`❌ Failed to add ${detectedCard} to deck`);
                  }
                } else {
                  console.log(`❌ Card "${detectedCard}" not found in card database`);
                }
                
                // Check if we have a 3D model for this card
                if (gltfManager.hasModel(detectedCard)) {
                  setCurrentModel(detectedCard);
                  setShowAR(true);
                  console.log('3D model found for:', detectedCard);
                } else {
                  console.log('No 3D model available for:', detectedCard);
                }
              }
            }
          }
        } catch (err) {
          console.error('Error checking for detections:', err);
        }
      }, 2000); // Check every 2 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming, streamUrl, lastDetection, onCardDetected]);

  const toggleStream = () => {
    setIsStreaming(!isStreaming);
  };

  const clearDetectedCards = () => {
    setDetectedCards([]);
    setLastDetection("");
    setCurrentModel(null);
    setShowAR(false);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-4 items-start">
        {/* Flask Video Stream - Left Side */}
        <div className="relative w-[400px] h-[300px]">
          {streamUrl && isStreaming ? (
            <>
              {/* Blinking dot indicator in top left */}
              <div className="absolute top-2 left-2 z-20">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <img 
                src={streamUrl} 
                alt="Video Stream with YOLO Detection"
                className="w-full h-full rounded-lg object-cover"
                onLoad={() => console.log("Video stream loaded successfully")}
                onError={(e) => {
                  console.error("Video stream error:", e);
                  setIsStreaming(false);
                }}
              />
              {/* AR Overlay for 3D Models - positioned to match camera stream */}
              {showAR && currentModel && (
                <div className="absolute inset-0 rounded-lg overflow-hidden">
                  <AROverlay 
                    detectedCard={currentModel}
                    isVisible={showAR}
                    onModelLoaded={(model) => {
                      console.log('3D model loaded:', model);
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="w-[400px] h-[300px] bg-gray-200 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                {!streamUrl ? (
                  <>
                    <p className="text-lg mb-2">Flask Server Not Reachable</p>
                    <p className="text-sm">Make sure Flask server is running on port 5000</p>
                    <p className="text-xs mt-2">Check console for connection details</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg mb-2">Camera Ready</p>
                    <p className="text-sm">Click &ldquo;Start Stream&rdquo; to begin</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Detected Cards - Right Side */}
        <div className="w-[300px] min-h-[300px] bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-700">Detected Cards</h3>
              {detectedCards.length > 0 && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {detectedCards.length}
                </span>
              )}
            </div>
            {detectedCards.length > 0 && (
              <button
                onClick={clearDetectedCards}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-gray-300 hover:border-gray-400 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          {detectedCards.length > 0 ? (
            <div className="space-y-2">
              {detectedCards.map((card, index) => (
                <div 
                  key={index}
                  className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">{card}</span>
                      <div className="flex gap-1">
                        {cardDatabase.hasCard(card) && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            In DB
                          </span>
                        )}
                        {deckManager.hasCard(card) && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            In Deck ({deckManager.getCardQuantity(card)})
                          </span>
                        )}
                        {gltfManager.hasModel(card) && (
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                            3D
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">#{index + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p className="text-sm">No cards detected yet</p>
              <p className="text-xs mt-1">Start streaming to see detections</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Control Buttons */}
      <div className="mt-4 flex gap-2">
        {streamUrl ? (
          <>
            <button
              onClick={toggleStream}
              className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                isStreaming 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {isStreaming ? 'Stop Stream' : 'Start Stream'}
            </button>
            {currentModel && (
              <button
                onClick={() => setShowAR(!showAR)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  showAR 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {showAR ? 'Hide 3D' : 'Show 3D'}
              </button>
            )}
          </>
        ) : (
          <button
            onClick={() => {
              console.log("Retrying connection...");
              setStreamUrl("http://localhost:5000/video_feed");
              setIsStreaming(true);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry Connection
          </button>
        )}
      </div>

    </div>
  );
}