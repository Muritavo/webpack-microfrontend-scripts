import {
  existsSync,
  mkdirSync,
  rmdirSync,
  symlinkSync,
  writeFileSync,
} from "fs";
import { join } from "path";
import { DirResult, dirSync } from "tmp";
import { Stats } from "webpack";

export let testDirectory: DirResult;
const tmpPath = join(__dirname, "tmp");

beforeEach(() => {
  rmdirSync(tmpPath, {
    recursive: true,
  });
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

export function createIndexHTML() {
  mkdirSync(join(testDirectory.name, "public"));
  writeFileSync(
    join(testDirectory.name, "public", "index.html"),
    "<html><head></head><body></body></html>"
  );
}

export function createCompilerErrorHandler(
  doneCb: jest.DoneCallback | ((errors?: any) => void)
) {
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
