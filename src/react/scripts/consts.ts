export const browserifyReplacements = {
  fs: false,
  zlib: require.resolve("browserify-zlib"),
  stream: require.resolve("stream-browserify"),
  buffer: require.resolve("buffer"),
  crypto: require.resolve("crypto-browserify"),
  http: require.resolve("stream-http"),
  url: require.resolve("url/url"),
  https: require.resolve("https-browserify"),
  assert: require.resolve("assert/build/assert"),
  os: require.resolve("os-browserify/browser"),
  path: require.resolve("path-browserify"),
} as const;

export const serverPort = Number(process.env.PORT || "3500")
