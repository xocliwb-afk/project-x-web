import { Listing, SearchRequest } from "@project-x/shared-types";

export interface IListingProvider {
  searchListings(request: SearchRequest): Promise<Listing[]>;
  getListingById(id: string): Promise<Listing | null>;
  healthCheck(): Promise<boolean>;
}
