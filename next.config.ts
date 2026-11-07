import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  serverExternalPackages: ["tesseract.js", "unpdf"],
  // tesseract.js loads its worker scripts and WASM core dynamically, so file
  // tracing cannot see them. Include both packages for the OCR upload route.
  outputFileTracingIncludes: {
    "/api/bot/upload": [
      "./node_modules/tesseract.js/**/*",
      "./node_modules/tesseract.js-core/**/*",
      "./node_modules/bmp-js/**/*",
      "./node_modules/zlibjs/**/*",
      "./node_modules/wasm-feature-detect/**/*",
      "./node_modules/idb-keyval/**/*",
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
