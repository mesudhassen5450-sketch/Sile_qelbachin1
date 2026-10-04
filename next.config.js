/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async rewrites() {
    // Same-origin proxy → Admin CMS (local :3001 or production Admin)
    const cms =
      process.env.CMS_REWRITE_TARGET ||
      process.env.NEXT_PUBLIC_CMS_API_BASE ||
      'https://admin.sileqelbachin1.com/api/public/v1'
    return [
      {
        source: '/api/cms/:path*',
        destination: `${cms.replace(/\/+$/, '')}/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
