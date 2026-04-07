import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, usersTable, driversTable, ridesTable, vehiclesTable } from "@workspace/db";
import { UpdateDriverParams, UpdateDriverBody } from "@workspace/api-zod";
import { requireRole } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/admin/dashboard", requireRole("admin"), async (_req, res): Promise<void> => {
  const [userCount] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable);
  const [driverCount] = await db.select({ count: sql<number>`count(*)::int` }).from(driversTable);
  const [activeDriverCount] = await db.select({ count: sql<number>`count(*)::int` }).from(driversTable).where(eq(driversTable.isOnline, true));
  const [vehicleCount] = await db.select({ count: sql<number>`count(*)::int` }).from(vehiclesTable);

  const rides = await db.select().from(ridesTable);
  const totalRevenue = rides.filter(r => r.status === "completed").reduce((sum, r) => sum + Number(r.fare ?? 0), 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayRides = rides.filter(r => r.status === "completed" && r.updatedAt >= today);
  const todayRevenue = todayRides.reduce((sum, r) => sum + Number(r.fare ?? 0), 0);

  res.json({
    totalUsers: userCount?.count ?? 0,
    totalDrivers: driverCount?.count ?? 0,
    activeDrivers: activeDriverCount?.count ?? 0,
    totalRides: rides.length,
    completedRides: rides.filter(r => r.status === "completed").length,
    cancelledRides: rides.filter(r => r.status === "cancelled").length,
    pendingRides: rides.filter(r => r.status === "requested").length,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    todayRevenue: Math.round(todayRevenue * 100) / 100,
    totalVehicles: vehicleCount?.count ?? 0,
  });
});

router.get("/admin/drivers", requireRole("admin"), async (_req, res): Promise<void> => {
  const drivers = await db.select().from(driversTable)
    .innerJoin(usersTable, eq(driversTable.userId, usersTable.id))
    .orderBy(desc(driversTable.createdAt));

  res.json(drivers.map(d => ({
    id: d.drivers.id,
    userId: d.drivers.userId,
    name: d.users.name,
    email: d.users.email,
    phone: d.users.phone,
    isOnline: d.drivers.isOnline,
    totalEarnings: Number(d.drivers.totalEarnings),
    totalRides: d.drivers.totalRides,
    rating: d.drivers.rating ? Number(d.drivers.rating) : null,
    vehicleInfo: d.drivers.vehicleInfo,
    licenseNumber: d.drivers.licenseNumber,
    createdAt: d.drivers.createdAt,
  })));
});

router.patch("/admin/drivers/:id", requireRole("admin"), async (req, res): Promise<void> => {
  const params = UpdateDriverParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateDriverBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (body.data.isOnline !== undefined) updateData.isOnline = body.data.isOnline;
  if (body.data.licenseNumber !== undefined) updateData.licenseNumber = body.data.licenseNumber;
  if (body.data.vehicleInfo !== undefined) updateData.vehicleInfo = body.data.vehicleInfo;

  const [updated] = await db.update(driversTable)
    .set(updateData)
    .where(eq(driversTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Driver not found" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId));

  res.json({
    id: updated.id,
    userId: updated.userId,
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? null,
    isOnline: updated.isOnline,
    totalEarnings: Number(updated.totalEarnings),
    totalRides: updated.totalRides,
    rating: updated.rating ? Number(updated.rating) : null,
    vehicleInfo: updated.vehicleInfo,
    licenseNumber: updated.licenseNumber,
    createdAt: updated.createdAt,
  });
});

router.get("/admin/rides", requireRole("admin"), async (_req, res): Promise<void> => {
  const rides = await db.select().from(ridesTable)
    .orderBy(desc(ridesTable.createdAt));

  const enriched = await Promise.all(rides.map(async (ride) => {
    const [customer] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, ride.customerId));
    let driverName: string | null = null;
    if (ride.driverId) {
      const [driver] = await db.select({ name: usersTable.name }).from(usersTable)
        .innerJoin(driversTable, eq(driversTable.userId, usersTable.id))
        .where(eq(driversTable.id, ride.driverId));
      driverName = driver?.name ?? null;
    }
    return {
      ...ride,
      fare: ride.fare ? Number(ride.fare) : null,
      distance: ride.distance ? Number(ride.distance) : null,
      customerName: customer?.name ?? null,
      driverName,
    };
  }));

  res.json(enriched);
});

router.get("/admin/analytics", requireRole("admin"), async (_req, res): Promise<void> => {
  const rides = await db.select().from(ridesTable);

  const dailyMap = new Map<string, { count: number; revenue: number }>();
  for (const ride of rides) {
    const date = ride.createdAt.toISOString().split("T")[0];
    const existing = dailyMap.get(date) ?? { count: 0, revenue: 0 };
    existing.count++;
    if (ride.status === "completed") {
      existing.revenue += Number(ride.fare ?? 0);
    }
    dailyMap.set(date, existing);
  }

  const dailyRides = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, stats]) => ({
      date,
      count: stats.count,
      revenue: Math.round(stats.revenue * 100) / 100,
    }));

  const typeMap = new Map<string, number>();
  for (const ride of rides) {
    typeMap.set(ride.rideType, (typeMap.get(ride.rideType) ?? 0) + 1);
  }
  const ridesByType = Array.from(typeMap.entries()).map(([rideType, count]) => ({ rideType, count }));

  const statusMap = new Map<string, number>();
  for (const ride of rides) {
    statusMap.set(ride.status, (statusMap.get(ride.status) ?? 0) + 1);
  }
  const ridesByStatus = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }));

  res.json({ dailyRides, ridesByType, ridesByStatus });
});

export default router;
