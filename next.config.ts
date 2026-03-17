import type { NextConfig } from "next";

const nextConfig: NextConfig = {

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
