import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ["@next-md-editor/editor-core", "@next-md-editor/types", "@next-md-editor/markdown"],
};

export default nextConfig;
