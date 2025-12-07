import { IListingProvider } from "../providers/listing-provider.interface";
import { SimplyRetsListingProvider } from "../providers/simplyrets.provider";

export function getListingProvider(): IListingProvider {
  console.log("[ProviderFactory] Using SimplyRETS provider");
  return new SimplyRetsListingProvider();
}
