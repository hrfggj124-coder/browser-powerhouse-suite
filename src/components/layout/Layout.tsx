import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Header from "./Header";
import AdSlot, { CustomAdSlots } from "@/components/ads/AdSlot";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const currentRoute = location.pathname;
  const isHomepage = currentRoute === "/";
  const placement = isHomepage ? "homepage" : "tool_pages";

  return (
    <div className="min-h-screen bg-background bg-hero-pattern">
      <Header />
      <main className="pt-16">
        <AdSlot slotName="header_banner" className="container mx-auto px-4 pt-4" />
        <CustomAdSlots
          placement={placement}
          currentRoute={currentRoute}
          position="header"
          className="container mx-auto px-4 pt-2"
        />
        {!isHomepage ? (
          <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-8">
            <div className="flex-1 min-w-0">{children}</div>
            <aside className="w-full lg:w-72 shrink-0">
              <div className="sticky top-20 space-y-4">
                <CustomAdSlots
                  placement={placement}
                  currentRoute={currentRoute}
                  position="sidebar"
                  className="space-y-4"
                />
              </div>
            </aside>
          </div>
        ) : (
          children
        )}
        <CustomAdSlots
          placement={placement}
          currentRoute={currentRoute}
          position="after_content"
          className="container mx-auto px-4 py-4 space-y-4"
        />
      </main>
      <CustomAdSlots
        placement={placement}
        currentRoute={currentRoute}
        position="footer"
        className="container mx-auto px-4 pb-4 space-y-4"
      />
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
