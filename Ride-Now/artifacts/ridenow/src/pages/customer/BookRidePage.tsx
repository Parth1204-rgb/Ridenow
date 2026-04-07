import { useState } from "react";
import { useCreateRide, useGetRides, getGetRidesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { MapPin, Navigation, Car, Bike, X } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

type RideType = "cab" | "bike";

const FARE_RATES: Record<RideType, number> = { cab: 1.5, bike: 1.0 };
const BASE_FARE = 2;

export default function BookRidePage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    pickupAddress: "",
    dropoffAddress: "",
    rideType: "cab" as RideType,
    distance: 5,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data: activeRides } = useGetRides({ status: "requested" });
  const createRide = useCreateRide();

  const estimatedFare = BASE_FARE + form.distance * FARE_RATES[form.rideType];

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await createRide.mutateAsync({ data: form });
      setSuccess("Ride requested successfully! A driver will be assigned shortly.");
      setForm(f => ({ ...f, pickupAddress: "", dropoffAddress: "" }));
      queryClient.invalidateQueries({ queryKey: getGetRidesQueryKey({ status: "requested" }) });
    } catch (err: unknown) {
      const e = err as { data?: { error?: string }; message?: string };
      setError(e?.data?.error ?? e?.message ?? "Failed to book ride");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Book a Ride</h1>
        <p className="text-muted-foreground mt-1 text-sm">Get where you need to go, fast and safely</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Booking form */}
        <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleBook} className="space-y-5">
            {/* Ride type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Ride Type</label>
              <div className="grid grid-cols-2 gap-3">
                {(["cab", "bike"] as RideType[]).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, rideType: type }))}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      form.rideType === type
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${form.rideType === type ? "bg-primary" : "bg-muted"}`}>
                      {type === "cab"
                        ? <Car size={18} className={form.rideType === type ? "text-primary-foreground" : "text-muted-foreground"} />
                        : <Bike size={18} className={form.rideType === type ? "text-primary-foreground" : "text-muted-foreground"} />
                      }
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm text-foreground capitalize">{type}</p>
                      <p className="text-xs text-muted-foreground">${FARE_RATES[type]}/km</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Pickup */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Pickup Location</label>
              <div className="relative">
                <Navigation size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-green-500" />
                <input
                  type="text"
                  value={form.pickupAddress}
                  onChange={e => setForm(f => ({ ...f, pickupAddress: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter pickup address"
                  required
                />
              </div>
            </div>

            {/* Dropoff */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Drop-off Location</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-red-500" />
                <input
                  type="text"
                  value={form.dropoffAddress}
                  onChange={e => setForm(f => ({ ...f, dropoffAddress: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter destination"
                  required
                />
              </div>
            </div>

            {/* Distance */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Estimated Distance: <span className="text-primary font-semibold">{form.distance} km</span>
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={form.distance}
                onChange={e => setForm(f => ({ ...f, distance: Number(e.target.value) }))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1 km</span>
                <span>50 km</span>
              </div>
            </div>

            {/* Fare estimate */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Estimated Fare</p>
                <p className="text-2xl font-bold text-foreground">${estimatedFare.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">${BASE_FARE} base + ${form.distance} km × ${FARE_RATES[form.rideType]}</p>
              </div>
              <div className="bg-primary rounded-xl p-3">
                <Car size={24} className="text-primary-foreground" />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3.5 py-2.5">
                <X size={14} />
                {error}
              </div>
            )}
            {success && (
              <div className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3.5 py-2.5">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={createRide.isPending}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {createRide.isPending ? "Requesting..." : "Request Ride"}
            </button>
          </form>
        </div>

        {/* Active rides */}
        <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground mb-4">Your Active Rides</h2>
          {!activeRides || activeRides.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Car size={40} className="text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No active rides</p>
              <p className="text-xs text-muted-foreground mt-1">Book a ride to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeRides.map(ride => (
                <div key={ride.id} className="border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {ride.rideType} ride
                    </span>
                    <StatusBadge status={ride.status} />
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
                  {ride.fare && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Fare</span>
                      <span className="font-semibold text-foreground">${Number(ride.fare).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
