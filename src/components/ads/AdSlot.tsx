import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AdSlotProps {
  slotName: string;
  className?: string;
}

const AdSlot = ({ slotName, className = "" }: AdSlotProps) => {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    const fetchAd = async () => {
      const { data } = await supabase
        .from("ad_placements")
        .select("html_content")
        .eq("slot_name", slotName)
        .eq("is_active", true)
        .maybeSingle();
      if (data?.html_content) {
        setHtml(data.html_content);
      }
    };
    fetchAd();
  }, [slotName]);

  if (!html) return null;

  return (
    <div
      className={`ad-slot ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default AdSlot;

const DEFAULT_SLOTS = ["header_banner", "between_tools", "footer_banner"];

type PlacementFilter = "all_pages" | "homepage" | "tool_pages" | string;
type PositionFilter = "header" | "after_content" | "sidebar" | "between_tools" | "footer";

interface CustomAdSlotsProps {
  className?: string;
  placement?: PlacementFilter;
  position?: PositionFilter;
  currentRoute?: string;
}

export const CustomAdSlots = ({
  className = "",
  placement,
  position,
  currentRoute,
}: CustomAdSlotsProps) => {
  const [ads, setAds] = useState<
    { slot_name: string; html_content: string; placement: string; position: string }[]
  >([]);

  useEffect(() => {
    const fetchCustomAds = async () => {
      const { data } = await supabase
        .from("ad_placements")
        .select("slot_name, html_content, placement, position")
        .eq("is_active", true);
      if (data) {
        let filtered = data.filter(
          (a) => !DEFAULT_SLOTS.includes(a.slot_name) && a.html_content.trim()
        );

        filtered = filtered.filter((a) => {
          const p = a.placement || "all_pages";
          if (p === "all_pages") return true;
          if (placement && p === placement) return true;
          if (currentRoute && p === currentRoute) return true;
          return false;
        });

        if (position) {
          filtered = filtered.filter((a) => (a.position || "after_content") === position);
        }

        setAds(filtered);
      }
    };
    fetchCustomAds();
  }, [placement, position, currentRoute]);

  if (!ads.length) return null;

  return (
    <div className={className}>
      {ads.map((ad) => (
        <div
          key={ad.slot_name}
          className="ad-slot"
          dangerouslySetInnerHTML={{ __html: ad.html_content }}
        />
      ))}
    </div>
  );
};
