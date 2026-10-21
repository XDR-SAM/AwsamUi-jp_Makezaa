/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    // Retire the old standalone URLs in favor of their existing home sections.
    return [
      { source: '/about', destination: '/#about', permanent: true },
      { source: '/services', destination: '/#features', permanent: true },
      { source: '/book-meeting', destination: '/#book-meeting', permanent: true },
      { source: '/projects/nike-air-max-shoe-web-design', destination: '/projects/nike-air-max-showcase', permanent: true },
    ];
  },
  async headers() {
    return ['/admin/:path*', '/auth/:path*', '/api/:path*', '/todos/:path*', '/.well-known/:path*'].map(source => ({
      source,
      headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
    }));
  },
}

export default nextConfig
