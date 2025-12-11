/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    TELEGRAM_BOT_SERBIA: process.env.TELEGRAM_BOT_SERBIA,
  }
}

module.exports = nextConfig

