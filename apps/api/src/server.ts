import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import listingsRouter from "./routes/listings.route";
import leadsRouter from "./routes/leads.route";
import toursRouter from "./routes/tours.route";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://192.168.4.197:3000",
  "http://192.168.4.197:3001",
];

app.use(
  cors({
    origin: (origin, callback) => {
      const isDev = process.env.NODE_ENV !== "production";
      if (!origin) return callback(null, true);
      if (isDev) return callback(null, true);
      return callback(null, allowedOrigins.includes(origin));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("*", cors());
app.use(express.json());

app.use("/api/listings", listingsRouter);
app.use("/api", leadsRouter);
app.use("/api/tours", toursRouter);
app.use("/api/v1/tours", toursRouter);

app.get("/health", (req, res) => {
  res.status(200).send("API is healthy and running.");
});

app.listen(PORT, () => {
  console.log(`[API] Server running on http://localhost:${PORT}`);
  console.log(
    `[API] Routes exposed: GET /health, GET /api/listings, GET /api/listings/:id, POST /api/v1/leads`
  );
});
