const plugin = require("./environment-usage-plugin");
const pluginTester = require("babel-plugin-tester").default;

process.env.DEFINED_VARIABLE = "DEFINED";

pluginTester({
  plugin: plugin,
  tests: {
    "Should parse without problems access to defined variable": {
      // input to the plugin
      code: "console.log(process.env.DEFINED_VARIABLE);",
      // expected output
      output: "console.log(\"DEFINED\");",
    },
    "Should throw an error when the variable is not defined": {
      // input to the plugin
      code: "console.log(process.env.UNDEFINED_VARIABLE)",
      error: / UNDEFINED_VARIABLE /,
    },
  },
});
