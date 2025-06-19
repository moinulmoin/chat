"use client";

import { Command, CommandItem, CommandList } from "@/components/ui/command";
import { SlashCommand } from "@/lib/slash-commands";
import { Terminal, Hash, Settings, Navigation } from "lucide-react";
import { useEffect, useRef } from "react";

interface CommandSuggestionsProps {
  commands: SlashCommand[];
  selectedIndex: number;
  onSelect: (command: SlashCommand) => void;
  visible: boolean;
}

function getCategoryIcon(category: SlashCommand['category']) {
  switch (category) {
    case 'navigation':
      return <Navigation className="w-3 h-3" />;
    case 'chat':
      return <Hash className="w-3 h-3" />;
    case 'settings':
      return <Settings className="w-3 h-3" />;
    case 'utility':
      return <Terminal className="w-3 h-3" />;
    default:
      return <Terminal className="w-3 h-3" />;
  }
}

export function CommandSuggestions({ 
  commands, 
  selectedIndex, 
  onSelect, 
  visible 
}: CommandSuggestionsProps) {
  const selectedItemRef = useRef<HTMLDivElement>(null);
  
  // Scroll selected item into view
  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedIndex]);
  
  if (!visible || commands.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 z-50">
      <Command className="rounded-lg border shadow-lg bg-background/95 backdrop-blur-sm">
        <CommandList className="max-h-48 p-1">
          {commands.map((command, index) => (
            <CommandItem
              key={`${command.command}-${index}`}
              ref={index === selectedIndex ? selectedItemRef : null}
              onSelect={() => onSelect(command)}
              className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors ${
                index === selectedIndex 
                  ? 'bg-accent text-accent-foreground' 
                  : 'hover:bg-accent/50'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(command.category)}
                  <span className="font-mono text-sm font-medium text-primary">
                    /{command.command}
                  </span>
                  {command.aliases && command.aliases.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({command.aliases.map(a => `/${a}`).join(', ')})
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground text-right max-w-48 truncate">
                  {command.description}
                </span>
                <div className="text-xs text-muted-foreground bg-muted px-1 py-0.5 rounded font-mono">
                  {command.category}
                </div>
              </div>
            </CommandItem>
          ))}
          
          {commands.length > 0 && (
            <div className="px-3 py-1 text-xs text-muted-foreground border-t mt-1 pt-2">
              <div className="flex items-center justify-between">
                <span>Use ↑↓ to navigate, Tab/Enter to select, Esc to close</span>
                <span>{commands.length} command{commands.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          )}
        </CommandList>
      </Command>
    </div>
  );
}