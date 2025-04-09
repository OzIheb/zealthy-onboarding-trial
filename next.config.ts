import type { NextConfig } from "next";
// @ts-expect-error - Use require for CJS module in ESM context
import { PrismaPlugin } from '@prisma/nextjs-monorepo-workaround-plugin';

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
