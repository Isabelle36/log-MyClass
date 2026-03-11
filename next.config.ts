import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'xubohuah.github.io',
        pathname: '/xubohua.top/Group.png',
      },
    ],
  },
};

export default nextConfig;
