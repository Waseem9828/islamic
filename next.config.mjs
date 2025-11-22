
/** @type {import('next').NextConfig} */
const nextConfig = {
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
