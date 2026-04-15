# Web3Forum — Rich Text Composer (TextEditor) Reference

## Overview

The composer is a ProseKit-based rich text editor (`prosekit ^0.14.2`) built on ProseMirror. It stores content as HTML internally and converts to/from Markdown for persistence. It was originally more feature-rich — some features (task lists, toggle lists, emoji picker) were commented out or removed over time.

---

## Architecture

```
TextEditor (components/editor/text-editor.tsx)
├── Toolbar              — top formatting bar
├── ProseMirror div      — editable content area
├── InlineMenu           — floating format bar on text selection
├── SlashMenu            — "/" command palette
├── BlockHandle          — drag handle + add block button
├── TableHandle          — column/row manipulation handles
└── MentionPicker        — @mention autocomplete popover
```

### Data Flow

1. User types in ProseMirror editor
2. `useDocChange` fires on every change
3. HTML extracted via `editor.getDocHTML()`
4. Converted to Markdown via `markdownFromHTML()` (unified pipeline)
5. Markdown string passed to parent via `onChange(markdown)`
6. On load, `initialValue` (markdown) → `htmlFromMarkdown()` → `jsonFromHTML()` → editor content

---

## Feature List — Full Capabilities

### 1. Toolbar (Top Bar)

All buttons with active state highlighting and disabled state:

| Feature            | Icon            | Command                          |
|--------------------|-----------------|----------------------------------|
| Undo               | Undo2           | `editor.commands.undo`           |
| Redo               | Redo2           | `editor.commands.redo`           |
| Bold               | Bold            | `editor.commands.toggleBold`     |
| Italic             | Italic          | `editor.commands.toggleItalic`   |
| Underline          | Underline       | `editor.commands.toggleUnderline`|
| Strikethrough      | Strikethrough   | `editor.commands.toggleStrike`   |
| Inline Code        | Code            | `editor.commands.toggleCode`     |
| Code Block         | SquareCode      | `editor.commands.insertCodeBlock`|
| Heading 1          | Heading1        | `editor.commands.toggleHeading({level:1})` |
| Heading 2          | Heading2        | `editor.commands.toggleHeading({level:2})` |
| Heading 3          | Heading3        | `editor.commands.toggleHeading({level:3})` |
| Horizontal Rule    | Minus           | `editor.commands.insertHorizontalRule` |
| Bullet List        | List            | `editor.commands.toggleList({kind:"bullet"})` |
| Ordered List       | ListOrdered     | `editor.commands.toggleList({kind:"ordered"})` |
| Task List          | ListChecks      | `editor.commands.toggleList({kind:"task"})` |
| Toggle List        | ListCollapse    | `editor.commands.toggleList({kind:"toggle"})` |
| Indent             | IndentIncrease  | `editor.commands.indentList`     |
| Dedent             | IndentDecrease  | `editor.commands.dedentList`     |
| Insert Image       | Image           | Opens ImageUploadPopover         |

### 2. Inline Menu (Floating on Selection)

Appears when text is selected. Provides:

- Bold, Italic, Underline, Strikethrough, Inline Code
- Link insertion/editing (with URL input popover)
- Link removal button when link is active

### 3. Slash Menu (`/` Commands)

Triggered by typing `/` at the start of a line or after whitespace:

| Command        | Shortcut | Action                                    |
|----------------|----------|-------------------------------------------|
| Text           | —        | `setParagraph()`                          |
| Heading 1      | `#`      | `setHeading({level:1})`                   |
| Heading 2      | `##`     | `setHeading({level:2})`                   |
| Heading 3      | `###`    | `setHeading({level:3})`                   |
| Bullet list    | `-`      | `wrapInList({kind:"bullet"})`             |
| Ordered list   | `1.`     | `wrapInList({kind:"ordered"})`            |
| Quote          | `>`      | `setBlockquote()`                         |
| Table          | —        | `insertTable({row:3, col:3})`             |
| Divider        | `---`    | `insertHorizontalRule()`                  |
| Code           | ` ``` `  | `setCodeBlock()`                          |

**Commented out (were available before):**
- Task list (`[]` shortcut)
- Toggle list (`>>` shortcut)

### 4. @Mention System

- Triggered by typing `@` followed by characters
- Debounced search (300ms) against Lens Protocol accounts API
- Shows up to 5 results with avatar, name, username
- Inserts `<span data-mention="user" data-id="address">@lens/username</span>`
- On render, mentions display as blue links with hover popover showing profile info (avatar, bio, followers, following, join date)
- Mention popover fetches live profile data on hover

### 5. Image Upload

Two methods:
- **Toolbar button** → opens popover with file input → uploads to Grove storage → inserts image node
- **Paste/Drop** → intercepts image files → uploads to Grove → inserts at cursor/drop position

Image features:
- Resizable via drag handle (bottom-right corner)
- Upload progress indicator (percentage)
- Error state with "Failed to upload" message
- Uses Next.js `<Image>` component for rendering
- Uploads to Grove (Lens decentralized storage) via `@lens-chain/storage-client`

### 6. Code Blocks

- Syntax highlighting via Shiki (bundled languages)
- Language selector dropdown (appears on hover)
- All Shiki bundled languages available
- Custom `CodeBlockView` React node view

### 7. Block Handle

- Appears on hover at the left of blocks
- `+` button to add new block
- Grip icon for drag-and-drop reordering

### 8. Table Editing

Full table manipulation via handles:
- Insert column left/right
- Insert row above/below
- Delete column/row
- Clear cell contents
- Column and row drag handles

---

## Extensions Registered (`extension.ts`)

```typescript
defineBasicExtension()        // Bold, italic, underline, strike, code, headings, lists, blockquote, links, images
definePlaceholder()           // "Press / for commands..."
defineMention()               // @mention support
defineCodeBlock()             // Code blocks
defineCodeBlockShiki()        // Syntax highlighting
defineHorizontalRule()        // --- dividers
defineReactNodeView("codeBlock")  // Custom code block with language selector
defineReactNodeView("image")      // Custom image with resize
defineImageFileHandlers()     // Paste/drop image upload
```

---

## Markdown ↔ HTML Pipeline

### HTML → Markdown (`markdownFromHTML`)

```
rehypeParse → rehypeJoinParagraph → rehypeMentionToMarkdownLink → rehypeRemark → remarkGfm → remarkLinkProtocol → remarkStringify
```

Custom transformers:
- `rehypeJoinParagraph`: Merges consecutive non-empty `<p>` tags with `<br>` between them
- `rehypeMentionToMarkdownLink`: Converts `<span data-mention="user">` to `[@username](mention:user:account)` markdown links
- `remarkLinkProtocol`: Adds `https://` to bare URLs
- Custom break handler: Converts `\\\n` to just `\n`
- Underscore unescaping for mention usernames

### Markdown → HTML (`htmlFromMarkdown`)

```
remarkParse → remarkGfm → remarkHtml
```

---

## Editor Styling (`text-editor.css`)

ProseMirror-specific styles:
- Lists: disc/decimal with proper padding and margins
- Headings: h1 (2rem), h2 (1.5rem), h3 (1.25rem) with tight letter-spacing
- Colors: `#18181b` (slate-900) for headings

---

## Editor Container Styling

```tsx
<div className="box-border flex h-full min-h-36 w-full flex-col overflow-x-hidden overflow-y-hidden
                rounded-2xl border border-brand-200/40 bg-gray-50/80 ring-offset-background
                backdrop-blur-sm focus-within:ring-2 focus-within:ring-brand-200/40
                focus-within:ring-offset-2 dark:border-gray-700/60 dark:bg-slate-800/90">
```

Key visual properties:
- `rounded-2xl` border radius
- Semi-transparent brand border
- Glass effect with `backdrop-blur-sm`
- Focus ring on interaction
- Min height of 9rem (36 in Tailwind = 144px)

