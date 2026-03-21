# Knowbase — UI Design System & Pattern Guide

> A living reference for building the Knowbase frontend. Every component, color, spacing decision, and interaction pattern lives here. Follow this doc to keep the UI consistent across screens and contributors.

---

## 1. Design Philosophy

Knowbase follows a **clean, flat, minimal** aesthetic inspired by modern AI chat interfaces (Claude, ChatGPT, Perplexity). The goal is to feel like a native tool developers already trust — not a flashy demo.

**Core principles:**

- **Content first** — UI should disappear; the search results and citations are the product.
- **Flat surfaces** — No gradients, no drop shadows, no glow effects. Use 0.5px borders and subtle background shifts for depth.
- **Intentional whitespace** — Generous padding and spacing. Don't cram. Let content breathe.
- **Developer-centric** — Assume the user is technical. No hand-holding UI, no excessive tooltips. Keep it fast and keyboard-friendly.
- **Single-task focus** — Each screen does one thing well. Search, read, upload. No feature overload.

---

## 2. Color System

### 2.1 Primary Color

| Token             | Value                     | Usage                                                                        |
| ----------------- | ------------------------- | ---------------------------------------------------------------------------- |
| `--primary`       | `#2563EB` (Electric Blue) | Send button, active states, user message bubble, avatar, links, brand accent |
| `--primary-light` | `#E6F1FB`                 | Citation pill background, light hover states, selected item tint             |
| `--primary-dark`  | `#0C447C`                 | Citation pill text, pressed states                                           |

### 2.2 Neutral Palette

| Token              | Role                         | Light Mode         | Dark Mode                |
| ------------------ | ---------------------------- | ------------------ | ------------------------ |
| `--bg-primary`     | Card/sidebar backgrounds     | `#FFFFFF`          | `#1A1A1A`                |
| `--bg-secondary`   | Page background, input fills | `#F5F5F4`          | `#111111`                |
| `--bg-tertiary`    | Hover states, badges         | `#EDEDED`          | `#2A2A2A`                |
| `--text-primary`   | Headings, body text          | `#1A1A1A`          | `#F5F5F4`                |
| `--text-secondary` | Labels, subtitles            | `#6B6B6B`          | `#A0A0A0`                |
| `--text-tertiary`  | Placeholders, hints          | `#9B9B9B`          | `#666666`                |
| `--border-default` | Dividers, card borders       | `rgba(0,0,0,0.15)` | `rgba(255,255,255,0.12)` |
| `--border-hover`   | Input focus, hovered borders | `rgba(0,0,0,0.30)` | `rgba(255,255,255,0.25)` |

### 2.3 Semantic / File Type Colors

| Purpose            | Background  | Text      | Use Case                           |
| ------------------ | ----------- | --------- | ---------------------------------- |
| PDF tag            | `#F0997B33` | `#993C1D` | File type badge in sidebar         |
| DOCX tag           | `#85B7EB33` | `#185FA5` | File type badge in sidebar         |
| TXT tag            | `#97C45933` | `#3B6D11` | File type badge in sidebar         |
| Cross-doc citation | `#E1F5EE`   | `#085041` | Citation pill for different source |
| Error              | `#FCEBEB`   | `#A32D2D` | Upload failure, search error       |
| Success            | `#EAF3DE`   | `#3B6D11` | Upload complete, processing done   |
| Warning            | `#FAEEDA`   | `#854F0B` | File size warning, rate limit      |

**Rule:** Never use raw hex in components. Always reference design tokens. This ensures dark mode compatibility and easy theming.

---

## 3. Typography

### 3.1 Font Stack

```css
--font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", "Consolas", monospace;
```

> Use `font-sans` for all UI. Use `font-mono` only for code snippets, file paths, and keyboard shortcuts.

### 3.2 Type Scale

| Element                    | Size | Weight     | Line Height | Token          |
| -------------------------- | ---- | ---------- | ----------- | -------------- |
| Page heading               | 22px | 500        | 1.3         | `--text-xl`    |
| Section heading            | 16px | 500        | 1.4         | `--text-lg`    |
| Body / messages            | 14px | 400        | 1.7         | `--text-base`  |
| Labels / sidebar items     | 13px | 400 or 500 | 1.4         | `--text-sm`    |
| Captions / hints           | 12px | 400        | 1.4         | `--text-xs`    |
| Badges / pills             | 11px | 500        | 1.2         | `--text-2xs`   |
| Section labels (uppercase) | 11px | 500        | 1.2         | `--text-label` |

