# Prompt Assistant - Modern Chat Interface UI Specification

## Table of Contents
1. [Overview](#overview)
2. [Design Philosophy](#design-philosophy)
3. [Component Library Recommendations](#component-library-recommendations)
4. [Layout Architecture](#layout-architecture)
5. [Component Specifications](#component-specifications)
6. [JSON Schema](#json-schema)
7. [Wireframes & Annotations](#wireframes--annotations)
8. [Design Tokens](#design-tokens)
9. [Accessibility Guidelines](#accessibility-guidelines)
10. [Integration Instructions](#integration-instructions)

---

## Overview

This specification describes a complete frontend redesign transforming the current Google Forms-like UI into a modern AI chat interface. The new design features:

- **Chat Window**: Central message display with conversation history
- **Composer**: Rich input area for drafting prompts
- **Inspector Panel**: Side panel for configuration options
- **Provider/Model Selector**: Dynamic dropdown with model names and versions
- **Prompt Type Selector**: Categorized prompt templates
- **Constraints Editor**: Structured constraint management

---

## Design Philosophy

### Core Principles
1. **Conversational First**: The primary interaction is chat-based
2. **Progressive Disclosure**: Advanced options hidden in inspector panel
3. **Responsive**: Mobile-first, scales to desktop with side panel
4. **Accessible**: WCAG 2.1 AA compliant
5. **Themeable**: CSS custom properties for easy customization

### Visual Language
- Clean, minimal interface with ample whitespace
- Soft shadows and subtle borders
- Smooth micro-animations for state changes
- Clear visual hierarchy between user/assistant messages

---

## Component Library Recommendations

### Primary Recommendation: Radix UI + Tailwind CSS
- **Radix UI Primitives**: Unstyled, accessible components
- **Tailwind CSS**: Utility-first styling
- **Headless UI**: Additional accessible components
- **Lucide React**: Icon library

### Alternative Options
1. **shadcn/ui**: Pre-built Radix + Tailwind components
2. **Chakra UI**: Full component library with good a11y
3. **Mantine**: React component library with hooks
4. **Ant Design**: Enterprise-grade components

### Recommended Dependencies
```json
{
  "dependencies": {
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-dialog": "^1.0.0",
    "@radix-ui/react-popover": "^1.0.0",
    "@radix-ui/react-tooltip": "^1.0.0",
    "@radix-ui/react-accordion": "^1.0.0",
    "lucide-react": "^0.300.0",
    "clsx": "^2.0.0"
  }
}
```

---

## Layout Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              HEADER                                      │
│  [Logo] Prompt Assistant                    [Theme Toggle] [Settings]    │
├──────────────────────────────────────────────┬──────────────────────────┤
│                                              │                          │
│              CHAT WINDOW                     │    INSPECTOR PANEL       │
│                                              │                          │
│  ┌────────────────────────────────────────┐  │  ┌────────────────────┐  │
│  │ 💬 User Message                        │  │  │ Provider & Model   │  │
│  │ "Build a REST API for..."              │  │  │ ┌────────────────┐ │  │
│  └────────────────────────────────────────┘  │  │ │ Claude         │ │  │
│                                              │  │ └────────────────┘ │  │
│  ┌────────────────────────────────────────┐  │  │ ┌────────────────┐ │  │
│  │ 🤖 Assistant Response                  │  │  │ │ Sonnet 4.5    ↓│ │  │
│  │ "Here's your improved prompt..."       │  │  │ └────────────────┘ │  │
│  └────────────────────────────────────────┘  │  └────────────────────┘  │
│                                              │                          │
│  ┌────────────────────────────────────────┐  │  ┌────────────────────┐  │
│  │ 🔍 Clarification Request               │  │  │ Prompt Type        │  │
│  │ "What language/framework?"             │  │  │ ┌────────────────┐ │  │
│  │ [Option 1] [Option 2] [Option 3]       │  │  │ │ Plan/Architect│ │  │
│  └────────────────────────────────────────┘  │  └────────────────────┘  │
│                                              │                          │
│                                              │  ┌────────────────────┐  │
│                                              │  │ Constraints        │  │
│                                              │  │ + Add Constraint   │  │
│                                              │  │ ┌──────────────┐   │  │
│                                              │  │ │ Tone: Prof. ✕│   │  │
│                                              │  │ └──────────────┘   │  │
│                                              │  └────────────────────┘  │
│                                              │                          │
│                                              │  ┌────────────────────┐  │
│                                              │  │ ☑ Learning Mode    │  │
│                                              │  │ □ Export JSON      │  │
│                                              │  └────────────────────┘  │
├──────────────────────────────────────────────┴──────────────────────────┤
│                            COMPOSER                                      │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ Type your rough prompt here...                                      │ │
│  │                                                           [Send ➤] │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Responsive Breakpoints
- **Mobile** (<768px): Inspector as bottom sheet/modal
- **Tablet** (768-1024px): Collapsible inspector panel
- **Desktop** (>1024px): Full three-column layout

---

## Component Specifications

### 1. ChatWindow
**Purpose**: Display conversation history between user and assistant

**Features**:
- Auto-scroll to latest message
- Message grouping by timestamp
- Support for different message types:
  - User messages (right-aligned, primary color)
  - Assistant messages (left-aligned, neutral)
  - Clarification requests (interactive cards)
  - System messages (centered, muted)
- Copy button on hover for assistant messages
- Markdown rendering for responses

**Props**:
```typescript
interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onClarificationResponse: (id: string, value: any) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type: 'message' | 'clarification' | 'improved-prompt' | 'learning-report';
  metadata?: {
    clarifications?: ClarificationItem[];
    assumptions?: string[];
    learningReport?: LearningReport;
  };
}
```

### 2. Composer
**Purpose**: Input area for user prompts

**Features**:
- Auto-expanding textarea
- Character count indicator
- Keyboard shortcuts (Cmd/Ctrl+Enter to send)
- Attachment support (future)
- Paste handling for long prompts

**Props**:
```typescript
interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  placeholder?: string;
}
```

### 3. InspectorPanel
**Purpose**: Configuration sidebar with all options

**Features**:
- Collapsible sections with accordion
- Persists state across sessions
- Mobile: transforms to bottom sheet
- Export current config as JSON

**Sections**:
1. Provider & Model
2. Prompt Type
3. Constraints
4. Options (Learning Mode, etc.)

### 4. ModelSelector
**Purpose**: Provider and model selection with dynamic loading

**Features**:
- Two-tier dropdown (Provider → Model)
- Shows model name + version (e.g., "Sonnet 4.5")
- Loading state while fetching models
- Unavailable providers shown as disabled
- Model capabilities/hints displayed

**Props**:
```typescript
interface ModelSelectorProps {
  providers: Provider[];
  selectedProvider: string;
  selectedModel: string;
  onProviderChange: (id: string) => void;
  onModelChange: (id: string) => void;
  isLoading: boolean;
}

interface Provider {
  id: string;
  name: string;
  available: boolean;
  unavailable_reason?: string;
}

interface Model {
  id: string;
  name: string;
  version?: string;
  displayName: string; // "Sonnet 4.5", "GPT-4o"
  capabilities?: string[];
}
```

### 5. PromptTypeSelector
**Purpose**: Select the type/category of prompt being refined

**Default Value**: None

**Categories**:
| Type | Description |
|------|-------------|
| **None** | No specific prompt type (default) |
| **Plan / Architect** | High-level system design, architecture decisions, technical planning |
| **Research** | Information gathering, exploration, learning about topics |
| **Full App Build** | Complete application development from scratch |
| **Update / Refactor** | Modifying existing code, improving structure, upgrading dependencies |
| **Bug Investigation & Fix** | Debugging, root cause analysis, implementing fixes |
| **Code Review** | Reviewing code for quality, security, best practices |

**Props**:
```typescript
interface PromptTypeSelectorProps {
  value: PromptType;
  onChange: (type: PromptType) => void;
}

type PromptType = 
  | 'none'
  | 'plan-architect'
  | 'research'
  | 'full-app-build'
  | 'update-refactor'
  | 'bug-investigation-fix'
  | 'code-review';
```

### 6. ConstraintsList
**Purpose**: Manage optional constraints for the prompt

**Constraint Types**:
| Type | Description | Example |
|------|-------------|---------|
| **Tone** | Voice and style of output | "Professional and concise" |
| **Length** | Output length requirements | "Maximum 500 words" |
| **Output Format** | Structure of response | "Markdown with code blocks" |
| **Resource/Time Limits** | Computational constraints | "Must complete in <2 seconds" |
| **Security/Privacy** | Data handling requirements | "No external API calls" |
| **Language** | Programming/natural language | "TypeScript, British English" |
| **Testing Requirements** | Test coverage expectations | "Include unit tests with Jest" |

**Props**:
```typescript
interface ConstraintsListProps {
  constraints: Constraint[];
  onChange: (constraints: Constraint[]) => void;
}

interface Constraint {
  id: string;
  type: ConstraintType;
  description: string;
}

type ConstraintType =
  | 'tone'
  | 'length'
  | 'output-format'
  | 'resource-time-limits'
  | 'security-privacy'
  | 'language'
  | 'testing-requirements';
```

---

## JSON Schema

### Prompt Payload Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "PromptPayload",
  "description": "Complete prompt configuration payload",
  "type": "object",
  "required": ["roughPrompt", "model"],
  "properties": {
    "roughPrompt": {
      "type": "string",
      "description": "The user's original prompt text",
      "minLength": 1
    },
    "promptType": {
      "type": "string",
      "enum": [
        "none",
        "plan-architect",
        "research",
        "full-app-build",
        "update-refactor",
        "bug-investigation-fix",
        "code-review"
      ],
      "default": "none",
      "description": "The category/type of prompt"
    },
    "constraints": {
      "type": "array",
      "description": "Optional constraints for the prompt",
      "items": {
        "type": "object",
        "required": ["id", "type", "description"],
        "properties": {
          "id": {
            "type": "string",
            "description": "Unique identifier for the constraint"
          },
          "type": {
            "type": "string",
            "enum": [
              "tone",
              "length",
              "output-format",
              "resource-time-limits",
              "security-privacy",
              "language",
              "testing-requirements"
            ]
          },
          "description": {
            "type": "string",
            "description": "User-provided constraint description"
          }
        }
      },
      "default": []
    },
    "model": {
      "type": "object",
      "required": ["provider", "name"],
      "properties": {
        "provider": {
          "type": "string",
          "description": "Provider ID (e.g., 'openai', 'claude')"
        },
        "name": {
          "type": "string",
          "description": "Model ID (e.g., 'gpt-4o', 'sonnet')"
        },
        "version": {
          "type": "string",
          "description": "Model version (e.g., '4.5', '2024-01')"
        },
        "displayName": {
          "type": "string",
          "description": "Human-readable name (e.g., 'Sonnet 4.5')"
        }
      }
    },
    "options": {
      "type": "object",
      "properties": {
        "learningMode": {
          "type": "boolean",
          "default": false,
          "description": "Enable learning report generation"
        }
      }
    },
    "uiState": {
      "type": "object",
      "description": "Current UI state for persistence",
      "properties": {
        "inspectorCollapsed": {
          "type": "boolean"
        },
        "theme": {
          "type": "string",
          "enum": ["light", "dark", "system"]
        },
        "lastUpdated": {
          "type": "string",
          "format": "date-time"
        }
      }
    },
    "clarifications": {
      "type": "object",
      "description": "User responses to clarification questions",
      "additionalProperties": true
    }
  }
}
```

### Example Payload
```json
{
  "roughPrompt": "Build a REST API for managing users",
  "promptType": "full-app-build",
  "constraints": [
    {
      "id": "c1",
      "type": "language",
      "description": "Use TypeScript with Express.js"
    },
    {
      "id": "c2",
      "type": "testing-requirements",
      "description": "Include integration tests with supertest"
    }
  ],
  "model": {
    "provider": "claude",
    "name": "sonnet",
    "version": "4.5",
    "displayName": "Sonnet 4.5"
  },
  "options": {
    "learningMode": true
  },
  "uiState": {
    "inspectorCollapsed": false,
    "theme": "dark",
    "lastUpdated": "2026-01-18T10:30:00Z"
  }
}
```

---

## Wireframes & Annotations

### Desktop View (1440px)
```
┌────────────────────────────────────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────────────────────────────────────┐   │
│ │  🔮 PROMPT ASSISTANT                               ◐ Dark  ⚙️ Settings  │   │
│ └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                │
│ ┌─────────────────────────────────────────────────────┐ ┌────────────────────┐│
│ │                                                     │ │ INSPECTOR          ││
│ │                                                     │ │                    ││
│ │   ┌─────────────────────────────────────────────┐   │ │ ▼ Provider & Model ││
│ │   │ 👤 You                          10:30 AM   │   │ │ ┌────────────────┐ ││
│ │   │                                             │   │ │ │ Claude       ▼│ ││
│ │   │ Build me a REST API for user management     │   │ │ └────────────────┘ ││
│ │   │ with authentication                         │   │ │ ┌────────────────┐ ││
│ │   └─────────────────────────────────────────────┘   │ │ │ Sonnet 4.5   ▼│ ││
│ │                                                     │ │ └────────────────┘ ││
│ │   ┌─────────────────────────────────────────────┐   │ │                    ││
│ │   │ 🤖 Assistant                    10:30 AM   │   │ │ ▼ Prompt Type      ││
│ │   │                                             │   │ │ ┌────────────────┐ ││
│ │   │ I need a few clarifications:                │   │ │ │ Full App Build│ ││
│ │   │                                             │   │ │ └────────────────┘ ││
│ │   │ ┌─────────────────────────────────────────┐ │   │ │ Plan & Architect   ││
│ │   │ │ What language/framework?                │ │   │ │ for high-level     ││
│ │   │ │ ○ Node.js  ○ Python  ○ Go  ○ Other     │ │   │ │ system design...   ││
│ │   │ └─────────────────────────────────────────┘ │   │ │                    ││
│ │   │                                             │   │ │ ▼ Constraints (2)  ││
│ │   │ ┌─────────────────────────────────────────┐ │   │ │ ┌────────────────┐ ││
│ │   │ │ Database preference?                    │ │   │ │ │ 🎨 Tone       ││ ││
│ │   │ │ ○ PostgreSQL  ○ MongoDB  ○ MySQL       │ │   │ │ │ Professional   ✕││ ││
│ │   │ └─────────────────────────────────────────┘ │   │ │ └────────────────┘ ││
│ │   │                                             │   │ │ ┌────────────────┐ ││
│ │   │            [Continue →]                     │   │ │ │ 📏 Length     ││ ││
│ │   └─────────────────────────────────────────────┘   │ │ │ Under 1000w   ✕││ ││
│ │                                                     │ │ └────────────────┘ ││
│ │                                                     │ │ [+ Add Constraint] ││
│ │                                                     │ │                    ││
│ │                                                     │ │ ▼ Options          ││
│ │                                                     │ │ ☑ Learning Mode    ││
│ │                                                     │ │ □ Auto-copy result ││
│ │                                                     │ │                    ││
│ │                                                     │ │ [📋 Export JSON]   ││
│ ├─────────────────────────────────────────────────────┤ └────────────────────┘│
│ │ ┌─────────────────────────────────────────────────────────────────────┐    │
│ │ │ Type your rough prompt...                                    [➤]   │    │
│ │ └─────────────────────────────────────────────────────────────────────┘    │
│ └────────────────────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────────────────────┘
```

### Mobile View (375px)
```
┌─────────────────────────────┐
│ 🔮 PROMPT ASSISTANT    [≡]  │
├─────────────────────────────┤
│                             │
│ ┌─────────────────────────┐ │
│ │ 👤 You         10:30 AM │ │
│ │                         │ │
│ │ Build me a REST API     │ │
│ │ for user management...  │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 🤖 Assistant   10:30 AM │ │
│ │                         │ │
│ │ I need clarifications:  │ │
│ │                         │ │
│ │ What language?          │ │
│ │ ○ Node ○ Python ○ Go   │ │
│ │                         │ │
│ │    [Continue →]         │ │
│ └─────────────────────────┘ │
│                             │
│                             │
├─────────────────────────────┤
│ [⚙️ Options]                │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ Type your prompt...     │ │
│ │                    [➤]  │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘

  ↓ [⚙️ Options] opens bottom sheet

┌─────────────────────────────┐
│ ─────                       │  ← Drag handle
│                             │
│ Provider & Model            │
│ ┌─────────────────────────┐ │
│ │ Claude                ▼ │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Sonnet 4.5            ▼ │ │
│ └─────────────────────────┘ │
│                             │
│ Prompt Type                 │
│ ┌─────────────────────────┐ │
│ │ Full App Build        ▼ │ │
│ └─────────────────────────┘ │
│                             │
│ Constraints                 │
│ ┌─────────────────────────┐ │
│ │ 🎨 Tone: Professional ✕ │ │
│ └─────────────────────────┘ │
│ [+ Add Constraint]          │
│                             │
│ ☑ Learning Mode             │
│                             │
│ [📋 Export JSON]            │
└─────────────────────────────┘
```

---

## Design Tokens

### Colors
```css
:root {
  /* Primary palette */
  --color-primary-50: #f0f9ff;
  --color-primary-100: #e0f2fe;
  --color-primary-200: #bae6fd;
  --color-primary-300: #7dd3fc;
  --color-primary-400: #38bdf8;
  --color-primary-500: #0ea5e9;
  --color-primary-600: #0284c7;
  --color-primary-700: #0369a1;
  --color-primary-800: #075985;
  --color-primary-900: #0c4a6e;

  /* Neutral palette */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f8fafc;
  --color-neutral-100: #f1f5f9;
  --color-neutral-200: #e2e8f0;
  --color-neutral-300: #cbd5e1;
  --color-neutral-400: #94a3b8;
  --color-neutral-500: #64748b;
  --color-neutral-600: #475569;
  --color-neutral-700: #334155;
  --color-neutral-800: #1e293b;
  --color-neutral-900: #0f172a;

  /* Semantic colors */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;

  /* Theme variables (light mode default) */
  --bg-primary: var(--color-neutral-0);
  --bg-secondary: var(--color-neutral-50);
  --bg-tertiary: var(--color-neutral-100);
  --bg-inverse: var(--color-neutral-900);
  
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --text-tertiary: var(--color-neutral-400);
  --text-inverse: var(--color-neutral-0);
  
  --border-default: var(--color-neutral-200);
  --border-strong: var(--color-neutral-300);
  
  --accent: var(--color-primary-500);
  --accent-hover: var(--color-primary-600);
  --accent-subtle: var(--color-primary-100);
}

/* Dark mode */
[data-theme="dark"] {
  --bg-primary: var(--color-neutral-900);
  --bg-secondary: var(--color-neutral-800);
  --bg-tertiary: var(--color-neutral-700);
  --bg-inverse: var(--color-neutral-0);
  
  --text-primary: var(--color-neutral-50);
  --text-secondary: var(--color-neutral-400);
  --text-tertiary: var(--color-neutral-500);
  --text-inverse: var(--color-neutral-900);
  
  --border-default: var(--color-neutral-700);
  --border-strong: var(--color-neutral-600);
  
  --accent: var(--color-primary-400);
  --accent-hover: var(--color-primary-300);
  --accent-subtle: var(--color-primary-900);
}
```

### Typography
```css
:root {
  /* Font families */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Font sizes */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */

  /* Font weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  /* Line heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

### Spacing
```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
}
```

### Shadows
```css
:root {
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
```

### Border Radius
```css
:root {
  --radius-sm: 0.25rem;   /* 4px */
  --radius-md: 0.5rem;    /* 8px */
  --radius-lg: 0.75rem;   /* 12px */
  --radius-xl: 1rem;      /* 16px */
  --radius-2xl: 1.5rem;   /* 24px */
  --radius-full: 9999px;
}
```

### Transitions
```css
:root {
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow: 350ms ease;
}
```

---

## Accessibility Guidelines

### Keyboard Navigation
1. **Tab order**: Header → Chat messages → Composer → Inspector panel
2. **Focus visible**: All interactive elements have clear focus indicators
3. **Skip links**: "Skip to main content" link at top
4. **Arrow keys**: Navigate within select menus and radio groups

### Screen Reader Support
1. **ARIA labels**: All buttons and inputs have descriptive labels
2. **Live regions**: Chat messages announced as they arrive
3. **Headings**: Proper heading hierarchy (h1 for title, h2 for sections)
4. **Landmarks**: `<main>`, `<nav>`, `<aside>` used appropriately

### Color & Contrast
1. **Contrast ratio**: Minimum 4.5:1 for normal text, 3:1 for large text
2. **Color independence**: Information not conveyed by color alone
3. **Focus indicators**: 3:1 contrast against adjacent colors

### Motion & Animations
1. **Reduced motion**: Respect `prefers-reduced-motion`
2. **No auto-play**: Animations don't start automatically
3. **Pause controls**: Any motion can be paused

### Forms & Inputs
1. **Labels**: All inputs have visible labels
2. **Error messages**: Descriptive, linked to inputs with `aria-describedby`
3. **Required fields**: Marked with both visual and ARIA indicators

### Component-Specific A11y

#### ChatWindow
```jsx
<div role="log" aria-live="polite" aria-label="Chat conversation">
  {messages.map(message => (
    <article 
      key={message.id}
      aria-label={`${message.role === 'user' ? 'You' : 'Assistant'} said`}
    >
      {message.content}
    </article>
  ))}
</div>
```

#### Composer
```jsx
<label htmlFor="prompt-input" className="sr-only">
  Enter your prompt
</label>
<textarea
  id="prompt-input"
  aria-describedby="prompt-hint"
  aria-invalid={hasError}
/>
<span id="prompt-hint" className="sr-only">
  Press Command+Enter to send
</span>
```

#### ModelSelector
```jsx
<fieldset>
  <legend>Model Selection</legend>
  <label htmlFor="provider-select">Provider</label>
  <select id="provider-select" aria-describedby="provider-status">
    {/* options */}
  </select>
  <span id="provider-status" aria-live="polite">
    {isLoading ? 'Loading models...' : ''}
  </span>
</fieldset>
```

---

## Integration Instructions

### Step 1: Install Dependencies
```bash
cd frontend
npm install @radix-ui/react-select @radix-ui/react-accordion \
  @radix-ui/react-dialog @radix-ui/react-tooltip \
  lucide-react clsx uuid
```

### Step 2: Update Project Structure
```
frontend/src/
├── components/
│   ├── ChatWindow/
│   │   ├── ChatWindow.jsx
│   │   ├── ChatMessage.jsx
│   │   ├── ClarificationCard.jsx
│   │   └── index.js
│   ├── Composer/
│   │   ├── Composer.jsx
│   │   └── index.js
│   ├── Inspector/
│   │   ├── InspectorPanel.jsx
│   │   ├── ModelSelector.jsx
│   │   ├── PromptTypeSelector.jsx
│   │   ├── ConstraintsList.jsx
│   │   └── index.js
│   ├── Header/
│   │   ├── Header.jsx
│   │   └── index.js
│   └── ui/
│       ├── Button.jsx
│       ├── Select.jsx
│       ├── Input.jsx
│       └── index.js
├── hooks/
│   ├── useChat.js
│   ├── useProviders.js
│   ├── useModels.js
│   └── useLocalStorage.js
├── utils/
│   ├── api.js
│   ├── schema.js
│   └── constants.js
├── styles/
│   ├── tokens.css
│   ├── globals.css
│   └── components/
├── App.jsx
└── main.jsx
```

### Step 3: Create API Utilities
```javascript
// src/utils/api.js
const API_BASE = import.meta.env.VITE_API_BASE || '';

export async function fetchProviders() {
  const response = await fetch(`${API_BASE}/providers`);
  if (!response.ok) throw new Error('Failed to fetch providers');
  return response.json();
}

export async function fetchModels(providerId) {
  const response = await fetch(`${API_BASE}/models?provider=${providerId}`);
  if (!response.ok) throw new Error('Failed to fetch models');
  return response.json();
}

export async function improvePrompt(payload) {
  const response = await fetch(`${API_BASE}/improve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Request failed');
  }
  return response.json();
}
```

### Step 4: Create Custom Hooks
```javascript
// src/hooks/useChat.js
import { useState, useCallback } from 'react';
import { improvePrompt } from '../utils/api';
import { v4 as uuid } from 'uuid';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const sendMessage = useCallback(async (payload) => {
    const userMessage = {
      id: uuid(),
      role: 'user',
      content: payload.roughPrompt,
      timestamp: new Date(),
      type: 'message'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      const result = await improvePrompt(payload);
      
      const assistantMessage = {
        id: uuid(),
        role: 'assistant',
        content: result.improved_prompt || '',
        timestamp: new Date(),
        type: result.needs_clarification ? 'clarification' : 'improved-prompt',
        metadata: {
          clarifications: result.clarifications,
          assumptions: result.assumptions,
          learningReport: result.learning_report
        }
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = {
        id: uuid(),
        role: 'system',
        content: error.message,
        timestamp: new Date(),
        type: 'message'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return { messages, isLoading, sendMessage, setMessages };
}
```

### Step 5: Wire Components to Backend

The main App component orchestrates all pieces:

```jsx
// src/App.jsx
import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ChatWindow } from './components/ChatWindow';
import { Composer } from './components/Composer';
import { InspectorPanel } from './components/Inspector';
import { useChat } from './hooks/useChat';
import { useProviders } from './hooks/useProviders';
import { buildPayload, exportPayloadAsJSON } from './utils/schema';

function App() {
  const { messages, isLoading, sendMessage } = useChat();
  const { providers, selectedProvider, setSelectedProvider } = useProviders();
  const [selectedModel, setSelectedModel] = useState('');
  const [promptType, setPromptType] = useState('none');
  const [constraints, setConstraints] = useState([]);
  const [learningMode, setLearningMode] = useState(false);
  const [roughPrompt, setRoughPrompt] = useState('');

  const handleSubmit = () => {
    if (!roughPrompt.trim()) return;
    
    const payload = buildPayload({
      roughPrompt,
      promptType,
      constraints,
      model: { provider: selectedProvider, name: selectedModel },
      options: { learningMode }
    });
    
    sendMessage(payload);
    setRoughPrompt('');
  };

  const handleExportJSON = () => {
    const payload = buildPayload({
      roughPrompt,
      promptType,
      constraints,
      model: { provider: selectedProvider, name: selectedModel },
      options: { learningMode }
    });
    exportPayloadAsJSON(payload);
  };

  return (
    <div className="app-container">
      <Header onExport={handleExportJSON} />
      <main className="main-content">
        <ChatWindow 
          messages={messages} 
          isLoading={isLoading}
        />
        <InspectorPanel
          providers={providers}
          selectedProvider={selectedProvider}
          onProviderChange={setSelectedProvider}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          promptType={promptType}
          onPromptTypeChange={setPromptType}
          constraints={constraints}
          onConstraintsChange={setConstraints}
          learningMode={learningMode}
          onLearningModeChange={setLearningMode}
        />
      </main>
      <Composer
        value={roughPrompt}
        onChange={setRoughPrompt}
        onSubmit={handleSubmit}
        disabled={isLoading}
      />
    </div>
  );
}
```

### Step 6: Backend API Updates

Update the backend `/improve` endpoint to accept the new payload format:

```javascript
// backend/server.js - Updated payload handling
app.post('/improve', async (req, res) => {
  const { 
    roughPrompt,      // New field name
    rough_prompt,     // Legacy support
    promptType,
    constraints,
    model,
    provider,         // Legacy support
    options,
    learning_mode,    // Legacy support
    clarifications 
  } = req.body;

  // Normalize payload for backward compatibility
  const normalizedPayload = {
    provider: model?.provider || provider,
    model: model?.name || req.body.model,
    rough_prompt: roughPrompt || rough_prompt,
    constraints: Array.isArray(constraints) 
      ? constraints.map(c => `${c.type}: ${c.description}`).join('; ')
      : req.body.constraints,
    learning_mode: options?.learningMode ?? learning_mode,
    prompt_type: promptType,
    clarifications
  };

  // Continue with existing logic...
});
```

### Step 7: Testing Checklist

- [ ] Provider dropdown loads and displays all providers
- [ ] Model dropdown updates when provider changes
- [ ] Prompt type selector works and persists selection
- [ ] Constraints can be added, edited, and removed
- [ ] Messages appear in chat window correctly
- [ ] Clarification cards display interactive inputs
- [ ] Learning report renders properly
- [ ] Export JSON generates valid payload
- [ ] Keyboard navigation works throughout
- [ ] Screen reader announces new messages
- [ ] Mobile responsive layout works
- [ ] Dark mode toggle functions correctly

---

## File Structure Summary

```
frontend/
├── UI_SPEC.md                    # This specification
├── src/
│   ├── components/
│   │   ├── ChatWindow/
│   │   │   ├── ChatWindow.jsx
│   │   │   ├── ChatMessage.jsx
│   │   │   ├── ClarificationCard.jsx
│   │   │   └── index.js
│   │   ├── Composer/
│   │   │   ├── Composer.jsx
│   │   │   └── index.js
│   │   ├── Inspector/
│   │   │   ├── InspectorPanel.jsx
│   │   │   ├── ModelSelector.jsx
│   │   │   ├── PromptTypeSelector.jsx
│   │   │   ├── ConstraintsList.jsx
│   │   │   └── index.js
│   │   ├── Header/
│   │   │   ├── Header.jsx
│   │   │   └── index.js
│   │   └── ui/
│   │       ├── Button.jsx
│   │       ├── Select.jsx
│   │       └── index.js
│   ├── hooks/
│   │   ├── useChat.js
│   │   ├── useProviders.js
│   │   └── useLocalStorage.js
│   ├── utils/
│   │   ├── api.js
│   │   ├── schema.js
│   │   └── constants.js
│   ├── styles/
│   │   ├── tokens.css
│   │   ├── globals.css
│   │   └── components.css
│   ├── App.jsx
│   └── main.jsx
└── package.json
```
