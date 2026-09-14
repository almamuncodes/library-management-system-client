import dns from 'node:dns';

// Fix Windows DNS resolution for MongoDB Atlas SRV records in Next.js runtime
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {}

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
};

export default nextConfig;