### 3.3 Typography Rules

- **Two weights only:** 400 (regular) and 500 (medium). Never use 600 or 700 — they look heavy in this flat aesthetic.
- **Sentence case everywhere.** Never Title Case, never ALL CAPS except for section labels in the sidebar (e.g., "TODAY", "DOCUMENTS").
- **No font size below 11px.** Accessibility baseline.
- **Line height 1.7 for body text.** This is non-negotiable for readability in AI responses.

---

## 4. Spacing & Layout

### 4.1 Spacing Scale

| Token         | Value | Usage                                |
| ------------- | ----- | ------------------------------------ |
| `--space-xs`  | 4px   | Icon-to-text gap inside pills        |
| `--space-sm`  | 8px   | Between sidebar items, between pills |
| `--space-md`  | 12px  | Section padding, card internal gaps  |
| `--space-lg`  | 16px  | Sidebar padding, input padding       |
| `--space-xl`  | 24px  | Chat message area padding            |
| `--space-2xl` | 32px  | Between heading and search bar       |
| `--space-3xl` | 40px  | Main content area padding            |

### 4.2 Border Radius

| Token           | Value | Usage                                       |
| --------------- | ----- | ------------------------------------------- |
| `--radius-sm`   | 4px   | Keyboard shortcut hints, tiny badges        |
| `--radius-md`   | 8px   | Buttons, pills, sidebar items, input fields |
| `--radius-lg`   | 12px  | Cards, panels                               |
| `--radius-xl`   | 16px  | Search input bar, chat message bubbles      |
| `--radius-full` | 50%   | Avatars, send button                        |

### 4.3 Layout Structure

```
┌──────────────────────────────────────────────────┐
│ App Shell                                        │
│ ┌─────────┬──────────────────────────────────┐   │
│ │ Sidebar │  Main Content Area               │   │
│ │  260px  │  flex: 1                         │   │
│ │         │                                  │   │
│ │ fixed   │  scrollable                      │   │
│ │ width   │                                  │   │
│ └─────────┴──────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

- **Sidebar:** Fixed 260px width. Never collapses on desktop. On mobile (<768px), becomes a slide-over drawer.
- **Main area:** Flex-grow. Contains either the landing state (centered) or the chat view (full height flex column).
- **Total min-width:** 900px desktop. Below that, switch to mobile layout.

---

## 5. Component Library

### 5.1 Sidebar

```
Structure:
├── Header (brand logo + new chat button)
├── Search bar (filter chats)
├── Chat history (scrollable, grouped by date)
├── Documents section (file list with type badges)
└── User profile footer
```

**Chat history item states:**

| State           | Background       | Text Color               | Border |
| --------------- | ---------------- | ------------------------ | ------ |
| Default         | transparent      | `--text-primary`         | none   |
| Hover           | `--bg-secondary` | `--text-primary`         | none   |
| Active/Selected | `--bg-secondary` | `--primary` (title only) | none   |

**Date group labels:** Uppercase, 11px, weight 500, color `--text-tertiary`, 0.5px letter spacing. Examples: "TODAY", "YESTERDAY", "THIS WEEK".

**Document type badges:** Rounded rectangle (3px radius), 11px font, weight 500. Background and text colors per file type (see Section 2.3).

### 5.2 Search / Input Bar

The search bar is the hero component. It handles both text queries and file uploads in a single interface.

```
┌─────────────────────────────────────────────────┐
│ Ask anything about your documents...            │
│                                                 │
│ [📤 Upload] [PDF] [DOCX] [TXT]          (⬆)   │
└─────────────────────────────────────────────────┘
```

**Specs:**

| Property         | Value                        |
| ---------------- | ---------------------------- |
| Border           | 0.5px solid `--border-hover` |
| Border radius    | 16px (`--radius-xl`)         |
| Padding          | 12px 16px                    |
| Background       | `--bg-primary`               |
| Placeholder text | 14px, `--text-tertiary`      |

**Upload button:** Outlined, 12px text, `--border-default` border, `--radius-md`. Icon + text.

**File type pills:** 11px, `--text-tertiary`, `--bg-secondary` background, 10px radius. These are informational — not clickable.

**Send button:** 32px circle, `--primary` background, white arrow icon. Disabled state at 40% opacity when input is empty.

### 5.3 Chat Messages

**User message bubble:**

| Property      | Value                                     |
| ------------- | ----------------------------------------- |
| Background    | `--primary` (`#2563EB`)                   |
| Text color    | `#FFFFFF`                                 |
| Border radius | 16px 16px 4px 16px (squared bottom-right) |
| Max width     | 420px                                     |
| Padding       | 12px 16px                                 |
| Font size     | 14px                                      |
| Alignment     | Right-aligned (flex-end)                  |

