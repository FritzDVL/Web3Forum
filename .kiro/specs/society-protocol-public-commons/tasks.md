# Society Protocol Public Commons - Implementation Tasks

## Project Scope
UI-only curation layer for existing LensForum. No architectural changes, no modifications to `/lib`, `/services`, or database schemas.

---

## Task 1: Hide "Create Community" Button

**Objective**: Restrict community creation at the UX level

**Files to Modify**:
- `components/layout/navbar-desktop.tsx`
- `components/layout/navbar-mobile.tsx`
- `components/communities/list/communities-header.tsx` (if button exists here)

**Implementation**:
- Locate "Create Community" or "New Community" buttons
- Add `className="hidden"` or conditional rendering `{false && ...}`
- Verify button is hidden on all screen sizes

**Acceptance Criteria**:
- [ ] Create Community button not visible in desktop navbar
- [ ] Create Community button not visible in mobile navbar
- [ ] Create Community button not visible on communities list page
- [ ] No console errors or warnings

---

## Task 2: Create Commons Configuration

**Objective**: Define 15 mock Lens Feeds for Commons area

**Files to Create**:
- `config/commons-feeds.ts`

**Implementation**:
```typescript
export const COMMONS_FEEDS = [
  'feed-1',
  'feed-2',
  'feed-3',
  'feed-4',
  'feed-5',
  'feed-6',
  'feed-7',
  'feed-8',
  'feed-9',
  'feed-10',
  'feed-11',
  'feed-12',
  'feed-13',
  'feed-14',
  'feed-15',
];
```

**Acceptance Criteria**:
- [ ] Config file created with 15 feed strings
- [ ] Exportable array for use in components

---

## Task 3: Create Curated Communities Configuration

**Objective**: Define 3 specific community IDs for landing page

**Files to Create**:
- `config/curated-communities.ts`

**Implementation**:
```typescript
export const CURATED_COMMUNITY_IDS = {
  SPANISH: 'SPANISH_ID',
  CHINESE: 'CHINESE_ID',
  JAPANESE: 'JAPANESE_ID',
};

export const CURATED_COMMUNITIES = [
  CURATED_COMMUNITY_IDS.SPANISH,
  CURATED_COMMUNITY_IDS.CHINESE,
  CURATED_COMMUNITY_IDS.JAPANESE,
];
```

**Acceptance Criteria**:
- [ ] Config file created with placeholder IDs
- [ ] Easy to swap actual addresses later
- [ ] Exportable for use in components

---

## Task 4: Modify Landing Page - Featured Communities

**Objective**: Display only 3 curated communities on landing page

**Files to Modify**:
- `components/home/featured-communities.tsx`

**Implementation**:
- Import `CURATED_COMMUNITIES` from config
- Filter fetched communities to only include the 3 curated IDs
- Maintain existing UI/styling

**Acceptance Criteria**:
- [ ] Landing page shows exactly 3 communities
- [ ] Communities match Spanish, Chinese, Japanese IDs
- [ ] Existing styling and layout preserved
- [ ] No errors if communities not found (graceful handling)

---

## Task 5: Create Commons Feed Card Component

**Objective**: Reusable card component for displaying individual feeds

**Files to Create**:
- `components/commons/commons-feed-card.tsx`

**Implementation**:
- Reuse existing community card styling for consistency
- Accept feed ID as prop
- Display feed name/ID
- Link to `/commons/[feedId]` route
- Minimal placeholder content

**Acceptance Criteria**:
- [ ] Component renders feed information
- [ ] Matches community card visual style
- [ ] Clickable and navigates to feed detail page
- [ ] Responsive design

---

## Task 6: Create Commons Feed List Component

**Objective**: Display grid of 15 feeds

**Files to Create**:
- `components/commons/commons-feed-list.tsx`

**Implementation**:
- Import `COMMONS_FEEDS` from config
- Map over feeds and render `CommonsFeedCard` for each
- Use grid layout (similar to communities list)
- Responsive grid (adjust columns for mobile/tablet/desktop)

**Acceptance Criteria**:
- [ ] Displays all 15 feeds in grid layout
- [ ] Responsive across screen sizes
- [ ] Consistent spacing and alignment
- [ ] Matches existing design patterns

---

## Task 7: Create Commons Landing Page

**Objective**: Main page for Commons area

**Files to Create**:
- `app/commons/page.tsx`

**Implementation**:
- Page title: "Commons"
- Brief description/header
- Render `CommonsFeedList` component
- Use existing layout patterns from communities page

**Acceptance Criteria**:
- [ ] Page accessible at `/commons` route
- [ ] Displays header and description
- [ ] Shows 15 feeds in grid
- [ ] Consistent with app styling

---

## Task 8: Create Commons Feed Detail Page

**Objective**: Boilerplate page for individual feed view

**Files to Create**:
- `app/commons/[feedId]/page.tsx`

**Implementation**:
- Dynamic route for feed ID
- Display feed ID/name in header
- Placeholder content: "Feed content coming soon"
- Back button to Commons
- Basic layout structure

**Acceptance Criteria**:
- [ ] Page accessible at `/commons/[feedId]` route
- [ ] Displays correct feed ID from URL
- [ ] Back navigation works
- [ ] No errors or warnings

---

## Task 9: Add Commons Navigation Link

**Objective**: Add "Commons" link to main navbar

**Files to Modify**:
- `components/layout/navbar-desktop.tsx`
- `components/layout/navbar-mobile.tsx`

**Implementation**:
- Add "Commons" link next to "Communities" link
- Link to `/commons` route
- Match existing nav link styling
- Ensure proper active state highlighting

**Acceptance Criteria**:
- [ ] Commons link visible in desktop navbar
- [ ] Commons link visible in mobile navbar
- [ ] Link navigates to `/commons` page
- [ ] Active state works correctly
- [ ] Consistent styling with other nav links

---

## Task 10: Testing & Verification

**Objective**: Ensure all changes work correctly

**Testing Checklist**:
- [ ] Landing page shows only 3 curated communities
- [ ] Create Community button hidden everywhere
- [ ] Commons link appears in navbar (desktop & mobile)
- [ ] Commons page displays 15 feeds in grid
- [ ] Clicking feed navigates to detail page
- [ ] Feed detail page displays correctly
- [ ] Back navigation works from feed detail
- [ ] No console errors or warnings
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] No changes to `/lib`, `/services`, or database schemas
- [ ] All existing functionality still works

---

## Implementation Order

1. Task 2: Create Commons Configuration
2. Task 3: Create Curated Communities Configuration
3. Task 1: Hide Create Community Button
4. Task 4: Modify Landing Page
5. Task 5: Create Commons Feed Card Component
6. Task 6: Create Commons Feed List Component
7. Task 7: Create Commons Landing Page
8. Task 8: Create Commons Feed Detail Page
9. Task 9: Add Commons Navigation Link
10. Task 10: Testing & Verification

---

## Safety Constraints

**DO NOT MODIFY**:
- `/lib/**` - All library code
- `/services/**` - All service layer code
- Database schemas
- API routes (unless creating new ones for Commons)
- Authentication logic
- Data fetching logic (only filter results in components)

**ONLY MODIFY**:
- `/app/**` - Pages and routes
- `/components/**` - UI components
- `/config/**` - Configuration files (create new)
- CSS/styling files

---

## Notes

- All community IDs are placeholders (SPANISH_ID, CHINESE_ID, JAPANESE_ID)
- All feed IDs are mock strings (feed-1 through feed-15)
- Actual addresses will be swapped manually later
- Focus on UI structure and navigation flow
- Reuse existing components and styling patterns where possible
