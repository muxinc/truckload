const { withWorkflow } = require('workflow/next');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@workflow/world-local', '@workflow/world-vercel'],
  },
  images: {
    domains: ['image.mux.com'],
  },
};

module.exports = withWorkflow(nextConfig);
