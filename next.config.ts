import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ['@apollo/client'],
  // This helps resolve the /core issue
  // webpack: (config) => {
  //   config.resolve.alias = {
  //     ...config.resolve.alias,
  //     '@apollo/client': require.resolve('@apollo/client'),
  //   };
  //   return config;
  // },
};

export default nextConfig;
