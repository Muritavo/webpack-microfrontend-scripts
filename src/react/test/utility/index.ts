import { existsSync, mkdirSync, symlinkSync } from "fs";
import { join } from "path";
import { DirResult, dirSync } from "tmp";
import { Stats } from "webpack";

export let testDirectory: DirResult;
const tmpPath = join(__dirname, "tmp");

beforeEach(() => {
  if (!existsSync(tmpPath)) mkdirSync(tmpPath);
  testDirectory = dirSync({
    tmpdir: tmpPath,
  });
});

export function createNodeModulesFolder() {
  symlinkSync(
    join(process.env.INIT_CWD!, "node_modules"),
    join(testDirectory.name, "node_modules")
  );
}

export function createCompilerErrorHandler(doneCb: jest.DoneCallback) {
  return (_error?: Error, r?: Stats) => {
    if (_error) doneCb(_error);
    if (r && r.hasErrors())
      doneCb(
        r.compilation.errors
          .map((e) => (typeof e === "string" ? e : e.message))
          .join("\n")
      );
    else doneCb();
  };
}
