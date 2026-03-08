import { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Copy, Download, Eye, Edit3, Columns } from "lucide-react";
import { marked } from "marked";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import Layout from "@/components/layout/Layout";
import ToolHeader from "@/components/shared/ToolHeader";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const defaultMarkdown = `# Welcome to the Markdown Editor

## Features
- **Live preview** as you type
- Support for all standard Markdown syntax
- Copy and download your work

### Code Blocks
\`\`\`javascript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

\`\`\`python
def hello():
    print("Hello from Python!")
\`\`\`

### Lists
1. First item
2. Second item
3. Third item

> This is a blockquote. It can span multiple lines.

---

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

Visit [Lovable](https://lovable.dev) for more tools!
`;

type ViewMode = "split" | "edit" | "preview";

// Configure marked to use highlight.js
marked.setOptions({
  breaks: true,
  gfm: true,
});

const renderer = new marked.Renderer();
renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
  const language = lang && hljs.getLanguage(lang) ? lang : "plaintext";
  const highlighted = hljs.highlight(text, { language }).value;
  return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
};

marked.use({ renderer });

const MarkdownEditor = () => {
  const [markdown, setMarkdown] = useState(defaultMarkdown);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const previewRef = useRef<HTMLDivElement>(null);

  const htmlContent = useMemo(() => {
    try {
      return marked(markdown) as string;
    } catch {
      return "<p>Error rendering markdown</p>";
    }
  }, [markdown]);

  // Highlight inline code after render
  useEffect(() => {
    if (previewRef.current) {
      previewRef.current.querySelectorAll("pre code:not(.hljs)").forEach((block) => {
        hljs.highlightElement(block as HTMLElement);
      });
    }
  }, [htmlContent]);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    toast.success("Markdown copied to clipboard");
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.md";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Markdown file downloaded");
  };

  const handleDownloadHtml = () => {
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Markdown Export</title><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:2rem auto;padding:0 1rem;line-height:1.6}pre{background:#1e1e2e;padding:1rem;border-radius:8px;overflow-x:auto}code{font-family:monospace}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}blockquote{border-left:4px solid #ddd;margin:0;padding-left:1rem;color:#666}</style></head><body>${htmlContent}</body></html>`;
    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.html";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("HTML file downloaded");
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <ToolHeader
          title="Markdown Editor"
          description="Write Markdown with a live preview and syntax highlighting. All processing happens locally."
          icon={Edit3}
          color="--tool-markdown"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
              <Button
                variant={viewMode === "edit" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("edit")}
              >
                <Edit3 className="w-4 h-4 mr-1" /> Edit
              </Button>
              <Button
                variant={viewMode === "split" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("split")}
              >
                <Columns className="w-4 h-4 mr-1" /> Split
              </Button>
              <Button
                variant={viewMode === "preview" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("preview")}
              >
                <Eye className="w-4 h-4 mr-1" /> Preview
              </Button>
            </div>
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="w-4 h-4 mr-1" /> Copy MD
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-1" /> .md
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadHtml}>
              <Download className="w-4 h-4 mr-1" /> .html
            </Button>
          </div>

          {/* Editor / Preview */}
          <div
            className={`grid gap-4 ${
              viewMode === "split"
                ? "grid-cols-1 md:grid-cols-2"
                : "grid-cols-1"
            }`}
            style={{ minHeight: "70vh" }}
          >
            {viewMode !== "preview" && (
              <Textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                className="font-mono text-sm resize-none h-full min-h-[70vh] bg-secondary/50 border-border/50"
                placeholder="Write your markdown here..."
              />
            )}
            {viewMode !== "edit" && (
              <div
                ref={previewRef}
                className="prose prose-sm dark:prose-invert max-w-none p-6 rounded-xl bg-secondary/30 border border-border/50 overflow-auto"
                style={{ minHeight: "70vh" }}
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            )}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default MarkdownEditor;
