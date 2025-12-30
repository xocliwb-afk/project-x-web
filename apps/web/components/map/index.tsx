'use client';

import dynamic from 'next/dynamic';

// Dynamically import MapClient with SSR disabled
const Map = dynamic(() => import('./MapClient'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
      Loading Map...
    </div>
  ),
});

export default Map;
