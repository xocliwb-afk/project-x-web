import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import listingsRouter from "./routes/listings.route";
import leadsRouter from "./routes/leads.route";
import toursRouter from "./routes/tours.route";
import { getListingById } from "./routes/listings.route";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
  })
);
app.use(express.json());

app.use("/api/listings", listingsRouter);
app.use("/api", leadsRouter);
app.use("/api/tours", toursRouter);
app.use("/api/v1/tours", toursRouter);

app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true, ts: new Date().toISOString() });
});
app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, ts: new Date().toISOString() });
});

app.get("/api/listing/:id", getListingById);
app.get("/api/listings/:id", getListingById);

app.listen(PORT, () => {
  console.log(`[API] Server running on http://localhost:${PORT}`);
  console.log(
    `[API] Routes exposed: GET /health, GET /api/listings, GET /api/listings/:id, POST /api/v1/leads`
  );
});
