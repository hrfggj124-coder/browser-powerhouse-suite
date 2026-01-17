import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Menu, X } from "lucide-react";
import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";

const Header = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isHome = location.pathname === "/";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/5">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <span className="font-semibold text-lg">ToolBox</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <nav className="flex items-center gap-1">
              <NavItem to="/" label="Home" active={isHome} />
              <NavItem to="/pdf-tools" label="PDF" />
              <NavItem to="/password" label="Password" />
              <NavItem to="/ai-chat" label="AI Chat" />
              <NavItem to="/text-to-speech" label="TTS" />
              <NavItem to="/speech-to-text" label="STT" />
            </nav>
            <div className="ml-2 border-l border-border pl-2">
              <ThemeToggle />
            </div>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden glass-card border-t border-white/5"
        >
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
            <MobileNavItem to="/" label="Home" onClick={() => setMobileMenuOpen(false)} />
            <MobileNavItem to="/pdf-tools" label="PDF Tools" onClick={() => setMobileMenuOpen(false)} />
            <MobileNavItem to="/password" label="Password Generator" onClick={() => setMobileMenuOpen(false)} />
            <MobileNavItem to="/resume" label="Resume Builder" onClick={() => setMobileMenuOpen(false)} />
            <MobileNavItem to="/weather" label="Weather" onClick={() => setMobileMenuOpen(false)} />
            <MobileNavItem to="/ai-chat" label="AI Chat" onClick={() => setMobileMenuOpen(false)} />
            <MobileNavItem to="/text-to-speech" label="Text to Speech" onClick={() => setMobileMenuOpen(false)} />
            <MobileNavItem to="/speech-to-text" label="Speech to Text" onClick={() => setMobileMenuOpen(false)} />
            <MobileNavItem to="/compress" label="Image Compress" onClick={() => setMobileMenuOpen(false)} />
            <MobileNavItem to="/video-compress" label="Video Compress" onClick={() => setMobileMenuOpen(false)} />
            <MobileNavItem to="/convert" label="Convert" onClick={() => setMobileMenuOpen(false)} />
            <MobileNavItem to="/audio" label="Audio Extractor" onClick={() => setMobileMenuOpen(false)} />
            <MobileNavItem to="/qr-code" label="QR Code" onClick={() => setMobileMenuOpen(false)} />
          </nav>
        </motion.div>
      )}
    </header>
  );
};

const NavItem = ({ to, label, active }: { to: string; label: string; active?: boolean }) => {
  const location = useLocation();
  const isActive = active || location.pathname === to;

  return (
    <Link
      to={to}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? "bg-primary/20 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
      }`}
    >
      {label}
    </Link>
  );
};

const MobileNavItem = ({ to, label, onClick }: { to: string; label: string; onClick: () => void }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? "bg-primary/20 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
      }`}
    >
      {label}
    </Link>
  );
};

export default Header;
