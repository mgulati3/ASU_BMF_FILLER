/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static file serving for the filled_pdfs directory
  output: 'standalone',
  
  // Configure headers to allow PDF viewing
  async headers() {
    return [
      {
        source: '/filled_pdfs/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/pdf',
          },
          {
            key: 'Content-Disposition',
            value: 'inline',
          },
        ],
      },
    ]
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
