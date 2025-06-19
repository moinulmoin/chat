import { shareChatAction } from "@/actions";
import { signOut } from "@/lib/auth-client";
import { getAvailableModels, ModelKey, MODELS } from "@/lib/model-registry";
import { setModelKey, toggleWebSearch } from "@/lib/stores/chat";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { toast } from "sonner";

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
  // Unified message selection context
  setSelectionMode?: (mode: 'select' | null) => void;
  setSelectedMessageIndex?: (index: number) => void;
  selectedMessageIndex?: number;
  messages?: any[];
  // Message action handlers
  handleUserMessageDelete?: ({ messageId }: { messageId: string }) => void;
  handleRegenerate?: ({ messageId, modelKey }: { messageId: string; modelKey?: ModelKey }) => void;
  // Model selection for regenerate
  setRegenerateMode?: (messageId: string | null) => void;
  // Toggle handlers for AI message sections
  handleToggleSources?: ({ messageId }: { messageId: string }) => void;
  handleToggleThinking?: ({ messageId }: { messageId: string }) => void;
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
    handler: (args, { setHistoryOpen, setInput, setActiveCommand, setShowCommandSuggestions }) => {
      setHistoryOpen(true);

      // Clear input and command state after opening history
      setInput('');
      if (setActiveCommand) setActiveCommand(null);
      if (setShowCommandSuggestions) setShowCommandSuggestions(false);
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
    command: 'delete',
    aliases: ['del'],
    description: 'Delete current chat and start new',
    category: 'utility',
    requiresChat: true,
    handler: async (args, { chatId, router, setInput, setActiveCommand, setShowCommandSuggestions }) => {
      if (!chatId) {
        toast.error("No active chat to delete");
        return;
      }

      if (!router) {
        toast.error("Router not available");
        return;
      }

      try {
        // Import the delete action
        const { deleteChat } = await import("@/actions");

        // Delete the current chat
        await deleteChat(chatId);

        // Clear input and command state
        setInput('');
        if (setActiveCommand) setActiveCommand(null);
        if (setShowCommandSuggestions) setShowCommandSuggestions(false);

        // Redirect to new chat
        router.push('/chat');

        toast.success("Chat deleted successfully");

        // Invalidate chat list cache
        if (typeof window !== 'undefined' && (window as any).__SWR_MUTATE__) {
          const { mutate } = await import('swr');
          await mutate((key: any) => typeof key === "string" && key.startsWith("/api/chats?"));
        }
      } catch (error) {
        console.error('Delete chat command error:', error);
        toast.error("Failed to delete chat");
      }
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
    handler: (args, { onFileUpload, supportedFileTypes, setInput, setActiveCommand, setShowCommandSuggestions }) => {
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

          // Clear input and command state after successful file upload
          setInput('');
          if (setActiveCommand) setActiveCommand(null);
          if (setShowCommandSuggestions) setShowCommandSuggestions(false);
        }
      };
      input.click();
    }
  },

      // Unified message selection command
  {
    command: 'select',
    aliases: ['nav'],
    description: 'Select message to perform actions',
    category: 'utility',
    handler: (args, { setSelectionMode, setSelectedMessageIndex, setInput, setActiveCommand, setShowCommandSuggestions, messages }) => {
      if (!messages || messages.length === 0) {
        toast.error("No messages to select");
        return;
      }

      // Enter unified selection mode and start with last message
      if (setSelectionMode) setSelectionMode('select');
      if (setSelectedMessageIndex) setSelectedMessageIndex(messages.length - 1); // Start with last message

      // Clear input and command state
      setInput('');
      if (setActiveCommand) setActiveCommand(null);
      if (setShowCommandSuggestions) setShowCommandSuggestions(false);

      toast.success("Selection mode: Use ↑↓ to navigate • Type /c for /copy • ESC to exit");
    }
  },

  // Context-aware message actions (only available in selection mode)
  {
    command: 'copy',
    description: 'Copy selected message',
    category: 'utility',
    handler: (args, context) => {
      const { messages, setSelectionMode, setInput } = context;

      // Get selected message index from context (passed via custom property)
      const selectedMessageIndex = (context as any).selectedMessageIndex;

      if (!messages || selectedMessageIndex === undefined || selectedMessageIndex < 0 || selectedMessageIndex >= messages.length) {
        toast.error("No message selected to copy");
        return;
      }

      const selectedMessage = messages[selectedMessageIndex];

      // Extract text content from message
      let textContent = '';
      if (selectedMessage.role === 'user') {
        // For user messages, get text from parts
        textContent = selectedMessage.parts?.map((part: any) =>
          part.type === 'text' ? part.text : ''
        ).join('') || '';
      } else {
        // For AI messages, get text from parts (excluding tool invocations)
        textContent = selectedMessage.parts?.filter((part: any) => part.type === 'text')
          .map((part: any) => part.text).join('') || '';
      }

      if (!textContent.trim()) {
        toast.error("Selected message has no text content to copy");
        return;
      }

      // Copy to clipboard
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(textContent).then(() => {
          const messageType = selectedMessage.role === 'user' ? 'User' : 'AI';
          toast.success(`${messageType} message copied to clipboard`);

          // Clear input and exit selection mode after successful copy
          setInput('');
          if (setSelectionMode) setSelectionMode(null);
        }).catch(() => {
          toast.error("Failed to copy to clipboard");
        });
      } else {
        toast.error("Clipboard not available");
      }
    }
  },
  {
    command: 'delmsg',
    aliases: ['dm'],
    description: 'Delete selected user message',
    category: 'utility',
    handler: (args, context) => {
      const { messages, setSelectionMode, handleUserMessageDelete, setInput } = context;
      const selectedMessageIndex = (context as any).selectedMessageIndex;

      if (!messages || selectedMessageIndex === undefined || selectedMessageIndex < 0 || selectedMessageIndex >= messages.length) {
        toast.error("No message selected to delete");
        return;
      }

      const selectedMessage = messages[selectedMessageIndex];

      // Only allow deleting user messages
      if (selectedMessage.role !== 'user') {
        toast.error("Can only delete user messages");
        return;
      }

      if (!handleUserMessageDelete) {
        toast.error("Delete function not available");
        return;
      }

      if (!selectedMessage.id) {
        toast.error("Message ID not found");
        return;
      }

      // Execute deletion
      handleUserMessageDelete({ messageId: selectedMessage.id });

      // Clear input and exit selection mode after deletion
      setInput('');
      if (setSelectionMode) setSelectionMode(null);

      toast.success(`User message deleted successfully`);
    }
  },
    {
    command: 'regenerate',
    aliases: ['retry', 'regen'],
    description: 'Regenerate selected AI message',
    category: 'utility',
    handler: (args, context) => {
      const { messages, setSelectionMode, handleRegenerate, setShowModelSelection, setRegenerateMode, setInput } = context;
      const selectedMessageIndex = (context as any).selectedMessageIndex;

      if (!messages || selectedMessageIndex === undefined || selectedMessageIndex < 0 || selectedMessageIndex >= messages.length) {
        toast.error("No message selected to regenerate");
        return;
      }

      const selectedMessage = messages[selectedMessageIndex];

      // Only allow regenerating AI messages
      if (selectedMessage.role !== 'assistant') {
        toast.error("Can only regenerate AI messages");
        return;
      }

      if (!selectedMessage.id) {
        toast.error("Message ID not found");
        return;
      }

      if (args.length === 0) {
        // Show model selection UI for regenerate
        if (setShowModelSelection && setRegenerateMode) {
          setRegenerateMode(selectedMessage.id); // Store which message to regenerate
          setShowModelSelection(true);
          setInput('/regenerate ');
          return;
        }

        // Fallback: regenerate with current model
        if (!handleRegenerate) {
          toast.error("Regenerate function not available");
          return;
        }

        handleRegenerate({ messageId: selectedMessage.id });
        setInput('');
        if (setSelectionMode) setSelectionMode(null);
        return;
      }

      // Direct model specification
      if (!handleRegenerate) {
        toast.error("Regenerate function not available");
        return;
      }

      const modelKey = args[0] as ModelKey;

      // Execute regeneration with specified model
      handleRegenerate({ messageId: selectedMessage.id, modelKey });

      // Clear input and exit selection mode after regeneration
      setInput('');
      if (setSelectionMode) setSelectionMode(null);
    }
  },
  {
    command: 'branch',
    description: 'Branch from selected AI message',
    category: 'utility',
    handler: async (args, context) => {
      const { messages, setSelectionMode, router, setInput } = context;
      const selectedMessageIndex = (context as any).selectedMessageIndex;

      if (!messages || selectedMessageIndex === undefined || selectedMessageIndex < 0 || selectedMessageIndex >= messages.length) {
        toast.error("No message selected to branch from");
        return;
      }

      const selectedMessage = messages[selectedMessageIndex];

      // Only allow branching from AI messages
      if (selectedMessage.role !== 'assistant') {
        toast.error("Can only branch from AI messages");
        return;
      }

      if (!selectedMessage.id) {
        toast.error("Message ID not found");
        return;
      }

      if (!router) {
        toast.error("Router not available");
        return;
      }

      try {
        // Import the branch action dynamically
        const { branchChatAction } = await import("@/actions");

        // Execute branching
        const newChatId = await branchChatAction(selectedMessage.id);
        toast.success("Chat branched successfully");

        // Navigate to new chat
        router.push(`/chat/${newChatId}`);

        // Clear input and exit selection mode
        setInput('');
        if (setSelectionMode) setSelectionMode(null);

        // Invalidate chat list cache
        if (typeof window !== 'undefined' && (window as any).__SWR_MUTATE__) {
          const { mutate } = await import('swr');
          await mutate((key: any) => typeof key === "string" && key.startsWith("/api/chats?"));
        }
      } catch (error) {
        console.error('Branch command error:', error);
        toast.error("Failed to branch chat");
      }
    }
  },
  {
    command: 'togglesources',
    aliases: ['sources'],
    description: 'Toggle sources section',
    category: 'utility',
    handler: (args, context) => {
      const { messages, handleToggleSources, setSelectionMode, setInput } = context;
      const selectedMessageIndex = (context as any).selectedMessageIndex;

      if (!messages || selectedMessageIndex === undefined || selectedMessageIndex < 0 || selectedMessageIndex >= messages.length) {
        toast.error("No message selected");
        return;
      }

      const selectedMessage = messages[selectedMessageIndex];

      // Only allow for AI messages
      if (selectedMessage.role !== 'assistant') {
        toast.error("Sources only available for AI messages");
        return;
      }

      if (!selectedMessage.id) {
        toast.error("Message ID not found");
        return;
      }

      if (!handleToggleSources) {
        toast.error("Toggle sources function not available");
        return;
      }

      // Execute toggle
      handleToggleSources({ messageId: selectedMessage.id });

      // Clear input and exit selection mode
      setInput('');
      if (setSelectionMode) setSelectionMode(null);
    }
  },
  {
    command: 'togglethinking',
    aliases: ['thinking'],
    description: 'Toggle thinking section',
    category: 'utility',
    handler: (args, context) => {
      const { messages, handleToggleThinking, setSelectionMode, setInput } = context;
      const selectedMessageIndex = (context as any).selectedMessageIndex;

      if (!messages || selectedMessageIndex === undefined || selectedMessageIndex < 0 || selectedMessageIndex >= messages.length) {
        toast.error("No message selected");
        return;
      }

      const selectedMessage = messages[selectedMessageIndex];

      // Only allow for AI messages
      if (selectedMessage.role !== 'assistant') {
        toast.error("Thinking only available for AI messages");
        return;
      }

      if (!selectedMessage.id) {
        toast.error("Message ID not found");
        return;
      }

      if (!handleToggleThinking) {
        toast.error("Toggle thinking function not available");
        return;
      }

      // Execute toggle
      handleToggleThinking({ messageId: selectedMessage.id });

      // Clear input and exit selection mode
      setInput('');
      if (setSelectionMode) setSelectionMode(null);
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
        context.setInput('');
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
      // Enable web search immediately
      toggleWebSearch();

      // Clear the input and command state
      setInput('');
      if (setActiveCommand) setActiveCommand(null);
      if (setShowCommandSuggestions) setShowCommandSuggestions(false);
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

export function getCommandSuggestions(
  query: string,
  isStreaming?: boolean,
  messageCount?: number,
  selectionMode?: string | null,
  selectedMessage?: any
): SlashCommand[] {
  let commands = ALL_COMMANDS;

  // Only show /stop command when streaming
  if (!isStreaming) {
    commands = commands.filter(cmd => cmd.command !== 'stop');
  }

  // Only show /new command when there are messages (at least 2: 1 user + 1 AI)
  if (!messageCount || messageCount < 2) {
    commands = commands.filter(cmd => cmd.command !== 'new');
  }

  // Filter commands based on selection mode and selected message type
  if (selectionMode === 'select' && selectedMessage) {
    const messageActionCommands = ['copy', 'delmsg', 'regenerate', 'branch', 'togglesources', 'togglethinking'];

    // Get available actions for this message type
    const availableActions = selectedMessage.role === 'user'
      ? ['copy', 'delmsg']
      : (() => {
          const baseActions = ['copy', 'regenerate', 'branch'];

          // Check if message has sources (web search results)
          const hasSources = selectedMessage.parts?.some((part: any) =>
            part.type === "tool-invocation" &&
            part.toolInvocation.toolName === "webSearch" &&
            part.toolInvocation.state === "result" &&
            Array.isArray(part.toolInvocation.result) &&
            part.toolInvocation.result.length > 0
          );

          // Check if message has thinking/reasoning
          const hasThinking = selectedMessage.parts?.some((part: any) => part.type === "reasoning");

          if (hasSources) baseActions.push('togglesources');
          if (hasThinking) baseActions.push('togglethinking');

          return baseActions;
        })();

    // Only show message action commands that are valid for the selected message type
    commands = commands.filter(cmd => {
      if (!messageActionCommands.includes(cmd.command)) {
        // Keep non-message-action commands (like select, history, etc.)
        return true;
      }

      // Filter message action commands based on message type
      return availableActions.includes(cmd.command);
    });

    if (!query) return commands;

    const lowerQuery = query.toLowerCase();

    // Prioritize available actions in selection mode
    const filteredCommands = commands.filter(cmd =>
      cmd.command.startsWith(lowerQuery) ||
      cmd.aliases?.some(alias => alias.startsWith(lowerQuery)) ||
      cmd.description.toLowerCase().includes(lowerQuery)
    );

    // Sort so available actions come first
    return filteredCommands.sort((a, b) => {
      const aIsAvailable = availableActions.includes(a.command);
      const bIsAvailable = availableActions.includes(b.command);

      if (aIsAvailable && !bIsAvailable) return -1;
      if (!aIsAvailable && bIsAvailable) return 1;
      return 0;
    });
  } else {
    // When not in selection mode, hide individual message action commands
    const messageActionCommands = ['copy', 'delmsg', 'regenerate', 'branch', 'togglesources', 'togglethinking'];
    commands = commands.filter(cmd => !messageActionCommands.includes(cmd.command));
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

  let command = findCommand(parsed.command);

  // Smart auto-completion in selection mode
  if (!command && context.messages && context.selectedMessageIndex !== undefined) {
    const selectedMessage = context.messages[context.selectedMessageIndex];
    if (selectedMessage) {
      // Get available actions for this message type
      const availableActions = selectedMessage.role === 'user'
        ? ['copy', 'delmsg']
        : (() => {
            const baseActions = ['copy', 'regenerate', 'branch'];

            // Check if message has sources (web search results)
            const hasSources = selectedMessage.parts?.some((part: any) =>
              part.type === "tool-invocation" &&
              part.toolInvocation.toolName === "webSearch" &&
              part.toolInvocation.state === "result" &&
              Array.isArray(part.toolInvocation.result) &&
              part.toolInvocation.result.length > 0
            );

            // Check if message has thinking/reasoning
            const hasThinking = selectedMessage.parts?.some((part: any) => part.type === "reasoning");

            if (hasSources) baseActions.push('togglesources');
            if (hasThinking) baseActions.push('togglethinking');

            return baseActions;
          })();

      // Find available commands that start with the typed command
      const matchingCommands = availableActions
        .map(action => findCommand(action))
        .filter(cmd => cmd && cmd.command.startsWith(parsed.command.toLowerCase()));

      if (matchingCommands.length === 1) {
        // Auto-complete to the single matching available command
        command = matchingCommands[0];
        toast.success(`Auto-completed /${parsed.command} → /${command?.command}`);
      } else if (matchingCommands.length > 1) {
        const commandNames = matchingCommands.map(cmd => cmd!.command).join(', /');
        return {
          success: false,
          message: `Ambiguous command: /${parsed.command}. Available: /${commandNames}`
        };
      }
    }
  }

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