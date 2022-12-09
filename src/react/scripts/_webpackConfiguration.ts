import Webpack, {
  Configuration,
  SourceMapDevToolPlugin,
  DefinePlugin,
  ProvidePlugin,
} from "webpack";
import HTMLPlugin from "html-webpack-plugin";
import { join, relative } from "path";
import { existsSync } from "fs";
import ReactRefreshWebpackPlugin from "@pmmmwh/react-refresh-webpack-plugin";
import { container } from "webpack";
import { TsconfigPathsPlugin } from "tsconfig-paths-webpack-plugin";
import MiniCssExtractPlugin, {
  loader as minicssloader,
} from "mini-css-extract-plugin";
import LibraryVersionOptimizerPlugin from "../../shared/plugins/LibraryVersionOptimizerPlugin";
import chalk from "chalk";

type ConfirationModes = Configuration["mode"] | "test";

const { ModuleFederationPlugin } = container;
const CopyPlugin = require("copy-webpack-plugin");

function mainCssLoader(mode: ConfirationModes) {
  return mode !== "production"
    ? require.resolve("style-loader")
    : minicssloader;
}

function setupTsConfigPathsPlugin(tsconfigPath: string) {
  if (!existsSync(tsconfigPath)) return;
  return new TsconfigPathsPlugin({
    configFile: tsconfigPath,
    extensions: [".ts", ".tsx", ".js"],
    logInfoToStdOut: false,
    silent: true,
  });
}

