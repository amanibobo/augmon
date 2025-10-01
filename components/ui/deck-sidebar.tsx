"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X, Package } from "lucide-react";
import DeckDisplay from "@/components/DeckDisplay";

interface DeckSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCardToCanvas?: (cardName: string) => void;
  className?: string;
}

export function DeckSidebar({ 
  isOpen, 
  onClose, 
  onAddCardToCanvas,
  className 
}: DeckSidebarProps) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 right-0 h-full bg-white border-l border-gray-200 shadow-2xl z-50 transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full",
        "w-96",
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">My Deck</h2>
              <p className="text-sm text-gray-600">Manage your collected cards</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto h-[calc(100vh-80px)]">
          <DeckDisplay onAddCardToCanvas={onAddCardToCanvas} />
        </div>
      </div>
    </>
  );
}
