import { shareChatAction } from "@/actions";
import { toggleWebSearch, setModelKey } from "@/lib/stores/chat";
import { ModelKey, MODELS, getAvailableModels } from "@/lib/model-registry";
import { NextRouter } from "next/router";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { toast } from "sonner";
import { signOut } from "@/lib/auth-client";

export interface CommandArg {
  name: string;
  type: 'string' | 'number' | 'boolean';
  required?: boolean;
  description?: string;
}

export interface CommandContext {
  router: AppRouterInstance;
  chatId?: string;
  setHistoryOpen: (open: boolean) => void;
  setInput: (input: string) => void;
  messageCount?: number;
  setShowModelSelection?: (show: boolean) => void;
  stop?: () => void;
  isStreaming?: boolean;
  onFileUpload?: (file: File) => void;
  supportedFileTypes?: string[];
  setActiveCommand?: (command: string | null) => void;
  setShowCommandSuggestions?: (show: boolean) => void;
}

export interface SlashCommand {
  command: string;
  description: string;
  aliases?: string[];
  category: 'navigation' | 'chat' | 'settings' | 'utility';
  handler: (args: string[], context: CommandContext) => Promise<void> | void;
  args?: CommandArg[];
  requiresChat?: boolean; // Some commands need an active chat
}

// Core navigation and chat commands
export const CORE_COMMANDS: SlashCommand[] = [
  {
    command: 'history',
    aliases: ['h'],
    description: 'Open chat history',
    category: 'navigation',
    handler: (args, { setHistoryOpen }) => {
      setHistoryOpen(true);
    }
  },
  {
    command: 'new',
    aliases: ['n'],
    description: 'Start new chat',
    category: 'navigation',
    handler: (args, { router }) => {
      router.push('/chat');
    }
  },
  {
    command: 'share',
    aliases: ['s'],
    description: 'Share current chat',
    category: 'chat',
    requiresChat: true,
    handler: async (args, { chatId, messageCount }) => {
      if (!chatId) {
        toast.error("No active chat to share");
        return;
      }
      
      if (!messageCount || messageCount < 2) {
        toast.error("Chat must have at least 2 messages to share");
        return;
      }

      try {
        const shareId = await shareChatAction(chatId);
        const url = `${window.location.origin}/share/${shareId}`;
        await navigator.clipboard.writeText(url);
        toast.success("Chat link copied to clipboard");
      } catch (error) {
        console.error('Share command error:', error);
        toast.error("Failed to share chat");
      }
    }
  },
  {
    command: 'clear',
    aliases: ['cls'],
    description: 'Clear current input',
    category: 'utility',
    handler: (args, { setInput, setActiveCommand, setShowCommandSuggestions }) => {
      setInput('');
      if (setActiveCommand) setActiveCommand(null);
      if (setShowCommandSuggestions) setShowCommandSuggestions(false);
      toast.success("Input cleared");
    }
  },
  {
    command: 'signout',
    aliases: ['logout', 'exit'],
    description: 'Sign out of account',
    category: 'utility',
    handler: async (args, context) => {
      try {
        await signOut();
        toast.success("Signing out...");
      } catch (error) {
        console.error('Signout error:', error);
        toast.error("Failed to sign out");
      }
    }
  },
  {
    command: 'stop',
    description: 'Stop current streaming',
    category: 'utility',
    handler: (args, { stop, isStreaming }) => {
      if (!isStreaming) {
        toast.error("No active streaming to stop");
        return;
      }
      if (stop) {
        stop();
        toast.success("Streaming stopped");
      } else {
        toast.error("Stop function not available");
      }
    }
  },
  {
    command: 'upload',
    description: 'Upload image or PDF file',
    category: 'utility',
    handler: (args, { onFileUpload, supportedFileTypes }) => {
      if (!onFileUpload) {
        toast.error("File upload not available");
        return;
      }
      
      if (!supportedFileTypes || supportedFileTypes.length === 0) {
        toast.error("No file types supported for current model");
        return;
      }

      // Create file input programmatically
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = supportedFileTypes.join(',');
      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files[0]) {
          onFileUpload(target.files[0]);
          toast.success("File uploaded successfully");
        }
      };
      input.click();
    }
  }
];

