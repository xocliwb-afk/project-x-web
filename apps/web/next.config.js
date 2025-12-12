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
      {
        protocol: 'https',
        hostname: 's3-us-west-2.amazonaws.com',
        pathname: '/cdn.simplyrets.com/**',
      },
    ],
  },
};

module.exports = nextConfig;
