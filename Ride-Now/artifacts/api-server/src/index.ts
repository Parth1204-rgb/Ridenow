import "dotenv/config";
import "dotenv/config";
import { setupDatabase } from "./db-setup";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Setup DB (create tables + seed if needed) before starting server
setupDatabase()
  .then(async () => {
    const { default: app } = await import("./app");
    app.listen(port, (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }
      logger.info({ port }, "Server listening");
    });
  })
  .catch((err) => {
    logger.error({ err }, "Failed to set up database");
    process.exit(1);
  });
