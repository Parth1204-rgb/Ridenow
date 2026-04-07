import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, driversTable, usersTable, ridesTable } from "@workspace/db";
import { AcceptRideParams } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

async function enrichRide(ride: typeof ridesTable.$inferSelect) {
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
}

router.get("/drivers/me", requireRole("driver"), async (req, res): Promise<void> => {
  const [driver] = await db.select().from(driversTable).where(eq(driversTable.userId, req.user!.userId));
  if (!driver) {
    res.status(404).json({ error: "Driver profile not found" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));

  res.json({
    id: driver.id,
    userId: driver.userId,
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? null,
    isOnline: driver.isOnline,
    totalEarnings: Number(driver.totalEarnings),
    totalRides: driver.totalRides,
    rating: driver.rating ? Number(driver.rating) : null,
    vehicleInfo: driver.vehicleInfo,
    licenseNumber: driver.licenseNumber,
    createdAt: driver.createdAt,
  });
});

router.patch("/drivers/toggle-status", requireRole("driver"), async (req, res): Promise<void> => {
  const [driver] = await db.select().from(driversTable).where(eq(driversTable.userId, req.user!.userId));
  if (!driver) {
    res.status(404).json({ error: "Driver not found" });
    return;
  }

  const [updated] = await db.update(driversTable)
    .set({ isOnline: !driver.isOnline })
    .where(eq(driversTable.id, driver.id))
    .returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));

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

router.get("/drivers/earnings", requireRole("driver"), async (req, res): Promise<void> => {
  const [driver] = await db.select().from(driversTable).where(eq(driversTable.userId, req.user!.userId));
  if (!driver) {
    res.status(404).json({ error: "Driver not found" });
    return;
  }

  const completedRides = await db.select().from(ridesTable)
    .where(eq(ridesTable.driverId, driver.id));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const todayRides = completedRides.filter(r => r.status === "completed" && r.updatedAt >= today);
  const weekRides = completedRides.filter(r => r.status === "completed" && r.updatedAt >= weekAgo);

  const todayEarnings = todayRides.reduce((sum, r) => sum + Number(r.fare ?? 0), 0);
  const weekEarnings = weekRides.reduce((sum, r) => sum + Number(r.fare ?? 0), 0);
  const completedCount = completedRides.filter(r => r.status === "completed").length;

  res.json({
    totalEarnings: Number(driver.totalEarnings),
    todayEarnings: Math.round(todayEarnings * 100) / 100,
    weekEarnings: Math.round(weekEarnings * 100) / 100,
    totalRides: driver.totalRides,
    completedRides: completedCount,
    averageRating: driver.rating ? Number(driver.rating) : null,
  });
});

router.get("/drivers/available-rides", requireRole("driver"), async (req, res): Promise<void> => {
  const rides = await db.select().from(ridesTable)
    .where(eq(ridesTable.status, "requested"))
    .orderBy(desc(ridesTable.createdAt));

  const enriched = await Promise.all(rides.map(enrichRide));
  res.json(enriched);
});

router.patch("/drivers/:id/accept-ride/:rideId", requireRole("driver"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const rawRideId = Array.isArray(req.params.rideId) ? req.params.rideId[0] : req.params.rideId;
  const params = AcceptRideParams.safeParse({ id: parseInt(rawId, 10), rideId: parseInt(rawRideId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [driver] = await db.select().from(driversTable).where(eq(driversTable.id, params.data.id));
  if (!driver || driver.userId !== req.user!.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [ride] = await db.update(ridesTable)
    .set({ driverId: params.data.id, status: "accepted", updatedAt: new Date() })
    .where(eq(ridesTable.id, params.data.rideId))
    .returning();

  if (!ride) {
    res.status(404).json({ error: "Ride not found" });
    return;
  }

  const enriched = await enrichRide(ride);
  res.json(enriched);
});

export default router;
