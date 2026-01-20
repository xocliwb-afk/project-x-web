import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import listingsRouter from "./routes/listings.route";
import leadsRouter from "./routes/leads.route";
import toursRouter from "./routes/tours.route";
import aiRouter from "./routes/ai.route";
import geoRouter from "./routes/geo.route";

dotenv.config();

const app = express();
const resolvePort = () => {
  const argv = process.argv.slice(2);
  const flagIndex = argv.findIndex((a) => a === "--port" || a === "-p");
  if (flagIndex !== -1 && argv[flagIndex + 1]) {
    const fromArg = Number(argv[flagIndex + 1]);
    if (Number.isFinite(fromArg)) return fromArg;
  }
  const eqArg = argv.find((a) => a.startsWith("--port="));
  if (eqArg) {
    const fromEq = Number(eqArg.split("=")[1]);
    if (Number.isFinite(fromEq)) return fromEq;
  }

  const envPort = Number(process.env.PORT);
  if (Number.isFinite(envPort) && envPort > 0) return envPort;

  const npmConfigPort = Number(process.env.npm_config_port);
  if (Number.isFinite(npmConfigPort) && npmConfigPort > 0) return npmConfigPort;

  return 3002;
};

const PORT = resolvePort();

const parseAllowedOrigins = () => {
  const raw = process.env.ALLOWED_ORIGINS;
  if (raw) {
    return raw
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
  }
  // default: allow localhost/127.* for dev
  return undefined;
};

const allowedOrigins = parseAllowedOrigins();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // non-browser or curl

      if (!allowedOrigins) {
        // dev/default: allow localhost/127.*
        if (
          origin.startsWith("http://localhost:") ||
          origin.startsWith("http://127.0.0.1:")
        ) {
          return callback(null, true);
        }
        return callback(null, false);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("*", cors());
app.use(express.json());

app.use("/api/listings", listingsRouter);
app.use("/api/listing", listingsRouter);
app.use("/api", leadsRouter);
app.use("/api/tours", toursRouter);
app.use("/api/v1/tours", toursRouter);
app.use("/api/ai", aiRouter);
app.use("/api/geo", geoRouter);

app.get("/health", (req, res) => {
  res.status(200).send("API is healthy and running.");
});

app.listen(PORT, () => {
  console.log(`[API] Server running on http://localhost:${PORT}`);
  console.log(
    `[API] Routes exposed: GET /health, GET /api/listings, GET /api/listings/:id, GET /api/listing/:id (alias), POST /api/leads, POST /api/v1/leads`
  );
  if (allowedOrigins) {
    console.log(`[API] CORS: ALLOWED_ORIGINS set (${allowedOrigins.length} origins)`);
  } else {
    console.log("[API] CORS: default localhost/127.* origins allowed");
  }
});
