# /chat - Where conversations begin with /

> **Chat with AI models, with / commands**

/chat is a sophisticated Next.js-based chat application that provides an unparalleled AI conversation experience with advanced features, multi-model support, and professional-grade capabilities.

## �� **Core Features**

### **🤖 Multi-Model AI Support**
- **8 Premium AI Models** across 4 leading providers:
  - **OpenAI**: GPT-4.1 Mini, o4 Mini (reasoning)
  - **Google**: Gemini 2.5 Flash, Flash Lite, Flash Thinking
  - **Groq**: Llama 4 Scout, Qwen 3 32B (thinking)
  - **xAI**: Grok 3, Grok 3 Mini (thinking)
- **Dynamic Model Switching**: Change models mid-conversation with context preservation
- **Provider-Specific Optimizations**: Custom configurations for each model provider
- **Capability-Based UI**: Smart feature enablement based on model capabilities

### **🧠 Advanced AI Capabilities**

#### **Thinking Models with Reasoning Display**
- **Visual Reasoning Process**: Collapsible sections showing AI thought processes
- **Animated Thinking Indicators**: Real-time feedback during reasoning
- **Configurable Thinking Budgets**: Control reasoning depth and cost
- **Parsed Reasoning Output**: Structured display of AI thinking steps

#### **Intelligent Web Search Integration**
- **Real-Time Web Search**: Powered by Tavily for up-to-date information
- **Source Attribution**: Clickable links with domain favicons
- **Contextual Results**: Search results integrated into conversation flow
- **Search Status Indicators**: Visual feedback during web operations

#### **File Upload & Processing**
- **Multi-Format Support**: Images (JPEG, PNG), PDFs up to 10MB
- **Intelligent Previews**: Automatic file preview generation
- **Model-Aware Uploads**: File type validation based on selected model capabilities
- **Drag & Drop Interface**: Seamless file handling with progress indicators
- **Vercel Blob Storage**: Secure, scalable file storage with automatic cleanup

## 💬 **Chat Experience**

### **Conversation Management**
- **Smart Chat Branching**: Create new conversation branches from any message
- **Auto-Generated Titles**: AI-powered conversation naming
- **Message Editing**: Full inline editing of user messages with real-time updates
- **Message Regeneration**: Re-run responses with same or different models
- **Performance Metrics**: Live tokens/second display and usage tracking

### **Advanced Message Features**
- **Text Selection Tools**: Context menu with "Add to Chat" and "Explain" options
- **Rich Markdown Support**: GitHub Flavored Markdown with syntax highlighting
- **Code Block Enhancements**:
  - Syntax highlighting via Shiki
  - One-click copy functionality
  - Language auto-detection
- **Message Actions**: Copy, edit, delete, regenerate with hover-activated controls

### **Empty State & Onboarding**
- **Starter Questions**: Three curated prompts to get users started:
  - "Generate creative ideas for a project"
  - "Explain the concept of AI"
  - "Help me write a professional email"
- **Contextual Placeholders**: Dynamic placeholder text based on context

## ⌨️ **Power User Features**

### **Comprehensive Keyboard Shortcuts**
- **Ctrl+C**: New chat (when ≥2 messages exist)
- **Ctrl+S**: Share current chat
- **Ctrl+K**: Open chat history search
- **Enter**: Send message
- **Shift+Enter**: New line in message
- **Escape**: Cancel editing/cancel operations

### **Advanced Chat History**
- **Search Command Palette**: High-performance search through unlimited chat history
- **Time-Based Grouping**: "Today", "Yesterday", "X days/months ago"
- **Fuzzy Search**: Intelligent search across chat titles and content
- **Inline Management**:
  - Edit titles with immediate persistence
  - Delete with confirmation workflow
  - Navigate to parent chats (for branched conversations)
- **Visual Indicators**: Special icons for branched conversations

### **Professional Model Selector**
- **Provider Groupings**: Models organized by OpenAI, Google, Groq, xAI
- **Capability Indicators**: Visual icons showing model abilities:
  - 🧠 Thinking/reasoning capabilities
  - 📄 File upload support
  - 🖼️ Image processing
  - ✨ Image generation
- **Search Functionality**: Filter models by name
- **Brand Integration**: Authentic provider icons and branding

## 🔄 **Real-Time Features**

### **Streaming & Performance**
- **Live Message Streaming**: Real-time response display with smooth animations
- **Stream Resumption**: Automatic recovery of interrupted conversations
- **Optimistic Updates**: Immediate UI feedback for better UX
- **Performance Monitoring**: Live metrics display and usage tracking

