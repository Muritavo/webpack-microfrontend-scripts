import Webpack, { Configuration } from 'webpack';
import HTMLPlugin from "html-webpack-plugin";
import { join } from 'path';
import { existsSync } from 'fs';

export function createWebpackConfiguration(baseApplicaationDirectory: string, mode: Configuration['mode']) {
    const plugins: Configuration['plugins'] = [];

    //If the project has an index.html configured
    if (existsSync(join(baseApplicaationDirectory, "public", "index.html"))) {
        plugins.push(new HTMLPlugin({
            template: join(baseApplicaationDirectory, "public", "index.html")
        }))
    }

    return Webpack({
        mode,
        context: baseApplicaationDirectory,
        output: {
            //Let's write to the build directory as react already does
            path: join(baseApplicaationDirectory, "build"),
            filename: "index.js"
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
                            }]
                        ]
                    }
                }
            }, {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            }]
        },
        resolve: {
            extensions: ['.ts', '.tsx', '.js', '.json', '.wasm']
        },
        entry: {
            main: "./src/index.ts"
        },
        plugins
    })
}