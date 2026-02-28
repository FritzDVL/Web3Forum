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
  isLocked?: boolean;
}

export const COMMONS_SECTIONS: CommonsSection[] = [
  {
    sectionTitle: "GENERAL DISCUSSION",
    borderColor: "blue",
    layout: "list",
    feeds: [
      {
        title: "Beginners & Help",
        address: "0x7c86a0FCE84528cB90faF8394D3439cDCd48a69a",
        description: "New to the forum? Start here with questions and introductions.",
      },
      {
        title: "4 Key Concepts (Energy, Timeline, state, Actors, accounts, Lifeline, Death, etc...)",
        address: "0x70d9e6D753717353c814C77aa8a860C0A3c0c256",
        description: "Core concepts and fundamental principles of the system.",
      },
      {
        title: "Web3 Outpost (Outpod, Badges, Spec)",
        address: "0x4c99061F02d9bAB31cE2B6a8646642173e36e3D4",
        description: "Web3 integration, badges, and technical specifications.",
      },
      {
        title: "DAO Governance",
        address: "0x0115dB8888d2DB261752302c9B3F6706e5dcABc9",
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
        address: "0x44C171f2ADc2b12F3dB124abC21fe53731072DC7",
        description: "Discussion about Society Protocol partner communities.",
      },
      {
        title: "Announcements",
        address: "0x1837523A5921968cF9113B541d621BfFa0c9fb2E",
        description: "Official partner news and updates.",
      },
      {
        title: "Network States Communities",
        address: "0x21B212Ed66CeD5479396315ef788b97b071d891A",
        description: "Discussion about current and upcoming network states.",
      },
      {
        title: "Partner Badges & SPEC",
        address: "0xF9B6D91018E364D1F805488f46C03cfFaD0820d6",
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
        address: "0x51336141C44838c5657EAA3004dE8f92E23597C1",
        description: "Economic models and game theory discussions.",
      },
      {
        title: "Function Ideas",
        address: "0xd5487eA18e9049e1977EA6Ef2dba890B1Bf511a5",
        description: "Propose and discuss new function concepts.",
      },
      {
        title: "Hunting",
        address: "0xd380F727681091B11080dA6244A79f928408F37C",
        description: "Resource discovery and acquisition strategies.",
      },
      {
        title: "Property",
        address: "0x69c64cC29f6845Ab0bFD113E73a3b5cA4288DE4d",
        description: "Property rights and ownership discussions.",
      },
      {
        title: "Parenting",
        address: "0x8b83c64265b71A3745A744E83F39Ee8D353496f0",
        description: "Community growth and mentorship.",
      },
      {
        title: "Governance",
        address: "0x9929116d505EAC9788A9CD66764d347f135479FE",
        description: "Decision-making and governance structures.",
      },
      {
        title: "Organizations",
        address: "0xd6555f772f4307c200dedAb0549900dA7E244C82",
        description: "Organizational design and coordination.",
      },
      {
        title: "Curation",
        address: "0x408dab722a3774215a43BF9dc66d8A3524B0Aff9",
        description: "Content and quality curation systems.",
      },
      {
        title: "Farming",
        address: "0xb7140FB035cD96AA44F2273C65F02d4bAACE2f48",
        description: "Value creation and cultivation strategies.",
      },
      {
        title: "Portal",
        address: "0xeDa10585df116b9F8D854B8fb05A933c9daAFB8C",
        description: "Gateway and integration discussions.",
      },
      {
        title: "Communication",
        address: "0xB4949Ffb24C1Ea6b26442F3b6962CD697E1d0561",
        description: "Communication protocols and systems.",
      },
    ],
  },
  {
    sectionTitle: "SOCIETY PROTOCOL TECHNICAL SECTION",
    borderColor: "blue",
    layout: "list",
    isLocked: true,
    feeds: [
      {
        title: "General Architecture Discussion",
        address: "feed-20",
        description: "High-level system architecture and design patterns.",
      },
      {
        title: "State Machine",
        address: "feed-21",
        description: "State transitions and machine logic discussions.",
      },
      {
        title: "Consensus (Proof of Hunt)",
        address: "feed-22",
        description: "Consensus mechanisms and proof systems.",
      },
      {
        title: "Cryptography",
        address: "feed-23",
        description: "Cryptographic primitives and security protocols.",
      },
    ],
  },
  {
    sectionTitle: "OTHERS",
    borderColor: "blue",
    layout: "list",
    feeds: [
      {
        title: "Meta-discussion",
        address: "0x2aBFcf84cc82C4A3bBF0493Ab5468992812fC90c",
        description: "Discussion about the Society Protocol Forum itself.",
      },
      {
        title: "Politics & Society",
        address: "0x8c23479Fb235630C5B32cE6a6308d922d4ab6ca4",
        description: "Political impacts on society and optimization.",
      },
      {
        title: "Economics",
        address: "feed-26",
        description: "Economic models and theories.",
      },
      {
        title: "Cryptocurrencies & Web3",
        address: "0xd564Aaf85158c3D494f7efA2f7F3aD85f5BBBf01",
        description: "The broader crypto and web3 landscape.",
      },
      {
        title: "Off-topic",
        address: "0x0E3e5206B0dF562F460CcF37D9Cb359704C6eB08",
        description: "Anything unrelated to the protocol.",
      },
    ],
  },
];

// Legacy export for backward compatibility
export const COMMONS_FEEDS = COMMONS_SECTIONS[0].feeds;
