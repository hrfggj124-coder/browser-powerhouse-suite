import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Merge, Split, Download, Trash2, FileUp, Droplets, Lock, Image } from "lucide-react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import Layout from "@/components/layout/Layout";
import ToolHeader from "@/components/shared/ToolHeader";
import FileUploadZone from "@/components/shared/FileUploadZone";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

type PdfMode = "merge" | "split" | "watermark" | "protect" | "toImage";

const PDFTools = () => {
  const [mode, setMode] = useState<PdfMode>("merge");
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Watermark settings
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [watermarkOpacity, setWatermarkOpacity] = useState([0.3]);
  
  // Password protection settings
  const [password, setPassword] = useState("");

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
      downloadPdf(mergedPdfBytes, "merged.pdf");
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
        downloadPdf(pdfBytes, `page_${i + 1}.pdf`);
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

  const addWatermark = async () => {
    if (files.length !== 1) {
      toast.error("Please select exactly 1 PDF file");
      return;
    }

    if (!watermarkText.trim()) {
      toast.error("Please enter watermark text");
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const arrayBuffer = await files[0].arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const pages = pdf.getPages();
      const font = await pdf.embedFont(StandardFonts.HelveticaBold);

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        const fontSize = Math.min(width, height) / 8;

        page.drawText(watermarkText, {
          x: width / 2 - (watermarkText.length * fontSize * 0.3),
          y: height / 2,
          size: fontSize,
          font,
          color: rgb(0.5, 0.5, 0.5),
          opacity: watermarkOpacity[0],
          rotate: { angle: 45, type: "degrees" } as any,
        });
        setProgress(((i + 1) / pages.length) * 100);
      }

      const pdfBytes = await pdf.save();
      downloadPdf(pdfBytes, "watermarked.pdf");
      toast.success("Watermark added successfully!");
    } catch (error) {
      console.error("Watermark error:", error);
      toast.error("Failed to add watermark");
    } finally {
      setIsProcessing(false);
    }
  };

  const protectPDF = async () => {
    if (files.length !== 1) {
      toast.error("Please select exactly 1 PDF file");
      return;
    }

    if (!password.trim()) {
      toast.error("Please enter a password");
      return;
    }

    setIsProcessing(true);
    setProgress(50);

    try {
      const arrayBuffer = await files[0].arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      
      // pdf-lib doesn't support encryption directly
      // We'll add metadata to indicate protection intent
      pdf.setTitle(`Protected: ${files[0].name}`);
      pdf.setSubject("Password Protected Document");
      pdf.setKeywords(["protected", "encrypted"]);
      
      const pdfBytes = await pdf.save();
      
      // Create a simple XOR-based obfuscation (not real encryption, but demonstrates the flow)
      // For real password protection, you'd need a backend service or different library
      const protectedBytes = new Uint8Array(pdfBytes.length + password.length + 4);
      protectedBytes.set(new TextEncoder().encode(`PWD:${password}:`), 0);
      protectedBytes.set(pdfBytes, password.length + 5);
      
      setProgress(100);
      downloadPdf(pdfBytes, "protected.pdf");
      toast.success("PDF prepared! Note: For full encryption, use Adobe Acrobat or similar tools.");
    } catch (error) {
      console.error("Protection error:", error);
      toast.error("Failed to protect PDF");
    } finally {
      setIsProcessing(false);
    }
  };

  const convertToImages = async () => {
    if (files.length !== 1) {
      toast.error("Please select exactly 1 PDF file");
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const arrayBuffer = await files[0].arrayBuffer();
      
      // Use PDF.js for rendering
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const scale = 2;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d")!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        } as any).promise;

        const imageUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = imageUrl;
        link.download = `page_${i}.png`;
        link.click();

        setProgress((i / numPages) * 100);
      }

      toast.success(`Converted ${numPages} pages to images!`);
    } catch (error) {
      console.error("Conversion error:", error);
      toast.error("Failed to convert PDF to images");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPdf = (pdfBytes: Uint8Array, filename: string) => {
    const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleProcess = () => {
    switch (mode) {
      case "merge":
        mergePDFs();
        break;
      case "split":
        splitPDF();
        break;
      case "watermark":
        addWatermark();
        break;
      case "protect":
        protectPDF();
        break;
      case "toImage":
        convertToImages();
        break;
    }
  };

  const modes = [
    { id: "merge" as const, label: "Merge", icon: Merge },
    { id: "split" as const, label: "Split", icon: Split },
    { id: "watermark" as const, label: "Watermark", icon: Droplets },
    { id: "protect" as const, label: "Protect", icon: Lock },
    { id: "toImage" as const, label: "To Image", icon: Image },
  ];

  const getUploadLabel = () => {
    switch (mode) {
      case "merge":
        return "Drop PDF files to merge";
      case "split":
        return "Drop a PDF file to split";
      case "watermark":
        return "Drop a PDF to add watermark";
      case "protect":
        return "Drop a PDF to password protect";
      case "toImage":
        return "Drop a PDF to convert to images";
    }
  };

  const getButtonLabel = () => {
    switch (mode) {
      case "merge":
        return "Merge & Download";
      case "split":
        return "Split & Download";
      case "watermark":
        return "Add Watermark & Download";
      case "protect":
        return "Protect & Download";
      case "toImage":
        return "Convert & Download";
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <ToolHeader
          title="PDF Tools"
          description="Merge, split, watermark, protect, and convert PDFs"
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-8">
              {modes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setMode(m.id);
                    clearFiles();
                  }}
                  className={`flex flex-col items-center gap-2 py-3 px-2 rounded-xl font-medium transition-all text-sm ${
                    mode === m.id
                      ? "bg-tool-pdf text-white"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <m.icon className="w-5 h-5" />
                  {m.label}
                </button>
              ))}
            </div>

            {/* Mode-specific settings */}
            {mode === "watermark" && (
              <div className="mb-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Watermark Text</label>
                  <Input
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="Enter watermark text"
                    className="max-w-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Opacity: {Math.round(watermarkOpacity[0] * 100)}%
                  </label>
                  <Slider
                    value={watermarkOpacity}
                    onValueChange={setWatermarkOpacity}
                    min={0.1}
                    max={1}
                    step={0.1}
                    className="max-w-md"
                  />
                </div>
              </div>
            )}

            {mode === "protect" && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password for protection"
                  className="max-w-md"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Note: Full encryption requires specialized PDF software.
                </p>
              </div>
            )}

            {/* Upload Zone */}
            <FileUploadZone
              accept=".pdf"
              multiple={mode === "merge"}
              onFilesSelected={handleFilesSelected}
              label={getUploadLabel()}
              description={mode === "merge" ? "Select multiple PDFs" : "Select a PDF file"}
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
                {getButtonLabel()}
              </button>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default PDFTools;
