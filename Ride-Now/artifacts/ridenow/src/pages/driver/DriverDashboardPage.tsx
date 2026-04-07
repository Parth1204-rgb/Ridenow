import { useGetDriverProfile, useToggleDriverStatus, useGetRides, getGetDriverProfileQueryKey, getGetAvailableRidesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Power, MapPin, Navigation, TrendingUp, Car, DollarSign } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

export default function DriverDashboardPage() {
  const queryClient = useQueryClient();
  const { data: driver, isLoading } = useGetDriverProfile();
  const toggleStatus = useToggleDriverStatus();
  const { data: rides } = useGetRides({ status: "accepted" });

  const handleToggle = async () => {
    await toggleStatus.mutateAsync({});
    queryClient.invalidateQueries({ queryKey: getGetDriverProfileQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetAvailableRidesQueryKey() });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-card border border-card-border rounded-2xl animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-card border border-card-border rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  const activeRides = rides?.filter(r => r.driverId !== null) ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Driver Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">Welcome back, {driver?.name}</p>
      </div>

      {/* Status toggle */}
      <div className={`rounded-2xl p-6 border-2 ${driver?.isOnline ? "bg-green-50 dark:bg-green-900/10 border-green-500/30" : "bg-card border-card-border"}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <p className={`text-2xl font-bold mt-1 ${driver?.isOnline ? "text-green-600 dark:text-green-400" : "text-foreground"}`}>
              {driver?.isOnline ? "Online" : "Offline"}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {driver?.isOnline ? "You are receiving ride requests" : "Go online to start accepting rides"}
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={toggleStatus.isPending}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
              driver?.isOnline
                ? "bg-foreground text-background hover:opacity-80"
                : "bg-primary text-primary-foreground hover:opacity-90"
            } disabled:opacity-60`}
          >
            <Power size={16} />
            {driver?.isOnline ? "Go Offline" : "Go Online"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-card-border rounded-2xl p-5 shadow-sm">
          <DollarSign size={20} className="text-primary mb-2" />
          <p className="text-2xl font-bold text-foreground">${Number(driver?.totalEarnings ?? 0).toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Earnings</p>
        </div>
        <div className="bg-card border border-card-border rounded-2xl p-5 shadow-sm">
          <Car size={20} className="text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-foreground">{driver?.totalRides ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Rides</p>
        </div>
        <div className="bg-card border border-card-border rounded-2xl p-5 shadow-sm">
          <TrendingUp size={20} className="text-green-500 mb-2" />
          <p className="text-2xl font-bold text-foreground">
            {driver?.rating ? Number(driver.rating).toFixed(1) : "N/A"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Rating</p>
        </div>
      </div>

      {/* Current/recent rides */}
      <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground mb-4">Current Rides</h2>
        {activeRides.length === 0 ? (
          <div className="text-center py-8">
            <Car size={36} className="text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No active rides assigned</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeRides.map(ride => (
              <div key={ride.id} className="border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <StatusBadge status={ride.status} />
                  {ride.fare && <span className="font-semibold text-foreground">${Number(ride.fare).toFixed(2)}</span>}
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <Navigation size={14} className="text-green-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-foreground">{ride.pickupAddress}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-foreground">{ride.dropoffAddress}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
