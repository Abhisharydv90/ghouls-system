/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self';",
          },
          // Vercel often handles server banner, but adding a custom header might help obscure it or prevent its display.
          // This specific header doesn't directly hide "Vercel", but it's a common security practice.
          // For Vercel, the "Server" header is usually managed by their infrastructure.
          // We'll focus on the other critical headers first.
        ],
      },
    ];
  },
};

module.exports = nextConfig;