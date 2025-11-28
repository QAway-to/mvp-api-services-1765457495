/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Enable server-side rendering for API routes
  experimental: {
    serverActions: false,
  },
}

module.exports = nextConfig

