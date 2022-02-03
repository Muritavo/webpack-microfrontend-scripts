#! /usr/bin/env node

import DevServer from "webpack-dev-server";
import { join, resolve } from "path";
import { getArgument } from "../../shared/arguments";
//This plugin is used to inject the bundles into the main html (when it exists)
import { createWebpackConfiguration } from "./_webpackConfiguration";

const root = resolve(getArgument("root", process.cwd()));
const mode = "development";
const devServer = new DevServer(
  {
    hot: true,
    client: {
      overlay: false,
      progress: false,
    },
    historyApiFallback: {
      index: '/'
    },
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    port: Number(process.env.PORT || "3500"),
  },
  createWebpackConfiguration(root, mode) as any
);
devServer.start();
