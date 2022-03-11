declare module "*.module.scss" {
  const classes: { readonly [key: string]: string };
  export default classes;
}
declare module "*.svg" {
  const El: import("react").ReactSVGElement;
  const S: string;
  export default S;
  export const ReactComponent: (
    props: import("react").ComponentProps<typeof El>
  ) => El;
}

declare module "*.png" {
  const S: string;
  export default S;
}

declare module "*.jpeg" {
  const S: string;
  export default S;
}
