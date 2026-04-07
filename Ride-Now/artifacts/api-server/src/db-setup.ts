import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";
import bcryptjs from "bcryptjs";
import * as schema from "@workspace/db";

export async function setupDatabase() {
  const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), "ridenow.db");
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  // Create all tables
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      phone TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      is_online INTEGER NOT NULL DEFAULT 0,
      total_earnings REAL NOT NULL DEFAULT 0,
      total_rides INTEGER NOT NULL DEFAULT 0,
      rating REAL,
      vehicle_info TEXT,
      license_number TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      year INTEGER NOT NULL,
      license_plate TEXT NOT NULL UNIQUE,
      vehicle_type TEXT NOT NULL,
      is_available INTEGER NOT NULL DEFAULT 1,
      rate_per_hour REAL,
      rate_per_km REAL,
      driver_id INTEGER REFERENCES drivers(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS rides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES users(id),
      driver_id INTEGER REFERENCES drivers(id),
      pickup_address TEXT NOT NULL,
      dropoff_address TEXT NOT NULL,
      ride_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'requested',
      fare REAL,
      distance REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES users(id),
      vehicle_id INTEGER REFERENCES vehicles(id),
      booking_type TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      total_amount REAL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Seed demo data only if users table is empty
  const userCount = (sqlite.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number }).count;
  if (userCount === 0) {
    const hash = async (pw: string) => bcryptjs.hash(pw, 10);

    const insertUser = sqlite.prepare(
      "INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)"
    );
    const insertDriver = sqlite.prepare(
      "INSERT INTO drivers (user_id, is_online, total_earnings, total_rides, rating) VALUES (?, ?, ?, ?, ?)"
    );
    const insertVehicle = sqlite.prepare(
      "INSERT INTO vehicles (make, model, year, license_plate, vehicle_type, is_available, rate_per_hour, rate_per_km) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );
    const insertRide = sqlite.prepare(
      "INSERT INTO rides (customer_id, driver_id, pickup_address, dropoff_address, ride_type, status, fare, distance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );

    const password = await hash("password123");

    // Admin
    const adminResult = insertUser.run("Admin User", "admin@ridenow.com", password, "admin", "+1 (555) 000-0001");

    // Driver 1
    const d1Result = insertUser.run("John Driver", "driver1@ridenow.com", password, "driver", "+1 (555) 000-0002");
    const driver1 = insertDriver.run(d1Result.lastInsertRowid, 1, 820.50, 45, 4.8);

    // Driver 2
    const d2Result = insertUser.run("Sarah Driver", "driver2@ridenow.com", password, "driver", "+1 (555) 000-0003");
    const driver2 = insertDriver.run(d2Result.lastInsertRowid, 0, 1250.00, 68, 4.9);

    // Customer
    const custResult = insertUser.run("Jane Customer", "customer@ridenow.com", password, "customer", "+1 (555) 000-0004");

    // Vehicles
    insertVehicle.run("Toyota", "Camry", 2022, "RN-001", "cab", 1, 15, 1.5);
    insertVehicle.run("Honda", "CBR 500", 2023, "RN-002", "bike", 1, 8, 1.0);
    insertVehicle.run("Ford", "Explorer", 2021, "RN-003", "suv", 1, 25, 2.0);

    // Sample completed rides
    insertRide.run(custResult.lastInsertRowid, driver1.lastInsertRowid, "123 Main St, Downtown", "456 Oak Ave, Uptown", "cab", "completed", 12.50, 7);
    insertRide.run(custResult.lastInsertRowid, driver2.lastInsertRowid, "Airport Terminal 1", "Grand Hotel, City Center", "cab", "completed", 35.00, 22);
    insertRide.run(custResult.lastInsertRowid, driver1.lastInsertRowid, "Green Park", "Shopping Mall", "bike", "completed", 7.00, 5);
    insertRide.run(custResult.lastInsertRowid, null, "Home Street 10", "Office Tower, Business District", "cab", "requested", 18.00, 10.5);

    console.log("[db-setup] Database seeded with demo data");
  }

  console.log("[db-setup] Database ready at:", dbPath);
}
