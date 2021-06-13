import DevServer from 'webpack-dev-server';
import Webpack from 'webpack';
import { join, resolve } from 'path';
import { getArgument } from '../../shared/arguments';
//This plugin is used to inject the bundles into the main html (when it exists)
import HTMLPlugin from "html-webpack-plugin";
import { createWebpackConfiguration} from './_webpackConfiguration';

const root = resolve(getArgument("root", process.env.INIT_CWD!));
const mode = "development";
const devServer = new DevServer(
    createWebpackConfiguration(root, mode),
    {
        contentBase: join(root, "public")
    }
);
devServer.listen(19999);
