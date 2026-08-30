/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove 'output: export' to enable API routes on Netlify
  // Static export doesn't support serverless functions
  images: {
    unoptimized: true,
  },
  // Optional: enable standalone output for better performance
  // output: 'standalone',
}

module.exports = nextConfig 