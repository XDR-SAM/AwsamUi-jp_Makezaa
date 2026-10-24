/** @type {import('next').NextConfig} */
const nextConfig = {
  // Docker needs standalone output; Vercel uses its standard Next.js build.
  output: process.env.DOCKER_BUILD === '1' ? 'standalone' : undefined,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    // Retire the old standalone URLs in favor of their existing home sections.
    return [
      { source: '/llm.txt', destination: '/llms.txt', permanent: true },
      { source: '/agents.md', destination: '/Agent.md', permanent: true },
      { source: '/AGENTS.md', destination: '/Agent.md', permanent: true },
      { source: '/about', destination: '/#about', permanent: true },
      { source: '/services', destination: '/#features', permanent: true },
      { source: '/book-meeting', destination: '/#book-meeting', permanent: true },
      { source: '/projects/nike-air-max-shoe-web-design', destination: '/projects/nike-air-max-showcase', permanent: true },
    ];
  },
  async headers() {
    const discovery = ['/', '/blog/:path*', '/projects/:path*', '/contact', '/Agent.md'].map(source => ({
      source,
      headers: [{ key: 'Link', value: '</llms.txt>; rel="describedby"' }],
    }));
    const privateHeaders = ['/admin/:path*', '/auth/:path*', '/api/:path*', '/todos/:path*', '/.well-known/:path*'].map(source => ({
      source,
      headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
    }));
    return [...discovery, ...privateHeaders];
  },
}

export default nextConfig
