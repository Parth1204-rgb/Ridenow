import { sqliteTable, integer, real, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const driversTable = sqliteTable("drivers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  isOnline: integer("is_online", { mode: "boolean" }).notNull().default(false),
  totalEarnings: real("total_earnings").notNull().default(0),
  totalRides: integer("total_rides").notNull().default(0),
  rating: real("rating"),
  vehicleInfo: text("vehicle_info"),
  licenseNumber: text("license_number"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const insertDriverSchema = createInsertSchema(driversTable).omit({ id: true, createdAt: true });
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Driver = typeof driversTable.$inferSelect;
