import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import listingsRouter, { listingRouter } from "./routes/listings.route";
import leadsRouter from "./routes/leads.route";
import toursRouter from "./routes/tours.route";

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || ".env" });

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
  })
);
app.use(express.json());

app.use("/api/listings", listingsRouter);
app.use("/api/listing", listingRouter);
app.use("/api", leadsRouter);
app.use("/api/tours", toursRouter);
app.use("/api/v1/tours", toursRouter);

app.get("/health", (req, res) => {
  res.status(200).send("API is healthy and running.");
});

app.listen(PORT, () => {
  console.log(`[API] Server running on http://localhost:${PORT}`);
  console.log(
    `[API] Routes exposed: GET /health, GET /api/listings, GET /api/listings/:id, GET /api/listing/:id, POST /api/v1/leads`
  );
});
