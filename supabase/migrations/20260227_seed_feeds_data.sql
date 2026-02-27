-- ============================================
-- Seed Data for Feeds Table
-- Created: 2026-02-27
-- Purpose: Populate feeds from commons-config.ts
-- ============================================

-- Insert feeds from GENERAL DISCUSSION section
INSERT INTO feeds (lens_feed_address, title, description, category, display_order, is_locked, featured) VALUES
('feed-1', 'Beginners & Help', 'New to the forum? Start here with questions and introductions.', 'general', 1, false, true),
('feed-2', '4 Key Concepts (Energy, Timeline, state, Actors, accounts, Lifeline, Death, etc...)', 'Core concepts and fundamental principles of the system.', 'general', 2, false, false),
('feed-3', 'Web3 Outpost (Outpod, Badges, Spec)', 'Web3 integration, badges, and technical specifications.', 'general', 3, false, false),
('feed-4', 'DAO Governance', 'Decentralized governance discussions and proposals.', 'general', 4, false, false);

-- Insert feeds from PARTNER COMMUNITIES section
INSERT INTO feeds (lens_feed_address, title, description, category, display_order, is_locked, featured) VALUES
('feed-5', 'General Discussion', 'Discussion about Society Protocol partner communities.', 'partners', 5, false, false),
('feed-6', 'Announcements', 'Official partner news and updates.', 'partners', 6, false, false),
('feed-7', 'Network States Communities', 'Discussion about current and upcoming network states.', 'partners', 7, false, false),
('feed-8', 'Partner Badges & SPEC', 'Technical specs and badge systems for partners.', 'partners', 8, false, false);

-- Insert feeds from FUNCTIONS (VALUE SYSTEM) section
INSERT INTO feeds (lens_feed_address, title, description, category, display_order, is_locked, featured) VALUES
('feed-9', 'Economic Game Theory', 'Economic models and game theory discussions.', 'functions', 9, false, false),
('feed-10', 'Function Ideas', 'Propose and discuss new function concepts.', 'functions', 10, false, false),
('feed-11', 'Hunting', 'Resource discovery and acquisition strategies.', 'functions', 11, false, false),
('feed-12', 'Property', 'Property rights and ownership discussions.', 'functions', 12, false, false),
('feed-13', 'Parenting', 'Community growth and mentorship.', 'functions', 13, false, false),
('feed-14', 'Governance', 'Decision-making and governance structures.', 'functions', 14, false, false),
('feed-15', 'Organizations', 'Organizational design and coordination.', 'functions', 15, false, false),
('feed-16', 'Curation', 'Content and quality curation systems.', 'functions', 16, false, false),
('feed-17', 'Farming', 'Value creation and cultivation strategies.', 'functions', 17, false, false),
('feed-18', 'Portal', 'Gateway and integration discussions.', 'functions', 18, false, false),
('feed-19', 'Communication', 'Communication protocols and systems.', 'functions', 19, false, false);

-- Insert feeds from SOCIETY PROTOCOL TECHNICAL SECTION
INSERT INTO feeds (lens_feed_address, title, description, category, display_order, is_locked, featured) VALUES
('feed-20', 'General Architecture Discussion', 'High-level system architecture and design patterns.', 'technical', 20, true, false),
('feed-21', 'State Machine', 'State transitions and machine logic discussions.', 'technical', 21, true, false),
('feed-22', 'Consensus (Proof of Hunt)', 'Consensus mechanisms and proof systems.', 'technical', 22, true, false),
('feed-23', 'Cryptography', 'Cryptographic primitives and security protocols.', 'technical', 23, true, false);

-- Insert feeds from OTHERS section
INSERT INTO feeds (lens_feed_address, title, description, category, display_order, is_locked, featured) VALUES
('feed-24', 'Meta-discussion', 'Discussion about the Society Protocol Forum itself.', 'others', 24, false, false),
('feed-25', 'Politics & Society', 'Political impacts on society and optimization.', 'others', 25, false, false),
('feed-26', 'Economics', 'Economic models and theories.', 'others', 26, false, false),
('feed-27', 'Cryptocurrencies & Web3', 'The broader crypto and web3 landscape.', 'others', 27, false, false),
('feed-28', 'Off-topic', 'Anything unrelated to the protocol.', 'others', 28, false, false);

-- ============================================
-- SEED DATA COMPLETE
-- Total: 28 feeds across 5 categories
-- ============================================
