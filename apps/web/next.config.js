const isProd = process.env.NODE_ENV === 'production';
const apiProxyTarget = process.env.API_PROXY_TARGET || 'http://localhost:3002';

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
    // Default to proxying API requests to the local API in dev; allow opt-in override in prod.
    if (isProd && !process.env.API_PROXY_TARGET) {
      return [];
    }

    return [
      {
        source: '/api/:path*',
        destination: `${apiProxyTarget}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
