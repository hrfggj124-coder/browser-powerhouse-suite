import { ReactNode } from "react";
import { CustomAdSlots } from "@/components/ads/AdSlot";
import { useLocation } from "react-router-dom";

interface ToolPageLayoutProps {
  children: ReactNode;
}

const ToolPageLayout = ({ children }: ToolPageLayoutProps) => {
  const location = useLocation();

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
      <div className="flex-1 min-w-0">{children}</div>
      <aside className="w-full lg:w-72 shrink-0 space-y-4">
        <CustomAdSlots
          placement="tool_pages"
          currentRoute={location.pathname}
          position="sidebar"
          className="space-y-4 sticky top-20"
        />
      </aside>
    </div>
  );
};

export default ToolPageLayout;
