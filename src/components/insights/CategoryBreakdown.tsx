import { EventWithOptions } from "@/hooks/useActiveEvents";
import { getCategoryInfo, CATEGORY_STYLES, CategoryType } from "@/lib/categoryUtils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface CategoryBreakdownProps {
  events: EventWithOptions[];
}

const getCategoryColor = (label: string): string => {
  const style = CATEGORY_STYLES[label as CategoryType];
  return style ? `hsl(${style.hsl})` : "hsl(222 25% 55%)";
};

// Mock volume per category
const getMockCategoryVolume = (category: string, count: number) => {
  const hash = category.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return {
    totalVolume: (hash % 800 + 200) * count * 1000,
    volume24h: (hash % 200 + 50) * count * 1000,
  };
};

const formatVol = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n}`;
};

export const CategoryBreakdown = ({ events }: CategoryBreakdownProps) => {
  // Group by category
  const categoryMap = new Map<string, { count: number; label: string }>();
  events.forEach((e) => {
    const info = getCategoryInfo(e.category);
    const existing = categoryMap.get(info.label);
    if (existing) {
      existing.count++;
    } else {
      categoryMap.set(info.label, { count: 1, label: info.label });
    }
  });

  const categories = Array.from(categoryMap.entries()).map(([label, data]) => {
    const vol = getMockCategoryVolume(label, data.count);
    return {
      label,
      count: data.count,
      totalVolume: vol.totalVolume,
      volume24h: vol.volume24h,
      color: getCategoryColor(label),
    };
  }).sort((a, b) => b.totalVolume - a.totalVolume);

  const chartData = categories.map((c) => ({
    name: c.label,
    value: c.totalVolume,
  }));

  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground mb-4">Category Breakdown</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Donut Chart */}
        <div className="p-4 rounded-xl bg-card border border-border/30 flex items-center justify-center">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {categories.map((c, i) => (
                  <Cell key={i} fill={c.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [formatVol(value), "Volume"]}
                labelFormatter={(name) => name}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "hsl(var(--foreground))",
                  padding: "8px 12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                }}
                itemStyle={{ color: "hsl(var(--foreground))", fontSize: "12px" }}
                labelStyle={{ color: "hsl(var(--muted-foreground))", fontSize: "11px", marginBottom: "2px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Table */}
        <div className="md:col-span-2 rounded-xl bg-card border border-border/30 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 bg-muted/20">
                <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">Category</th>
                <th className="text-right py-2.5 px-4 text-xs font-medium text-muted-foreground">Markets</th>
                <th className="text-right py-2.5 px-4 text-xs font-medium text-muted-foreground">Total Volume</th>
                <th className="text-right py-2.5 px-4 text-xs font-medium text-muted-foreground">24h Volume</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.label} className="border-b border-border/20 last:border-0 hover:bg-muted/10 transition-colors">
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="text-xs font-medium text-foreground">{c.label}</span>
                    </div>
                  </td>
                  <td className="text-right py-2.5 px-4 text-xs text-foreground font-mono">{c.count}</td>
                  <td className="text-right py-2.5 px-4 text-xs text-foreground font-mono">{formatVol(c.totalVolume)}</td>
                  <td className="text-right py-2.5 px-4 text-xs text-foreground font-mono">{formatVol(c.volume24h)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
