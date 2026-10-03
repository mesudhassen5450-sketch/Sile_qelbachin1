import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  basePath: process.env.BASEPATH ?? '',
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  // Nested under the public website Next app — pin root so we don't share parent .next lock
  outputFileTracingRoot: path.join(__dirname),
  turbopack: {
    root: path.join(__dirname)
  },
  // Large ders / video uploads (m4a, mp3, mp4) through proxy + route handlers
  experimental: {
    proxyClientMaxBodySize: '100mb',
    serverActions: {
      bodySizeLimit: '100mb'
    }
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
      },
      // Legacy flat CMS paths → current IA
      { source: '/content/kitabs', destination: '/content/library/kitabs', permanent: false },
      { source: '/content/pdfs', destination: '/content/library/pdfs', permanent: false },
      { source: '/content/video', destination: '/content/videos', permanent: false },
      { source: '/content/audio', destination: '/content/dawah/talks', permanent: false },
      { source: '/content/muhadara', destination: '/content/dawah/talks', permanent: false },
      { source: '/content/reminders', destination: '/content/dawah/reminders', permanent: false },
      { source: '/content/library/notes', destination: '/content/dawah/reminders', permanent: false },
    ]
  }
}

export default nextConfig
