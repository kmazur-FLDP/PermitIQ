import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Netlify deployment
  // output: 'export', // Uncomment for static export (no server features)
  
  // Image optimization
  images: {
    unoptimized: true, // Required for Netlify static deployment
  },
  
  // Trailing slashes
  trailingSlash: true,
};

export default nextConfig;
