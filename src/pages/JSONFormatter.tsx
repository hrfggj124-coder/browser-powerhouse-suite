import { useState } from "react";
import { motion } from "framer-motion";
import { Braces, Copy, Check, AlertTriangle, Minimize2, Maximize2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import ToolHeader from "@/components/shared/ToolHeader";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const sampleJson = `{"name":"ToolBox","version":"1.0","tools":["PDF","Password","Resume","Weather","AI Chat"],"config":{"theme":"dark","language":"en"}}`;

const JSONFormatter = () => {
  const [input, setInput] = useState(sampleJson);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [indentSize, setIndentSize] = useState(2);

  const formatJson = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, indentSize));
      setError(null);
      toast.success("JSON formatted successfully");
    } catch (e: any) {
      setError(e.message);
      setOutput("");
      toast.error("Invalid JSON");
    }
  };

  const minifyJson = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError(null);
      toast.success("JSON minified");
    } catch (e: any) {
      setError(e.message);
      setOutput("");
      toast.error("Invalid JSON");
    }
  };

  const validateJson = () => {
    try {
      JSON.parse(input);
      setError(null);
      toast.success("Valid JSON ✓");
    } catch (e: any) {
      setError(e.message);
      toast.error("Invalid JSON");
    }
  };

  const copyOutput = () => {
    const text = output || input;
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <ToolHeader
          title="JSON Formatter"
          description="Format, validate, and minify JSON data. All processing happens locally."
          icon={Braces}
          color="--tool-json"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={formatJson} className="btn-primary-gradient">
              <Maximize2 className="w-4 h-4 mr-1" /> Format
            </Button>
            <Button variant="outline" onClick={minifyJson}>
              <Minimize2 className="w-4 h-4 mr-1" /> Minify
            </Button>
            <Button variant="outline" onClick={validateJson}>
              <Check className="w-4 h-4 mr-1" /> Validate
            </Button>
            <Button variant="outline" onClick={copyOutput}>
              <Copy className="w-4 h-4 mr-1" /> Copy
            </Button>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-muted-foreground">Indent:</span>
              {[2, 4].map((size) => (
                <Button
                  key={size}
                  variant={indentSize === size ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setIndentSize(size)}
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex items-start gap-2 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive"
            >
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Invalid JSON</p>
                <p className="text-xs mt-1 opacity-80">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Input / Output */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ minHeight: "60vh" }}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Input</label>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="font-mono text-sm resize-none h-full min-h-[55vh] bg-secondary/50 border-border/50"
                placeholder="Paste your JSON here..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Output</label>
              <Textarea
                value={output}
                readOnly
                className="font-mono text-sm resize-none h-full min-h-[55vh] bg-secondary/50 border-border/50"
                placeholder="Formatted JSON will appear here..."
              />
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default JSONFormatter;
