import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Merge, Split, Download, Trash2, FileUp } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import Layout from "@/components/layout/Layout";
import ToolHeader from "@/components/shared/ToolHeader";
import FileUploadZone from "@/components/shared/FileUploadZone";
import { toast } from "sonner";

type PdfMode = "merge" | "split";

const PDFTools = () => {
  const [mode, setMode] = useState<PdfMode>("merge");
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearFiles = () => {
    setFiles([]);
    setProgress(0);
  };

  const mergePDFs = async () => {
    if (files.length < 2) {
      toast.error("Please select at least 2 PDF files to merge");
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        const arrayBuffer = await files[i].arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((page) => mergedPdf.addPage(page));
        setProgress(((i + 1) / files.length) * 100);
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "merged.pdf";
      link.click();

      URL.revokeObjectURL(url);
      toast.success("PDFs merged successfully!");
    } catch (error) {
      console.error("Merge error:", error);
      toast.error("Failed to merge PDFs");
    } finally {
      setIsProcessing(false);
    }
  };

  const splitPDF = async () => {
    if (files.length !== 1) {
      toast.error("Please select exactly 1 PDF file to split");
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const arrayBuffer = await files[0].arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const pageCount = pdf.getPageCount();

      for (let i = 0; i < pageCount; i++) {
        const newPdf = await PDFDocument.create();
        const [page] = await newPdf.copyPages(pdf, [i]);
        newPdf.addPage(page);

        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `page_${i + 1}.pdf`;
        link.click();

        URL.revokeObjectURL(url);
        setProgress(((i + 1) / pageCount) * 100);
      }

      toast.success(`Split into ${pageCount} pages!`);
    } catch (error) {
      console.error("Split error:", error);
      toast.error("Failed to split PDF");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcess = () => {
    if (mode === "merge") {
      mergePDFs();
    } else {
      splitPDF();
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <ToolHeader
          title="PDF Tools"
          description="Merge, split, and manage PDFs directly in your browser"
          icon={FileText}
          color="--tool-pdf"
        />

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 md:p-8 mb-6"
          >
            {/* Mode Selection */}
            <div className="flex gap-3 mb-8">
              <button
                onClick={() => {
                  setMode("merge");
                  clearFiles();
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-medium transition-all ${
                  mode === "merge"
                    ? "bg-tool-pdf text-white"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <Merge className="w-5 h-5" />
                Merge PDFs
              </button>
              <button
                onClick={() => {
                  setMode("split");
                  clearFiles();
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-medium transition-all ${
                  mode === "split"
                    ? "bg-tool-pdf text-white"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <Split className="w-5 h-5" />
                Split PDF
              </button>
            </div>

            {/* Upload Zone */}
            <FileUploadZone
              accept=".pdf"
              multiple={mode === "merge"}
              onFilesSelected={handleFilesSelected}
              label={mode === "merge" ? "Drop PDF files to merge" : "Drop a PDF file to split"}
              description={mode === "merge" ? "Select multiple PDFs" : "One PDF will be split into pages"}
            />

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">
                    {files.length} file(s) selected
                  </span>
                  <button
                    onClick={clearFiles}
                    className="text-sm text-destructive hover:underline"
                  >
                    Clear all
                  </button>
                </div>
                {files.map((file, index) => (
                  <motion.div
                    key={`${file.name}-${index}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50"
                  >
                    <FileUp className="w-5 h-5 text-tool-pdf shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Progress */}
            {isProcessing && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Processing...</span>
                  <span className="text-sm font-mono">{Math.round(progress)}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {/* Process Button */}
            {files.length > 0 && !isProcessing && (
              <button
                onClick={handleProcess}
                className="w-full mt-6 btn-primary-gradient flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--tool-pdf)) 0%, hsl(0 70% 45%) 100%)",
                }}
              >
                <Download className="w-5 h-5" />
                {mode === "merge" ? "Merge & Download" : "Split & Download"}
              </button>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default PDFTools;
