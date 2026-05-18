import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  skipTrailingSlashRedirect: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost', 'localhost:80', 'https://localhost'],
    }
  },
  async rewrites() {
    const gateway = process.env.API_GATEWAY_URL ?? 'http://api-gateway:8080';
    const services = ['core', 'forum', 'game', 'gamification'];
    const rules = services.flatMap((svc) => [
      { source: `/api/${svc}/:path*/`, destination: `${gateway}/api/${svc}/:path*/` },
      { source: `/api/${svc}/:path*`,  destination: `${gateway}/api/${svc}/:path*` },
      { source: `/api/${svc}/`,        destination: `${gateway}/api/${svc}/` },
    ]);
    return {
      beforeFiles: [
        { source: '/api/auth/graphql', destination: `${gateway}/api/auth/graphql` },
        ...rules,
      ],
    };
  },
};

export default nextConfig;
