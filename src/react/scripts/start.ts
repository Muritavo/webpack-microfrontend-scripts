#! /usr/bin/env node

import DevServer from "webpack-dev-server";
import { join, resolve } from "path";
import { getArgument } from "../../shared/arguments";
//This plugin is used to inject the bundles into the main html (when it exists)
import { createWebpackConfiguration } from "./_webpackConfiguration";
import { serverPort } from "./consts";

const root = resolve(getArgument("root", process.cwd()));
const mode = "development";
process.env.NODE_ENV = mode;
const devServer = new DevServer(
  {
    hot: true,
    client: {
      overlay: false,
      progress: false,
    },
    historyApiFallback: {
      index: "/",
    },
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    port: serverPort,
  },
  createWebpackConfiguration(root, mode) as any
);
devServer.start();
