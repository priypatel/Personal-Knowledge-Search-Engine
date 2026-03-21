# Information Architecture

## App Name

Knowbase

---

## Top-Level Structure

```
Knowbase App
├── App Shell
│   ├── Sidebar (persistent, 260px)
│   │   ├── Header
│   │   │   ├── Brand logo
│   │   │   └── New Chat button
│   │   ├── Chat history search bar
│   │   ├── Chat history list (grouped by date)
│   │   │   ├── TODAY
│   │   │   ├── YESTERDAY
│   │   │   └── THIS WEEK
│   │   ├── Documents section
│   │   │   └── Document list (with file type badges)
│   │   └── User profile footer
│   │
│   └── Main Content Area (flex: 1)
│       ├── Landing State (no active chat)
│       └── Active Chat View
```

---

## Screens

### Screen 1 — Landing State (Empty / New Chat)

Shown when no chat is active or user clicks "New Chat".

```
Layout: Centered vertically and horizontally in main area

Content:
  1. Brand icon (48px search magnifier)
  2. Heading: "What do you want to know?"
  3. Subtitle: "Search across your documents..."
  4. Search bar (hero, max-width 520px)
     ├── Text input
     ├── Upload button
     ├── File type pills (PDF, DOCX, TXT — informational)
     └── Send button (disabled when empty)
  5. Quick suggestion pills (from DB, document-specific)
  6. Keyboard hint: "Press / to focus search"
```

Navigation triggers:
- Typing + Enter → transitions to Active Chat View
- Clicking suggestion pill → populates search bar + submits
- Clicking upload button → triggers file picker

---

### Screen 2 — Active Chat View

Shown when a conversation is in progress.

```
Layout: Full-height flex column

Structure:
  ├── Chat header
  │   ├── Conversation title
  │   └── Source count badge
  ├── Message area (scrollable)
  │   ├── [User message bubble]
  │   ├── [File attachment indicator — if file uploaded]
  │   ├── [Search status line: "Searched X docs, found Y chunks"]
  │   ├── [AI response — no bubble, plain text]
  │   ├── [Citation pills row]
  │   └── [Action buttons: Copy, View Sources]
  └── Input bar (pinned bottom)
      ├── Text input
      ├── Upload button
      └── Send button
```

Navigation triggers:
- Clicking citation pill → opens Source Detail Panel
- Clicking "View Sources" → opens Source Detail Panel
- Clicking "Copy" → copies response to clipboard
- Sidebar chat item → loads different conversation

---

### Screen 3 — Source Detail Panel (Future)

Slide-in panel from the right side, triggered by citation click.

```
Content:
  ├── Document name + page/chunk number
  ├── Highlighted text chunk (original content)
  ├── Relevance score indicator
  ├── "Open full document" link
  └── Previous / Next chunk navigation
```

---

### Screen 4 — Document Management (Future)

Grid or list view of all uploaded documents.

```
Content:
  ├── Drag-and-drop upload zone (top)
  ├── Search/filter bar
  └── Document cards
      ├── File name
      ├── File type badge
      ├── Upload date
      ├── Chunk count
      ├── File size
      ├── Delete action (with confirmation modal)
      └── Re-process action
```

---

## Navigation Model

| Action                  | Result                                    |
| ----------------------- | ----------------------------------------- |
| Click "New Chat"        | Clear main area → Landing State           |
| Submit query            | Main area → Active Chat View              |
| Click sidebar chat item | Load that conversation in main area       |
| Click citation pill     | Open Source Detail Panel (slide-in right) |
| Press Esc               | Close panel / blur input                  |
| Press /                 | Focus search bar                          |
| Press Ctrl+N            | New chat                                  |
| Press Ctrl+K            | Focus sidebar search                      |

---

## Content Taxonomy

### Document
- id
- name
- file type (PDF / DOCX / TXT)
- upload date
- processing status (uploading / processing / ready / failed)

### Chunk
- id
- parent document
- text content
- vector embedding

### Suggestion
- id
- parent document
- question text

### Chat / Conversation
- id
- title (derived from first message)
- date created
- messages[]

### Message
- id
- role (user / assistant)
- content text
- sources[] (citation references)
- timestamp

---

## Component Hierarchy

```
App
└── AppShell
    ├── Sidebar
    │   ├── SidebarHeader
    │   │   ├── BrandLogo
    │   │   └── NewChatButton
    │   ├── ChatHistorySearch
    │   ├── ChatHistoryList
    │   │   └── ChatHistoryItem (×n)
    │   ├── DocumentList
    │   │   └── DocumentItem (×n) + FileTypeBadge
    │   └── UserProfile + Avatar
    │
    └── MainContent
        ├── LandingView
        │   ├── SearchBar
        │   │   ├── TextInput
        │   │   ├── UploadButton
        │   │   ├── FileTypePills
        │   │   └── SendButton
        │   └── SuggestionPills (×n)
        │
        └── ChatView
            ├── ChatHeader
            ├── MessageArea
            │   └── MessageGroup (×n)
            │       ├── MessageBubble (user)
            │       ├── FileAttachmentIndicator
            │       ├── SearchStatus
            │       ├── AIResponse
            │       ├── CitationPills (×n)
            │       └── ActionButtons
            └── InputBar (SearchBar variant)
```

---

## Responsive Breakpoints

| Breakpoint | Layout                                              |
| ---------- | --------------------------------------------------- |
| >= 1024px  | Full layout: 260px sidebar + flex-grow main area    |
| 768-1023px | Sidebar collapses to 40px icon-only strip           |
| < 768px    | Sidebar as slide-over drawer; main area full-width  |
