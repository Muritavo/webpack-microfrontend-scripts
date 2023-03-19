import { Plugin, ResolveRequest } from "enhanced-resolve";
import { lstatSync } from "fs";
import { browserifyReplacements } from "../../react/scripts/consts";

const versionMap: {
  [LIB: string]: {
    versions: {
      version: string;
      baseContext: string;
    }[];
  };
} = {};

function getMajor(version: string = "") {
  return Number(version.split(".")[0]);
}

/**
 * This plugin allows for single resolving of same version modules
 *
 * It was required from the usage of this plugin on the context of linked libraries
 */
const LibraryVersionOptimizerPlugin: Plugin = {
  apply(r) {
    const target = r.ensureHook("Linked library plugin");
    r.getHook("described-resolve").tapAsync(
      "Linked library plugin",
      async (req, res, cb) => {
        if (
          /^[a-z].*[a-z]$/.test(req.request || "") &&
          ![".js", ".svg", ".png", ".css"].some((end) =>
            req.request?.endsWith(end)
          ) &&
          !req.request?.includes("package.json") &&
          !Object.keys(browserifyReplacements).includes(req.request!)
        ) {
          const resolved = await new Promise<ResolveRequest>(
            (resolve, reject) => {
              r.resolve(
                {},
                req.descriptionFileRoot!,
                `${req.request!}/package.json`,
                res,
                (e, str, res) => {
                  if (e) {
                    reject(e);
                  } else {
                    resolve(res!);
                  }
                }
              );
            }
          ).catch(() => null);
          if (resolved !== null) {
            const data = resolved.descriptionFileData! as {
              version: string;
            };

            if (!versionMap[req.request!]) {
              versionMap[req.request!] = {
                versions: [
                  {
                    version: data.version,
                    baseContext: req.path as string,
                  },
                ],
              };
            }
            if (!versionMap[req.request!])
              console.log(req.request, versionMap[req.request!]);
            const preloadedLib = versionMap[req.request!].versions.find(
              (a) => getMajor(a.version) === getMajor(data.version)
            );
            if (preloadedLib) {
              req.path = preloadedLib.baseContext;
            } else {
              versionMap[req.request!].versions.push({
                version: data.version,
                baseContext: req.path as string,
              });
            }
          }
        }

        return r.doResolve(target, req, null, res, cb);
      }
    );
  },
};

export default LibraryVersionOptimizerPlugin;
