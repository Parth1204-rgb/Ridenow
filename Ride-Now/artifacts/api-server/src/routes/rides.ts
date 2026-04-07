import { Router, type IRouter } from "express";
import { eq, and, desc, or } from "drizzle-orm";
import { db, ridesTable, usersTable, driversTable } from "@workspace/db";
import {
  CreateRideBody,
  GetRideParams,
  UpdateRideStatusParams,
  UpdateRideStatusBody,
  CancelRideParams,
  GetRidesQueryParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function calculateFare(distance: number, rideType: string): number {
  const baseFare = 2;
  const ratePerKm = rideType === "cab" ? 1.5 : 1.0;
  return Math.round((baseFare + distance * ratePerKm) * 100) / 100;
}

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

router.get("/rides", requireAuth, async (req, res): Promise<void> => {
  const params = GetRidesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  let query = db.select().from(ridesTable).$dynamic();

  const conditions = [];
  if (params.data.status) {
    conditions.push(eq(ridesTable.status, params.data.status as "requested" | "accepted" | "ongoing" | "completed" | "cancelled"));
  }
  if (params.data.customerId) {
    conditions.push(eq(ridesTable.customerId, params.data.customerId));
  }
  if (params.data.driverId) {
    conditions.push(eq(ridesTable.driverId, params.data.driverId));
  }

  if (req.user!.role === "customer" && !params.data.customerId) {
    conditions.push(eq(ridesTable.customerId, req.user!.userId));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const rides = await query.orderBy(desc(ridesTable.createdAt));
  const enriched = await Promise.all(rides.map(enrichRide));
  res.json(enriched);
});

router.post("/rides", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateRideBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { pickupAddress, dropoffAddress, rideType, distance } = parsed.data;
  const fare = calculateFare(distance, rideType);

  const [ride] = await db.insert(ridesTable).values({
    customerId: req.user!.userId,
    pickupAddress,
    dropoffAddress,
    rideType: rideType as "cab" | "bike",
    status: "requested",
    fare: fare,
    distance: distance,
  }).returning();

  const enriched = await enrichRide(ride);
  res.status(201).json(enriched);
});

router.get("/rides/history", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  let rides;

  if (req.user!.role === "driver") {
    const [driver] = await db.select().from(driversTable).where(eq(driversTable.userId, userId));
    if (!driver) {
      res.json([]);
      return;
    }
    rides = await db.select().from(ridesTable)
      .where(and(eq(ridesTable.driverId, driver.id), or(eq(ridesTable.status, "completed"), eq(ridesTable.status, "cancelled"))))
      .orderBy(desc(ridesTable.createdAt));
  } else {
    rides = await db.select().from(ridesTable)
      .where(and(eq(ridesTable.customerId, userId), or(eq(ridesTable.status, "completed"), eq(ridesTable.status, "cancelled"))))
      .orderBy(desc(ridesTable.createdAt));
  }

  const enriched = await Promise.all(rides.map(enrichRide));
  res.json(enriched);
});

router.get("/rides/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetRideParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [ride] = await db.select().from(ridesTable).where(eq(ridesTable.id, params.data.id));
  if (!ride) {
    res.status(404).json({ error: "Ride not found" });
    return;
  }

  const enriched = await enrichRide(ride);
  res.json(enriched);
});

router.patch("/rides/:id/status", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateRideStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateRideStatusBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [ride] = await db.update(ridesTable)
    .set({ status: body.data.status as "accepted" | "ongoing" | "completed" | "cancelled", updatedAt: new Date().toISOString() })
    .where(eq(ridesTable.id, params.data.id))
    .returning();

  if (!ride) {
    res.status(404).json({ error: "Ride not found" });
    return;
  }

  if (body.data.status === "completed" && ride.driverId) {
    const fareAmount = ride.fare ? Number(ride.fare) : 0;
    const [driver] = await db.select().from(driversTable).where(eq(driversTable.id, ride.driverId));
    if (driver) {
      await db.update(driversTable).set({
        totalEarnings: Number(driver.totalEarnings) + fareAmount,
        totalRides: driver.totalRides + 1,
      }).where(eq(driversTable.id, ride.driverId));
    }
  }

  const enriched = await enrichRide(ride);
  res.json(enriched);
});

router.patch("/rides/:id/cancel", requireAuth, async (req, res): Promise<void> => {
  const params = CancelRideParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [ride] = await db.update(ridesTable)
    .set({ status: "cancelled", updatedAt: new Date().toISOString() })
    .where(eq(ridesTable.id, params.data.id))
    .returning();

  if (!ride) {
    res.status(404).json({ error: "Ride not found" });
    return;
  }

  const enriched = await enrichRide(ride);
  res.json(enriched);
});

export default router;
