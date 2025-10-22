import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization - use Netlify's image CDN
  images: {
    domains: ['lqiglujleojwkcwfbxmr.supabase.co'], // Allow Supabase images
  },
  
  // Experimental features for Netlify
  experimental: {
    // Enable server actions for forms
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
