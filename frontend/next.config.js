/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'https://reach-herb-fossil-referred.trycloudflare.com/api/:path*'
            },
            {
                source: '/mail/:path*',
                destination: 'https://ethernet-heath-tampa-runtime.trycloudflare.com/:path*'
            }
        ]
    }
}
module.exports = nextConfig 