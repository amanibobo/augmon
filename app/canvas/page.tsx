'use client';

import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  MiniMap,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
  Panel,
  Handle,
  Position,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { geminiService } from '@/lib/gemini-service';
import { GEMINI_MODELS, type GeminiModel } from '@/lib/gemini-config';
import { getPokemonResponse } from './pokemon-action';
import { Tool, type ToolPart } from '@/components/ui/tool';
import { Command } from 'cmdk';
import { Search, Menu, X, Home, Camera, Trash2, Package } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import * as Dialog from '@radix-ui/react-dialog';
import { ResponseStream } from '@/components/prompt-kit/response-stream';
import { ListPlus, GitBranch, DotsSix } from '@phosphor-icons/react';
import WebcamCapture from '@/components/WeCapture';
import DeckDisplay from '@/components/DeckDisplay';
import { deckManager } from '@/lib/deck-manager';
import { cardDatabase } from '@/lib/card-database';
import { Sidebar } from '@/components/ui/sidebar';
import { DeckSidebar } from '@/components/ui/deck-sidebar';
import { ScannerSidebar } from '@/components/ui/scanner-sidebar';



type ChatMessage = { 
  id: string; 
  role: 'user' | 'assistant'; 
  content: string;
  toolCalls?: ToolPart[];
};

type ChatNodeData = {
  title: string;
  messages: ChatMessage[];
  threads?: { id: string; title: string }[];
  activeThreadId?: string;
  linkedNodeIds?: string[];
  isSending?: boolean;
  selectedModel?: GeminiModel;
  mergedCount?: number;
  isBranchSelected?: boolean;
  onSend?: (nodeId: string, text: string) => void;
  onCreateBranch?: (nodeId: string) => void;
  onCreateChat?: (nodeId: string) => void;
  onSelectBranch?: (nodeId: string, threadId: string) => void;
  onModelChange?: (nodeId: string, model: GeminiModel) => void;
  onChatClick?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
};

