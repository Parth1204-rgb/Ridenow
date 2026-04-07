import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, bookingsTable, usersTable, vehiclesTable } from "@workspace/db";
import { CreateBookingBody, GetBookingParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

async function enrichBooking(booking: typeof bookingsTable.$inferSelect) {
  const [customer] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, booking.customerId));
  let vehicleInfo: string | null = null;
  if (booking.vehicleId) {
    const [v] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, booking.vehicleId));
    if (v) vehicleInfo = `${v.make} ${v.model} (${v.year})`;
  }
  return {
    ...booking,
    totalAmount: booking.totalAmount ? Number(booking.totalAmount) : null,
    customerName: customer?.name ?? null,
    vehicleInfo,
  };
}

router.get("/bookings", requireAuth, async (req, res): Promise<void> => {
  let bookings;
  if (req.user!.role === "customer") {
    bookings = await db.select().from(bookingsTable)
      .where(eq(bookingsTable.customerId, req.user!.userId))
      .orderBy(desc(bookingsTable.createdAt));
  } else {
    bookings = await db.select().from(bookingsTable).orderBy(desc(bookingsTable.createdAt));
  }
  const enriched = await Promise.all(bookings.map(enrichBooking));
  res.json(enriched);
});

router.post("/bookings", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let totalAmount: number | null = null;
  if (parsed.data.vehicleId) {
    const [vehicle] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, parsed.data.vehicleId));
    if (vehicle) {
      const startDate = new Date(parsed.data.startDate);
      const endDate = new Date(parsed.data.endDate);
      const hours = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)));
      totalAmount = vehicle.ratePerHour ? Number(vehicle.ratePerHour) * hours : null;
    }
  }

  const [booking] = await db.insert(bookingsTable).values({
    customerId: req.user!.userId,
    vehicleId: parsed.data.vehicleId ?? null,
    bookingType: parsed.data.bookingType as "rental" | "self_drive",
    startDate: new Date(parsed.data.startDate),
    endDate: new Date(parsed.data.endDate),
    totalAmount: totalAmount?.toString() ?? null,
    status: "pending",
  }).returning();

  const enriched = await enrichBooking(booking);
  res.status(201).json(enriched);
});

router.get("/bookings/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, params.data.id));
  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const enriched = await enrichBooking(booking);
  res.json(enriched);
});

export default router;
