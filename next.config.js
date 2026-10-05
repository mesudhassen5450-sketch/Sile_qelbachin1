/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // Monorepo: Admin lives under admincn-1.0.0 — keep tracing rooted here for Vercel
  outputFileTracingRoot: __dirname,
  async rewrites() {
    // Fallback proxy if App Router /api/cms is not hit. Prefer CMS_REWRITE_TARGET on Vercel.
    const cms =
      process.env.CMS_REWRITE_TARGET ||
      (process.env.NEXT_PUBLIC_CMS_API_BASE &&
      !String(process.env.NEXT_PUBLIC_CMS_API_BASE).includes('/api/cms')
        ? process.env.NEXT_PUBLIC_CMS_API_BASE
        : null) ||
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
