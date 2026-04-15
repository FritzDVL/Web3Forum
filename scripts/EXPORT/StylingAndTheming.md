# Web3Forum — Styling & Theming Reference

## Tech Stack

- Next.js 14 + React 18 + TypeScript
- Tailwind CSS 3.4 with `tailwindcss-animate` and `@tailwindcss/typography`
- CSS Variables for theming (light/dark)
- Custom font loaded via `@font-face` (woff2)
- Radix UI primitives for accessible components
- `class-variance-authority` + `clsx` + `tailwind-merge` for className composition

---

## Color System

### CSS Variables (defined in `app/globals.css`)

All colors use HSL via CSS custom properties, consumed as `hsl(var(--name))`.

#### Light Mode (`:root`)

| Variable                | HSL Value          | Description           |
|-------------------------|--------------------|-----------------------|
| `--background`          | `0 0% 100%`       | White                 |
| `--foreground`          | `0 0% 3.9%`       | Almost black          |
| `--card` / `--popover`  | `0 0% 100%`       | White                 |
| `--primary`             | `217 91% 60%`     | Brand blue (#3b82f6)  |
| `--primary-foreground`  | `0 0% 98%`        | Almost white          |
| `--secondary`           | `0 0% 96.1%`      | Light gray            |
| `--muted`               | `0 0% 96.1%`      | Light gray            |
| `--muted-foreground`    | `0 0% 45.1%`      | Medium gray           |
| `--accent`              | `0 0% 96.1%`      | Light gray            |
| `--destructive`         | `0 84.2% 60.2%`   | Red                   |
| `--border` / `--input`  | `0 0% 89.8%`      | Very light gray       |
| `--ring`                | `0 0% 3.9%`       | Almost black          |
| `--radius`              | `0.5rem`           | Border radius base    |

#### Dark Mode (`.dark`)

| Variable                | HSL Value          | Description           |
|-------------------------|--------------------|-----------------------|
| `--background`          | `0 0% 3.9%`       | Almost black          |
| `--foreground`          | `0 0% 98%`        | Almost white          |
| `--primary`             | `217 91% 60%`     | Same brand blue       |
| `--secondary`           | `0 0% 14.9%`      | Dark gray             |
| `--muted`               | `0 0% 14.9%`      | Dark gray             |
| `--muted-foreground`    | `0 0% 63.9%`      | Medium-light gray     |
| `--border` / `--input`  | `0 0% 14.9%`      | Dark gray             |
| `--ring`                | `0 0% 83.1%`      | Light gray            |
| `--destructive`         | `0 62.8% 30.6%`   | Dark red              |

### Brand Color Palette (Tailwind `brand-*`)

Defined in `tailwind.config.ts` — "Society Protocol Blue" theme:

| Token       | Hex       | Usage                    |
|-------------|-----------|--------------------------|
| `brand-50`  | `#eff6ff` | Lightest backgrounds     |
| `brand-100` | `#dbeafe` | Hover backgrounds        |
| `brand-200` | `#bfdbfe` | Borders, rings           |
| `brand-300` | `#93c5fd` | Soft accents             |
| `brand-400` | `#60a5fa` | Medium accents           |
| `brand-500` | `#3b82f6` | Primary brand color      |
| `brand-600` | `#2563eb` | Hover states, gradients  |
| `brand-700` | `#1d4ed8` | Dark accents             |
| `brand-800` | `#1e40af` | Deeper accents           |
| `brand-900` | `#1e3a8a` | Very dark accents        |
| `brand-950` | `#172554` | Almost black blue        |

---

## Body & Base Styles

```css
body {
  @apply min-h-screen w-full bg-slate-100 font-custom text-foreground dark:bg-gray-900;
}
```

- Light background: `bg-slate-100`
- Dark background: `dark:bg-gray-900`
- Font: custom woff2 font via `font-custom` family

---

## Utility Classes (defined in `globals.css`)

### `.gradient-card`
```css
.gradient-card {
  @apply border border-white/20 bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-sm;
  @apply dark:border-gray-700/20 dark:from-gray-800/80 dark:to-gray-900/40;
}
```

### `.gradient-button`
```css
.gradient-button {
  @apply transform bg-gradient-to-r from-brand-500 to-brand-600 font-semibold text-white
         transition-all duration-200 hover:scale-105 hover:from-brand-600 hover:to-brand-700;
}
```

### `.animate-float` / `.animate-pulse-slow`
Subtle floating and pulsing animations for decorative elements.

### `.line-clamp-2` / `.line-clamp-3`
Text truncation with `-webkit-line-clamp`.

---

## Tailwind Config Highlights (`tailwind.config.ts`)

- `darkMode: ["class"]` — class-based dark mode via `next-themes`
- Custom `fontFamily.custom` using CSS variable `--font-custom`
- All semantic colors mapped to CSS variables via `hsl(var(--name))`
- Accordion keyframe animations
- Plugins: `tailwindcss-animate`, `@tailwindcss/typography`

---

## Theme Provider

Uses `next-themes` with class strategy:

```tsx
// components/theme/theme-provider.tsx
<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
```

Toggle component at `components/theme/theme-toggle.tsx`.

---

## Card Patterns

Typical card styling used across the app:

```tsx
<Card className="rounded-3xl border border-brand-200/60 bg-white backdrop-blur-sm
                 dark:border-gray-700/60 dark:bg-gray-800">
```

Key patterns:
- `rounded-3xl` for large radius
- Semi-transparent borders (`border-brand-200/60`)
- `backdrop-blur-sm` for glass effect
- Dark mode overrides with `dark:` prefix

---

## Rich Text Content Display (`styles/rich-text-content.css`)

Applied via `.rich-text-content` class when rendering user-generated content. Covers:

- Typography: h1–h6, paragraphs, line-height 1.6
- Lists: disc/decimal/circle/square nesting, task lists
- Text formatting: bold, italic, underline, strikethrough
- Code: inline `code` with muted bg + destructive color, `pre` blocks with monospace
- Links: primary color, underline with offset, hover transitions
- Blockquotes: left border, muted color, italic
- Tables: full-width, collapsed borders, muted header bg
- Images: max-width 100%, rounded
- Horizontal rules: border-top with border color

---

## Key UI Component Patterns

### Buttons
- Primary: `gradient-button` class (brand gradient + scale hover)
- Ghost: `variant="ghost"` from shadcn/ui Button
- Disabled: `disabled:opacity-50`

### Avatars
- Ring styling: `ring-2 ring-brand-200 dark:ring-brand-700`
- Gradient fallback: `bg-gradient-to-br from-brand-400 to-brand-600 text-white`

### Popovers / Dropdowns
- Glass effect: `bg-white/95 backdrop-blur-sm dark:bg-gray-800/95`
- Border: `border-gray-200/60 dark:border-gray-700/60`
- Shadow: `shadow-xl`

### Loading Spinners
- `animate-spin rounded-full border-2 border-brand-200 border-t-brand-500`

---

## Dependencies to Install

```json
{
  "tailwindcss": "^3.4",
  "tailwindcss-animate": "^1.0",
  "@tailwindcss/typography": "^0.5",
  "class-variance-authority": "^0.7",
  "clsx": "^2.1",
  "tailwind-merge": "^2.6",
  "next-themes": "^0.4",
  "lucide-react": "^0.454"
}
```
