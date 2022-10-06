#! /usr/bin/env node

import { existsSync, rmSync } from "fs";
import { resolve } from "path";
import { getArgument } from "../../shared/arguments";
import { createWebpackConfiguration } from "./_webpackConfiguration";

const root = resolve(getArgument("root", process.env.INIT_CWD!));
const mode = "production";
process.env.NODE_ENV = mode;

const config = createWebpackConfiguration(root, mode);

const compilationOutputDir = config.options.output.path!;
if (existsSync(compilationOutputDir))
  rmSync(compilationOutputDir, {
    recursive: true,
  });

config.run((error, stats) => {
  if (error) {
    console.error(
      "An unexpected exception has ocurred. Please, check the details below:"
    );
    console.error(error);
    process.exit(1);
  }
  if (stats?.hasErrors()) {
    console.error(
      "Some errors have ocurred during the compilation, please, check the details below:"
    );
    console.error(
      stats.compilation.errors
        .map((e) => (typeof e === "string" ? e : e.message))
        .join("\n")
    );
    process.exit(1);
  }
  console.log("Compiled succesfully");
  process.exit(0);
});
