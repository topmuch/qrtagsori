import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  serverExternalPackages: ['nodemailer', 'pdf-lib', 'qrcode', 'archiver', 'sharp'],
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    // Bypass the Next.js image optimizer. We already serve optimized images
    // (PNG/JPEG), and the optimizer can fail in production environments
    // where sharp is not properly bundled (especially with output: 'standalone'
    // + serverExternalPackages). Setting unoptimized = true serves the
    // images directly via /public, which is more reliable across dev/preview/
    // production environments. The browser still benefits from srcset because
    // next/image keeps generating it when the Image component is used.
    unoptimized: true,
    formats: ['image/webp', 'image/avif'],
  },
};

export default nextConfig;