**AI response (no bubble):**

| Property    | Value              |
| ----------- | ------------------ |
| Background  | none (transparent) |
| Text color  | `--text-primary`   |
| Max width   | 520px              |
| Padding     | none               |
| Font size   | 14px               |
| Line height | 1.7                |
| Alignment   | Left-aligned       |

**Search status indicator:** Shows above AI response. 12px text, `--primary` color. Includes a subtle animated circle icon. Format: "Searched X documents, found Y relevant chunks".

### 5.4 Citation Pills

Citations appear below each AI response as inline clickable pills.

```
[1  react-patterns.pdf, p.12] [2  react-patterns.pdf, p.24] [3  system-design-notes.docx]
```

**Specs:**

| Property          | Value    |
| ----------------- | -------- |
| Padding           | 4px 10px |
| Border radius     | 6px      |
| Font size         | 11px     |
| Gap between pills | 6px      |

**Color logic:**

- Same-document citations use primary blue: background `#E6F1FB`, number `#2563EB`, text `#0C447C`.
- Cross-document citations use teal: background `#E1F5EE`, number `#0F6E56`, text `#085041`.
- This color distinction helps the user instantly see if the answer draws from one or multiple sources.

**On click:** Opens a source detail panel (slide-in from right) or highlights the relevant chunk.

### 5.5 File Upload Indicator

Shows below user message when a file is attached.

```
[📤 react-patterns.pdf uploaded]
```

| Property      | Value                             |
| ------------- | --------------------------------- |
| Background    | `--bg-primary`                    |
| Border        | 0.5px solid `--border-default`    |
| Border radius | `--radius-md`                     |
| Font size     | 11px                              |
| Text color    | `--text-secondary`                |
| Alignment     | Right-aligned (below user bubble) |

### 5.6 Quick Suggestion Pills

Appear below the search bar on the landing screen. Prompt the user with example queries.

| Property      | Value                                         |
| ------------- | --------------------------------------------- |
| Padding       | 6px 14px                                      |
| Border        | 0.5px solid `--border-default`                |
| Border radius | 20px (pill shape)                             |
| Font size     | 12px                                          |
| Text color    | `--text-secondary`                            |
| Hover         | Background `--bg-secondary`                   |
| On click      | Populates search bar with the suggestion text |

### 5.7 Action Buttons (Copy, View Sources)

Appear below AI responses. Icon + label, no border, no background.

| Property              | Value                                     |
| --------------------- | ----------------------------------------- |
| Icon size             | 14px                                      |
| Icon color            | `--text-tertiary`                         |
| Text size             | 11px                                      |
| Text color            | `--text-tertiary`                         |
| Gap (icon to text)    | 4px                                       |
| Gap (between actions) | 12px                                      |
| Hover                 | Text and icon shift to `--text-secondary` |

### 5.8 New Chat Button

Located in the sidebar header. A square icon button.

| Property      | Value                               |
| ------------- | ----------------------------------- |
| Size          | 28px x 28px                         |
| Border        | 0.5px solid `--border-default`      |
| Border radius | `--radius-md`                       |
| Icon          | Plus sign, 14px, `--text-secondary` |
| Hover         | Background `--bg-secondary`         |

### 5.9 User Avatar

Circular with initials. Used in sidebar footer.

| Property   | Value                                       |
| ---------- | ------------------------------------------- |
| Size       | 30px (sidebar), 32px (if used elsewhere)    |
| Background | `--primary`                                 |
| Text       | White, 12px, weight 500, uppercase initials |
| Shape      | Circle (`--radius-full`)                    |

---

## 6. Screen Specifications

