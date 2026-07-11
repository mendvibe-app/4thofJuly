/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLint package not configured in this project yet; keep builds unblocked
    // while TypeScript errors are enforced.
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
