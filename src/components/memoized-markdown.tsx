import { IconButton } from "@/components/ui/icon-button";
import { Clipboard } from "lucide-react";
import { marked } from "marked";
import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import ShikiHighlighter, { isInlineCode } from "react-shiki";
import remarkGfm from "remark-gfm";

function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens.map((token) => token.raw);
}

// Syntax highlighting for code blocks using react-shiki
const CodeHighlight = ({ className, children, node, ...props }: any) => {
  const code = String(children).trim();
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : undefined;

  const inline = node ? isInlineCode(node) : false;

  if (inline) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
      }).catch(() => {});
    }
  };

  return (
    // <div className="relative group not-prose">
    //   {/* Copy button */}
    //   <IconButton
    //     tooltip="Copy"
    //     variant="ghost"
    //     size="sm"
    //     className="absolute right-2 top-6 hover:bg-transparent z-50"
    //     icon={<Clipboard className="size-3.5 text-primary-foreground" />}
    //     onClick={handleCopy}
    //   />
    //   {/* Shiki highlighter */}
      <ShikiHighlighter
        language={language}
        theme="github-dark"
        {...props}
        className="not-prose-pre:"
      >
        {code}
      </ShikiHighlighter>
    // </div>
  );
};

const MemoizedMarkdownBlock = memo(
  ({ content }: { content: string }) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: CodeHighlight
        }}
      >
        {content}
      </ReactMarkdown>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.content !== nextProps.content) return false;
    return true;
  }
);

MemoizedMarkdownBlock.displayName = "MemoizedMarkdownBlock";

export const MemoizedMarkdown = memo(({ content, id }: { content: string; id: string }) => {
  const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);

  return blocks.map((block, index) => (
    <MemoizedMarkdownBlock content={block} key={`${id}-block_${index}`} />
  ));
});

MemoizedMarkdown.displayName = "MemoizedMarkdown";
