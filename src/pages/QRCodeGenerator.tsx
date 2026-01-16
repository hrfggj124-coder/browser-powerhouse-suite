import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { QrCode, Download, Copy, Check, Link, FileText, Mail, Phone, Wifi } from "lucide-react";
import QRCode from "qrcode";
import Layout from "@/components/layout/Layout";
import ToolHeader from "@/components/shared/ToolHeader";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const QRCodeGenerator = () => {
  const [inputType, setInputType] = useState("url");
  const [inputValue, setInputValue] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [size, setSize] = useState([300]);
  const [errorCorrection, setErrorCorrection] = useState<"L" | "M" | "Q" | "H">("M");
  
  // WiFi specific fields
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [wifiEncryption, setWifiEncryption] = useState("WPA");
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const getQRContent = () => {
    switch (inputType) {
      case "url":
        return inputValue;
      case "text":
        return inputValue;
      case "email":
        return `mailto:${inputValue}`;
      case "phone":
        return `tel:${inputValue}`;
      case "wifi":
        return `WIFI:T:${wifiEncryption};S:${wifiSsid};P:${wifiPassword};;`;
      default:
        return inputValue;
    }
  };

  const generateQRCode = async () => {
    const content = getQRContent();
    if (!content || content === "WIFI:T:WPA;S:;P:;;") return;

    try {
      const dataUrl = await QRCode.toDataURL(content, {
        width: size[0],
        margin: 2,
        errorCorrectionLevel: errorCorrection,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error("QR generation error:", error);
      toast({
        title: "Generation failed",
        description: "Failed to generate QR code",
        variant: "destructive",
      });
    }
  };

  // Auto-generate QR code when content changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      generateQRCode();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [inputValue, inputType, size, errorCorrection, wifiSsid, wifiPassword, wifiEncryption]);

  const downloadQRCode = (format: "png" | "svg") => {
    if (!qrDataUrl) return;

    const link = document.createElement("a");
    link.download = `qrcode.${format}`;
    link.href = qrDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Downloaded!",
      description: `QR code saved as ${format.toUpperCase()}`,
    });
  };

  const copyToClipboard = async () => {
    if (!qrDataUrl) return;

    try {
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "QR code copied to clipboard",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const inputIcons = {
    url: Link,
    text: FileText,
    email: Mail,
    phone: Phone,
    wifi: Wifi,
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <ToolHeader
          title="QR Code Generator"
          description="Create QR codes from text, URLs, emails, and more"
          icon={QrCode}
          color="--tool-qr"
        />

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Input Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6"
            >
              <h3 className="font-semibold mb-4">Content</h3>

              <Tabs value={inputType} onValueChange={setInputType}>
                <TabsList className="grid grid-cols-5 mb-4">
                  {Object.entries(inputIcons).map(([type, Icon]) => (
                    <TabsTrigger key={type} value={type} className="text-xs">
                      <Icon className="w-4 h-4" />
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="url" className="space-y-4">
                  <Input
                    placeholder="https://example.com"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="input-dark"
                  />
                </TabsContent>

                <TabsContent value="text" className="space-y-4">
                  <Textarea
                    placeholder="Enter your text..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="input-dark min-h-[100px]"
                  />
                </TabsContent>

                <TabsContent value="email" className="space-y-4">
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="input-dark"
                  />
                </TabsContent>

                <TabsContent value="phone" className="space-y-4">
                  <Input
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="input-dark"
                  />
                </TabsContent>

                <TabsContent value="wifi" className="space-y-4">
                  <Input
                    placeholder="Network Name (SSID)"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    className="input-dark"
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    className="input-dark"
                  />
                  <Select value={wifiEncryption} onValueChange={setWifiEncryption}>
                    <SelectTrigger>
                      <SelectValue placeholder="Encryption" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WPA">WPA/WPA2</SelectItem>
                      <SelectItem value="WEP">WEP</SelectItem>
                      <SelectItem value="nopass">None</SelectItem>
                    </SelectContent>
                  </Select>
                </TabsContent>
              </Tabs>

              {/* Settings */}
              <div className="mt-6 pt-6 border-t border-border space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">Size</label>
                    <span className="text-sm text-muted-foreground">{size[0]}px</span>
                  </div>
                  <Slider
                    value={size}
                    onValueChange={setSize}
                    min={100}
                    max={500}
                    step={10}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Error Correction</label>
                  <Select value={errorCorrection} onValueChange={(v) => setErrorCorrection(v as "L" | "M" | "Q" | "H")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">Low (7%)</SelectItem>
                      <SelectItem value="M">Medium (15%)</SelectItem>
                      <SelectItem value="Q">Quartile (25%)</SelectItem>
                      <SelectItem value="H">High (30%)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Higher = more resistant to damage but larger code
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Preview Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6"
            >
              <h3 className="font-semibold mb-4">Preview</h3>

              <div className="flex items-center justify-center bg-white rounded-xl p-6 min-h-[300px]">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Generated QR Code"
                    className="max-w-full"
                    style={{ width: size[0], height: size[0] }}
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <QrCode className="w-16 h-16 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Enter content to generate QR code</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              {qrDataUrl && (
                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    onClick={() => downloadQRCode("png")}
                    className="btn-primary-gradient flex items-center gap-2 flex-1"
                  >
                    <Download className="w-4 h-4" />
                    PNG
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors flex items-center gap-2 flex-1"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              )}

              <canvas ref={canvasRef} className="hidden" />
            </motion.div>
          </div>

          {/* Privacy Notice */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xs text-muted-foreground text-center mt-6"
          >
            🔒 QR codes are generated locally in your browser. No data is sent to any server.
          </motion.p>
        </div>
      </div>
    </Layout>
  );
};

export default QRCodeGenerator;
