import { ResearchPublication } from "@/lib/domain/research/types";
import { ResearchPost } from "./research-post";

interface ResearchPostListProps {
  publications: ResearchPublication[];
  onReply: (quotedText: string, authorName: string) => void;
}

export function ResearchPostList({ publications, onReply }: ResearchPostListProps) {
  if (publications.length === 0) {
    return <div className="py-8 text-center text-gray-500">No posts yet.</div>;
  }

  return (
    <div>
      {publications.map((pub) => (
        <ResearchPost key={pub.lensPostId} publication={pub} onReply={onReply} />
      ))}
    </div>
  );
}