export function createBaseConfiguration(
  baseApplicaationDirectory: string,
  mode: ConfirationModes
) {
  const plugins: Configuration["plugins"] = [];
  const uniqueName = baseApplicaationDirectory.replace(/[^0-9a-z]/i, "");
  const publicFolder = join(baseApplicaationDirectory, "public");

  //If the project has an index.html configured
  if (existsSync(join(publicFolder, "index.html"))) {
    plugins.push(
      new HTMLPlugin({
        template: join(publicFolder, "index.html"),
        excludeChunks: ["container"],
      })
    );
  }

  if (existsSync(publicFolder)) {
    plugins.push(
      new CopyPlugin({
        patterns: [
          {
            from: join(publicFolder, "**", "*"),
            context: "public/",
            filter: (resourcePath: string) =>
              !resourcePath.includes("index.html"),
            noErrorOnMissing: true,
          },
        ],
      })
    );
  }

  let libraryTarget!: NonNullable<Configuration["output"]>["libraryTarget"];

  if (mode === "development") {
    plugins.push(
      new ReactRefreshWebpackPlugin({
        library: uniqueName,
      })
    );
  }

  if (mode !== "production") plugins.push(new SourceMapDevToolPlugin({}));

  if (mode === "production") {
    plugins.push(new MiniCssExtractPlugin());
  }

  if (mode !== "test") {
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
    libraryTarget = "system";
  } else {
    libraryTarget = "umd";
  }

  plugins.push(
    {
      apply(c) {
        c.hooks.afterCompile.tap("Logger", (comp) => {});
      },
    },
    new DefinePlugin({
      "process.env": {},
    }),
    new ProvidePlugin({
      "window.Buffer": ["buffer", "Buffer"],
      Buffer: ["buffer", "Buffer"],
      process: "process/browser",
    })
  );

  const baseConfig: Configuration = {
    mode: mode === "production" ? mode : "development",
    context: baseApplicaationDirectory,
    output: {
      //Let's write to the build directory as react already does
      path: join(baseApplicaationDirectory, "build"),
      filename: "[name].chunk.js",
      publicPath: `/`,
      libraryTarget,
    },
    devtool: "source-map",
    node: {
      global: true,
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
              sourceType: "unambiguous",
              plugins: [
                mode === "development" &&
                  require.resolve("react-refresh/babel"),
                require.resolve("@babel/plugin-proposal-class-properties"),
                require.resolve("@babel/plugin-transform-runtime"),
                require.resolve(
                  "../../shared/babel-plugins/environment-usage-plugin"
                ),
                mode === "test" && "istanbul",
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
              loader: "babel-loader",
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
                sourceType: "unambiguous",
              },
            },
            require.resolve(
              "../../shared/loaders/ImageResolutionOptimizer/namedSVG"
            ),
            {
              loader: require.resolve("@svgr/webpack"),
              options: {
                exportType: "named",
                babel: false,
              },
            },
            {
              loader: require.resolve("file-loader"),
              options: {
                name: "[path][name].[ext]",
                publicPath: (url: string) => {
                  if (baseConfig.output?.publicPath)
                    return `${baseConfig.output?.publicPath || "/"}${url}`;
                  else return url;
                },
              },
            },
            require.resolve(
              "../../shared/loaders/ImageResolutionOptimizer/extractImages"
            ),
          ],
          issuer: {
            and: [/\.(ts|tsx|js|jsx|md|mdx)$/],
          },
        },
        {
          test: /\.(png|jpe?g)$/i,
          loader: require.resolve(
            "../../shared/loaders/ImageResolutionOptimizer/default"
          ),
          options: {
            publicPath: (url: string) => {
              if (baseConfig.output?.publicPath)
                return `${baseConfig.output?.publicPath || "/"}${url}`;
              else return url;
            },
          },
        },
        {
          test: /\.(gif|pdf|ttf|otf|mp4)$/i,
          loader: "file-loader",
          options: {
            name: "[path][name].[ext]",
            publicPath: (url: string) => {
              if (baseConfig.output?.publicPath)
                return `${baseConfig.output?.publicPath || "/"}${url}`;
              else return url;
            },
          },
        },
        // {
        //   test: /\.(svg)$/i,
        //   loader: "file-loader",
        //   options: {
        //     name: "[path][name].[ext]",
        //     publicPath: (url: string) => {
        //       if (baseConfig.output?.publicPath)
        //         return `${baseConfig.output?.publicPath || "/"}${url}`;
        //       else return url;
        //     },
        //   },
        //   issuer: {
        //     and: [/\.(s?css)$/],
        //   },
        // },
      ],
    },
    resolve: {
      plugins: [
        setupTsConfigPathsPlugin(
          join(baseApplicaationDirectory, "tsconfig.json")
        ),
        LibraryVersionOptimizerPlugin,
      ].filter(Boolean) as any[],
      extensions: [".ts", ".tsx", ".js", ".json", ".wasm", ".jsx"],
      modules: [
        join(baseApplicaationDirectory, "src"),
        "node_modules",
        join(baseApplicaationDirectory, "node_modules"),
      ],
      fallback: {
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
      },
    },
    entry: {},
    plugins,
    stats: "none",
    infrastructureLogging: {
      level: "none",
    },
  };

  if (mode !== "test") {
    const entry = baseConfig.entry! as Webpack.EntryObject;
    entry.container = require.resolve(
      "systemjs-webpack-interop/auto-public-path"
    );
    entry.main = {
      import: [require.resolve("./scripts/init")],
      library: {
        type: "umd",
      },
    };
  }

  return loadCustomizer(baseApplicaationDirectory)(baseConfig);
}

export function createWebpackConfiguration(
  baseApplicaationDirectory: string,
  mode: ConfirationModes
) {
  return Webpack(createBaseConfiguration(baseApplicaationDirectory, mode));
}

function loadCustomizer(
  baseDir: string
): (config: Configuration) => Configuration {
  const customizerPath = join(baseDir, "custom-config.js");
  try {
    return require(customizerPath).webpack;
  } catch (e) {
    console.log(
      `\n\nTo customize webpack config, create a module at ${chalk.white(
        `./${relative(
          process.env.INIT_CWD!,
          join(baseDir, "custom-config.js")
        )}`
      )}\n\n`
    );
    return (c) => c;
  }
}
