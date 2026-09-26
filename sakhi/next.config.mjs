// /** @type {import('next').NextConfig} */
// const nextConfig = {};

// export default nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
      turbopack: {
        root: import.meta.dirname,
      },
    },
  };
  
  export default nextConfig;