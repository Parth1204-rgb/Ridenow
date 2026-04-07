import { useGetAdminDashboard } from "@workspace/api-client-react";
import { Users, Car, DollarSign, Activity, TrendingUp, XCircle, Clock, Truck } from "lucide-react";

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useGetAdminDashboard();

  const statCards = stats ? [
    { label: "Total Users", value: stats.totalUsers, icon: <Users size={20} />, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Total Drivers", value: stats.totalDrivers, icon: <Car size={20} />, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Online Drivers", value: stats.activeDrivers, icon: <Activity size={20} />, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Total Rides", value: stats.totalRides, icon: <TrendingUp size={20} />, color: "text-primary", bg: "bg-primary/10" },
    { label: "Completed", value: stats.completedRides, icon: <TrendingUp size={20} />, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Cancelled", value: stats.cancelledRides, icon: <XCircle size={20} />, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "Pending", value: stats.pendingRides, icon: <Clock size={20} />, color: "text-yellow-500", bg: "bg-yellow-500/10" },
    { label: "Vehicles", value: stats.totalVehicles, icon: <Truck size={20} />, color: "text-blue-400", bg: "bg-blue-400/10" },
  ] : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">Platform overview and key metrics</p>
      </div>

      {/* Revenue highlight */}
      {stats && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-primary rounded-2xl p-6 text-primary-foreground">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={20} />
              <p className="font-medium">Total Revenue</p>
            </div>
            <p className="text-4xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
            <p className="text-primary-foreground/70 text-sm mt-1">All time</p>
          </div>
          <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              <DollarSign size={20} />
              <p className="font-medium text-foreground">Today's Revenue</p>
            </div>
            <p className="text-4xl font-bold text-foreground">${stats.todayRevenue.toFixed(2)}</p>
            <p className="text-muted-foreground text-sm mt-1">Today only</p>
          </div>
        </div>
      )}

      {/* Stats grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="h-28 bg-card border border-card-border rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map(stat => (
            <div key={stat.label} className="bg-card border border-card-border rounded-2xl p-5 shadow-sm">
              <div className={`inline-flex p-2 rounded-lg ${stat.bg} mb-3`}>
                <span className={stat.color}>{stat.icon}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
