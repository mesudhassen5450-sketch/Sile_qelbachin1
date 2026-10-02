/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async rewrites() {
    // Same-origin proxy → local Admin CMS (avoids browser CORS on :3001)
    const cms =
      process.env.CMS_REWRITE_TARGET || 'http://127.0.0.1:3001/api/public/v1'
    return [
      {
        source: '/api/cms/:path*',
        destination: `${cms.replace(/\/+$/, '')}/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
