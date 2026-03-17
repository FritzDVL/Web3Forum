# Composer & TextEditor Improvements

**Date:** March 17, 2026
**Status:** Reference document — improvements to implement alongside or after Research section

---

## 1. Current State

### Stack
- **ProseKit** v0.14.2 — React wrapper around ProseMirror
- **Location:** `components/editor/`
- **Used by:** Board reply boxes, Thread reply boxes, Post creation forms — same component everywhere

### What the editor supports today

**Toolbar buttons:**
Undo, Redo, Bold, Italic, Underline, Strikethrough, Inline Code, Code Block (Shiki syntax highlighting), H1, H2, H3, Horizontal Rule, Bullet List, Ordered List, Task List, Toggle List, Indent, Dedent, Image Upload

**Slash menu (`/` commands):**
Text, H1, H2, H3, Bullet List, Ordered List, Quote (blockquote), Divider, Code Block
- Table: coded but commented out
- Task List: coded but commented out

**Inline menu (select text → floating popup):**
Bold, Italic, Underline, Strikethrough, Inline Code, Link

**Other:**
- @mentions (user and tag)
- Block drag handle
- Image drag-and-drop / paste upload
- GFM markdown in conversion pipeline (remark-gfm)

### Markdown pipeline
- **Editor → Storage:** ProseKit HTML → `markdownFromHTML()` (rehype-remark + remark-gfm) → markdown string → stored in Lens `article()` metadata
- **Storage → Display:** markdown string → `ContentRenderer` (ReactMarkdown + remarkBreaks) → rendered HTML

### Known gap
`ContentRenderer` uses only `remarkBreaks` but NOT `remarkGfm`. So tables, strikethrough, and other GFM features that the editor outputs won't render properly on display. The conversion pipeline supports GFM both ways, but the renderer doesn't.

---

## 2. Required Improvements

### 2.1 Add remarkGfm to ContentRenderer

**Problem:** Editor outputs GFM markdown (tables, strikethrough) but ContentRenderer doesn't parse it.

**Fix:** Add `remarkGfm` to the ReactMarkdown plugins in `components/shared/content-renderer.tsx`.

**File:** `components/shared/content-renderer.tsx`
```tsx
// Change:
<ReactMarkdown remarkPlugins={[remarkBreaks]}>

// To:
<ReactMarkdown remarkPlugins={[remarkBreaks, remarkGfm]}>
```

**Effort:** 5 minutes. One import, one array entry.

---

### 2.2 Quote-Reply Feature

**What it does:** User clicks "Reply" on any post → the reply editor opens (or scrolls to it) with a blockquote pre-filled:

```markdown
> @researcher wrote:
> "any consensus mechanism requiring fewer than..."

[cursor here — user types their response]
```

**Implementation approach:**

1. Each post has a "Reply" button
2. Clicking it:
   a. Scrolls to the reply editor at the bottom of the page
   b. Inserts a blockquote into the editor with the quoted text and author attribution
3. If the user has selected/highlighted specific text from that post before clicking Reply, only the selected text is quoted
4. If no text is selected, quote the first ~200 characters of the post content

**Technical details:**
- The `TextEditor` component needs an imperative method to insert content (e.g., `editor.commands.insertText()` or inserting a blockquote node)
- ProseKit supports programmatic content insertion via `editor.commands.setBlockquote()` and `editor.commands.insertText()`
- We need to expose the editor instance or provide a callback prop like `onQuote(text: string, author: string)`
- The `TextEditor` component currently doesn't accept an `editorRef` — we'd add one

**New prop for TextEditor:**
```tsx
interface TextEditorProps {
  onChange: (value: string) => void;
  initialValue?: string;
  editorRef?: React.MutableRefObject<Editor<EditorExtension> | null>;  // NEW
}
```

**Quote insertion logic:**
```tsx
function insertQuote(editor: Editor, text: string, author: string) {
  // Insert: "> @author wrote:\n> quoted text\n\n"
  // Then place cursor after the blockquote
}
```

**Effort:** ~1-2 hours. New prop on TextEditor, quote insertion function, Reply button wiring.

---

### 2.3 Uncomment Table Support

**Problem:** Table insertion is coded in the slash menu but commented out.

**Fix:** Uncomment in `components/editor/slash-menu.tsx`:
```tsx
// Uncomment this line:
<SlashMenuItem label="Table" onSelect={() => editor.commands.insertTable({ row: 3, col: 3 })} />
```

The `TableHandle` component for resizing/managing tables is already mounted in `TextEditor`.

**Effort:** 1 minute. Uncomment one line.

---

## 3. Nice-to-Have Improvements (Later)

### 3.1 Emoji Picker
ProseKit doesn't have a built-in emoji picker, but we can add one using a React emoji picker library (e.g., `emoji-mart`) that inserts emoji text into the editor.

### 3.2 File Attachments (non-image)
Currently only images are supported. PDFs, documents, etc. would need a file upload service and a custom node view.

### 3.3 Math/LaTeX Support
For a research forum, LaTeX rendering could be valuable. Would need `remark-math` + `rehype-katex` in the rendering pipeline, and a math input mode in the editor.

### 3.4 Collaborative Editing
ProseKit supports Yjs integration for real-time collaboration. Not needed now but possible.

### 3.5 TipTap Migration
If ProseKit ever becomes limiting, TipTap is the natural next step — same ProseMirror base, larger ecosystem. The editor is isolated in `components/editor/` so the swap would be ~2-3 days without touching the rest of the app.

---

## 4. File Inventory

All editor files live in `components/editor/`:

```
components/editor/
├── text-editor.tsx          — Main component (used everywhere)
├── extension.ts             — ProseKit extension definition
├── toolbar.tsx              — Toolbar buttons
├── toolbar-button.tsx       — Reusable toolbar button
├── inline-menu.tsx          — Floating menu on text selection
├── slash-menu.tsx           — Slash command menu
├── slash-menu-item.tsx      — Slash menu item component
├── slash-menu-empty.tsx     — Empty state for slash menu
├── block-handle.tsx         — Block drag handle
├── table-handle.tsx         — Table resize/manage handle
├── code-block-view.tsx      — Code block with Shiki highlighting
├── image-view.tsx           — Image node view
├── image-upload-popover.tsx — Image upload UI
├── upload-file.tsx          — Image file handler
├── mention.tsx              — Mention display component
├── mention-picker.tsx       — Mention autocomplete
├── mention-popover.tsx      — Mention popover UI
├── emojis.ts                — Emoji data
```

Rendering lives in:
```
components/shared/content-renderer.tsx  — Markdown → HTML display
lib/external/prosekit/markdown.ts       — HTML ↔ Markdown conversion
```
