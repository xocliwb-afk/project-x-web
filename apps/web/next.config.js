/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.photos.sparkplatform.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'd2bd5h5te3s67r.cloudfront.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's3-us-west-2.amazonaws.com',
        pathname: '/cdn.simplyrets.com/**',
      },
    ],
  },
  async rewrites() {
    const apiTarget =
      process.env.API_PROXY_TARGET ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://127.0.0.1:3002';

    const apiBase = apiTarget.replace(/\/+$/, '');

    const neighborhoodSlugs = [
      'grand-rapids',
      'ada',
      'byron-center',
      'caledonia',
      'east-grand-rapids',
      'grandville',
      'kentwood',
      'rockford',
      'wyoming',
    ];

    return {
      beforeFiles: [
        { source: '/api/:path*', destination: `${apiBase}/api/:path*` },
        { source: '/api/v1/:path*', destination: `${apiBase}/api/v1/:path*` },
        { source: '/', destination: '/marketing/index.html' },
        { source: '/buy', destination: '/marketing/buy.html' },
        { source: '/sell', destination: '/marketing/sell.html' },
        { source: '/build', destination: '/marketing/builder.html' },
        { source: '/builder', destination: '/marketing/builder.html' },
        { source: '/about', destination: '/marketing/about.html' },
        { source: '/neighborhoods', destination: '/marketing/neighborhoods.html' },
        ...neighborhoodSlugs.map((slug) => ({
          source: `/${slug}`,
          destination: `/marketing/${slug}.html`,
        })),
        { source: '/assets/:path*', destination: '/marketing/assets/:path*' },
        { source: '/style.css', destination: '/marketing/style.css' },
        { source: '/robots.txt', destination: '/marketing/robots.txt' },
        { source: '/sitemap.xml', destination: '/marketing/sitemap.xml' },
        { source: '/search.html', destination: '/search' },
      ],
    };
  },
};

module.exports = nextConfig;
