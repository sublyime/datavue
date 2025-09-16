import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'placehold.co', pathname: '/**' },
    { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
    { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
  ],
}

};

export default nextConfig;
