# Information Architecture

**Project:** Knowbase — Personal Knowledge Search Engine
**Version:** 1.0 MVP
**Date:** March 2026

---

## 1. Application Structure Overview

Knowbase is a **single-page application (SPA)** with a persistent two-panel shell. The sidebar holds navigation and history; the main content area renders contextual screens based on user state.

```
App Shell
├── Sidebar (persistent, 260px, fixed)
│   ├── Brand Header
│   │   ├── Logo / Brand Icon
│   │   └── New Chat Button [+]
│   ├── Chat Search Bar (filter sessions)
│   ├── Chat History (scrollable, date-grouped)
│   │   ├── Group: TODAY
│   │   │   └── [Chat Item] — title + source count badge
│   │   ├── Group: YESTERDAY
│   │   │   └── [Chat Item]
│   │   └── Group: THIS WEEK
│   │       └── [Chat Item]
│   ├── Documents Section
│   │   └── [Document Item] — name + type badge (PDF/DOCX/TXT)
│   └── User Profile Footer
│       ├── Avatar (initials)
│       └── User Name / Email
│
└── Main Content Area (flex-grow, scrollable)
    ├── Screen: Landing / Empty State
    ├── Screen: Active Chat View
    ├── Screen: Login / Register (auth-only, no sidebar)
    └── Screen: Source Detail Panel (slide-in overlay)
```

---

## 2. Screen Inventory

| Screen ID | Screen Name | Route | Auth Required | Description |
|---|---|---|---|---|
| SCR-001 | Login | `/login` | No | Email + password login form |
| SCR-002 | Register | `/register` | No | New account creation form |
| SCR-003 | Landing / Empty Chat | `/` | Yes | Default view; search centered with suggestions |
| SCR-004 | Active Chat View | `/chat/:chatId` | Yes | Full chat conversation with a document set |
| SCR-005 | Source Detail Panel | overlay | Yes | Slide-in panel showing original chunk text |
| SCR-006 | Document Management | `/documents` (future) | Yes | Grid/list view of all uploaded documents |

---

## 3. Navigation Flow

### 3.1 Primary User Flows

```
[Login/Register]
      ↓
[Landing State - SCR-003]
      ↓ (upload document OR type query)
      ↓
[Active Chat View - SCR-004]
      ↓ (click citation pill)
      ↓
[Source Detail Panel - SCR-005 overlay]
      ↓ (Esc or close)
      ↑ back to Active Chat

[Sidebar: click history item] ──────→ [Active Chat View - SCR-004]
[Sidebar: click New Chat   ] ──────→ [Landing State - SCR-003]
```

### 3.2 Upload Flow (within Active Chat)

```
[Input Bar: click Upload]
      ↓
[Native File Picker]
      ↓
[File appears in input with progress indicator]
      ↓
[User sends message / upload]
      ↓
[Processing pill shows in chat]
      ↓
[Background worker processes document]
      ↓
[✓ Ready — document in sidebar + suggestions below input]
```

### 3.3 Query Flow (RAG)

```
[User types query + sends]
      ↓
[User message bubble appears (optimistic)]
      ↓
[Search status line: "Searching X documents..."]
      ↓
[AI response streams token-by-token]
      ↓
[Citation pills appear below response]
      ↓
[Action buttons: Copy, View Sources]
```

---

## 4. Content Hierarchy

### 4.1 Sidebar — Chat History
- Grouped by recency: TODAY → YESTERDAY → THIS WEEK → [older dates]
- Each item: Chat title (auto-generated) + source count badge
- Active item: primary blue title, `--bg-secondary` background
- Overflow: ellipsis on title at 180px max-width

### 4.2 Sidebar — Documents
- Each document: filename, file type badge (PDF/DOCX/TXT), processing status
- Sorted: most recently uploaded first
- Status states: Processing | Ready | Error

