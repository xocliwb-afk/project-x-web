import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import listingsRouter from "./routes/listings.route";
import leadsRouter from "./routes/leads.route";
import toursRouter from "./routes/tours.route";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

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
