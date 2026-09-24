import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  basePath: process.env.BASEPATH ?? '',
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  turbopack: {
    root: path.join(__dirname)
  },
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false
      },
      {
        source: '/apps/users',
        destination: '/apps/users/list',
        permanent: true
      }
    ]
  }
}

export default nextConfig