### 4.3 Chat Messages — Order & Structure
Each conversation exchange follows this order:
1. User message bubble (right-aligned)
2. File attachment indicator (if file was uploaded)
3. Search status line
4. AI response (left-aligned, no bubble)
5. Citation pills
6. Action buttons (Copy, View Sources)

---

## 5. UI States

### 5.1 Global States

| State | Trigger | Visual |
|---|---|---|
| Authenticated | Valid JWT | Full app shell visible |
| Unauthenticated | No/expired JWT | Redirected to `/login` |
| Loading | Any async op | Skeleton / spinner |
| Error | API failure | Error banner or toast |
| Offline | No network | Persistent banner: "Connection lost. Retrying..." |

### 5.2 Landing State (SCR-003) States

| State | Condition | What's Shown |
|---|---|---|
| No documents | No docs uploaded | Default static example suggestions |
| Documents present | ≥1 doc ready | AI-generated suggestion pills |
| Processing | File uploaded, processing | "Processing..." pill in suggestion area |

### 5.3 Chat State (SCR-004) States

| Element | Idle | Loading | Error |
|---|---|---|---|
| AI Response | Shows message | Pulsing skeleton blocks | Error message inline |
| Citation Pills | Visible | Hidden until response complete | Hidden |
| Input Bar | Enabled | Disabled during AI response | Enabled (with retry) |

---

## 6. Component Tree (High Level)

```
<App>
├── <AuthProvider>
│   ├── <Router>
│   │   ├── /login        → <LoginPage>
│   │   ├── /register     → <RegisterPage>
│   │   └── /*            → <ProtectedLayout>
│   │       ├── <Sidebar>
│   │       │   ├── <SidebarHeader> (logo + NewChatButton)
│   │       │   ├── <ChatSearchBar>
│   │       │   ├── <ChatHistoryList>
│   │       │   │   └── <ChatHistoryItem> (× N)
│   │       │   ├── <DocumentList>
│   │       │   │   └── <DocumentItem> (× N)
│   │       │   └── <UserProfile>
│   │       └── <MainContent>
│   │           ├── <LandingView> (empty state)
│   │           │   ├── <BrandIcon>
│   │           │   ├── <SearchBar>
│   │           │   └── <SuggestionPills>
│   │           ├── <ChatView> (active chat)
│   │           │   ├── <ChatHeader>
│   │           │   ├── <MessageList>
│   │           │   │   └── <MessageGroup> (× N)
│   │           │   │       ├── <UserMessageBubble>
│   │           │   │       ├── <FileAttachmentIndicator>
│   │           │   │       ├── <SearchStatusLine>
│   │           │   │       ├── <AIResponse>
│   │           │   │       ├── <CitationPills>
│   │           │   │       └── <ActionButtons>
│   │           │   └── <InputBar>
│   │           └── <SourceDetailPanel> (overlay, conditional)
```

---

## 7. URL Structure

| Route | Component | Auth | Notes |
|---|---|---|---|
| `/login` | `<LoginPage>` | Public | Redirect to `/` if authenticated |
| `/register` | `<RegisterPage>` | Public | Redirect to `/` if authenticated |
| `/` | `<LandingView>` | Protected | Default app entry |
| `/chat/:chatId` | `<ChatView>` | Protected | Load chat by ID |
| `/documents` | `<DocumentsPage>` | Protected | Future screen |

---

## 8. Data Flow Summary

| User Action | Frontend Event | API Call | State Update |
|---|---|---|---|
| Upload file | Select file → send | `POST /api/upload` | Add to document list with "Processing" status |
| Send query | Enter/click send | `POST /api/chat` | Add user message; poll for AI response |
| Click suggestion | Auto-populate + send | `POST /api/chat` | Same as send query |
| Click citation | Open panel | `GET /api/chunks/:id` | Show chunk in overlay |
| Start new chat | Click + / Ctrl+N | (local state reset) | Clear main content, deselect history item |
| Navigate history | Click chat item | `GET /api/chat/:chatId` | Load previous chat messages |
