import { sqliteTable, integer, real, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { driversTable } from "./drivers";

export const ridesTable = sqliteTable("rides", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").notNull().references(() => usersTable.id),
  driverId: integer("driver_id").references(() => driversTable.id),
  pickupAddress: text("pickup_address").notNull(),
  dropoffAddress: text("dropoff_address").notNull(),
  rideType: text("ride_type", { enum: ["cab", "bike"] }).notNull(),
  status: text("status", { enum: ["requested", "accepted", "ongoing", "completed", "cancelled"] }).notNull().default("requested"),
  fare: real("fare"),
  distance: real("distance"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const insertRideSchema = createInsertSchema(ridesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRide = z.infer<typeof insertRideSchema>;
export type Ride = typeof ridesTable.$inferSelect;
