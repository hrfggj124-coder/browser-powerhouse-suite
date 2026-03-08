import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const tracked = new Set<string>();

function trackEvent(slotName: string, eventType: "impression" | "click") {
  const key = `${slotName}:${eventType}:${window.location.pathname}`;
  if (eventType === "impression" && tracked.has(key)) return;
  tracked.add(key);

  supabase
    .from("ad_analytics")
    .insert({ slot_name: slotName, event_type: eventType, page_path: window.location.pathname })
    .then(); // fire-and-forget
}

export function useAdImpression(slotName: string, active: boolean) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !ref.current) return;
    const el = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          trackEvent(slotName, "impression");
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [slotName, active]);

  const handleClick = useCallback(() => {
    trackEvent(slotName, "click");
  }, [slotName]);

  return { ref, handleClick };
}
