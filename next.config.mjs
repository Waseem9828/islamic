
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
};

export default nextConfig;
