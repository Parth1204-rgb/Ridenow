import { sqliteTable, integer, real, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { driversTable } from "./drivers";

export const vehiclesTable = sqliteTable("vehicles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  licensePlate: text("license_plate").notNull().unique(),
  vehicleType: text("vehicle_type", { enum: ["cab", "bike", "suv", "van"] }).notNull(),
  isAvailable: integer("is_available", { mode: "boolean" }).notNull().default(true),
  ratePerHour: real("rate_per_hour"),
  ratePerKm: real("rate_per_km"),
  driverId: integer("driver_id").references(() => driversTable.id),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const insertVehicleSchema = createInsertSchema(vehiclesTable).omit({ id: true, createdAt: true });
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehiclesTable.$inferSelect;
