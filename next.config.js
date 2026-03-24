/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          {
            // Force HTTPS in production (HSTS)
            // This is the primary fix for the "plaintext credentials" concern.
            // Once a browser visits the site over HTTPS, it will refuse to
            // connect over plain HTTP for the next year.
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            // Prevent browsers from MIME-sniffing the content type
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            // Prevent the site from being embedded in iframes (clickjacking protection)
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            // Control how much referrer info is sent with requests
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            // Disable unnecessary browser features
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
