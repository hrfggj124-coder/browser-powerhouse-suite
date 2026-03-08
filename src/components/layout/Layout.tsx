import { ReactNode } from "react";
import Header from "./Header";
import AdSlot, { CustomAdSlots } from "@/components/ads/AdSlot";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background bg-hero-pattern">
      <Header />
      <main className="pt-16">
        <AdSlot slotName="header_banner" className="container mx-auto px-4 pt-4" />
        {children}
        <CustomAdSlots className="container mx-auto px-4 py-4 space-y-4" />
      </main>
      <AdSlot slotName="footer_banner" className="container mx-auto px-4 pb-4" />
      <footer className="border-t border-border/50 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 ToolBox. All processing happens locally in your browser.
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Your files never leave your device
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
