import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  images: { formats: ['image/avif', 'image/webp'] },
  turbopack: { root: process.cwd() },
}

export default nextConfig
