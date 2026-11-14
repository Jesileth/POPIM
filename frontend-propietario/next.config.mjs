/** @type {import('next').NextConfig} */

const nextConfig = {
  /* config options here */
  output: "standalone", // carpeta mínima para la imagen Docker

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:4000/api/:path*",
      },
    ];
  },

};

export default nextConfig;
