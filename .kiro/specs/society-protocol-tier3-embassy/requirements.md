# Requirements Document

## Introduction

Transform the existing LensForum codebase into the Society Protocol Tier 3 Embassy system - a language-based regional forum architecture that maintains the existing Lens Protocol V3 integration while restructuring the community system to support predefined language embassies instead of user-created communities. This system serves as the "Local Embassies" tier in the 3-tier Society Protocol Forum architecture, providing sovereign, language-based routing for global discussions.

## Glossary

- **Embassy_System**: The transformed forum system that organizes discussions by language-based regional groups
- **Language_Embassy**: A predefined Lens Group representing a specific language community (Arabic, Spanish, Chinese, etc.)
- **Root_Category**: Top-level organizational unit that groups related discussion feeds (General Discussion, Partner Communities, etc.)
- **Sub_Category**: Individual discussion feeds within a root category, mapped to specific Lens Feeds
- **Lens_Group**: Lens Protocol V3 primitive representing a community with its own governance
- **Lens_Feed**: Lens Protocol V3 primitive representing a stream of content within a group
- **Shadow_Indexer**: Supabase-based caching system that mirrors Lens Protocol data for performance
- **Forum_Adapter**: Service layer that transforms raw Lens Protocol data into forum UI objects
- **Auth_Store**: Zustand-based authentication state management with wallet and Lens profile integration
- **Embassy_Router**: System component that routes users to appropriate language-based embassies

## Requirements

### Requirement 1: Brand Transformation

**User Story:** As a user visiting the forum, I want to see Society Protocol branding instead of LensForum branding, so that I understand this is the Society Protocol Tier 3 Embassy system.

#### Acceptance Criteria

1. THE Embassy_System SHALL display "Society Protocol" as the primary brand name in the header
2. THE Embassy_System SHALL replace all "LensForum" references with "Society Protocol Forum" in the UI
3. THE Embassy_System SHALL update the page title to "Society Protocol Forum"
4. THE Embassy_System SHALL display the shield icon as specified in the UI mockup
5. THE Embassy_System SHALL maintain the existing color scheme and layout structure from the HTML mockup

### Requirement 2: Language Embassy Configuration

**User Story:** As a forum administrator, I want to configure predefined language embassies, so that users can participate in discussions in their preferred language.

#### Acceptance Criteria

1. THE Embassy_System SHALL support configuration of predefined Language_Embassy entries
2. WHEN configuring embassies, THE Embassy_System SHALL map each Language_Embassy to a specific Lens_Group address
3. THE Embassy_System SHALL support at minimum Arabic, Spanish, and Chinese language embassies
4. THE Embassy_System SHALL store embassy configurations in environment variables or configuration files
5. THE Embassy_System SHALL prevent user creation of new embassies (admin-only configuration)
6. WHERE additional languages are configured, THE Embassy_System SHALL display them in the Local section

### Requirement 3: Root Category Structure Implementation

**User Story:** As a user browsing the forum, I want to see organized root categories, so that I can easily find relevant discussions.

#### Acceptance Criteria

1. THE Embassy_System SHALL display six predefined root categories: General Discussion, Partner Communities, Functions, Technical Section, Others, and Local
2. THE Embassy_System SHALL map each Root_Category to one or more Lens_Feed addresses
3. THE Embassy_System SHALL display categories with the exact styling from the HTML mockup including border colors and icons
4. THE Embassy_System SHALL make the Technical Section visually distinct with dark theme and lock icon
5. THE Embassy_System SHALL organize the Functions category in the grid layout as specified in the mockup
6. THE Embassy_System SHALL display the Local category with language-based embassies

### Requirement 4: Technical Section Access Control

**User Story:** As a technical contributor, I want to access the gated Technical Section, so that I can participate in technical discussions with verified members.

#### Acceptance Criteria

1. THE Embassy_System SHALL implement access control for the Technical Section Root_Category
2. WHEN a user attempts to access the Technical Section, THE Embassy_System SHALL verify token NFT ownership
3. IF the user lacks required tokens, THEN THE Embassy_System SHALL display an access denied message
4. THE Embassy_System SHALL apply client-side encryption to Technical Section content
5. THE Embassy_System SHALL display the Technical Section with the dark theme styling from the mockup
6. THE Embassy_System SHALL show the padlock icon with glow effect for the Technical Section

### Requirement 5: Lens Protocol Integration Preservation

**User Story:** As a developer maintaining the system, I want to preserve all existing Lens Protocol functionality, so that the forum continues to work with the decentralized backend.

#### Acceptance Criteria

1. THE Embassy_System SHALL maintain all existing Lens Protocol V3 client integrations
2. THE Embassy_System SHALL preserve the existing authentication flow: wallet connection → profile selection → session management
3. THE Embassy_System SHALL continue using the shadow indexing strategy with Supabase
4. THE Embassy_System SHALL maintain the Forum_Adapter for transforming Lens data to UI objects
5. THE Embassy_System SHALL preserve the metadata prefix "LearningLens: [Tier]" for post identification
6. THE Embassy_System SHALL maintain the fallback rule for missing Supabase data

