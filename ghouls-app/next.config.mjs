/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            // This is the master key. It allows React to compile (unsafe-eval) 
            // and explicitly opens the gate for WebSockets on Port 4000.
            value: "default-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' ws://localhost:4000 http://localhost:4000 ws://127.0.0.1:4000 http://127.0.0.1:4000; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
          }
        ]
      }
    ];
  }
};

export default nextConfig;