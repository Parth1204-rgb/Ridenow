import { useState } from "react";
import { useGetVehicles, useCreateVehicle, useUpdateVehicle, getGetVehiclesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Truck, Plus, X, ToggleLeft, ToggleRight } from "lucide-react";

type VehicleType = "cab" | "bike" | "suv" | "van";

export default function ManageVehiclesPage() {
  const queryClient = useQueryClient();
  const { data: vehicles, isLoading } = useGetVehicles();
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ make: "", model: "", year: 2023, licensePlate: "", vehicleType: "cab" as VehicleType, ratePerHour: 15, ratePerKm: 1.5 });
  const [error, setError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await createVehicle.mutateAsync({ data: { ...form } });
      queryClient.invalidateQueries({ queryKey: getGetVehiclesQueryKey() });
      setShowForm(false);
      setForm({ make: "", model: "", year: 2023, licensePlate: "", vehicleType: "cab", ratePerHour: 15, ratePerKm: 1.5 });
    } catch (err: unknown) {
      const e = err as { data?: { error?: string }; message?: string };
      setError(e?.data?.error ?? e?.message ?? "Failed to create vehicle");
    }
  };

  const toggleAvailability = async (id: number, isAvailable: boolean) => {
    await updateVehicle.mutateAsync({ id, data: { isAvailable: !isAvailable } });
    queryClient.invalidateQueries({ queryKey: getGetVehiclesQueryKey() });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manage Vehicles</h1>
          <p className="text-muted-foreground mt-1 text-sm">Fleet management</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? "Cancel" : "Add Vehicle"}
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground mb-4">New Vehicle</h2>
          <form onSubmit={handleCreate} className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Make</label>
              <input type="text" value={form.make} onChange={e => setForm(f => ({ ...f, make: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Model</label>
              <input type="text" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Year</label>
              <input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">License Plate</label>
              <input type="text" value={form.licensePlate} onChange={e => setForm(f => ({ ...f, licensePlate: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Type</label>
              <select value={form.vehicleType} onChange={e => setForm(f => ({ ...f, vehicleType: e.target.value as VehicleType }))}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                {["cab","bike","suv","van"].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Rate/Hour ($)</label>
              <input type="number" step="0.01" value={form.ratePerHour} onChange={e => setForm(f => ({ ...f, ratePerHour: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            {error && <div className="md:col-span-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</div>}
            <div className="md:col-span-3">
              <button type="submit" disabled={createVehicle.isPending} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60">
                {createVehicle.isPending ? "Creating..." : "Create Vehicle"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [1,2,3].map(i => <div key={i} className="h-44 bg-card border border-card-border rounded-2xl animate-pulse" />)
        ) : !vehicles || vehicles.length === 0 ? (
          <div className="md:col-span-3 bg-card border border-card-border rounded-2xl p-12 text-center">
            <Truck size={40} className="text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No vehicles registered</p>
          </div>
        ) : vehicles.map(vehicle => (
          <div key={vehicle.id} className="bg-card border border-card-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground">{vehicle.make} {vehicle.model}</h3>
                <p className="text-sm text-muted-foreground">{vehicle.year} · <span className="uppercase">{vehicle.vehicleType}</span></p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${vehicle.isAvailable ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                {vehicle.isAvailable ? "Available" : "Unavailable"}
              </span>
            </div>
            <div className="space-y-1 mb-4 text-sm text-muted-foreground">
              <p>Plate: <span className="text-foreground font-medium">{vehicle.licensePlate}</span></p>
              {vehicle.ratePerHour && <p>Rate: <span className="text-foreground font-medium">${Number(vehicle.ratePerHour)}/hr</span></p>}
            </div>
            <button
              onClick={() => toggleAvailability(vehicle.id, vehicle.isAvailable)}
              disabled={updateVehicle.isPending}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {vehicle.isAvailable ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} />}
              {vehicle.isAvailable ? "Mark Unavailable" : "Mark Available"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
