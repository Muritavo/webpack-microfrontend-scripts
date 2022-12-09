import { copyFileSync, mkdirSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";
import { createWebpackConfiguration } from "../../scripts/_webpackConfiguration";
import {
  createCompilerErrorHandler,
  createIndexHTML,
  createNodeModulesFolder,
  testDirectory,
} from "../utility";
function writeEntryWithComp(compSrc: string) {
  createNodeModulesFolder();
  createIndexHTML();
  mkdirSync(join(testDirectory.name, "src"));
  mkdirSync(join(testDirectory.name, "src", "assets"));
  copyFileSync(
    join(__dirname, "..", "fixtures", "image", "png", "example.png"),
    join(testDirectory.name, "src", "assets", "example.png")
  );
  copyFileSync(
    join(__dirname, "..", "fixtures", "image", "jpg", "example.jpg"),
    join(testDirectory.name, "src", "assets", "example_jpg.jpg")
  );
  copyFileSync(
    join(__dirname, "..", "fixtures", "image", "jpg", "sm-example.jpg"),
    join(testDirectory.name, "src", "assets", "example_jpg_sm.jpg")
  );
  copyFileSync(
    join(__dirname, "..", "fixtures", "image", "svg", "example.svg"),
    join(testDirectory.name, "src", "assets", "example_svg.svg")
  );
  writeFileSync(join(testDirectory.name, "src", "component.tsx"), compSrc);
  writeFileSync(
    join(testDirectory.name, "src", "index.ts"),
    `import React from 'react';
    import ReactDOM from 'react-dom';
    import { Component } from "./component";
    
    ReactDOM.render(React.createElement(Component), document.body);
    `
  );
}

it("Should be able to create multiple versions of an image", (done) => {
  writeEntryWithComp(`import pngPath, { Scaled as ScaledPNG } from './assets/example.png';
  import jpgPath, { Scaled as ScaledJPG } from './assets/example_jpg.jpg';
  
  export function Component() { 
  return <>
    <style dangerouslySetInnerHTML={{__html: "img { width: 90vw }"}}/>
    <h1>PNG</h1>
    <h2>Original</h2>
    <img src={pngPath}/>
    <h2>Small</h2>
    <img src={ScaledPNG['0.5x']}/>
    <h2>Normal</h2>
    <img src={ScaledPNG['1x']}/>
    <h2>Big</h2>
    <img src={ScaledPNG['2x']}/>
    <h2>Large</h2>
    <img src={ScaledPNG['3x']}/>
    <h2>ExtraLarge</h2>
    <img src={ScaledPNG['4x']}/>
  
    <h1>JPG</h1>
    <h2>Original</h2>
    <img src={jpgPath}/>
    <h2>Small</h2>
    <img src={ScaledJPG['0.5x']}/>
    <h2>Normal</h2>
    <img src={ScaledJPG['1x']}/>
    <h2>Big</h2>
    <img src={ScaledJPG['2x']}/>
    <h2>Large</h2>
    <img src={ScaledJPG['3x']}/>
    <h2>ExtraLarge</h2>
    <img src={ScaledJPG['4x']}/>
  </>
  }`);

  createWebpackConfiguration(testDirectory.name, "production").run(
    createCompilerErrorHandler((error: any) => {
      if (error) return done(error);
      const imageResources = readdirSync(
        join(testDirectory.name, "build", "src", "assets")
      );
      try {
        expect(imageResources).toHaveLength(6 * 2);
        done();
      } catch (e) {
        done(e);
      }
    })
  );
});

it.only("Should create a component with scaling prop", (done) => {
  writeEntryWithComp(`import { ReactComponent } from './assets/example_svg.svg';
import {useState} from "react";
  
  export function Component() { 
    const [scale, setScale] = useState<string>("0.5x");
    console.log(scale)
  return <>
    <style dangerouslySetInnerHTML={{__html: "svg { width: 400px }"}}/>
    <h1>PNG</h1>
    <div>
      <button onClick={() => setScale("")}>Original</button>
      <button onClick={() => setScale("0.5x")}>Small</button>
      <button onClick={() => setScale("1x")}>Normal</button>
      <button onClick={() => setScale("2x")}>Big</button>
      <button onClick={() => setScale("3x")}>Large</button>
      <button onClick={() => setScale("4x")}>Extra Large</button>
    </div>
    <h2>Result</h2>
    <ReactComponent scale={scale}/>
  </>
  }`);

  createWebpackConfiguration(testDirectory.name, "production").run(
    createCompilerErrorHandler(((error: any) => {
      if (error) return done(error);
      try {
        const imageResources = readdirSync(
          join(testDirectory.name, "build", "src", "assets", "example_svg")
        );
        expect(imageResources).toHaveLength(7);
        done();
      } catch (e) {
        done(e);
      }
    }) as any)
  );
});

it("Should not upscale images", (done) => {
  writeEntryWithComp(`import jpgPath, {Scaled as ScaledJPG} from './assets/example_jpg_sm.jpg';
import {useState} from "react";
  
  export function Component() { 
    const [scale, setScale] = useState<string>("0.5x");
    console.log(scale)
  return <>
    <style dangerouslySetInnerHTML={{__html: "img { width: 90vw }"}}/>
    <h1>PNG</h1>
    <h2>Original</h2>
    <img src={pngPath}/>
    <h2>Small</h2>
    <img src={ScaledJPG['0.5x']}/>
    <h2>Normal</h2>
    <img src={ScaledJPG['1x']}/>
    <h2>Big</h2>
    <img src={ScaledJPG['2x']}/>
    <h2>Large</h2>
    <img src={ScaledJPG['3x']}/>
    <h2>ExtraLarge</h2>
    <img src={ScaledJPG['4x']}/>
  </>
  }`);
  createWebpackConfiguration(testDirectory.name, "production").run(
    createCompilerErrorHandler(((error: any) => {
      if (error) return done(error);
      try {
        const imageResources = readdirSync(
          join(testDirectory.name, "build", "src", "assets")
        );
        expect(imageResources).toHaveLength(3);
        done();
      } catch (e) {
        done(e);
      }
    }) as any)
  );
});

describe("BUGFIX", () => {

})