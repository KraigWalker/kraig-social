import path from "node:path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { closeDb, db } from "./db.js";

const migrationsFolder = path.resolve(process.cwd(), "drizzle");

try {
  console.log(`Running migrations from ${migrationsFolder}`);
  await migrate(db, { migrationsFolder });
  console.log("Migrations applied");
} catch (error) {
  console.error("Migration failed", error);
  process.exitCode = 1;
} finally {
  await closeDb();
}
