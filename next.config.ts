import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isGithubPages ? "/micro-saas-unit-economics-studio" : undefined,
  assetPrefix: isGithubPages ? "/micro-saas-unit-economics-studio/" : undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
