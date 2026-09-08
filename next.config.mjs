/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'telegraf', 'bcryptjs', 'ioredis'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org https://webk.telegram.org https://webz.telegram.org telegram: t.me;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
