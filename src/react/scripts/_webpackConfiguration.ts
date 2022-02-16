import Webpack, { Configuration, SourceMapDevToolPlugin } from "webpack";
import HTMLPlugin from "html-webpack-plugin";
import { join } from "path";
import { existsSync } from "fs";
import ReactRefreshWebpackPlugin from "@pmmmwh/react-refresh-webpack-plugin";
import { container } from "webpack";
import { TsconfigPathsPlugin } from "tsconfig-paths-webpack-plugin";
import MiniCssExtractPlugin, { loader } from "mini-css-extract-plugin";
import LibraryVersionOptimizerPlugin from "../../shared/plugins/LibraryVersionOptimizerPlugin";
const { ModuleFederationPlugin } = container;

function mainCssLoader(mode: Configuration["mode"]) {
  return mode === "development" ? "style-loader" : loader;
}

export function createBaseConfiguration(
  baseApplicaationDirectory: string,
  mode: Configuration["mode"]
) {
  const plugins: Configuration["plugins"] = [];
  const uniqueName = baseApplicaationDirectory.replace(/[^0-9a-z]/i, "");

  //If the project has an index.html configured
  if (existsSync(join(baseApplicaationDirectory, "public", "index.html"))) {
    plugins.push(
      new HTMLPlugin({
        template: join(baseApplicaationDirectory, "public", "index.html"),
        excludeChunks: ["container"],
      })
    );
  }

  if (mode === "development") {
    plugins.push(
      new ReactRefreshWebpackPlugin({
        library: uniqueName,
      })
    );
    plugins.push(new SourceMapDevToolPlugin({}));
  }

  if (mode === "production") {
    plugins.push(new MiniCssExtractPlugin());
  }

  plugins.push(
    new ModuleFederationPlugin({
      //This will create a container
      name: "container",
      //Accessible via the index.js file
      filename: "index.js",
      //And wrapped on a systemjs format
      library: { type: "system" },
      //This exposes a simple module for the entrypoint
      exposes: {
        entry: {
          import: ["./src/index"],
          name: "principal",
        },
      },
      //This means react should be shared
      shared: [
        {
          react: {
            eager: true,
            singleton: true,
            requiredVersion: false,
          },
          "react-refresh/runtime": {
            eager: true,
            singleton: true,
            requiredVersion: false,
          },
        },
        "firebase/app",
      ],
    })
  );

  const baseConfig: Configuration = {
    mode,
    context: baseApplicaationDirectory,
    output: {
      //Let's write to the build directory as react already does
      path: join(baseApplicaationDirectory, "build"),
      filename: "[name].chunk.js",
      publicPath: `/`,
      libraryTarget: "system",
    },
    module: {
      rules: [
        {
          test: /\.m?[j|t]sx?$/,
          exclude: /node_modules/,
          use: {
            loader: require.resolve("babel-loader"),
            options: {
              // Allow customization from babelrc from the application folder
              babelrcRoots: [baseApplicaationDirectory],
              presets: [
                ["@babel/preset-env", { targets: "defaults" }],
                [
                  "@babel/preset-react",
                  {
                    runtime: "automatic",
                  },
                ],
                ["@babel/preset-typescript"],
              ],
              plugins: [
                mode === "development" &&
                  require.resolve("react-refresh/babel"),
                require.resolve("@babel/plugin-proposal-class-properties"),
                require.resolve("@babel/plugin-transform-runtime"),
              ].filter(Boolean),
            },
          },
        },
        {
          test: /\.css$/i,
          use: [mainCssLoader(mode), "css-loader"],
        },
        {
          test: /\.s[ac]ss$/i,
          use: [
            // Creates `style` nodes from JS strings
            mainCssLoader(mode),
            // Translates CSS into CommonJS
            {
              loader: "css-loader",
              options: {
                modules: {
                  localIdentName:
                    mode === "development"
                      ? "[name]__[local]"
                      : "[hash:base64]",
                },
              },
            },
            // Fixes imports relative to the sass file location
            "resolve-url-loader",
            // Compiles Sass to CSS
            {
              loader: "sass-loader",
              options: {
                sourceMap: true,
              },
            },
          ],
        },
        {
          test: /\.svg$/i,
          use: [
            {
              loader: require.resolve("@svgr/webpack"),
              options: {
                exportType: "named",
              },
            },
            {
              loader: require.resolve("file-loader"),
            },
          ],
          issuer: {
            and: [/\.(ts|tsx|js|jsx|md|mdx)$/],
          },
        },
        {
          test: /\.(png|jpe?g|gif|pdf|ttf|otf|svg)$/i,
          loader: "file-loader",
          options: {
            name: "[path][name].[ext]",
          },
        },
      ],
    },
    resolve: {
      plugins: [
        new TsconfigPathsPlugin({
          extensions: [".ts", ".tsx", ".js"],
          logInfoToStdOut: false,
          silent: true,
        }),
        LibraryVersionOptimizerPlugin,
      ],
      extensions: [".ts", ".tsx", ".js", ".json", ".wasm", ".jsx"],
      modules: [
        join(baseApplicaationDirectory, "src"),
        "node_modules",
        join(baseApplicaationDirectory, "node_modules"),
      ],
      fallback: {
        stream: require.resolve("stream-browserify"),
        buffer: require.resolve("buffer"),
        crypto: require.resolve("crypto-browserify"),
        http: require.resolve("stream-http"),
        url: require.resolve(
          join(__dirname, "..", "..", "..", "node_modules", "url")
        ),
        https: require.resolve("https-browserify"),
        assert: require.resolve(
          join(__dirname, "..", "..", "..", "node_modules", "assert")
        ),
        os: require.resolve('os-browserify/browser'),
      },
    },
    entry: {
      main: {
        import: [require.resolve("./scripts/init")],
        library: {
          type: "umd",
        },
      },
      container: require.resolve("systemjs-webpack-interop/auto-public-path"),
    },
    plugins,
    stats: "none",
    infrastructureLogging: {
      level: "none",
    },
  };

  return loadCustomizer(baseApplicaationDirectory)(baseConfig);
}

export function createWebpackConfiguration(
  baseApplicaationDirectory: string,
  mode: Configuration["mode"]
) {
  return Webpack(createBaseConfiguration(baseApplicaationDirectory, mode));
}

function loadCustomizer(
  baseDir: string
): (config: Configuration) => Configuration {
  try {
    return require(join(baseDir, "custom-config.js")).webpack;
  } catch (e) {
    return (c) => c;
  }
}
