import * as types from "@babel/types";
import { Visitor } from "@babel/core";

function EnvironmentUsageBabelPlugin({ types: t }: { types: typeof types }) {
  function isLeftSideOfAssignmentExpression(path: any) {
    return (
      t.isAssignmentExpression(path.parent) && path.parent.left === path.node
    );
  }
  return {
    name: "environment-usage-plugin",
    visitor: {
      MemberExpression(path, state: { opts: { whitelist?: string[] } }) {
        const whitelistedOpts = state.opts.whitelist || [];
        // We visit all accessors
        // If the accessor is at process.env
        if (path.get("object").matchesPattern("process.env")) {
          if ("toComputedKey" in path) {
            // Get the key that is made for accessing
            const key = (path as any).toComputedKey();
            if (
              t.isStringLiteral(key) && //Is string literal and
              !isLeftSideOfAssignmentExpression(path) //Is not left side
            ) {
              const value = process.env[key.value];
              //If the environment variable is not defined and is not in whitelist
              if (!value && !whitelistedOpts.includes(key.value)) {
                throw new Error(
                  `The environment variable ${key.value} is not defined at the ENV. Please, define it and restart the application`
                );
              }
            }
          }
        }
      },
    } as Visitor,
  };
}
module.exports = EnvironmentUsageBabelPlugin;
