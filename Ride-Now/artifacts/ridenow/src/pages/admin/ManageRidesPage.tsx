import { useState } from "react";
import { useGetAdminRides } from "@workspace/api-client-react";
import { Activity, Search } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

export default function ManageRidesPage() {
  const { data: rides, isLoading } = useGetAdminRides();
  const [filter, setFilter] = useState("all");

  const statusOptions = ["all", "requested", "accepted", "ongoing", "completed", "cancelled"];
  const filtered = rides?.filter(r => filter === "all" || r.status === filter) ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Manage Rides</h1>
        <p className="text-muted-foreground mt-1 text-sm">All rides on the platform</p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {statusOptions.map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
              filter === status
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-foreground hover:border-primary/50"
            }`}
          >
            {status === "all" ? "All Rides" : status}
          </button>
        ))}
      </div>

      <div className="bg-card border border-card-border rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Activity size={40} className="text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No rides found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">#</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Customer</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Route</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Fare</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ride, i) => (
                <tr key={ride.id} className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">#{ride.id}</td>
                  <td className="px-5 py-3.5 text-sm text-foreground">{ride.customerName ?? "Unknown"}</td>
                  <td className="px-5 py-3.5">
                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">{ride.pickupAddress}</p>
                    <p className="text-xs text-foreground truncate max-w-[180px]">{ride.dropoffAddress}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-medium text-foreground capitalize">{ride.rideType}</span>
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge status={ride.status} /></td>
                  <td className="px-5 py-3.5 text-sm font-medium text-foreground">
                    {ride.fare ? `$${Number(ride.fare).toFixed(2)}` : "-"}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">
                    {new Date(ride.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
