export interface CommonsFeed {
  title: string;
  address: string;
  description: string;
}

export const COMMONS_FEEDS: CommonsFeed[] = [
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
];
