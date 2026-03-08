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

export const CustomAdSlots = ({ className = "" }: { className?: string }) => {
  const [ads, setAds] = useState<{ slot_name: string; html_content: string }[]>([]);

  useEffect(() => {
    const fetchCustomAds = async () => {
      const { data } = await supabase
        .from("ad_placements")
        .select("slot_name, html_content")
        .eq("is_active", true);
      if (data) {
        setAds(data.filter((a) => !DEFAULT_SLOTS.includes(a.slot_name) && a.html_content.trim()));
      }
    };
    fetchCustomAds();
  }, []);

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
