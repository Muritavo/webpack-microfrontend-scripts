declare enum ImageScales {
  SMALL = "0.5x",
  NORMAL = "1x",
  BIG = "2x",
  LARGE = "3x",
  EXTRA_LARGE = "4x",
}

declare module "*.png" {
  export const Scaled: {
    [s in ImageScales]: string;
  };
}
