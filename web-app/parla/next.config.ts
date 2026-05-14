import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost', 'localhost:80', 'https://localhost'],
    }
  }
};

export default nextConfig;
