import { useGetAnalytics } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { BarChart3 } from "lucide-react";

const COLORS = ["hsl(47,100%,50%)", "hsl(220,70%,55%)", "hsl(142,70%,45%)", "hsl(0,84%,60%)", "hsl(280,70%,55%)"];

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useGetAnalytics();

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-8 w-40 bg-muted rounded animate-pulse" />
        <div className="grid md:grid-cols-2 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-card border border-card-border rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1 text-sm">Platform performance and trends</p>
      </div>

      {!analytics || (analytics.dailyRides.length === 0 && analytics.ridesByType.length === 0) ? (
        <div className="bg-card border border-card-border rounded-2xl p-12 text-center">
          <BarChart3 size={48} className="text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-semibold text-foreground">No analytics data yet</h3>
          <p className="text-muted-foreground text-sm mt-1">Data will appear once rides are completed</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Daily rides */}
          {analytics.dailyRides.length > 0 && (
            <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-semibold text-foreground mb-4">Daily Rides (Last 14 days)</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={analytics.dailyRides}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar dataKey="count" fill="hsl(47,100%,50%)" radius={[4,4,0,0]} name="Rides" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Revenue */}
            {analytics.dailyRides.length > 0 && (
              <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
                <h2 className="text-base font-semibold text-foreground mb-4">Daily Revenue</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={analytics.dailyRides}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                      formatter={(v: number) => [`$${v.toFixed(2)}`, "Revenue"]}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(142,70%,45%)" strokeWidth={2} dot={{ fill: "hsl(142,70%,45%)" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Rides by type */}
            {analytics.ridesByType.length > 0 && (
              <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
                <h2 className="text-base font-semibold text-foreground mb-4">Rides by Type</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={analytics.ridesByType} dataKey="count" nameKey="rideType" cx="50%" cy="50%" outerRadius={75} label={({ rideType, count }) => `${rideType}: ${count}`}>
                      {analytics.ridesByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Status breakdown */}
          {analytics.ridesByStatus.length > 0 && (
            <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-semibold text-foreground mb-4">Rides by Status</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {analytics.ridesByStatus.map((item, i) => (
                  <div key={item.status} className="text-center p-4 rounded-xl bg-muted/30">
                    <p className="text-2xl font-bold text-foreground">{item.count}</p>
                    <p className="text-xs text-muted-foreground capitalize mt-1">{item.status}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
