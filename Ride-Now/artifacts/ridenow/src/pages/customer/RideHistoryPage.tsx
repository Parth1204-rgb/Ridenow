import { useGetRideHistory } from "@workspace/api-client-react";
import { Clock, MapPin, Navigation, Car } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

export default function RideHistoryPage() {
  const { data: rides, isLoading } = useGetRideHistory();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ride History</h1>
        <p className="text-muted-foreground mt-1 text-sm">Your completed and cancelled rides</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card border border-card-border rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-3" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : !rides || rides.length === 0 ? (
        <div className="bg-card border border-card-border rounded-2xl p-12 text-center">
          <Clock size={48} className="text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-semibold text-foreground">No rides yet</h3>
          <p className="text-muted-foreground text-sm mt-1">Your completed rides will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rides.map(ride => (
            <div key={ride.id} className="bg-card border border-card-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${ride.rideType === "cab" ? "bg-yellow-100 dark:bg-yellow-900/20" : "bg-blue-100 dark:bg-blue-900/20"}`}>
                    <Car size={16} className={ride.rideType === "cab" ? "text-yellow-600 dark:text-yellow-400" : "text-blue-600 dark:text-blue-400"} />
                  </div>
                  <span className="text-sm font-medium text-foreground capitalize">{ride.rideType} Ride</span>
                </div>
                <StatusBadge status={ride.status} />
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2">
                  <Navigation size={14} className="text-green-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground">{ride.pickupAddress}</p>
                </div>
                <div className="w-px h-3 ml-[7px] bg-border" />
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground">{ride.dropoffAddress}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-3 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Fare</p>
                  <p className="text-sm font-semibold text-foreground">
                    {ride.fare ? `$${Number(ride.fare).toFixed(2)}` : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Distance</p>
                  <p className="text-sm font-semibold text-foreground">
                    {ride.distance ? `${Number(ride.distance).toFixed(1)} km` : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm font-semibold text-foreground">
                    {new Date(ride.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
