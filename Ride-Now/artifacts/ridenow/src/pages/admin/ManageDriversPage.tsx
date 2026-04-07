import { useGetAdminDrivers, useUpdateDriver, getGetAdminDriversQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Users, Power, Star } from "lucide-react";

export default function ManageDriversPage() {
  const queryClient = useQueryClient();
  const { data: drivers, isLoading } = useGetAdminDrivers();
  const updateDriver = useUpdateDriver();

  const toggleOnline = async (id: number, isOnline: boolean) => {
    await updateDriver.mutateAsync({ id, data: { isOnline: !isOnline } });
    queryClient.invalidateQueries({ queryKey: getGetAdminDriversQueryKey() });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Manage Drivers</h1>
        <p className="text-muted-foreground mt-1 text-sm">View and manage all drivers</p>
      </div>

      <div className="bg-card border border-card-border rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
          </div>
        ) : !drivers || drivers.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={40} className="text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No drivers registered</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Driver</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Rides</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Earnings</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Rating</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver, i) => (
                <tr key={driver.id} className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
                        {driver.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{driver.name}</p>
                        <p className="text-xs text-muted-foreground">{driver.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${driver.isOnline ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${driver.isOnline ? "bg-green-500" : "bg-gray-400"}`} />
                      {driver.isOnline ? "Online" : "Offline"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-foreground">{driver.totalRides}</td>
                  <td className="px-5 py-3.5 text-sm font-medium text-foreground">${Number(driver.totalEarnings).toFixed(2)}</td>
                  <td className="px-5 py-3.5">
                    {driver.rating ? (
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star size={13} className="fill-current" />
                        <span className="text-sm text-foreground">{Number(driver.rating).toFixed(1)}</span>
                      </div>
                    ) : <span className="text-muted-foreground text-sm">-</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => toggleOnline(driver.id, driver.isOnline)}
                      disabled={updateDriver.isPending}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        driver.isOnline
                          ? "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                          : "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
                      } disabled:opacity-60`}
                    >
                      <Power size={12} />
                      {driver.isOnline ? "Deactivate" : "Activate"}
                    </button>
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