### 6.1 Landing State (Empty Chat)

The default view when no chat is active or when the user clicks "New Chat".

```
Layout: Centered vertically and horizontally in the main area.

Components:
  1. Brand icon (48px SVG, search magnifier with primary tint)
  2. Heading: "What do you want to know?" — 22px, weight 500
  3. Subtitle: "Search across your documents..." — 14px, --text-secondary
  4. Search bar (hero, full width of center column, max-width 520px)
  5. Quick suggestion pills (centered, wrapping)
  6. Keyboard hint at absolute bottom: "Press / to focus search"
```

**Spacing:**

- Icon to heading: 24px
- Heading to subtitle: 6px
- Subtitle to search bar: 32px
- Search bar to suggestions: 16px

### 6.2 Active Chat View

The view when a conversation is in progress.

```
Layout: Full-height flex column.

Structure:
├── Chat header (title + source count badge)
├── Message area (scrollable, flex-grow)
│   ├── User message (right-aligned bubble)
│   ├── File attachment indicator
│   ├── Search status line
│   ├── AI response (left-aligned, no bubble)
│   ├── Citation pills
│   └── Action buttons
└── Input bar (pinned to bottom)
```

**Chat header:**

- Height: auto, padding 12px 24px
- Bottom border: 0.5px solid `--border-default`
- Title: 14px, weight 500
- Source count: 11px badge, `--bg-secondary` background, 10px radius

**Message area padding:** 24px all sides. Messages spaced 20px apart.

**Input bar:** Same specs as the landing search bar, but placeholder says "Follow up or ask something new..."

### 6.3 Document Management (Future Screen)

A grid or list view of all uploaded documents. Include these elements:

- File cards with: name, type badge, upload date, chunk count, file size
- Drag-and-drop upload zone
- Delete action (with confirmation)
- Re-process action (re-chunk and re-embed)
- Search/filter bar for documents

### 6.4 Source Detail Panel (Future Screen)

A slide-in panel from the right when a citation pill is clicked.

- Shows the original text chunk highlighted
- Document name and page number at the top
- "Open full document" link
- Previous/next chunk navigation
- Relevance score indicator

---

## 7. Interaction Patterns

### 7.1 Keyboard Shortcuts

| Shortcut        | Action                          |
| --------------- | ------------------------------- |
| `/`             | Focus the search bar            |
| `Ctrl + N`      | New chat                        |
| `Ctrl + K`      | Search chat history             |
| `Enter`         | Send message                    |
| `Shift + Enter` | Newline in input                |
| `Esc`           | Close source panel / blur input |

### 7.2 Loading States

**Document upload:**

1. File appears in input bar with a progress indicator
2. "Processing..." pill replaces file type pills
3. On complete: checkmark + "Ready to search"

**Search/query:**

1. User message appears immediately (optimistic)
2. Animated search status line: "Searching X documents..."
3. AI response streams in token-by-token
4. Citation pills appear after response completes

**Skeleton states:** Use pulsing `--bg-secondary` blocks for AI response placeholder. Three lines at varying widths (100%, 85%, 60%).

### 7.3 Error States

| Error            | Display                                                                                       |
| ---------------- | --------------------------------------------------------------------------------------------- |
| Upload fails     | Red-tinted file indicator: "Upload failed — retry"                                            |
| No results found | Inline message: "No relevant results in your documents. Try rephrasing or upload more files." |
| Processing error | Toast notification at top-right, auto-dismiss in 5s                                           |
| Network error    | Persistent banner below chat header: "Connection lost. Retrying..."                           |

### 7.4 Empty States

| Screen                    | Empty State                                                              |
| ------------------------- | ------------------------------------------------------------------------ |
| Chat history (no chats)   | "No conversations yet. Ask your first question."                         |
| Documents (none uploaded) | "Upload your first document to get started." with a centered upload zone |
| Search results (no match) | "Nothing found. Try a different question or upload more files."          |

---

## 8. Responsive Behavior

### 8.1 Breakpoints

| Breakpoint   | Behavior                                                                                     |
| ------------ | -------------------------------------------------------------------------------------------- |
| >= 1024px    | Full layout: sidebar + main content                                                          |
| 768px–1023px | Sidebar collapses to icon-only (40px). Expand on hover or hamburger click.                   |
| < 768px      | Sidebar becomes a slide-over drawer. Main content is full-width. Input bar sticks to bottom. |

