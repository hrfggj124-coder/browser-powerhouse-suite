import { motion } from "framer-motion";
import {
  FileText,
  Lock,
  FileUser,
  Cloud,
  MessageSquare,
  ImageMinus,
  ImageIcon,
  Music,
  Sparkles,
  Video,
  QrCode,
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import ToolCard from "@/components/shared/ToolCard";

const tools = [
  {
    title: "PDF Tools",
    description: "Merge, split, compress, and convert PDFs directly in your browser.",
    icon: FileText,
    href: "/pdf-tools",
    color: "--tool-pdf",
  },
  {
    title: "Password Generator",
    description: "Create secure, random passwords with customizable options.",
    icon: Lock,
    href: "/password",
    color: "--tool-password",
  },
  {
    title: "Resume Builder",
    description: "Build professional resumes with beautiful templates.",
    icon: FileUser,
    href: "/resume",
    color: "--tool-resume",
  },
  {
    title: "Weather",
    description: "Get real-time weather information for any location.",
    icon: Cloud,
    href: "/weather",
    color: "--tool-weather",
  },
  {
    title: "AI Chat",
    description: "Chat with an intelligent AI assistant powered by Lovable AI.",
    icon: MessageSquare,
    href: "/ai-chat",
    color: "--tool-ai",
  },
  {
    title: "Image Compressor",
    description: "Reduce image file sizes while maintaining quality.",
    icon: ImageMinus,
    href: "/compress",
    color: "--tool-compress",
  },
  {
    title: "Video Compressor",
    description: "Reduce video file sizes directly in your browser.",
    icon: Video,
    href: "/video-compress",
    color: "--tool-video",
  },
  {
    title: "Image Converter",
    description: "Convert images between PNG, JPG, WEBP, and GIF formats.",
    icon: ImageIcon,
    href: "/convert",
    color: "--tool-convert",
  },
  {
    title: "Audio Extractor",
    description: "Extract audio tracks from video files in MP3 or WAV format.",
    icon: Music,
    href: "/audio",
    color: "--tool-audio",
  },
  {
    title: "QR Code Generator",
    description: "Create QR codes from URLs, text, emails, WiFi, and more.",
    icon: QrCode,
    href: "/qr-code",
    color: "--tool-qr",
  },
];

const Index = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="hero-glow" />
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">100% Client-Side Processing</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              All-in-One{" "}
              <span className="gradient-text">Tool Suite</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
              Powerful browser-based tools for PDFs, images, passwords, resumes, and more.
              Your files never leave your device.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a href="#tools" className="btn-primary-gradient">
                Explore Tools
              </a>
              <a
                href="#tools"
                className="px-6 py-3 rounded-xl font-medium text-foreground bg-secondary hover:bg-secondary/80 transition-colors"
              >
                Learn More
              </a>
            </div>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-tool-compress/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Tools Grid */}
      <section id="tools" className="container mx-auto px-4 pb-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Available Tools</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Choose from our collection of privacy-focused tools that run entirely in your browser.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tools.map((tool, index) => (
            <ToolCard
              key={tool.href}
              {...tool}
              delay={index * 0.05}
            />
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 pb-20">
        <div className="glass-card p-8 md:p-12">
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-14 h-14 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="font-semibold text-lg mb-2">100% Private</h3>
              <p className="text-sm text-muted-foreground">
                All processing happens locally. Your files never leave your device.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Blazing Fast</h3>
              <p className="text-sm text-muted-foreground">
                No uploads required. Instant processing using WebAssembly.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <Cloud className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No Sign Up</h3>
              <p className="text-sm text-muted-foreground">
                Start using all tools immediately. No account required.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
