import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";

type Range = "7d" | "30d" | "all";
type ChartMode = "bar" | "line";

interface SlotStats {
  slot_name: string;
  impressions: number;
  clicks: number;
  ctr: string;
}

interface DailyData {
  date: string;
  impressions: number;
  clicks: number;
}

const rangeLabels: Record<Range, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  all: "All time",
};

function getDateCutoff(range: Range): string | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : 30;
  return subDays(new Date(), days).toISOString();
}

const AdAnalytics = () => {
  const [stats, setStats] = useState<SlotStats[]>([]);
  const [daily, setDaily] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>("7d");
  const [chartMode, setChartMode] = useState<ChartMode>("bar");

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      let query = supabase.from("ad_analytics").select("slot_name, event_type, created_at");
      const cutoff = getDateCutoff(range);
      if (cutoff) {
        query = query.gte("created_at", cutoff);
      }
      const { data } = await query;

      if (data && data.length) {
        // Slot stats
        const map: Record<string, { impressions: number; clicks: number }> = {};
        // Daily stats
        const dayMap: Record<string, { impressions: number; clicks: number }> = {};

        for (const row of data) {
          // Slot aggregation
          if (!map[row.slot_name]) map[row.slot_name] = { impressions: 0, clicks: 0 };
          if (row.event_type === "impression") map[row.slot_name].impressions++;
          else if (row.event_type === "click") map[row.slot_name].clicks++;

          // Daily aggregation
          const day = format(new Date(row.created_at), "yyyy-MM-dd");
          if (!dayMap[day]) dayMap[day] = { impressions: 0, clicks: 0 };
          if (row.event_type === "impression") dayMap[day].impressions++;
          else if (row.event_type === "click") dayMap[day].clicks++;
        }

        const result: SlotStats[] = Object.entries(map).map(([slot_name, s]) => ({
          slot_name,
          impressions: s.impressions,
          clicks: s.clicks,
          ctr: s.impressions > 0 ? ((s.clicks / s.impressions) * 100).toFixed(1) + "%" : "0%",
        }));
        result.sort((a, b) => b.impressions - a.impressions);
        setStats(result);

        // Fill in missing days for chart continuity
        const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
        const interval = eachDayOfInterval({
          start: subDays(new Date(), days - 1),
          end: new Date(),
        });
        const dailyResult: DailyData[] = interval.map((d) => {
          const key = format(d, "yyyy-MM-dd");
          return {
            date: format(d, "MMM d"),
            impressions: dayMap[key]?.impressions || 0,
            clicks: dayMap[key]?.clicks || 0,
          };
        });
        setDaily(dailyResult);
      } else {
        setStats([]);
        setDaily([]);
      }
      setLoading(false);
    };
    fetchStats();
  }, [range]);

  return (
    <div className="glass-card p-6 space-y-6">
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
        <>
          {/* Chart */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Daily Overview</p>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={chartMode === "bar" ? "default" : "outline"}
                  className="text-xs h-6 px-2"
                  onClick={() => setChartMode("bar")}
                >
                  Bar
                </Button>
                <Button
                  size="sm"
                  variant={chartMode === "line" ? "default" : "outline"}
                  className="text-xs h-6 px-2"
                  onClick={() => setChartMode("line")}
                >
                  Line
                </Button>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartMode === "bar" ? (
                  <BarChart data={daily} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      className="fill-muted-foreground"
                      interval={range === "30d" ? 3 : range === "all" ? 7 : 0}
                    />
                    <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Bar dataKey="impressions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="clicks" fill="hsl(var(--primary) / 0.5)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <LineChart data={daily} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      className="fill-muted-foreground"
                      interval={range === "30d" ? 3 : range === "all" ? 7 : 0}
                    />
                    <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Line
                      type="monotone"
                      dataKey="impressions"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="clicks"
                      stroke="hsl(var(--primary) / 0.5)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table */}
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
        </>
      )}
    </div>
  );
};

export default AdAnalytics;
