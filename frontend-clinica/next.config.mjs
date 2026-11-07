/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

   // Todo lo que empiece con /api se lo pasa al backend (mismo origen: la cookie viaja sola, sin CORS)
  async rewrites() {
    return [{ source: "/api/:path*", destination: "http://localhost:4000/api/:path*" }];
  },

};

export default nextConfig;
