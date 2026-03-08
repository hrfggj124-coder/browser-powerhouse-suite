import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Range = "7d" | "30d" | "all";

interface SlotStats {
  slot_name: string;
  impressions: number;
  clicks: number;
  ctr: string;
}

const rangeLabels: Record<Range, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  all: "All time",
};

function getDateCutoff(range: Range): string | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : 30;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

const AdAnalytics = () => {
  const [stats, setStats] = useState<SlotStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>("7d");

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      let query = supabase.from("ad_analytics").select("slot_name, event_type");
      const cutoff = getDateCutoff(range);
      if (cutoff) {
        query = query.gte("created_at", cutoff);
      }
      const { data } = await query;

      if (data) {
        const map: Record<string, { impressions: number; clicks: number }> = {};
        for (const row of data) {
          if (!map[row.slot_name]) map[row.slot_name] = { impressions: 0, clicks: 0 };
          if (row.event_type === "impression") map[row.slot_name].impressions++;
          else if (row.event_type === "click") map[row.slot_name].clicks++;
        }
        const result: SlotStats[] = Object.entries(map).map(([slot_name, s]) => ({
          slot_name,
          impressions: s.impressions,
          clicks: s.clicks,
          ctr: s.impressions > 0 ? ((s.clicks / s.impressions) * 100).toFixed(1) + "%" : "0%",
        }));
        result.sort((a, b) => b.impressions - a.impressions);
        setStats(result);
      } else {
        setStats([]);
      }
      setLoading(false);
    };
    fetchStats();
  }, [range]);

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <h2 className="font-semibold text-lg">Ad Analytics</h2>
        </div>
        <div className="flex gap-1">
          {(Object.keys(rangeLabels) as Range[]).map((r) => (
            <Button
              key={r}
              size="sm"
              variant={range === r ? "default" : "outline"}
              className="text-xs h-7 px-3"
              onClick={() => setRange(r)}
            >
              {rangeLabels[r]}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground text-sm py-4">Loading analytics...</p>
      ) : !stats.length ? (
        <p className="text-center text-muted-foreground text-sm py-4">
          No analytics data for this period.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 font-medium text-muted-foreground">Slot</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Impressions</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Clicks</th>
                <th className="text-right py-2 font-medium text-muted-foreground">CTR</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.slot_name} className="border-b border-border/50">
                  <td className="py-2 font-mono text-xs">{s.slot_name}</td>
                  <td className="py-2 text-right tabular-nums">{s.impressions.toLocaleString()}</td>
                  <td className="py-2 text-right tabular-nums">{s.clicks.toLocaleString()}</td>
                  <td className="py-2 text-right tabular-nums">{s.ctr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdAnalytics;