function ChatNode({ id, data }: NodeProps<ChatNodeData>) {
  const [input, setInput] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [showSelectionMenu, setShowSelectionMenu] = useState(false);
  const [selectionPosition, setSelectionPosition] = useState({ x: 0, y: 0 });

  const handleTextSelection = (e: React.MouseEvent) => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    
    if (text && text.length > 0) {
      setSelectedText(text);
      setSelectionPosition({ x: e.clientX, y: e.clientY });
      setShowSelectionMenu(true);
    } else {
      setShowSelectionMenu(false);
    }
  };

  const handleCreateChatFromSelection = () => {
    if (selectedText && data.onCreateChat) {
      data.onCreateChat(id, selectedText);
      setShowSelectionMenu(false);
      setSelectedText('');
    }
  };

  return (
    <div 
      className={`rounded-xl border w-[480px] relative cursor-pointer transition-all duration-300 ${
        data.isBranchSelected 
          ? 'border-blue-500 border-2 shadow-2xl shadow-blue-200/50' 
          : 'border-gray-200 shadow-lg hover:shadow-xl'
      } bg-white`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => data.onChatClick?.(id)}
    >
      {/* Connection Handles */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className="w-3 h-3 bg-blue-500 border-2 border-white"
        style={{ top: -6 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="w-3 h-3 bg-blue-500 border-2 border-white"
        style={{ right: -6 }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        className="w-3 h-3 bg-green-500 border-2 border-white"
        style={{ bottom: -6 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="w-3 h-3 bg-green-500 border-2 border-white"
        style={{ left: -6 }}
      />

      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {/* Hamburger Menu */}
          <button className="p-1 hover:bg-gray-100 rounded-md transition-colors">
          <DotsSix size={24} />
          </button>
          
          {/* Model Selector + Merge Badge */}
          <div className="relative flex items-center gap-2">
            <button 
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
            >
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Google_Favicon_2025.svg/250px-Google_Favicon_2025.svg.png"
                alt="Google"
                className="w-4 h-4"
              />
              {data.selectedModel?.replace('gemini-', 'Gemini ').replace('-', ' ') || 'Gemini 2.5 Flash'}
            </button>
            
              {/* Mastra Tool Indicator */}
              {(() => {
                const lastMessage = data.messages?.[data.messages.length - 1];
                const isPokemonQuery = lastMessage?.role === 'user' && 
                  geminiService.isPokemonQuery(lastMessage.content);
                
                if (isPokemonQuery) {
                  // Check if the last assistant message has tool calls
                  const assistantMessage = data.messages?.[data.messages.length - 2];
                  const toolName = assistantMessage?.toolCalls?.[0]?.type || 'Pokémon Agent';
                  
                  return (
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium ml-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      {toolName}
                    </div>
                  );
                }
                return null;
              })()}
            
            {typeof data.mergedCount === 'number' && data.mergedCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-black text-white">
                {data.mergedCount}
              </span>
            )}
            
            {/* Dropdown Menu */}
            {showModelDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px]">
                {GEMINI_MODELS.map(model => (
                  <button
                    key={model.id}
                    onClick={() => {
                      data.onModelChange?.(id, model.id);
                      setShowModelDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      data.selectedModel === model.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    {model.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
         {/* Delete Button */}
         <button 
           onClick={() => data.onDelete?.(id)}
           className="p-1 hover:bg-red-50 rounded-md transition-colors"
           title="Delete chat"
         >
           <Trash2 className="w-4 h-4 text-gray-600 hover:text-red-600" />
         </button>
      </div>
      {/* Messages Area */}
      <div className="px-16 py-2" onMouseUp={handleTextSelection}>
          <div className="space-y-2">
            {data.messages.map((m) => (
              <div key={m.id} className="text-sm leading-rela xed select-text">
                {m.role === 'assistant' ? (
                  <div className="bg-gray-50 rounded-lg p-3 -mx-3">
                    <ResponseStream
                      textStream={m.content}
                      mode="fade"
                      className="text-sm"
                      fadeDuration={300}
                      segmentDelay={8}
                      renderMarkdown={true}
                    />
                    {/* Display tool calls if available */}
                    {m.toolCalls && m.toolCalls.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {m.toolCalls.map((toolCall, index) => (
                          <Tool
                            key={`${m.id}-tool-${index}`}
                            toolPart={toolCall}
                            defaultOpen={false}
                            className="w-full"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-700">{m.content}</div>
                )}
              </div>
            ))}
          </div>
      </div>

      {/* Text Selection Menu */}
      {showSelectionMenu && (
        <div 
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2"
          style={{ 
            left: selectionPosition.x - 100, 
            top: selectionPosition.y - 50 
          }}
        >
          <button
            onClick={handleCreateChatFromSelection}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ListPlus size={16} />
            New Chat: &ldquo;{selectedText.length > 30 ? selectedText.substring(0, 30) + '...' : selectedText}&rdquo;
          </button>
        </div>
      )}
      {/* Input Area */}
      <div className="px-4 pb-4 relative">
        <div className="relative">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && input.trim() && !data.isSending) {
                data.onSend?.(id, input.trim());
                setInput('');
              }
            }}
            placeholder="Enter your query..."
            className="w-full rounded-lg bg-white px-4 py-3 text-sm text-black focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-transparent focus:shadow-none shadow-sm"
            style={{ 
              outline: 'none',
              boxShadow: 'none',
              border: 'none'
            }}
          />
          <button
            onClick={() => {
              if (input.trim() && !data.isSending) {
                data.onSend?.(id, input.trim());
                setInput('');
              }
            }}
            disabled={data.isSending || !input.trim()}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-md transition-all duration-200 ${
              data.isSending || !input.trim() 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-blue-600 hover:bg-blue-50'
            }`}
          >
            {data.isSending ? (
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        
        {/* Hover Card for Branching Options - positioned below input */}
        {isHovered && (
          <div className="absolute top-full left-0 right-0 -mt-2 z-50">
            <div className="">
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => data.onCreateBranch?.(id)}
                  className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
                    data.isBranchSelected 
                      ? 'bg-green-100 text-green-800 border border-green-300' 
                      : 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200'
                  }`}
                  title={data.isBranchSelected ? 'Click to select another chat to merge with' : 'Branch'}
                >
                  <GitBranch size={16} />
                </button>
                <button
                  onClick={() => data.onCreateChat?.(id)}
                  className="flex items-center justify-center w-8 h-8 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-all duration-200 border border-blue-200"
                  title="Create new independent chat"
                >
                  <ListPlus size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Card Node Component with handles
function CardNode({ id, data }: NodeProps<{ label: string; imagePath?: string; cardName?: string }>) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
      {/* Connection Handles */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className="w-4 h-4 bg-blue-500 border-2 border-white shadow-lg"
        style={{ top: -8 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="w-4 h-4 bg-blue-500 border-2 border-white shadow-lg"
        style={{ right: -8 }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        className="w-4 h-4 bg-green-500 border-2 border-white shadow-lg"
        style={{ bottom: -8 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="w-4 h-4 bg-green-500 border-2 border-white shadow-lg"
        style={{ left: -8 }}
      />
      
      <div className="relative">
        {data.imagePath ? (
          <img 
            src={data.imagePath} 
            alt={data.cardName || "Pokémon Card"} 
            className="w-48 h-auto rounded-lg object-cover"
          />
        ) : (
          <div className="w-48 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-sm font-medium">{data.label}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const nodeTypes = { 
  chat: ChatNode,
  card: CardNode
} as const;

const initialNodes: Node[] = [
  {
    id: 'main-chat',
    type: 'chat',
    position: { x: 200, y: 50 }, // Positioned in top middle
    data: {
      title: 'Main Chat',
      messages: [],
      threads: [{ id: 't1', title: 'Main' }],
      activeThreadId: 't1',
      linkedNodeIds: [],
      selectedModel: 'gemini-2.5-flash'
    } as ChatNodeData
  }
];

const initialEdges: Edge[] = [];

export default function CanvasPage() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);

  // Debug logging
  console.log('Current nodes:', nodes);
  console.log('Current edges:', edges);

  const [isSendingMap, setIsSendingMap] = useState<Record<string, boolean>>({});
  
  // Branch selection state
  const [branchMode, setBranchMode] = useState<{
    isActive: boolean;
    sourceChatId: string | null;
    selectedChatId: string | null;
  }>({
    isActive: false,
    sourceChatId: null,
    selectedChatId: null
  });

  // Theme and search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [deckOpen, setDeckOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Filter deck cards based on search query
  const getFilteredDeckCards = () => {
    if (!searchQuery.trim()) return deckManager.getDeck();
    
    const query = searchQuery.toLowerCase();
    return deckManager.getDeck().filter(card => 
      card.name.toLowerCase().includes(query) ||
      card.type.toLowerCase().includes(query) ||
      card.rarity.toLowerCase().includes(query) ||
      card.description?.toLowerCase().includes(query)
    );
  };

  // Sidebar handlers
  const handleNavigate = (route: string) => {
    if (route === "/") {
      window.location.href = "/";
    }
  };

  const handleScannerOpen = () => {
    setScannerOpen(true);
  };

  const handleDeckOpen = () => {
    setDeckOpen(true);
  };

  const handleSearchOpen = () => {
    setSearchOpen(true);
  };

  const handleAddChat = () => {
    addChatNode();
  };

  const handleAddCardToCanvas = (cardName: string) => {
    addNode(cardName);
  };

  // Node and edge change handlers
  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes],
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges],
  );

  const handleSelectionChange = useCallback(({ nodes: selNodes }: { nodes: Node[] }) => {
    const nextIds = selNodes.map(n => n.id).filter(id => !id.startsWith('chat-'));
    setSelectedNodeIds((prev) => {
      const prevKey = prev.join('|');
      const nextKey = nextIds.join('|');
      if (prevKey === nextKey) return prev;
      return nextIds;
    });
  }, []);


  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge({ 
      ...connection, 
      type: 'default',
      animated: true, 
      style: { stroke: 'var(--primary)' } 
    }, eds));
  }, [setEdges]);


  const handleChatSend = async (nodeId: string, text: string) => {
    // mark sending
    setIsSendingMap((m) => ({ ...m, [nodeId]: true }));
    
    // Get the chat node data to access selected model and linked nodes
    const chatNode = nodes.find(n => n.id === nodeId && n.type === 'chat');
    if (!chatNode) return;
    
    const data = chatNode.data as ChatNodeData;
    const selectedModel = data.selectedModel || 'gemini-2.5-flash';
    
    // append user message to that node's data
    setNodes((nds) => nds.map((n) => {
      if (n.id === nodeId && n.type === 'chat') {
        const data = n.data as ChatNodeData;
        return { ...n, data: { ...data, messages: [...(data.messages || []), { id: `m-${Date.now()}`, role: 'user', content: text }] } };
      }
      return n;
    }));

    try {
      // Get context from linked nodes by checking edges
      const linkedNodes = nodes.filter(n => {
        return edges.some(edge =>
          (edge.source === nodeId && edge.target === n.id) ||
          (edge.target === nodeId && edge.source === n.id)
        );
      });
      const context = linkedNodes.map(n => n.data.label || n.id);

      // Extract connected card information from database
      const connectedCards = linkedNodes
        .filter(n => n.type === 'card')
        .map(n => {
          const cardName = n.data.cardName;
          if (cardName) {
            // Try to get full card data from database
            const cardInfo = cardDatabase.getCard(cardName);
            return {
              nodeId: n.id,
              cardName: cardName,
              cardInfo: cardInfo,
              label: n.data.label
            };
          }
          return null;
        })
        .filter(card => card !== null);

      console.log(`Found ${connectedCards.length} connected cards for chat ${nodeId}:`, connectedCards);

      // Check if this is a Pokémon-related query first
      const isPokemonQuery = geminiService.isPokemonQuery(text);

      let response: string;

      // Handle questions about connected cards first
      if (text.toLowerCase().includes('connected') ||
          text.toLowerCase().includes('what card') ||
          text.toLowerCase().includes('which card') ||
          text.toLowerCase().includes('card connected')) {

        if (connectedCards.length === 0) {
          response = "No cards are currently connected to this chat. Try connecting a card node to this chat node by dragging an edge between them.";
        } else if (connectedCards.length === 1) {
          const card = connectedCards[0];
          if (card.cardInfo) {
            response = `The card **${card.cardInfo.name}** is connected to this chat.

**Card Details:**
- **Type:** ${card.cardInfo.type}
- **HP:** ${card.cardInfo.hp || 'N/A'}
- **Rarity:** ${card.cardInfo.rarity}
- **Description:** ${card.cardInfo.description || 'No description available'}

You can ask me questions about this card or compare it with others!`;
          } else {
            response = `A card is connected but I don't have detailed information about it.`;
          }
        } else {
          const cardDetails = connectedCards.map((card, index) => {
            if (card.cardInfo) {
              return `${index + 1}. **${card.cardInfo.name}** (${card.cardInfo.type}, HP: ${card.cardInfo.hp || 'N/A'})`;
            }
            return `${index + 1}. Unknown card`;
          }).join('\n');

          response = `${connectedCards.length} cards are connected to this chat:

${cardDetails}

Ask me about any of these cards or request comparisons!`;
        }
      }
      
      if (isPokemonQuery) {
        // Use the Mastra Pokémon agent for Pokémon-related queries
        // Enhance the query with connected card context
        let enhancedQuery = text;
        if (connectedCards.length > 0) {
          const cardContext = connectedCards
            .filter(card => card.cardInfo)
            .map(card => `${card.cardInfo!.name} (${card.cardInfo!.type}, HP: ${card.cardInfo!.hp || 'N/A'})`)
            .join(', ');
          enhancedQuery = `${text}\n\nConnected cards context: ${cardContext}`;
        }

        const pokemonResult = await getPokemonResponse(enhancedQuery);
        if (pokemonResult.success) {
          response = pokemonResult.response;
          
          // Update the assistant message with tool calls if available
          if (pokemonResult.toolCalls && pokemonResult.toolCalls.length > 0) {
            setNodes((nds) => nds.map((n) => {
              if (n.id === nodeId && n.type === 'chat') {
                const data = n.data as ChatNodeData;
                return { 
                  ...n, 
                  data: { 
                    ...data, 
                    messages: data.messages.map(msg => 
                      msg.id === assistantMessageId 
                        ? { ...msg, toolCalls: pokemonResult.toolCalls }
                        : msg
                    )
                  }
                };
              }
              return n;
            }));
          }
        } else {
          // Fall back to regular Gemini if Pokémon agent fails
          response = await geminiService.generateContent(text, selectedModel);
        }
      } else if (text.toLowerCase().includes('battle') || text.toLowerCase().includes('vs') || text.toLowerCase().includes('fight')) {
        // Battle simulation with connected cards
        if (connectedCards.length >= 2) {
          const card1 = connectedCards[0].cardInfo;
          const card2 = connectedCards[1].cardInfo;
          if (card1 && card2) {
            response = await geminiService.generateBattleSimulation(
              `${card1.name} (${card1.type}, HP: ${card1.hp || 'N/A'})`,
              `${card2.name} (${card2.type}, HP: ${card2.hp || 'N/A'})`,
              selectedModel
            );
          } else {
            response = await geminiService.generateContent(
              `Simulate a battle based on this request: ${text}. Connected cards: ${connectedCards.map(c => c.cardName).join(', ')}`,
              selectedModel
            );
          }
        } else {
          response = await geminiService.generateContent(
            `Simulate a battle based on this request: ${text}. Context: ${context.join(', ')}`,
            selectedModel
          );
        }
      } else if (text.toLowerCase().includes('optimize') || text.toLowerCase().includes('deck')) {
        // Deck optimization with connected cards
        const cardContext = connectedCards
          .filter(card => card.cardInfo)
          .map(card => `${card.cardInfo!.name} (${card.cardInfo!.type}, HP: ${card.cardInfo!.hp || 'N/A'}, Rarity: ${card.cardInfo!.rarity})`)
          .join(', ');
        response = await geminiService.generateDeckOptimization([...context, cardContext], selectedModel);
      } else if (connectedCards.length > 0) {
        // Card analysis with connected card database context
        const detailedContext = connectedCards
          .filter(card => card.cardInfo)
          .map(card => {
            const info = card.cardInfo!;
            return `${info.name}: Type=${info.type}, HP=${info.hp || 'N/A'}, Rarity=${info.rarity}, Description=${info.description || 'N/A'}`;
          });
        response = await geminiService.generateCardAnalysis(text, detailedContext, selectedModel);
      } else if (context.length > 0) {
        // Card analysis with basic context
        response = await geminiService.generateCardAnalysis(text, context, selectedModel);
      } else {
        // General chat
        response = await geminiService.generateContent(text, selectedModel);
      }

      // Create assistant message with empty content initially
      const assistantMessageId = `m-${Date.now()}`;
      setNodes((nds) => nds.map((n) => {
        if (n.id === nodeId && n.type === 'chat') {
          const data = n.data as ChatNodeData;
          return { ...n, data: { ...data, messages: [...(data.messages || []), { id: assistantMessageId, role: 'assistant', content: '' }] } };
        }
        return n;
      }));

      // Simulate streaming by progressively updating the message content
      const chunkSize = 15; // Stream in chunks of 15 characters
      let currentContent = '';
      
      for (let i = 0; i < response.length; i += chunkSize) {
        currentContent = response.substring(0, i + chunkSize);
        
        setNodes((nds) => nds.map((n) => {
          if (n.id === nodeId && n.type === 'chat') {
            const data = n.data as ChatNodeData;
            return { 
              ...n, 
              data: { 
                ...data, 
                messages: data.messages.map(msg => 
                  msg.id === assistantMessageId 
                    ? { ...msg, content: currentContent }
                    : msg
                )
              } 
            };
          }
          return n;
        }));
        
        // Small delay between chunks for streaming effect
        await new Promise(resolve => setTimeout(resolve, 5));
      }
    } catch (error) {
      console.error('Error generating response:', error);
      // append error message
      setNodes((nds) => nds.map((n) => {
        if (n.id === nodeId && n.type === 'chat') {
          const data = n.data as ChatNodeData;
          return { ...n, data: { ...data, messages: [...(data.messages || []), { id: `m-${Date.now()}`, role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }] } };
        }
        return n;
      }));
    } finally {
      setIsSendingMap((m) => ({ ...m, [nodeId]: false }));
    }
  };

  const handleCreateBranch = (nodeId: string) => {
    // Start branch selection mode
    setBranchMode({
      isActive: true,
      sourceChatId: nodeId,
      selectedChatId: null
    });
    
    // Add blue border to the source chat
    setNodes((nds) => nds.map((n) => {
      if (n.id === nodeId && n.type === 'chat') {
        const data = n.data as ChatNodeData;
        return { 
          ...n, 
          data: { 
            ...data, 
            isBranchSelected: true
          } 
        };
      }
      return n;
    }));
  };

  const handleChatClick = (nodeId: string) => {
    if (!branchMode.isActive) return;
    
    if (branchMode.sourceChatId === nodeId) {
      // Clicked on the same chat, cancel branch mode
      setBranchMode({
        isActive: false,
        sourceChatId: null,
        selectedChatId: null
      });
      
      // Remove blue border
      setNodes((nds) => nds.map((n) => {
        if (n.id === nodeId && n.type === 'chat') {
          const data = n.data as ChatNodeData;
          return { 
            ...n, 
            data: { 
              ...data, 
              isBranchSelected: false
            } 
          };
        }
        return n;
      }));
      return;
    }
    
    // Selected a different chat, create the merge
    const sourceChatId = branchMode.sourceChatId!;
    const targetChatId = nodeId;
    
    // Create curved edge between the two chats (like in the image)
    const mergeEdge: Edge = {
      id: `merge-${sourceChatId}-${targetChatId}`,
      source: sourceChatId,
      target: targetChatId,
      animated: true,
      style: { 
        stroke: '#8b5cf6', 
        strokeWidth: 2,
        strokeDasharray: '5,5'
      },
      type: 'smoothstep',
      markerEnd: {
        type: 'arrowclosed',
        color: '#8b5cf6',
      }
    };
    
    // Create new merged chat
    const mergedChatId = `chat-merged-${Date.now()}`;
    const sourceNode = nodes.find(n => n.id === sourceChatId);
    const targetNode = nodes.find(n => n.id === targetChatId);
    
    if (sourceNode && targetNode) {
      const sourceCount = (sourceNode.data as ChatNodeData).mergedCount ? (sourceNode.data as ChatNodeData).mergedCount! : 1;
      const targetCount = (targetNode.data as ChatNodeData).mergedCount ? (targetNode.data as ChatNodeData).mergedCount! : 1;
      const totalMerged = sourceCount + targetCount;

      const mergedChatNode: Node = {
        id: mergedChatId,
        type: 'chat',
        position: { 
          x: (sourceNode.position.x + targetNode.position.x) / 2, 
          y: Math.max(sourceNode.position.y, targetNode.position.y) + 100
        },
        data: {
          title: `Merged Chat`,
          messages: [],
          threads: [{ id: 't1', title: 'Main' }],
          activeThreadId: 't1',
          linkedNodeIds: [],
          selectedModel: 'gemini-2.5-flash',
          mergedCount: totalMerged
        } as ChatNodeData
      };
      
      // Create edges from both source chats to the merged chat
      const sourceToMergedEdge: Edge = {
        id: `edge-${sourceChatId}-${mergedChatId}`,
        source: sourceChatId,
        target: mergedChatId,
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 2 },
        type: 'smoothstep'
      };
      
      const targetToMergedEdge: Edge = {
        id: `edge-${targetChatId}-${mergedChatId}`,
        source: targetChatId,
        target: mergedChatId,
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 2 },
        type: 'smoothstep'
      };
      
      // Update state
      setNodes((nds) => [
        ...nds.map((n) => {
          if (n.id === sourceChatId && n.type === 'chat') {
            const data = n.data as ChatNodeData;
            return { 
              ...n, 
              data: { 
                ...data, 
                isBranchSelected: false
              } 
            };
          }
          return n;
        }),
        mergedChatNode
      ]);
      
      setEdges((eds) => [...eds, mergeEdge, sourceToMergedEdge, targetToMergedEdge]);
    }
    
    // Reset branch mode
    setBranchMode({
      isActive: false,
      sourceChatId: null,
      selectedChatId: null
    });
  };

  const handleDeleteChat = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  }, []);

  const handleSelectBranch = (nodeId: string, threadId: string) => {
    setNodes((nds) => nds.map((n) => {
      if (n.id === nodeId && n.type === 'chat') {
        const data = n.data as ChatNodeData;
        return { ...n, data: { ...data, activeThreadId: threadId } };
      }
      return n;
    }));
  };


  const handleModelChange = (nodeId: string, model: GeminiModel) => {
    setNodes((nds) => nds.map((n) => {
      if (n.id === nodeId && n.type === 'chat') {
        const data = n.data as ChatNodeData;
        return { ...n, data: { ...data, selectedModel: model } };
      }
      return n;
    }));
  };

  const handleCreateChat = (sourceNodeId: string, title?: string) => {
    const sourceNode = nodes.find(n => n.id === sourceNodeId);
    if (!sourceNode || sourceNode.type !== 'chat') return;
    
    const sourceData = sourceNode.data as ChatNodeData;
    const newId = `chat-${Date.now()}`;
    
    // Create new chat node with fresh context but same linked nodes
    // Spawn from the right side of the source chat
    const newChatNode: Node = {
      id: newId,
      type: 'chat',
      position: { 
        x: sourceNode.position.x, // Same x position as parent
        y: sourceNode.position.y + 300  // Spawn below the parent
      },
      data: {
        title: title || `Chat ${nodes.filter(n => n.type === 'chat').length + 1}`,
        messages: [],
        threads: [{ id: 't1', title: 'Main' }],
        activeThreadId: 't1',
        linkedNodeIds: sourceData.linkedNodeIds || [], // Inherit linked nodes
        selectedModel: sourceData.selectedModel || 'gemini-2.5-flash'
      } as ChatNodeData
    };
    
    // Create bezier curve edge connecting parent to new chat (side-to-side)
    const newEdge: Edge = {
      id: `edge-${sourceNodeId}-${newId}`,
      source: sourceNodeId,
      sourceHandle: 'top', // Connect from right handle of source
      target: newId,
      targetHandle: 'bottom',  // Connect to left handle of target
      animated: true,
      style: { 
        stroke: '#8b5cf6', 
        strokeWidth: 2,
        strokeDasharray: '5,5'
      },
      type: 'default',
      markerEnd: {
        type: 'arrowclosed',
        color: '#8b5cf6',
      }
    };
    
    console.log('Creating edge:', newEdge);
    console.log('Source node:', sourceNode);
    console.log('New chat node:', newChatNode);
    
    setNodes((nds) => [...nds, newChatNode]);
    setEdges((eds) => {
      console.log('Current edges:', eds);
      const newEdges = [...eds, newEdge];
      console.log('New edges:', newEdges);
      return newEdges;
    });
  };

  // Simple helper to drop a node via button (placeholder for future scan->deck->node)
  const addNode = (cardName?: string) => {
    const id = `node-${nodes.length + 1}`;
    
    if (cardName) {
      // Get the full card data from the deck
      const deckCard = deckManager.getCard(cardName);
      const label = `${cardName}\nHP: ${deckCard?.hp || Math.floor(Math.random()*100)+50}`;
      
      setNodes((nds) => nds.concat({
        id,
        type: 'card',
        position: { x: Math.random() * 400 + 100, y: Math.random() * 200 + 60 },
        data: { 
          label, 
          imagePath: deckCard?.imagePath,
          cardName: cardName
        },
      }));
    } else {
      // Create a generic card node
      const label = `New Card\nHP: ${Math.floor(Math.random()*100)+50}`;
      setNodes((nds) => nds.concat({
        id,
        type: 'card',
        position: { x: Math.random() * 400 + 100, y: Math.random() * 200 + 60 },
        data: { label },
      }));
    }
  };

  const addChatNode = () => {
    const id = `chat-${Date.now()}`;
    setNodes((nds) => nds.concat({
      id,
      type: 'chat',
      position: { x: 480 + Math.random()*120, y: 40 + Math.random()*60 },
      data: { 
        title: 'Chat', 
        messages: [], 
        threads: [{ id: 't1', title: 'Main' }], 
        activeThreadId: 't1', 
        linkedNodeIds: [],
        selectedModel: 'gemini-2.5-flash'
      } as ChatNodeData
    }));
  };


  return (
    <div className="h-screen w-screen overflow-hidden flex">
      {/* Sidebar */}
      <Sidebar
        className="flex-shrink-0"
        onNavigate={handleNavigate}
        onScannerOpen={handleScannerOpen}
        onDeckOpen={handleDeckOpen}
        onSearchOpen={handleSearchOpen}
        onAddChat={handleAddChat}
      />

      {/* Canvas Area */}
      <div className="flex-1 relative">
        <ReactFlow
        nodes={nodes.map(node => {
          if (node.type === 'chat') {
            const data = node.data as ChatNodeData;
            return {
              ...node,
              data: {
                ...data,
                isSending: isSendingMap[node.id] || false,
                isBranchSelected: data.isBranchSelected || false,
                onSend: handleChatSend,
                onCreateBranch: handleCreateBranch,
                onCreateChat: handleCreateChat,
                onSelectBranch: handleSelectBranch,
                onModelChange: handleModelChange,
                onChatClick: handleChatClick,
                onDelete: handleDeleteChat
              }
            };
          }
          return node;
        })}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ 
          padding: 0.1,
          minZoom: 0.1,
          maxZoom: 2
        }}
        defaultViewport={{ x: 0, y: 0, zoom: 0.3 }}
        proOptions={{ hideAttribution: true }}
        onSelectionChange={handleSelectionChange}
      >
        <Background 
          color="#ffffff" 
          gap={20}
          size={1}
          variant={BackgroundVariant.Lines}
        />
        <MiniMap 
          pannable 
          zoomable 
          nodeColor="#cbd5e1" 
          maskColor="rgba(0,0,0,0.05)"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        <Controls 
          position="bottom-left"
          style={{
            button: {
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              color: '#475569',
              borderRadius: '6px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }
          }}
        />
        </ReactFlow>
      </div>
          
          {/* Search Command Dialog */}
          <Dialog.Root
            open={searchOpen}
            onOpenChange={(open) => {
              setSearchOpen(open);
              if (!open) setSearchQuery(""); // Clear search when closing
            }}
          >
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
              <Dialog.Content
                className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-[600px] max-h-[80vh] rounded-xl shadow-lg border border-slate-200 bg-white text-slate-900 overflow-hidden"
              >
                <Dialog.Title className="sr-only">Search your deck and canvas</Dialog.Title>
                <Command>
                  <div className="p-6 border-b border-slate-100">
                    <Command.Input
                      placeholder="Search your deck and canvas..."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                      className="w-full bg-transparent border-none outline-none text-lg font-medium text-slate-900 placeholder-slate-400"
                    />
                  </div>
              <Command.List className="max-h-96 overflow-y-auto p-4">
              <Command.Empty className="py-12 text-center text-slate-500">
                <div className="text-sm font-medium mb-1">No results found</div>
                <div className="text-xs text-slate-400">Try adjusting your search terms</div>
              </Command.Empty>
              
              <Command.Group
                heading="My Deck"
                className="text-xs font-semibold mb-3 text-slate-700"
              >
                {getFilteredDeckCards().map((card, index) => (
                  <Command.Item 
                    key={`deck-${card.id}-${index}`}
                    onSelect={() => {
                      console.log('Selected deck card:', card.name);
                      setSearchOpen(false);
                      setDeckOpen(true);
                    }}
                    className="px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 flex items-center gap-3 hover:bg-slate-100 text-slate-900"
                  >
                    <img 
                      src={card.imagePath} 
                      alt={card.name}
                      className="w-8 h-10 object-cover rounded border border-gray-300"
                    />
                    <div className="flex-1">
                      <div className="font-medium capitalize">{card.name}</div>
                      <div className="text-xs text-slate-500">
                        {card.type} • HP: {card.hp} • Qty: {card.quantity}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      card.rarity === 'rare' ? 'bg-purple-100 text-purple-800' :
                      card.rarity === 'holo' ? 'bg-yellow-100 text-yellow-800' :
                      card.rarity === 'ultra' ? 'bg-red-100 text-red-800' :
                      card.rarity === 'uncommon' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {card.rarity}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
              
              <Command.Group
                heading="Chat Nodes"
                className="text-xs font-semibold mb-3 text-slate-700"
              >
                {nodes.filter(n => n.type === 'chat').map(node => (
                  <Command.Item
                    key={node.id}
                    onSelect={() => {
                      console.log('Selected chat:', node.id);
                      setSearchOpen(false);
                    }}
                    className="px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 flex items-center gap-3 hover:bg-slate-100 text-slate-900"
                  >
                    <div className="w-2 h-2 bg-slate-400 rounded-full flex-shrink-0"></div>
                    <span className="font-medium">{node.data.title || 'Chat'}</span>
                  </Command.Item>
                ))}
              </Command.Group>
              
            </Command.List>
                </Command>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>

      {/* Scanner Sidebar */}
      <ScannerSidebar 
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
      />

      {/* Deck Sidebar */}
      <DeckSidebar 
        isOpen={deckOpen}
        onClose={() => setDeckOpen(false)}
        onAddCardToCanvas={handleAddCardToCanvas}
      />
    </div>
  );
}


