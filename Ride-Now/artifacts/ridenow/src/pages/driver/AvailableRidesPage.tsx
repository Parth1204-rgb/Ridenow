import { useGetAvailableRides, useAcceptRide, useGetDriverProfile, getGetAvailableRidesQueryKey, getGetDriverProfileQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { MapPin, Navigation, Car, DollarSign, CheckCircle } from "lucide-react";

export default function AvailableRidesPage() {
  const queryClient = useQueryClient();
  const { data: rides, isLoading } = useGetAvailableRides();
  const { data: driver } = useGetDriverProfile();
  const acceptRide = useAcceptRide();

  const handleAccept = async (rideId: number) => {
    if (!driver) return;
    await acceptRide.mutateAsync({ id: driver.id, rideId });
    queryClient.invalidateQueries({ queryKey: getGetAvailableRidesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDriverProfileQueryKey() });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Available Rides</h1>
        <p className="text-muted-foreground mt-1 text-sm">Pending ride requests in your area</p>
      </div>

      {!driver?.isOnline && (
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 text-sm text-yellow-800 dark:text-yellow-400">
          You are currently offline. Go online from your dashboard to accept rides.
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-card border border-card-border rounded-2xl animate-pulse" />)}
        </div>
      ) : !rides || rides.length === 0 ? (
        <div className="bg-card border border-card-border rounded-2xl p-12 text-center">
          <Car size={48} className="text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-semibold text-foreground">No available rides</h3>
          <p className="text-muted-foreground text-sm mt-1">New ride requests will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rides.map(ride => (
            <div key={ride.id} className="bg-card border border-card-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Car size={16} className="text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground capitalize">{ride.rideType} ride</span>
                </div>
                {ride.fare && (
                  <div className="flex items-center gap-1 text-primary font-bold">
                    <DollarSign size={16} />
                    {Number(ride.fare).toFixed(2)}
                  </div>
                )}
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

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {ride.distance && <span>{Number(ride.distance).toFixed(1)} km</span>}
                  <span>{new Date(ride.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <button
                  onClick={() => handleAccept(ride.id)}
                  disabled={acceptRide.isPending || !driver?.isOnline}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <CheckCircle size={15} />
                  Accept
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