### 8.2 Mobile Adaptations

- Search bar: Full width with reduced padding (10px 12px)
- User bubbles: Max-width 85% of screen
- AI responses: Full width, no max-width constraint
- Citation pills: Horizontally scrollable row if they overflow
- Suggestion pills: Vertical stack instead of horizontal wrap

---

## 9. Animation & Motion

Keep motion minimal and functional. No decorative animations.

| Element               | Animation                  | Duration | Easing      |
| --------------------- | -------------------------- | -------- | ----------- |
| Sidebar item hover    | Background fade-in         | 150ms    | ease-out    |
| Send button press     | Scale to 0.95              | 100ms    | ease-in-out |
| Source panel slide-in | translateX(100%) to 0      | 250ms    | ease-out    |
| Toast notification    | Fade in + slide down 8px   | 200ms    | ease-out    |
| Citation pill hover   | Background darkens 10%     | 150ms    | ease-out    |
| AI response streaming | Token-by-token text append | --       | --          |
| Search status spinner | Continuous rotation        | 1000ms   | linear      |

**Rule:** No animation should exceed 300ms. If it feels sluggish, it's too slow.

---

## 10. Accessibility

- All interactive elements must have visible focus rings (`outline: 2px solid --primary, offset 2px`).
- Color contrast ratio must meet WCAG AA (4.5:1 for body text, 3:1 for large text).
- All icons must have `aria-label` or be paired with visible text.
- The chat message area must use `role="log"` and `aria-live="polite"` for screen readers.
- File upload must support both click-to-upload and drag-and-drop.
- Keyboard navigation must work for all core flows: new chat, search, send message, navigate history.

---

## 11. Do's and Don'ts

### Do

- Use 0.5px borders for all dividers and card edges
- Keep the sidebar clean — chat title + source count, nothing more
- Let AI responses render without a bubble/card — raw text feels more natural
- Group citation pills by document using color coding
- Use the primary blue sparingly — it should draw the eye to actions (send, active chat)

### Don't

- Don't use gradients, shadows, or glow effects anywhere
- Don't use font weight above 500
- Don't add borders AND background fills to the same element (pick one for depth)
- Don't put more than 3 action buttons below an AI response
- Don't auto-play animations or use motion for decoration
- Don't use icons without labels (except the send button and new chat button which are universally understood)
- Don't use placeholder text as a label — always have a clear label or contextual hint

---

## 12. Tech Stack Reference

| Layer      | Tool                     | Notes                                           |
| ---------- | ------------------------ | ----------------------------------------------- |
| Framework  | React 18+                | Functional components, hooks only               |
| Styling    | Tailwind CSS             | Use `@apply` sparingly, prefer utility classes  |
| Icons      | Lucide React             | Consistent 1.5px stroke weight, 16px default    |
| Animations | CSS transitions          | No JS animation libraries needed for this scope |
| State      | React Context or Zustand | Keep it simple, no Redux                        |
| Routing    | React Router v6          | Sidebar doesn't change between routes           |
| Fonts      | Inter (Google Fonts)     | Weight 400 and 500 only                         |
| Monospace  | JetBrains Mono           | For code snippets in AI responses               |

---

## 13. File Structure Convention

```
src/
├── components/
│   ├── sidebar/
│   │   ├── Sidebar.tsx
│   │   ├── ChatHistoryItem.tsx
│   │   ├── DocumentList.tsx
│   │   └── UserProfile.tsx
│   ├── chat/
│   │   ├── ChatView.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── AIResponse.tsx
│   │   ├── CitationPill.tsx
│   │   ├── SearchStatus.tsx
│   │   └── ActionButtons.tsx
│   ├── search/
│   │   ├── SearchBar.tsx
│   │   ├── SuggestionPills.tsx
│   │   └── LandingView.tsx
│   └── shared/
│       ├── Badge.tsx
│       ├── Avatar.tsx
│       ├── IconButton.tsx
│       └── Toast.tsx
├── styles/
│   └── tokens.css          # All CSS custom properties
├── hooks/
│   ├── useSearch.ts
│   ├── useChat.ts
│   └── useUpload.ts
└── types/
    ├── chat.ts
    ├── document.ts
    └── search.ts
```

---