---

## Where the Editor Is Used

| Context                    | Component                          | Features Used                |
|----------------------------|------------------------------------|------------------------------|
| Create thread              | `thread-create-form.tsx`           | Full editor                  |
| Edit thread                | `thread-edit-form.tsx`             | Full editor + initialValue   |
| Reply to thread            | `thread-reply-box.tsx`             | Full editor                  |
| Reply in thread card       | `thread-card-reply-box.tsx`        | Full editor (via reply-box)  |
| Board post creation        | `board-post-create-form.tsx`       | Full editor                  |
| Board reply                | `board-reply-box.tsx`              | Full editor + key reset      |
| Research reply             | `research-reply-editor.tsx`        | Full editor + initialValue   |
| Research topic creation    | `research-topic-create-form.tsx`   | Full editor                  |

---

## Content Rendering (Read-Only Display)

`ContentRenderer` component (`components/shared/content-renderer.tsx`):
- Uses `react-markdown` with `remark-breaks` and `remark-gfm`
- Custom paragraph renderer that detects `@lens/username` patterns and renders `<Mention>` components
- Mention component links to `/u/{username}` with hover popover
- Supports image and video media attachments
- Styled via `.rich-text-content` CSS class

---

## Features That Were Removed or Disabled

Based on git history and commented-out code:

1. **Task list in slash menu** — commented out (`// <SlashMenuItem label="Task list" ...>`)
2. **Toggle list in slash menu** — commented out (`// <SlashMenuItem label="Toggle list" ...>`)
3. **Emoji picker** — `emojis.ts` exists with full emoji list but no picker UI component is wired up
4. **Tiptap** — dependencies still in `package.json` (`@tiptap/react`, `@tiptap/starter-kit`, etc.) but the app uses ProseKit; these are likely leftover from a migration
5. **URL-based image insertion** — `ImageUploadPopover` was simplified to file upload only (URL input removed per commit `116030d`)

---

## Dependencies for the Composer

```json
{
  "prosekit": "^0.14.2",
  "react-markdown": "^10.1.0",
  "remark-breaks": "^4.0.0",
  "remark-gfm": "^4.0.1",
  "remark-html": "^16.0.1",
  "remark-parse": "^11.0.0",
  "remark-stringify": "^11.0.0",
  "rehype-parse": "^9.0.1",
  "rehype-remark": "^10.0.1",
  "unified": "^11.0.5",
  "unist-util-visit": "^5.0.0",
  "unist-util-visit-parents": "^6.0.1",
  "mdast-util-to-markdown": "^2.1.2",
  "@lens-chain/storage-client": "^1.0.5"
}
```

Note: `@lens-chain/storage-client` is for Grove image uploads — replace with your own storage solution in the other project.

---

## Feature Checklist for Other Project

Use this as a development checklist:

- [ ] Rich text editor with ProseMirror/ProseKit
- [ ] Toolbar: bold, italic, underline, strikethrough, inline code
- [ ] Toolbar: code block, headings (1-3), horizontal rule
- [ ] Toolbar: bullet list, ordered list, task list, toggle list
- [ ] Toolbar: indent/dedent
- [ ] Toolbar: image upload
- [ ] Inline floating menu on text selection
- [ ] Link insertion and editing via inline menu
- [ ] Slash command menu (`/`)
- [ ] @mention with search autocomplete
- [ ] Mention hover popover with profile info
- [ ] Image paste and drag-and-drop upload
- [ ] Image resize handles
- [ ] Code block with syntax highlighting (Shiki)
- [ ] Code block language selector
- [ ] Block drag handle for reordering
- [ ] Table insertion and editing (add/delete rows/columns)
- [ ] Markdown ↔ HTML bidirectional conversion
- [ ] GFM support (tables, strikethrough, task lists)
- [ ] Emoji support (list exists, picker UI needed)
- [ ] Content renderer for read-only display with mention parsing
- [ ] Dark mode support throughout
