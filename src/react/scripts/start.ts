import DevServer from 'webpack-dev-server';
import Webpack from 'webpack';
import { join, resolve } from 'path';
import { getArgument } from '../../shared/arguments';
//This plugin is used to inject the bundles into the main html (when it exists)
import HTMLPlugin from "html-webpack-plugin";

const root = resolve(getArgument("root", process.env.INIT_CWD!));
const mode = "development";
const devServer = new DevServer(
    Webpack({
        mode,
        context: root,
        output: {
            libraryTarget: "system",
            filename: "index.js"
        },
        entry: {
            main: "./src/index.ts"
        },
        plugins: [
            new HTMLPlugin({
                template: join(root, "public", "index.html")
            })
        ]
    }),
    {
        contentBase: join(root, "public")
    }
);
devServer.listen(19999);
