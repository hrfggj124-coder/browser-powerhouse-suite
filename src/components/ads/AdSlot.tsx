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
