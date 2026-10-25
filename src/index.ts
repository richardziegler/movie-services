import express, { type Request, type Response, type NextFunction } from "express";
import swaggerUi from "swagger-ui-express";
import openapi from "../openapi.json";
import router from "./routes";
import { initDatabase, closeAllConnections } from "./connections";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.get("/openapi.json", (_req, res) => res.json(openapi));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi, {
  swaggerOptions: { validatorUrl: null },
}));
app.use(router);

app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  console.error("Request failed:", error);
  if (res.headersSent) {
    next(error);
    return;
  }

  // Preserve client errors from middleware, such as invalid JSON (400).
  const status = error && typeof error === "object" && "status" in error ? error.status : 500;
  const statusCode = typeof status === "number" && Number.isInteger(status) &&
    status >= 400 && status < 500 ? status : 500;
  res.status(statusCode).json({ error: statusCode === 500 ? "Internal server error" : "Invalid request" });
});

initDatabase().then((dbs) => {
  const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });

  let shuttingDown = false;
  const shutdown = () => {
    if (shuttingDown) return;
    shuttingDown = true;
    server.close(() => {
      closeAllConnections(dbs).catch((error) => {
        console.error("Error closing databases:", error);
        process.exitCode = 1;
      });
    });
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
  server.once("error", (error) => {
    console.error("HTTP server error:", error);
    process.exitCode = 1;
    shutdown();
  });
}).catch((error) => {
  console.error("Failed to start movie API:", error);
  process.exitCode = 1;
});
