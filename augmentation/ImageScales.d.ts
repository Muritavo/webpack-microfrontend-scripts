declare module "*.png" {
  export const Scaled: {
    [s in import("../bin/types/ImageScales").ImageScales]: string;
  };
}
