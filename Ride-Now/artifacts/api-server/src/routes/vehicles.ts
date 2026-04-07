import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, vehiclesTable } from "@workspace/db";
import { CreateVehicleBody, UpdateVehicleParams, UpdateVehicleBody } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

function serializeVehicle(v: typeof vehiclesTable.$inferSelect) {
  return {
    ...v,
    ratePerHour: v.ratePerHour ? Number(v.ratePerHour) : null,
    ratePerKm: v.ratePerKm ? Number(v.ratePerKm) : null,
  };
}

router.get("/vehicles", requireAuth, async (_req, res): Promise<void> => {
  const vehicles = await db.select().from(vehiclesTable).orderBy(vehiclesTable.createdAt);
  res.json(vehicles.map(serializeVehicle));
});

router.post("/vehicles", requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = CreateVehicleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [vehicle] = await db.insert(vehiclesTable).values({
    make: parsed.data.make,
    model: parsed.data.model,
    year: parsed.data.year,
    licensePlate: parsed.data.licensePlate,
    vehicleType: parsed.data.vehicleType as "cab" | "bike" | "suv" | "van",
    ratePerHour: parsed.data.ratePerHour?.toString() ?? null,
    ratePerKm: parsed.data.ratePerKm?.toString() ?? null,
    driverId: parsed.data.driverId ?? null,
    isAvailable: true,
  }).returning();

  res.status(201).json(serializeVehicle(vehicle));
});

router.patch("/vehicles/:id", requireRole("admin"), async (req, res): Promise<void> => {
  const params = UpdateVehicleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateVehicleBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (body.data.isAvailable !== undefined) updateData.isAvailable = body.data.isAvailable;
  if (body.data.ratePerHour !== undefined) updateData.ratePerHour = body.data.ratePerHour?.toString() ?? null;
  if (body.data.ratePerKm !== undefined) updateData.ratePerKm = body.data.ratePerKm?.toString() ?? null;
  if (body.data.driverId !== undefined) updateData.driverId = body.data.driverId;

  const [vehicle] = await db.update(vehiclesTable)
    .set(updateData)
    .where(eq(vehiclesTable.id, params.data.id))
    .returning();

  if (!vehicle) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }

  res.json(serializeVehicle(vehicle));
});

export default router;