## 🔐 **Authentication & Security**

### **Modern Authentication**
- **GitHub OAuth**: Secure single sign-on via better-auth
- **Session Management**: Secure session handling with automatic expiration
- **User Profiles**: Avatar support with graceful fallbacks
- **Middleware Protection**: Route-level authentication for sensitive pages

### **Chat Sharing & Export**
- **Public Chat Sharing**: Generate shareable links for conversations
- **Share Controls**: Enable/disable sharing per conversation
- **Permalink Generation**: Crypto-secure public IDs for shared chats
- **One-Click Sharing**: Share button with keyboard shortcut

### **Database Architecture**
- **PostgreSQL Backend**: Robust relational database with ACID compliance
- **Prisma ORM**: Type-safe database operations with auto-generated client
- **Optimized Queries**: Efficient pagination and indexing
- **Data Relationships**: Proper foreign keys and cascade deletion

## 🎨 **User Interface**

### **Responsive Design**
- **Mobile-First**: Optimized for mobile with touch-friendly interactions
- **Desktop Enhancements**: Hover states, keyboard navigation, expanded layouts
- **Adaptive Components**: Different layouts for mobile vs desktop
- **Progressive Enhancement**: Features that enhance on larger screens

### **Modern UI Components**
- **Radix UI Foundation**: Accessible, unstyled components
- **shadcn/ui Design System**: Consistent, professional component library
- **Tailwind CSS**: Utility-first styling with design tokens
- **Dark/Light Mode Ready**: Theme-aware components (foundation in place)

### **Accessibility**
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Keyboard Navigation**: Full keyboard accessibility throughout
- **Focus Management**: Proper focus handling in modals and complex interactions
- **High Contrast**: Optimized color contrast for readability

## ⚡ **Technical Architecture**

### **Modern Stack**
- **Next.js 15**: React framework with App Router and server components
- **TypeScript**: Full type safety throughout the application
- **React 19**: Latest React features with concurrent features
- **Vercel AI SDK**: Advanced AI integration with streaming support

### **State Management**
- **Nanostores**: Lightweight, atomic state management
- **Persistent Storage**: Automatic state persistence across sessions
- **SWR Integration**: Smart data fetching with caching and revalidation
- **Real-time Updates**: Live data synchronization

### **Redis Integration**
- **Resumable Streams**: Redis-powered stream resumption for interrupted conversations
- **Session Storage**: High-performance session management
- **Pub/Sub Architecture**: Real-time features with Redis messaging
- **Connection Pooling**: Optimized Redis connections for serverless

## 🔧 **Developer Experience**

### **Code Quality**
- **ESLint Configuration**: Comprehensive linting rules
- **TypeScript Strict Mode**: Maximum type safety
- **Prisma Type Generation**: Auto-generated database types

### **Build System**
- **Turbopack**: Ultra-fast development server
- **Automatic Database Migration**: Prisma schema synchronization
- **Environment Validation**: Runtime environment variable checking
- **Type-Safe Environment Variables**: Validated environment configuration

## 🚀 **Getting Started**

### **Prerequisites**
```bash
Node.js 18+
PostgreSQL database
Redis instance (optional, for resumable streams)
```

### **Environment Variables**
```bash
# Database
DATABASE_URL="postgresql://..."

# Authentication
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"

# AI Providers (configure at least one)
OPENAI_API_KEY="sk-..."
GOOGLE_AI_API_KEY="..."
GROQ_API_KEY="gsk_..."
XAI_API_KEY="xai-..."

# Web Search
TAVILY_API_KEY="tvly-..."

# Redis (optional, for stream resumption)
REDIS_URL="redis://..."

# File Storage
BLOB_READ_WRITE_TOKEN="vercel_blob_token"
```

### **Installation**
```bash
# Clone repository
git clone <repository-url>
cd /chat

# Install dependencies
pnpm install

# Setup database
pnpm prisma:push

# Start development server
pnpm dev
```

### **Production Deployment**
```bash
# Build application
pnpm build

# Start production server
pnpm start
```

## 🔮 **Upcoming Features**

- **Team Workspaces**: Multi-user collaboration spaces
- **Custom Instructions**: User-defined system prompts
- **Voice Input/Output**: Speech-to-text and text-to-speech
- **API Integration**: RESTful API for external integrations
- **Plugin System**: Extensible architecture for custom tools
- **Advanced Analytics**: Detailed usage insights and reporting

## 📄 **License**

This project is proprietary software. All rights reserved.

---

**/chat** - *Where AI conversations become extraordinary*