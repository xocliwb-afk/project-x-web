import { ListingProvider } from '../providers/listing-provider.interface';
import { MockListingProvider } from '../providers/mock-listing.provider';

/**
 * Factory to choose the active ListingProvider implementation.
 *
 * For now, we only have MockListingProvider implemented.
 * When a real SimplyRETS provider exists, it can be wired in via DATA_PROVIDER.
 */
export function getListingProvider(): ListingProvider {
  const providerName = process.env.DATA_PROVIDER?.toLowerCase();

  switch (providerName) {
    case 'simplyrets':
      // TODO: wire in a real SimplyRETS provider implementation.
      console.warn(
        '[ProviderFactory] DATA_PROVIDER=simplyrets selected, but SimplyRETS provider is not implemented yet. Falling back to mock.',
      );
      return new MockListingProvider();

    case 'mock':
    default:
      return new MockListingProvider();
  }
}
