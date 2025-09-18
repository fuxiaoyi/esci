import nextI18NextConfig from "./next-i18next.config.js";

// @ts-check
/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 * This is especially useful for Docker builds.
 */
!process.env.SKIP_ENV_VALIDATION && (await import("./src/env/server.mjs"));

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: false,
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  // Optimize for Vercel deployment
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  /* If trying out the experimental appDir, comment the i18n config out
   * @see https://github.com/vercel/next.js/issues/41980 */
  i18n: nextI18NextConfig.i18n,
  webpack: function(config, options) {
    config.experiments = { asyncWebAssembly: true, layers: true };
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300
    };
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    })
    return config;
  },
  async rewrites() {
      return {
          beforeFiles: [
              {
                  source: '/((?!api|_next|_static|favicon.ico|zh|zhtw|en|hu|fr|de|it|ja|lt|ko|pl|pt|ro|ru|uk|es|nl|sk|hr|tr).*)',
                  has: [
                      {
                          type: 'host',
                          value: 'chat.e-sci.org',
                      },
                  ],
                  destination: '/',
              },
          ]
      }
  },
  // Ensure trailing slash is handled properly
  trailingSlash: false
};

export default config;
