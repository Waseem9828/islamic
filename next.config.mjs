
/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'picsum.photos',
                port: '',
                pathname: '/**',
            },
        ],
    },
    async headers() {
        return [
            {
                // apply to all routes
                source: "/:path*",
                headers: [
                    {
                        key: "Permissions-Policy",
                        value: "clipboard-write=self",
                    },
                ],
            },
        ];
    },
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
