/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "images.unsplash.com",
      "plus.unsplash.com",
      "images.pexels.com",
      "pbs.twimg.com",
      "res.cloudinary.com",
      "via.placeholder.com",
    ], // ✅ external image domains
  },
};

module.exports = nextConfig;
