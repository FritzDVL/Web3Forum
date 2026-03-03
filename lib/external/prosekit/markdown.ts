import { customBreakHandler } from "./helpers/remark-break-handler";
import { rehypeJoinParagraph } from "@/lib/external/prosekit/helpers/rehype-join-paragraph";
import { rehypeMentionToMarkdownLink } from "@/lib/external/prosekit/helpers/rehype-mention-to-markdown-link";
import { remarkLinkProtocol } from "@/lib/external/prosekit/helpers/remark-link-protocol";
import rehypeParse from "rehype-parse";
import rehypeRemark from "rehype-remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { unified } from "unified";

// By default, remark-stringify escapes underscores (i.e. "_" => "\_"). We want
// to disable this behavior so that we can have underscores in mention usernames.
const unescapeUnderscore = (str: string) => {
  return str.replace(/(^|[^\\])\\_/g, "$1_");
};

export const markdownFromHTML = (html: string): string => {
  const markdown = unified()
    .use(rehypeParse)
    .use(rehypeJoinParagraph)
    .use(rehypeMentionToMarkdownLink)
    .use(rehypeRemark, { newlines: true })
    .use(remarkGfm) // Add GFM support for tables, strikethrough, etc.
    .use(remarkLinkProtocol)
    .use(remarkStringify, {
      handlers: { break: customBreakHandler, hardBreak: customBreakHandler },
    })
    .processSync(html)
    .toString();

  return unescapeUnderscore(markdown);
};

export const htmlFromMarkdown = (markdown: string): string => {
  return unified()
    .use(remarkParse)
    .use(remarkGfm) // Add GFM support for parsing tables
    .use(remarkHtml)
    .processSync(markdown)
    .toString();
};
