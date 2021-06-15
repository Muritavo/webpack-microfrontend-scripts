import Webpack, { Configuration } from 'webpack';
import HTMLPlugin from "html-webpack-plugin";
import { join } from 'path';
import { existsSync } from 'fs';
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

export function createWebpackConfiguration(baseApplicaationDirectory: string, mode: Configuration['mode']) {
    const plugins: Configuration['plugins'] = [];

    //If the project has an index.html configured
    if (existsSync(join(baseApplicaationDirectory, "public", "index.html"))) {
        plugins.push(new HTMLPlugin({
            template: join(baseApplicaationDirectory, "public", "index.html")
        }))
    }

    if (mode === "development") {
        plugins.push(new ReactRefreshWebpackPlugin())
    }

    return Webpack({
        mode,
        context: baseApplicaationDirectory,
        output: {
            //Let's write to the build directory as react already does
            path: join(baseApplicaationDirectory, "build"),
            filename: (path) => {
                return path.chunk?.name === "main" ? "index.js" : "[name].chunk.js"
            },
            publicPath: "/"
        },
        module: {
            rules: [{
                test: /\.m?[j|t]sx?$/,
                exclude: /node_modules/,
                use: {
                    loader: require.resolve('babel-loader'),
                    options: {
                        // Allow customization from babelrc from the application folder
                        babelrcRoots: [baseApplicaationDirectory],
                        presets: [
                            ['@babel/preset-env', { targets: "defaults" }],
                            ['@babel/preset-react', {
                                "runtime": "automatic"
                            }],
                            ['@babel/preset-typescript']
                        ],
                        plugins: [
                            mode === "development" && require.resolve('react-refresh/babel'),
                            "@babel/plugin-proposal-class-properties"
                        ].filter(Boolean)
                    }
                }
            }, {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            }, {
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
                            sourceMap: true
                        }                      
                    },
                ],
            }, {
                test: /\.(png|jpe?g|gif|pdf|svg|ttf)$/i,
                loader: 'file-loader',
                options: {
                  name: '[path][name].[ext]',
                },
              }]
        },
        resolve: {
            extensions: ['.ts', '.tsx', '.js', '.json', '.wasm', '.jsx']
        },
        entry: {
            main: "./src/index.ts",
            system: require.resolve("systemjs/dist/system.min.js"),
        },
        plugins
    })
}