### Requirement 6: Embassy Routing System

**User Story:** As a user, I want to be routed to the appropriate language embassy, so that I can participate in discussions in my preferred language.

#### Acceptance Criteria

1. WHEN a user selects a Language_Embassy, THE Embassy_Router SHALL navigate to that embassy's discussion space
2. THE Embassy_Router SHALL maintain separate discussion threads for each Language_Embassy
3. THE Embassy_System SHALL display embassy-specific content using the configured Lens_Group
4. THE Embassy_System SHALL show language names in both native script and English as per the mockup
5. THE Embassy_System SHALL display embassy administrators and activity statistics
6. WHERE a user posts in an embassy, THE Embassy_System SHALL tag the content with the appropriate language identifier

### Requirement 7: UI Layout Transformation

**User Story:** As a user, I want to see the traditional forum table layout, so that I can easily browse discussions in a familiar format.

#### Acceptance Criteria

1. THE Embassy_System SHALL implement the exact table layout from the HTML mockup
2. THE Embassy_System SHALL display columns for Subject, Replies, Views, and Last Post
3. THE Embassy_System SHALL show pinned posts with pin icons
4. THE Embassy_System SHALL display pagination indicators as "(1 2 3 ... 5)" format
5. THE Embassy_System SHALL implement hover effects on table rows
6. THE Embassy_System SHALL maintain responsive design for mobile devices
7. THE Embassy_System SHALL use the Inter font family as specified in the mockup

### Requirement 8: Configuration Management

**User Story:** As a system administrator, I want to configure embassy settings through environment variables, so that I can manage the system without code changes.

#### Acceptance Criteria

1. THE Embassy_System SHALL support configuration of Lens_Group addresses for each Language_Embassy
2. THE Embassy_System SHALL allow configuration of Root_Category to Lens_Feed mappings
3. THE Embassy_System SHALL support configuration of Technical Section access token requirements
4. THE Embassy_System SHALL maintain backward compatibility with existing LensForum environment variables
5. THE Embassy_System SHALL validate all configuration values at startup
6. IF configuration is invalid, THEN THE Embassy_System SHALL display clear error messages

### Requirement 9: Content Migration Strategy

**User Story:** As a system administrator, I want to migrate existing LensForum content, so that historical discussions are preserved in the new embassy structure.

#### Acceptance Criteria

1. THE Embassy_System SHALL provide a migration path for existing community data to Root_Category mappings
2. THE Embassy_System SHALL preserve existing thread and reply data during transformation
3. THE Embassy_System SHALL maintain user profile associations and authentication data
4. THE Embassy_System SHALL update the Shadow_Indexer to reflect the new category structure
5. WHERE content cannot be automatically categorized, THE Embassy_System SHALL provide manual assignment tools
6. THE Embassy_System SHALL validate data integrity after migration

### Requirement 10: Performance and Caching

**User Story:** As a user, I want fast forum performance, so that I can browse discussions without delays.

#### Acceptance Criteria

1. THE Embassy_System SHALL maintain the existing Supabase shadow indexing performance
2. THE Embassy_System SHALL cache Language_Embassy configurations for fast access
3. THE Embassy_System SHALL implement efficient queries for Root_Category data loading
4. THE Embassy_System SHALL maintain sub-200ms response times for category browsing
5. THE Embassy_System SHALL implement proper loading states during data fetching
6. WHERE Supabase data is unavailable, THE Embassy_System SHALL fall back to direct Lens Protocol queries within 500ms

### Requirement 11: Search and Discovery

**User Story:** As a user, I want to search across all embassies and categories, so that I can find relevant discussions regardless of language or category.

#### Acceptance Criteria

1. THE Embassy_System SHALL implement global search across all Language_Embassy content
2. THE Embassy_System SHALL support filtering search results by Root_Category
3. THE Embassy_System SHALL support filtering search results by Language_Embassy
4. THE Embassy_System SHALL highlight search terms in results
5. THE Embassy_System SHALL maintain search performance under 1 second for typical queries
6. THE Embassy_System SHALL provide search suggestions based on popular topics

### Requirement 12: Parser and Serializer Requirements

**User Story:** As a developer, I want robust parsing of Lens Protocol data, so that forum content is correctly processed and displayed.

#### Acceptance Criteria

1. WHEN Lens Protocol post data is received, THE Lens_Parser SHALL parse it into Forum_Post objects
2. WHEN invalid Lens Protocol data is received, THE Lens_Parser SHALL return descriptive error messages
3. THE Forum_Serializer SHALL format Forum_Post objects back into valid Lens Protocol format
4. FOR ALL valid Forum_Post objects, parsing then serializing then parsing SHALL produce equivalent objects (round-trip property)
5. THE Embassy_System SHALL validate all parsed content against the expected schema
6. WHERE parsing fails, THE Embassy_System SHALL log errors and gracefully degrade functionality