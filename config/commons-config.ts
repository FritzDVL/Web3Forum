export interface CommonsFeed {
  title: string;
  address: string;
  description: string;
}

export interface CommonsSection {
  sectionTitle: string;
  feeds: CommonsFeed[];
  borderColor?: string;
  layout?: "list" | "grid";
}

export const COMMONS_SECTIONS: CommonsSection[] = [
  {
    sectionTitle: "GENERAL DISCUSSION",
    borderColor: "blue",
    layout: "list",
    feeds: [
      {
        title: "Beginners & Help",
        address: "feed-1",
        description: "New to the forum? Start here with questions and introductions.",
      },
      {
        title: "4 Key Concepts (Energy, Timeline, state, Actors, accounts, Lifeline, Death, etc...)",
        address: "feed-2",
        description: "Core concepts and fundamental principles of the system.",
      },
      {
        title: "Web3 Outpost (Outpod, Badges, Spec)",
        address: "feed-3",
        description: "Web3 integration, badges, and technical specifications.",
      },
      {
        title: "DAO Governance",
        address: "feed-4",
        description: "Decentralized governance discussions and proposals.",
      },
    ],
  },
  {
    sectionTitle: "PARTNER COMMUNITIES",
    borderColor: "green",
    layout: "list",
    feeds: [
      {
        title: "General Discussion",
        address: "feed-5",
        description: "Discussion about Society Protocol partner communities.",
      },
      {
        title: "Announcements",
        address: "feed-6",
        description: "Official partner news and updates.",
      },
      {
        title: "Network States Communities",
        address: "feed-7",
        description: "Discussion about current and upcoming network states.",
      },
      {
        title: "Partner Badges & SPEC",
        address: "feed-8",
        description: "Technical specs and badge systems for partners.",
      },
    ],
  },
  {
    sectionTitle: "FUNCTIONS (VALUE SYSTEM)",
    borderColor: "blue",
    layout: "grid",
    feeds: [
      {
        title: "Economic Game Theory",
        address: "feed-9",
        description: "Economic models and game theory discussions.",
      },
      {
        title: "Function Ideas",
        address: "feed-10",
        description: "Propose and discuss new function concepts.",
      },
      {
        title: "Hunting",
        address: "feed-11",
        description: "Resource discovery and acquisition strategies.",
      },
      {
        title: "Property",
        address: "feed-12",
        description: "Property rights and ownership discussions.",
      },
      {
        title: "Parenting",
        address: "feed-13",
        description: "Community growth and mentorship.",
      },
      {
        title: "Governance",
        address: "feed-14",
        description: "Decision-making and governance structures.",
      },
      {
        title: "Organizations",
        address: "feed-15",
        description: "Organizational design and coordination.",
      },
      {
        title: "Curation",
        address: "feed-16",
        description: "Content and quality curation systems.",
      },
      {
        title: "Farming",
        address: "feed-17",
        description: "Value creation and cultivation strategies.",
      },
      {
        title: "Portal",
        address: "feed-18",
        description: "Gateway and integration discussions.",
      },
      {
        title: "Communication",
        address: "feed-19",
        description: "Communication protocols and systems.",
      },
    ],
  },
];

// Legacy export for backward compatibility
export const COMMONS_FEEDS = COMMONS_SECTIONS[0].feeds;
