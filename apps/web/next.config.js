/** @type {import('next').NextConfig} */
const nextConfig = {
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
    ],
  },
};

module.exports = nextConfig;