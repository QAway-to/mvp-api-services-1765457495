/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true, // For static export
  },
  experimental: {
    appDir: false, // Use pages directory
  },
  // Enable static export for Vercel
  output: 'export',
  trailingSlash: true,
}

module.exports = nextConfig
