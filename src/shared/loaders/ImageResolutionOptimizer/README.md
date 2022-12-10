# Image Resolution Optimizer

This loader is used to optimize images on different resolutions

## Installation

### Basic functionalitty

For only resizing images, you can setup the loader at the webpack config loaders property like so:

```typescript
const webpackConfig = {
    loaders: [
        ...,
        {
          test: /\.(png|jpe?g)$/i, // Here you set the regex to match image resources
          loader: require.resolve(
            "@muritavo/webpack-microfrontend-scripts/bin/shared/loaders/ImageResolutionOptimizer/default"
          ),
        },
        {
          test: /\.svg$/i, // Make sure no other loader is processing svgs
          loader: require.resolve(
            "@muritavo/webpack-microfrontend-scripts/bin/shared/loaders/ImageResolutionOptimizer/extractImages"
          ),
        },
        ...,
    ]
}
```

### Inline SVGs support

For modyfing the inline SVG resources, the loaders should be set in the following order

```typescript
const webpackConfig = {
    loaders: [
        ...,
        {
          test: /\.svg$/i, // Make sure no other loader is processing SVG files
          use: [
            {
              loader: "babel-loader",
              options: {
                // Allow customization from babelrc from the application folder
                babelrcRoots: [baseApplicaationDirectory],
                presets: [
                  ["@babel/preset-env", { targets: "defaults" }],
                  [
                    "@babel/preset-react",
                    {
                      runtime: "automatic",
                    },
                  ],
                  ["@babel/preset-typescript"],
                ],
                sourceType: "unambiguous",
              },
            },
            require.resolve(
              "@muritavo/webpack-microfrontend-scripts/bin/shared/loaders/ImageResolutionOptimizer/namedSVG" // This replaces all the inline images by the resized ones from the first (bottom) loader
            ),
            {
              loader: require.resolve("@svgr/webpack"), // This library, is the responsible for creating the inline sources for the svg components
              options: {
                exportType: "named",
                babel: false,
              },
            },
            require.resolve(
              "@muritavo/webpack-microfrontend-scripts/bin/shared/loaders/ImageResolutionOptimizer/extractImages"
            ), // This extract the images and creates the optimized path based SVGs
          ],
          issuer: {
            and: [/\.(ts|tsx|js|jsx|md|mdx)$/],
          },
        },
        ...,
    ]
}
```

## Features

### Scaled images

On your code, the imported image will have a property that defines the path for each scale

```typescript
import { Scaled } from "./some/image/path.ext";
/** This is an utility type, it's not necessary but recommended to use it */
import { ImageScales } from "@muritavo/webpack-microfrontend-scripts/bin/types/ImageScales";

function SomeComponentOrLogic() {
...
    const width = window.visualViewport!.width;
    /** The default scaled resolutions are 480, 800, 1280, 1920, 3840 */
    const scale = width < 480 ? ImageScales.SMALL
                : width < 800 ? ImageScales.NORMAL
                : width < 1280 ? ImageScales.BIG
                : width < 1920 ? ImageScales.LARGE
                : ImageScales.EXTRA_LARGE;

    const scaledImgSrc = Scaled[scale];
...
}

```

### Setting a maximum width

Sometimes, the image doesn't need to match all the width necessarily, so we can set an maximum width this image will require, via an import query

```typescript
import { Scaled } from "./some/image/path.ext?w=300"; // This will set the image to a maximum of 300px
import { ImageScales } from "@muritavo/webpack-microfrontend-scripts/bin/types/ImageScales";

function SomeComponentOrLogic() {
...
    const width = window.visualViewport!.width;
    // Since the image now has 300px, all scales will point to the same reource, since the resource didn't required scaling to the preset resolutions;
    const scale = width < 480 ? ImageScales.SMALL
                : width < 800 ? ImageScales.NORMAL
                : width < 1280 ? ImageScales.BIG
                : width < 1920 ? ImageScales.LARGE
                : ImageScales.EXTRA_LARGE;

    const scaledImgSrc = Scaled[scale];
...
}

```

### Working with inline SVGs

When working with @svgr/webpack, the library can create React components via importing a SVG

The same optimization can be applied to the inline SVG **With the downside that the inline images will be converted to references, that means, draw time can be increased since the browser will need to download the resources first**

```tsx
import { ReactComponent } from "./some/image/path.svg";
import { ImageScales } from "@muritavo/webpack-microfrontend-scripts/bin/types/ImageScales";

function SomeComponentOrLogic() {
...
    const width = window.visualViewport!.width;
    // Since the image now has 300px, all scales will point to the same reource, since the resource didn't required scaling to the preset resolutions;
    const scale = width < 480 ? ImageScales.SMALL
                : width < 800 ? ImageScales.NORMAL
                : width < 1280 ? ImageScales.BIG
                : width < 1920 ? ImageScales.LARGE
                : ImageScales.EXTRA_LARGE;

    return <>
        <ReactComponent scale={scale}/> {/** Pass the scale prop, so it will use the resized resources */}
        <ReactComponent/> {/** Or omit it so the original image is used  */}
    </>
...
}

```
