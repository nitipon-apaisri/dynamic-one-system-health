import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Turbopack/RSC can resolve Prisma to the wasm entry (`edge-light`), whose bundled
  // DMMF omits field optionality and rejects null scalars. Keep the Node library client.
  serverExternalPackages: ['@prisma/client'],
};

export default nextConfig;
