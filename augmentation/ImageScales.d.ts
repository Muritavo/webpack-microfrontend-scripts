declare module "*.png" {
  export const Scaled: {
    [s in import("../types/ImageScales").ImageScales]: string;
  };
}
