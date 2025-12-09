'use client';

import { useState } from 'react';
import Image from 'next/image';

type ListingImageGalleryProps = {
  photos: string[];
};

export function ListingImageGallery({ photos }: ListingImageGalleryProps) {
  const imageList =
    Array.isArray(photos) && photos.length > 0
      ? photos
      : ['/placeholder-house.jpg']; // adjust placeholder path if needed

  const [mainImage, setMainImage] = useState(imageList[0]);

  return (
    <div className="flex flex-col h-full">
      <div className="relative flex-grow h-64 md:h-96">
        <Image
          src={mainImage}
          alt="Main listing image"
          fill
          style={{ objectFit: 'cover' }}
          className="bg-slate-200"
        />
      </div>
      {imageList.length > 1 && (
        <div className="flex space-x-2 p-2 bg-slate-100 dark:bg-slate-800">
          {imageList.slice(0, 5).map((photo, index) => (
            <button
              type="button"
              key={index}
              className="relative w-20 h-20 rounded-md overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              onMouseEnter={() => setMainImage(photo)}
              onClick={() => setMainImage(photo)}
            >
              <Image
                src={photo}
                alt={`Thumbnail ${index + 1}`}
                fill
                style={{ objectFit: 'cover' }}
                className={
                  mainImage === photo ? 'ring-2 ring-blue-500' : 'ring-0'
                }
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
