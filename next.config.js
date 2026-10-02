const path = require('path')

/** Prefer relative aliases — absolute paths break Turbopack when the project path has spaces. */
const supabaseAliases = {
  '@supabase/supabase-js': './vendor/@supabase/supabase-js',
  '@supabase/ssr': './vendor/@supabase/ssr',
  '@supabase/auth-js': './vendor/@supabase/auth-js',
  '@supabase/functions-js': './vendor/@supabase/functions-js',
  '@supabase/postgrest-js': './vendor/@supabase/postgrest-js',
  '@supabase/realtime-js': './vendor/@supabase/realtime-js',
  '@supabase/storage-js': './vendor/@supabase/storage-js',
  '@supabase/phoenix': './vendor/@supabase/phoenix',
  'iceberg-js': './vendor/iceberg-js',
  tslib: './vendor/tslib',
}

const supabaseWebpackAliases = Object.fromEntries(
  Object.entries(supabaseAliases).map(([k, v]) => [k, path.resolve(__dirname, v)])
)

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
  transpilePackages: [
    '@supabase/ssr',
    '@supabase/supabase-js',
    '@supabase/auth-js',
    '@supabase/functions-js',
    '@supabase/postgrest-js',
    '@supabase/realtime-js',
    '@supabase/storage-js',
    'iceberg-js',
  ],
  turbopack: {
    resolveAlias: supabaseAliases,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      ...supabaseWebpackAliases,
    }
    return config
  },
}

module.exports = nextConfig
