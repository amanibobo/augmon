"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X, Camera } from "lucide-react";
import WebcamCapture from "@/components/WeCapture";

interface ScannerSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function ScannerSidebar({ 
  isOpen, 
  onClose, 
  className 
}: ScannerSidebarProps) {
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
        "w-[900px]",
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
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
        <div className="flex-1 overflow-hidden h-[calc(100vh-80px)] p-6">
          <div className="flex flex-col items-center w-full gap-6">
            <WebcamCapture />
          </div>
        </div>
      </div>
    </>
  );
}
