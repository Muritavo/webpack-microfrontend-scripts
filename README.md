![npm](https://img.shields.io/npm/v/@muritavo/webpack-microfrontend-scripts)

# Architecture decisions

## This project comes bundled with the systemjs lib as it is the main library used to load microfrontends dinamically

# What is this project

This project aims to create and build scripts that are focused on compiling microfrontend applications.

# How to use it

- Install this cli application inside your project using

```bash
# With npm
npm i @muritavo/webpack-microfrontend-scripts

# or with yarn
yarn add @muritavo/webpack-microfrontend-scripts
```

- Inside the application you want to build:
  - Make sure the application has a src/index.ts (it is now hardcoded and a better detection system is on the roadmap)
  - Run the command `yarn react-build` or `yarn react-start` to build or watch the application respectively

# How it is structured

The project has the following directory patterns

- src: Where all the development sources are coded in
  - shared: Modules shared accross multiple framework setups
  - {framework}: Each script is focused on being used bound to a framework
    - scripts: The scripts to be provided by this application (mainly start & build)
    - test: An aplication to test each provided script (mainly start & build)
      - application: The source for the application that is being compiled for tests

# Roadmap

## Basic functionality

- [x] Support TS
- [x] Support JS
- [x] Support JSX
- [x] Support TSX
- [x] Support CSS
- [x] Support SCSS
- [x] Support JSON
- [x] Support SCSS Modules
- [x] Support CSS Modules
- [x] Support Hot swap
- [x] Support SVGs, PNGs, and other files as simple sources
- [x] **Support Module federation**
- [x] Allow any index.EXT file to be used as entrypoint
- [ ] Allow webpack manipulation from the base folder of the application
- [ ] Setup precaching of the application with custom service worker
- [ ] Allow multiple microfrontends being developed together

## Optimizations

- [x] Experiment with configuring module federation with uninstalled libraries (for example N mfes use a library that some don't use)
- [ ] Separate the CSS from JS source (replace the style-loader by the mini-css-extract-plugin)
- [ ] Support JSON treeshaking
- [ ] Support SVG bundling / Reduce amount of small SVG files
- [x] Scale images from png/jpg/inline svg to multiple versions for better resource usage

# Standalone Features

## Loaders

### ImageResolutionOptimizer

This loader is used to create multiple versions of an image for multiple resolutions

There are three main loaders:

#### For non SVG resources

- src/shared/loaders/ImageResolutionOptimizer/default.ts: Is used over png/jpg and other [Sharp]() supported image formats.

#### For SVG resources (both loaders should be used together as of now)

- src/shared/loaders/ImageResolutionOptimizer/extractImages.ts: Used over an SVG and extracts all inline image tag resources set at xlink:href to their specific files.
It also defines 2 exports.
- default: With the original SVG
- Scaled: With the map of scaled svgs

- src/shared/loaders/ImageResolutionOptimizer/namedSVG.ts: Modifies the inline ReactComponent from @svgr/webpack and injects the extracted images to be controled by a prop called props.scale (0.5x, 1x, 2x, 3x, 4x)

### environment-usage-plugin

Babel plugin that checks for undefined env variables referenced on code and prevents compilation until those variables are defined