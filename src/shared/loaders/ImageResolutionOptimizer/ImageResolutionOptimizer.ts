import { LoaderContext } from "webpack";
import { getOptions, interpolateName, getCurrentRequest } from "loader-utils";
import path, { parse } from "path";
import Sharp from "sharp";
const { JSDOM } = require("jsdom");

enum ImageScales {
  SMALL = "0.5x",
  NORMAL = "1x",
  BIG = "2x",
  LARGE = "3x",
  EXTRA_LARGE = "4x",
}

const BASE_64_SECTION_SPLITTER = /data:image\/([a-z]+);base64,(.+)/;
const BASE_SIZES = [
  [3840, "4x"],
  [1920, "3x"],
  [1280, "2x"],
  [800, "1x"],
  [480, "0.5x"],
] as const;

type CustomNameFactory = (suffix: string) => string;

async function emitFile(
  this: LoaderContext<{
    publicPath: (url: string) => string;
  }>,
  content: string | Buffer,
  suffix: string,
  customName: CustomNameFactory = (suffix) => `[path][name]${suffix}.[ext]`
) {
  const url = interpolateName(this as any, customName(suffix), {
    context: this.rootContext,
    content,
  });
  this.emitFile(url, content, null as any, {
    immutable: true,
    sourceFilename: path.relative(this.rootContext, this.resourcePath),
  });

  return url;
}

async function resize(
  this: LoaderContext<{
    publicPath: (url: string) => string;
  }>,
  baseImage: ReturnType<typeof Sharp>,
  width: number,
  suffix: string,
  customName: CustomNameFactory = (suffix) => `[path][name]${suffix}.[ext]`
) {
  const options = getOptions(this as any) as any;
  if (suffix) suffix = "_" + suffix;
  const content = await baseImage.resize(width).toBuffer();
  const url = emitFile.call(this, content, suffix, customName);
  let publicPath = `__webpack_public_path__ + ${JSON.stringify(url)}`;
  if (options.publicPath) {
    publicPath = options.publicPath(url);
    publicPath = JSON.stringify(publicPath);
  }
  return publicPath;
}

async function createVariations(
  this: LoaderContext<{
    publicPath: (url: string) => string;
  }>,
  baseImage: ReturnType<typeof Sharp>,
  customName?: CustomNameFactory
) {
  const meta = await baseImage.metadata();

  const OriginalSrc = await resize.call(
    this,
    baseImage,
    meta.width!,
    "",
    customName
  );
  const ScaledImages = await Promise.all(
    BASE_SIZES.map(([baseWidth, suffix]) =>
      baseWidth > meta.width!
        ? OriginalSrc
        : resize.call(this, baseImage, baseWidth, suffix, customName)
    )
  );
  return {
    original: OriginalSrc,
    _4x: ScaledImages[0],
    _3x: ScaledImages[1],
    _2x: ScaledImages[2],
    _1x: ScaledImages[3],
    _0_5x: ScaledImages[4],
  };
}

/**
 * This takes an image import and transforms it into multiple exports
 */
export async function urlBasedImageResolutionOptimizer(
  this: LoaderContext<{
    publicPath: (url: string) => string;
  }>
) {
  const request = new URLSearchParams(this.resourceQuery);
  try {
    let baseImage = Sharp(this.resourcePath);
    if (request.get("w")) {
      baseImage = Sharp(
        await baseImage.resize(Number(request.get("w"))).toBuffer()
      );
    }
    const { _0_5x, _1x, _2x, _3x, _4x, original } = await createVariations.call(
      this,
      baseImage
    );
    const exportClause = `export default ${original};
export const Scaled = {
    "0.5x": ${_0_5x},
    "1x": ${_1x},
    "2x": ${_2x},
    "3x": ${_3x},
    "4x": ${_4x}
}`;
    return exportClause;
  } catch (e) {
    console.log("Error", e);
  }
}

const imageMap: {
  [RES_NAME: string]: (Awaited<ReturnType<typeof createVariations>> & {
    size: number;
  })[];
} = {};

/**
 * This takes an named svg import (supported by @svgr/webpack) and
 * changes it into multiple resources
 *
 * Needs to disable @svgr babel-loader via options: {babel: false} and add it as a new loader
 * to allow the dynamic to work correctly
 */
export function namedSVGImportResolutionOptimizer(
  this: LoaderContext<{
    publicPath: (url: string) => string;
  }>,
  r: string
) {
  const imageResources: typeof imageMap[string] = imageMap[this.resourcePath];
  if (!imageResources || !imageResources.length) return r;
  imageResources.reverse();
  let popped = imageResources.pop()!;
  let modified = r;
  try {
    do {
      const { _0_5x, _1x, _2x, _3x, _4x, original } = popped;
      const startOfBase64 = modified.indexOf("data:");
      modified =
        modified.slice(0, startOfBase64 - 1) +
        `{({
          "0.5x": ${_0_5x},
          "1x": ${_1x},
          "2x": ${_2x},
          "3x": ${_3x},
          "4x": ${_4x},
          "default": ${original}
      })[props.scale || "default"]}` +
        modified.slice(startOfBase64 + popped.size + 1);
      popped = imageResources.pop()!;
    } while (!!popped);
  } catch (e) {
    console.error("stopped at", modified);
  }
  return modified;
}

export async function extractImageResources(
  this: LoaderContext<{
    publicPath: (url: string) => string;
  }>,
  r: string
) {
  const imageResources: typeof imageMap[string] = (imageMap[this.resourcePath] =
    []);
  const instance = new JSDOM();
  const parser: DOMParser = new instance.window.DOMParser();
  const parsedXml = parser.parseFromString(r, "text/xml");
  const images = Array.from(parsedXml.querySelectorAll("image"));

  const baseImages: [sharp: ReturnType<typeof Sharp>, ext: string][] = [];

  for (let image of images) {
    const imgSrc = image.getAttribute("xlink:href");
    if (imgSrc) {
      const [_, interestingPart] = imgSrc.split("image/");
      const [extension, inteterestingAlso] = interestingPart.split(";");
      const [__, b64] = inteterestingAlso.split(",");
      if (b64) {
        const sections = ["", extension, b64];
        const [_original, ext, src] = sections;
        try {
          const imageSharp = Sharp(Buffer.from(src, "base64"));
          baseImages.push([imageSharp, extension]);
          const resources = await createVariations.call(
            this,
            imageSharp,
            (suffix) => `[path][name]/${images.indexOf(image)}${suffix}.${ext}`
          );
          imageResources.push({
            ...resources,
            size: imgSrc.length,
          });
        } catch (e) {
          console.error("Failed parsing SVG base64 of", this.resourcePath);
          return r;
        }
      }
    }
  }
  
  await emitFile.call(this, parsedXml.documentElement.outerHTML, "");

  for (let res of Object.values(ImageScales)) {
    const resInfo = BASE_SIZES.find(([_, enumVal]) => enumVal === res)!;
    for (let image of images) {
      const imageInfo = baseImages[images.indexOf(image)];
      const meta = await imageInfo[0].metadata();
      const resized =
        meta.width! < resInfo[0]
          ? imageInfo[0]
          : imageInfo[0].resize(resInfo[0]);
      image.setAttribute(
        "xlink:href",
        `data:image/${imageInfo[1]};base64,${(
          await resized.toBuffer()
        ).toString("base64")}`
      );
    }
    await emitFile.call(
      this,
      parsedXml.documentElement.outerHTML,
      "_" + resInfo[1]
    );
  }

  return parsedXml.documentElement.outerHTML;
}
