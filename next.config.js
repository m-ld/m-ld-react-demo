/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, options) => ({
    ...config,
    experiments: {
      // Should only be required while we're using jsonld.js for contexts
      // (because of how it uses http-client, which uses ky). Should go away
      // when we switch to jsonld-context-parser.
      topLevelAwait: true,
    },
  }),
};

module.exports = nextConfig;
