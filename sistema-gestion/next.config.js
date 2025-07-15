/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["localhost"],
  },
  env: {
    DATABASE_URL: process.env.DATABASE_DATABASE_URL,
  },
};

module.exports = nextConfig;
