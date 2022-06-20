require("systemjs/dist/system.min.js");

declare var System: any;
declare var __react_refresh_library__: any;
declare var __webpack_share_scopes__: any;

var $RefreshInjected$ = "__reactRefreshInjected";
// Namespace the injected flag (if necessary) for monorepo compatibility
if (
  typeof __react_refresh_library__ !== "undefined" &&
  __react_refresh_library__
) {
  $RefreshInjected$ += "_" + __react_refresh_library__;
}
delete (window as any)[$RefreshInjected$];

System.import("/index.js")
  .then((m: any) => {
    try {
      m.init(__webpack_share_scopes__.default || {});
    } catch (e) {}
    return m.get("entry");
  })
  .then((m: any) => m());
