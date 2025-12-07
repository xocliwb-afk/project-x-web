import { Router, Request, Response } from "express";
import { SearchRequest, ListingStatus } from "@project-x/shared-types";
import {
  applyListingsCompliance,
  applyListingCompliance,
} from "../services/compliance";
import { getListingProvider } from "../utils/provider.factory";

const router = Router();
const listingProvider = getListingProvider();

function parseSearchRequest(query: any): SearchRequest {
  const req: SearchRequest = {};

  // Basic text + price + beds
  if (query.q) req.query = String(query.q);
  if (query.priceMin) req.priceMin = Number(query.priceMin);
  if (query.priceMax) req.priceMax = Number(query.priceMax);
  if (query.bedsMin) req.bedsMin = Number(query.bedsMin);

  // Status: allow comma-separated or array
  if (query.status) {
    const statuses = Array.isArray(query.status)
      ? query.status
      : String(query.status).split(",");
    req.status = statuses
      .map((s: string) => s.toUpperCase().trim())
      .filter((s: string) =>
        ["FOR_SALE", "PENDING", "SOLD", "OFF_MARKET"].includes(s)
      ) as ListingStatus[];
  }

  // Pagination
  if (query.limit) req.limit = Number(query.limit);
  if (query.offset) req.offset = Number(query.offset);

  // --- Advanced filters (mapped from querystring names) ---

  // Size
  if (query.minSqft) req.sqftMin = Number(query.minSqft);
  if (query.maxSqft) req.sqftMax = Number(query.maxSqft);

  // Lot size (acres)
  if (query.minLotSize) req.lotSizeMinAcres = Number(query.minLotSize);

  // Year built range
  if (query.minYearBuilt) req.yearBuiltMin = Number(query.minYearBuilt);
  if (query.maxYearBuilt) req.yearBuiltMax = Number(query.maxYearBuilt);

  // Days on market
  if (query.maxDaysOnMarket) req.maxDaysOnMarket = Number(query.maxDaysOnMarket);

  // Keywords
  if (query.keywords) req.keywords = String(query.keywords);

  // Garage
  if (query.minGarageSpaces) req.minGarageSpaces = Number(query.minGarageSpaces);

  // HOA
  if (query.maxHoaFee) req.maxHoaFee = Number(query.maxHoaFee);

  // Stories
  if (query.stories) req.stories = Number(query.stories);

  // Basement
  if (query.basement) {
    const val = String(query.basement);
    const allowed = ["Finished", "Unfinished", "Partial", "None"];
    if (allowed.includes(val)) {
      req.basement = val as SearchRequest["basement"];
    }
  }

  // HVAC flags
  if (typeof query.hasCentralAir !== "undefined") {
    req.hasCentralAir = String(query.hasCentralAir) === "true";
  }
  if (typeof query.hasForcedAir !== "undefined") {
    req.hasForcedAir = String(query.hasForcedAir) === "true";
  }

  return req;
}

router.get("/", async (req: Request, res: Response) => {
  try {
    const searchRequest = parseSearchRequest(req.query);
    const rawListings = await listingProvider.searchListings(searchRequest);
    const compliantListings = applyListingsCompliance(rawListings);
    res.json(compliantListings);
  } catch (err) {
    console.error("Error during listings search:", err);
    res.status(500).json({ error: "Failed to fetch listings." });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const listing = await listingProvider.getListingById(req.params.id);
    if (!listing) {
      return res.status(404).json({ error: "Listing not found." });
    }
    const compliantListing = applyListingCompliance(listing);
    res.json(compliantListing);
  } catch (err) {
    console.error(`Error fetching listing ${req.params.id}:`, err);
    res.status(500).json({ error: "Failed to fetch listing details." });
  }
});

export default router;
