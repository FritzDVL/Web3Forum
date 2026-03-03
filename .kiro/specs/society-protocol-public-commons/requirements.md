1. The previous design.md has been cleared. This is the new source of truth.
2. OBJECTIVE: UI-only 'Curation' of the existing LensForum. No architectural changes.
3. NOMENCLATURE: Retain all 'Community' and 'Group' naming in the code and UI.
4. UI RESTRICTION: Locate the 'Create Community' button and hide it (CSS or conditional rendering). We want to restrict creation at the UX level.
5. LANDING PAGE: Modify the landing page to fetch/display ONLY 3 specific communities (Spanish, Chinese, Japanese). 
6. ADDITION: Create a new 'Commons' area for 15 Lens Feeds.
7. SAFETY: Do not modify /lib, /services, or database schemas. Focus strictly on /app and /components."