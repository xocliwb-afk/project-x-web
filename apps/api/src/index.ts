import express from "express";
import cors from "cors";
import { mockListings } from "./data/mockListings";
import type {
  ListingSearchParams,
  ListingStatus,
  PropertyType,
} from "@project-x/shared-types";

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- Helper Parsers ---
function toNumber(value: unknown): number | undefined {
  if (typeof value !== "string") return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function toStatus(value: unknown): ListingStatus | undefined {
  if (typeof value !== "string") return undefined;
  const valid = ["FOR_SALE", "PENDING", "SOLD"];
  return valid.includes(value) ? (value as ListingStatus) : undefined;
}

function toPropertyType(value: unknown): PropertyType | undefined {
  if (typeof value !== "string") return undefined;
  const valid = ["Single Family", "Condo", "Multi-Family", "Land"];
  return valid.includes(value) ? (value as PropertyType) : undefined;
}

// --- Route ---
app.get("/api/listings", (req, res) => {
  const query = req.query;

  // 1. Parse URL params into Domain Object
  const params: ListingSearchParams = {
    q: query.q as string,
    minPrice: toNumber(query.minPrice),
    maxPrice: toNumber(query.maxPrice),
    minBeds: toNumber(query.minBeds),
    minBaths: toNumber(query.minBaths),
    status: toStatus(query.status),
    propertyType: toPropertyType(query.propertyType),
    minSqft: toNumber(query.minSqft),
    maxDaysOnMarket: toNumber(query.maxDaysOnMarket),
  };

  // 2. Filter Logic
  let results = mockListings.filter((l) => {
    // Text Search
    if (params.q) {
      const q = params.q.toLowerCase();
      const text = `${l.address.street} ${l.address.city} ${l.address.zip} ${
        l.address.neighborhood || ""
      }`.toLowerCase();
      if (!text.includes(q)) return false;
    }

    // Ranges & Enums
    if (params.minPrice && l.details.price < params.minPrice) return false;
    if (params.maxPrice && l.details.price > params.maxPrice) return false;
    if (params.minBeds && l.details.beds < params.minBeds) return false;
    if (params.minBaths && l.details.baths < params.minBaths) return false;
    if (params.status && l.details.status !== params.status) return false;
    if (
      params.propertyType &&
      l.details.propertyType !== params.propertyType
    )
      return false;
    if (params.minSqft && l.details.sqft < params.minSqft) return false;
    if (
      params.maxDaysOnMarket &&
      l.meta.daysOnMarket > params.maxDaysOnMarket
    )
      return false;

    return true;
  });

  res.json(results);
});

app.listen(port, () => {
  console.log(`API running on port ${port}`);
});