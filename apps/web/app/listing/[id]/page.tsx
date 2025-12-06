import { notFound } from "next/navigation";
import { mapNormalizedToListingDetail } from "../../../lib/mappers";
import type { NormalizedListing } from "../../../types";
import ListingImageGallery from "../../../components/ListingImageGallery";
import ListingInfo from "../../../components/ListingInfo";
import LeadForm from "../../../components/LeadForm";

interface ListingPageProps {
  params: { id: string };
}

export default async function ListingPage({ params }: ListingPageProps) {
  const res = await fetch(`http://localhost:3001/api/listings/${params.id}`, {
    cache: "no-store",
  });

  if (res.status === 404) {
    notFound();
  }

  if (!res.ok) {
    throw new Error("Failed to fetch listing");
  }

  const normalized: NormalizedListing = await res.json();
  const listing = mapNormalizedToListingDetail(normalized);

  return (
    <div className="h-full w-full overflow-y-auto bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <ListingImageGallery listing={listing} />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <ListingInfo listing={listing} />
          <LeadForm />
        </div>
      </div>
    </div>
  );
}