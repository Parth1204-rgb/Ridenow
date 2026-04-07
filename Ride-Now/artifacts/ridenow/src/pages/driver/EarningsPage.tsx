import { useGetDriverEarnings } from "@workspace/api-client-react";
import { DollarSign, Car, Star, TrendingUp, Calendar, Clock } from "lucide-react";

export default function EarningsPage() {
  const { data: earnings, isLoading } = useGetDriverEarnings();

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-28 bg-card border border-card-border rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Total Earnings", value: `$${Number(earnings?.totalEarnings ?? 0).toFixed(2)}`, icon: <DollarSign size={20} className="text-primary" />, bg: "bg-primary/5" },
    { label: "Today", value: `$${Number(earnings?.todayEarnings ?? 0).toFixed(2)}`, icon: <Clock size={20} className="text-blue-500" />, bg: "bg-blue-500/5" },
    { label: "This Week", value: `$${Number(earnings?.weekEarnings ?? 0).toFixed(2)}`, icon: <Calendar size={20} className="text-green-500" />, bg: "bg-green-500/5" },
    { label: "Total Rides", value: earnings?.totalRides ?? 0, icon: <Car size={20} className="text-purple-500" />, bg: "bg-purple-500/5" },
    { label: "Completed", value: earnings?.completedRides ?? 0, icon: <TrendingUp size={20} className="text-green-500" />, bg: "bg-green-500/5" },
    { label: "Rating", value: earnings?.averageRating ? Number(earnings.averageRating).toFixed(1) : "N/A", icon: <Star size={20} className="text-yellow-500" />, bg: "bg-yellow-500/5" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Earnings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Your earnings and performance summary</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className={`bg-card border border-card-border rounded-2xl p-5 shadow-sm`}>
            <div className={`inline-flex p-2 rounded-lg ${stat.bg} mb-3`}>
              {stat.icon}
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Earnings breakdown */}
      <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground mb-4">Earnings Breakdown</h2>
        <div className="space-y-3">
          {[
            { label: "Platform fee (20%)", value: -Number(earnings?.totalEarnings ?? 0) * 0.2 },
            { label: "Net earnings", value: Number(earnings?.totalEarnings ?? 0) * 0.8 },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className={`text-sm font-semibold ${item.value < 0 ? "text-destructive" : "text-foreground"}`}>
                {item.value < 0 ? "-" : ""}${Math.abs(item.value).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
