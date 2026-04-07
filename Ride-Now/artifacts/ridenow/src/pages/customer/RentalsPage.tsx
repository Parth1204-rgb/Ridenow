import { useState } from "react";
import { useGetVehicles, useCreateBooking, getGetBookingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Car, Truck, Bike, Calendar, CheckCircle } from "lucide-react";

const vehicleIcons: Record<string, typeof Car> = {
  cab: Car,
  bike: Bike,
  suv: Truck,
  van: Truck,
};

export default function RentalsPage() {
  const queryClient = useQueryClient();
  const { data: vehicles, isLoading } = useGetVehicles();
  const createBooking = useCreateBooking();
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);
  const [bookingType, setBookingType] = useState<"rental" | "self_drive">("rental");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const availableVehicles = vehicles?.filter(v => v.isAvailable) ?? [];

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;
    setError(""); setSuccess("");
    try {
      await createBooking.mutateAsync({
        data: {
          vehicleId: selectedVehicle,
          bookingType,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
        },
      });
      setSuccess("Booking confirmed! Check your bookings for details.");
      queryClient.invalidateQueries({ queryKey: getGetBookingsQueryKey() });
      setSelectedVehicle(null);
      setStartDate(""); setEndDate("");
    } catch (err: unknown) {
      const e = err as { data?: { error?: string }; message?: string };
      setError(e?.data?.error ?? e?.message ?? "Failed to create booking");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Rentals & Self Drive</h1>
        <p className="text-muted-foreground mt-1 text-sm">Browse vehicles and book for your trip</p>
      </div>

      {/* Booking type */}
      <div className="flex gap-3">
        {(["rental", "self_drive"] as const).map(type => (
          <button
            key={type}
            onClick={() => setBookingType(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
              bookingType === type
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:border-primary/50"
            }`}
          >
            {type === "rental" ? "With Driver" : "Self Drive"}
          </button>
        ))}
      </div>

      {/* Vehicle grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-card border border-card-border rounded-2xl animate-pulse" />)}
        </div>
      ) : availableVehicles.length === 0 ? (
        <div className="bg-card border border-card-border rounded-2xl p-12 text-center">
          <Car size={48} className="text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground">No vehicles available right now</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {availableVehicles.map(vehicle => {
            const Icon = vehicleIcons[vehicle.vehicleType] ?? Car;
            const isSelected = selectedVehicle === vehicle.id;
            return (
              <button
                key={vehicle.id}
                onClick={() => setSelectedVehicle(isSelected ? null : vehicle.id)}
                className={`text-left bg-card border-2 rounded-2xl p-5 transition-all shadow-sm hover:shadow-md ${
                  isSelected ? "border-primary" : "border-card-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${isSelected ? "bg-primary" : "bg-muted"}`}>
                    <Icon size={20} className={isSelected ? "text-primary-foreground" : "text-muted-foreground"} />
                  </div>
                  {isSelected && <CheckCircle size={18} className="text-primary" />}
                </div>
                <h3 className="font-semibold text-foreground">{vehicle.make} {vehicle.model}</h3>
                <p className="text-sm text-muted-foreground capitalize">{vehicle.vehicleType} · {vehicle.year}</p>
                {vehicle.ratePerHour && (
                  <p className="text-sm font-semibold text-primary mt-2">${Number(vehicle.ratePerHour).toFixed(0)}/hr</p>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Date picker */}
      <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-primary" />
          Select Dates
        </h2>
        <form onSubmit={handleBook} className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Start Date & Time</label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">End Date & Time</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          {error && (
            <div className="md:col-span-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3.5 py-2.5">
              {error}
            </div>
          )}
          {success && (
            <div className="md:col-span-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3.5 py-2.5">
              {success}
            </div>
          )}

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={createBooking.isPending}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {createBooking.isPending ? "Booking..." : "Confirm Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
