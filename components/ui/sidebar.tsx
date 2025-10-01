"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Home,
  Camera,
  Package,
  Search,
  MessageSquare,
  Settings,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  className?: string;
  onNavigate?: (route: string) => void;
  onScannerOpen?: () => void;
  onDeckOpen?: () => void;
  onSearchOpen?: () => void;
  onAddChat?: () => void;
}

const navigationItems = [
  {
    title: "Navigation",
    items: [
      {
        title: "Home",
        icon: Home,
        href: "/",
        action: "navigate"
      },
      {
        title: "Scanner",
        icon: Camera,
        action: "scanner"
      }
    ]
  },
  {
    title: "Canvas",
    items: [
      {
        title: "Add Chat",
        icon: MessageSquare,
        action: "addChat"
      },
      {
        title: "Search",
        icon: Search,
        action: "search"
      },
      {
        title: "My Deck",
        icon: Package,
        action: "deck"
      }
    ]
  }
];

export function Sidebar({ 
  className, 
  onNavigate,
  onScannerOpen,
  onDeckOpen,
  onSearchOpen,
  onAddChat
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleAction = (action: string) => {
    switch (action) {
      case "navigate":
        onNavigate?.("/");
        break;
      case "scanner":
        onScannerOpen?.();
        break;
      case "search":
        onSearchOpen?.();
        break;
      case "deck":
        onDeckOpen?.();
        break;
      case "addChat":
        onAddChat?.();
        break;
    }
  };

  return (
    <div className={cn(
      "flex h-full flex-col bg-white border-r border-gray-200 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <span className="font-semibold text-gray-900">augmon</span>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-6">
          {navigationItems.map((section) => (
            <div key={section.title}>
              {!isCollapsed && (
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.title}
                      variant="ghost"
                      onClick={() => handleAction(item.action)}
                      className={cn(
                        "w-full justify-start gap-3 h-10",
                        isCollapsed ? "px-2" : "px-3"
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="text-sm font-medium">{item.title}</span>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Export individual components for more flexibility
export { navigationItems };
