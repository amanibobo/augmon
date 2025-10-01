import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@libsql/client', '@libsql/hrana-client'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('@libsql/client', '@libsql/hrana-client');
    }
    
    // Ignore problematic files
    config.module.rules.push({
      test: /\.(md|txt|node|LICENSE)$/,
      use: 'ignore-loader',
    });
    
    return config;
  },
};

export default nextConfig;
