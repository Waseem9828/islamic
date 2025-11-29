/** @type {import('next').NextConfig} */
const nextConfig = {
  // Setting this to true will disable optimizations and tree-shaking.
  // This is not recommended for production builds.
  // We have this on to get clearer error messages in the console.
  optimizeFonts: true, 
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: false,
  },
   experimental: {
     // This is required to make the Storybook integration work.
     // We are using a custom server to serve the Storybook UI.
     // This is not a standard Next.js feature.
     // serverComponentsExternalPackages: ['@storybook/react'],
     
   },
};

export default nextConfig;
