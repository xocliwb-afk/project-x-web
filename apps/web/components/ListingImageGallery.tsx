"use client";
import Image from "next/image";
import type { ListingDetail } from "../types";

export default function ListingImageGallery({ listing }: { listing: ListingDetail }) {
  const [main, ...rest] = listing.photos;
  return (
    <section className="mb-6">
      <div className="grid gap-2 md:grid-cols-[2fr,1fr]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-border/40">
          {main && <Image src={main} alt={listing.addressLine1} fill className="object-cover" />}
        </div>
        <div className="grid grid-cols-2 grid-rows-2 gap-2">
          {rest.slice(0, 4).map((src, idx) => (
            <div key={idx} className="relative aspect-[4/3] overflow-hidden rounded-card bg-border/40">
              <Image src={src} alt={`Photo ${idx + 2}`} fill className="object-cover" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}