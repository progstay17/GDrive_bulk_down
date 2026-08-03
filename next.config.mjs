/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["archiver"],
  },
};

export default nextConfig;
// Configured serverComponentsExternalPackages to exclude 'archiver' from Webpack server-side bundling.