// Advanced commands for model and settings
export const ADVANCED_COMMANDS: SlashCommand[] = [
  {
    command: 'model',
    aliases: ['m'],
    description: 'Switch AI model',
    category: 'settings',
    args: [
      { 
        name: 'model_name', 
        type: 'string', 
        required: false,
        description: 'Model name or alias (e.g., gpt-4.1-mini, o4-mini)' 
      }
    ],
    handler: (args, context) => {
      if (args.length === 0) {
        // Show model selection UI
        if (context.setShowModelSelection) {
          context.setShowModelSelection(true);
          context.setInput('/model ');
          return;
        }
        
        // Fallback: show available models as text
        const models = getAvailableModels();
        const modelList = models
          .map(({ key, config }) => `• ${key} - ${config.displayName}`)
          .join('\n');
        
        context.setInput(`Available models:\n${modelList}\n\nUse: /model <model_name>`);
        return;
      }

      const modelKey = args[0] as ModelKey;
      if (modelKey in MODELS) {
        setModelKey(modelKey);
        const config = MODELS[modelKey];
        toast.success(`Switched to ${config.displayName}`);
      } else {
        toast.error(`Invalid model: ${modelKey}`);
      }
    }
  },
  {
    command: 'web',
    description: 'Enable web search for next query',
    category: 'settings',
    handler: (args, { setInput, setActiveCommand, setShowCommandSuggestions }) => {
      // Enable web search using the same function as the button
      toggleWebSearch();
      
      // Clear all command state so user can type normal query
      if (setActiveCommand) setActiveCommand(null);
      if (setShowCommandSuggestions) setShowCommandSuggestions(false);
      
      // Clear the input so user can type their actual query
      setInput('');
    }
  }
];

// Combine all commands
export const ALL_COMMANDS: SlashCommand[] = [...CORE_COMMANDS, ...ADVANCED_COMMANDS];

// Command parser utilities
export function parseSlashCommand(input: string): { command: string; args: string[] } | null {
  if (!input.startsWith('/')) {
    return null;
  }

  const parts = input.slice(1).trim().split(/\s+/);
  if (parts.length === 0 || parts[0] === '') {
    return null;
  }

  return {
    command: parts[0].toLowerCase(),
    args: parts.slice(1)
  };
}

export function findCommand(commandName: string): SlashCommand | null {
  return ALL_COMMANDS.find(cmd => 
    cmd.command === commandName || 
    cmd.aliases?.includes(commandName)
  ) || null;
}

export function getCommandSuggestions(query: string, isStreaming?: boolean, messageCount?: number): SlashCommand[] {
  let commands = ALL_COMMANDS;
  
  // Only show /stop command when streaming
  if (!isStreaming) {
    commands = commands.filter(cmd => cmd.command !== 'stop');
  }
  
  // Only show /new command when there are messages (at least 2: 1 user + 1 AI)
  if (!messageCount || messageCount < 2) {
    commands = commands.filter(cmd => cmd.command !== 'new');
  }
  
  if (!query) return commands;
  
  const lowerQuery = query.toLowerCase();
  return commands.filter(cmd =>
    cmd.command.startsWith(lowerQuery) ||
    cmd.aliases?.some(alias => alias.startsWith(lowerQuery)) ||
    cmd.description.toLowerCase().includes(lowerQuery)
  );
}

export function validateCommand(command: SlashCommand, args: string[], context: CommandContext): string | null {
  // Check if command requires an active chat
  if (command.requiresChat && !context.chatId) {
    return "This command requires an active chat";
  }

  // Check required arguments
  if (command.args) {
    const requiredArgs = command.args.filter(arg => arg.required);
    if (args.length < requiredArgs.length) {
      return `Missing required arguments: ${requiredArgs.map(arg => arg.name).join(', ')}`;
    }
  }

  return null; // Valid
}

export async function executeSlashCommand(
  input: string, 
  context: CommandContext
): Promise<{ success: boolean; message?: string }> {
  const parsed = parseSlashCommand(input);
  if (!parsed) {
    return { success: false, message: "Invalid command format" };
  }

  const command = findCommand(parsed.command);
  if (!command) {
    return { success: false, message: `Unknown command: /${parsed.command}` };
  }

  const validation = validateCommand(command, parsed.args, context);
  if (validation) {
    return { success: false, message: validation };
  }

  try {
    await command.handler(parsed.args, context);
    return { success: true };
  } catch (error) {
    console.error(`Command execution error for /${command.command}:`, error);
    return { 
      success: false, 
      message: `Failed to execute /${command.command}` 
    };
  }
}