import Webpack, { Configuration } from "webpack";
import HTMLPlugin from "html-webpack-plugin";
import { join } from "path";
import { existsSync } from "fs";
import ReactRefreshWebpackPlugin from "@pmmmwh/react-refresh-webpack-plugin";
import { container } from "webpack";
import { TsconfigPathsPlugin } from "tsconfig-paths-webpack-plugin";

const { ModuleFederationPlugin } = container;

export function createWebpackConfiguration(
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
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.s[ac]ss$/i,
          use: [
            // Creates `style` nodes from JS strings
            "style-loader",
            // Translates CSS into CommonJS
            "css-loader",
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
          test: /\.(png|jpe?g|gif|pdf|svg|ttf)$/i,
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
          logLevel: "INFO",
          logInfoToStdOut: true,
        }),
      ],
      extensions: [".ts", ".tsx", ".js", ".json", ".wasm", ".jsx"],
      modules: [
        join(baseApplicaationDirectory, "src"),
        "node_modules",
        join(baseApplicaationDirectory, "node_modules"),
      ],
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
  };

  return Webpack(loadCustomizer(baseApplicaationDirectory)(baseConfig));
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
