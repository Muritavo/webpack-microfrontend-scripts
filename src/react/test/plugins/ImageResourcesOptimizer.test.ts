import { copyFileSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { createWebpackConfiguration } from "../../scripts/_webpackConfiguration";
import {
  createCompilerErrorHandler,
  createNodeModulesFolder,
  testDirectory,
} from "../utility";

it("Should be able to create multiple versions of an image", (done) => {
  function writeEntryWithPNG() {
    createNodeModulesFolder();
    mkdirSync(join(testDirectory.name, "src"));
    mkdirSync(join(testDirectory.name, "src", "assets"));
    copyFileSync(
      join(__dirname, "..", "fixtures", "image", "png", "example.png"),
      join(testDirectory.name, "src", "assets", "example.png")
    );
    writeFileSync(
      join(testDirectory.name, "src", "component.tsx"),
      `import pngPath from './assets/example.png';
              
              export function Component() { return <img src={pngPath}/> }`
    );
    writeFileSync(
      join(testDirectory.name, "src", "index.ts"),
      `import React from 'react';
      import ReactDOM from 'react-dom';
      import { Component } from "./component";
      
      ReactDOM.render(React.createElement(Component), document.body);
      `
    );
  }
  writeEntryWithPNG();
  createWebpackConfiguration(testDirectory.name, "production").run(
    createCompilerErrorHandler(done)
  );
});
