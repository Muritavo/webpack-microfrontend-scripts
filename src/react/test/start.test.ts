import { existsSync, mkdirSync, rmdirSync, symlink, symlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { DirResult, dirSync } from 'tmp';
import { Stats } from 'webpack';
import { createWebpackConfiguration } from '../scripts/_webpackConfiguration';

let testDirectory: DirResult;
const tmpPath = join(__dirname, "tmp");
beforeEach(() => {
    if (!existsSync(tmpPath))
        mkdirSync(tmpPath)
    testDirectory = dirSync({
        tmpdir: tmpPath
    });
});

afterEach(() => {
    rmdirSync(testDirectory.name, {
        recursive: true
    })
});

afterAll(() => {
    rmdirSync(tmpPath);
})

function createAsyncCb(): Promise<any> & {
    callback: jest.DoneCallback
} {
    let res: any, rej: any;
    const promise = new Promise((_res, _rej) => { res = _res; rej = _rej });
    (promise as any).callback = ((errorStr?: string) => {
        if (errorStr)
            rej(errorStr);
        else
            res();
    }) as jest.DoneCallback;
    return promise as any;
}

function writeEntryPoint() {
    mkdirSync(join(testDirectory.name, "src"));
    writeFileSync(
        join(testDirectory.name, 'src', 'index.ts'),
        "console.warn('works')",
    );
}

function writeEntryPointWithJS() {
    mkdirSync(join(testDirectory.name, "src"));
    writeFileSync(
        join(testDirectory.name, 'src', 'log.js'),
        `export function log() {console.warn("I'm logging")}`
    )
    writeFileSync(
        join(testDirectory.name, 'src', 'index.ts'),
        `import { log } from "./log";

log();
`,
    );
}

function writePublicHTML() {
    mkdirSync(join(testDirectory.name, "public"));
    writeFileSync(
        join(testDirectory.name, 'public', 'index.html'),
        "<html><head></head><body></body></html>",
    );
}

function createNodeModulesFolder() {
    symlinkSync(join(process.env.INIT_CWD!, "node_modules"), join(testDirectory.name, "node_modules"))
}

function writeEntryPointWithTSX() {
    createNodeModulesFolder();
    mkdirSync(join(testDirectory.name, "src"));
    writeFileSync(
        join(testDirectory.name, 'src', 'component.tsx'),
        `export function Component() { return <h1>Some text</h1> }`
    )
    writeFileSync(
        join(testDirectory.name, 'src', 'index.ts'),
        `import React from 'react';
import ReactDOM from 'react-dom';
import { Component } from "./component";

ReactDOM.render(React.createElement(Component), document.body);
`,
    );
}

function writeBabelRC() {
    writeFileSync(
        join(testDirectory.name, '.babelrc.js'),
        `module.exports = { plugins: ["babel-plugin-styled-components"] }`
    )
}

function asyncWrapper<T extends any[]>(doneCb: jest.DoneCallback, fn: (...args: T) => void) {
    return (...args: T) => {
        try {
            fn(...args);
        } catch (e) {
            doneCb(e);
        }
    }
}

function createCompilerErrorHandler(doneCb: jest.DoneCallback) {
    return (_error?: Error, r?: Stats) => {
        if (_error) doneCb(_error);
        if (r && r.hasErrors())
            doneCb(r.compilation.errors.map((e) => typeof e === "string" ? e : e.message).join('\n'));
        else doneCb();
    }
}

it('Should compile when the folder has a src/index.ts entrypoint', (done) => {
    writeEntryPoint();
    createWebpackConfiguration(testDirectory.name, 'development').run(createCompilerErrorHandler(done));
});

it("Should not have a index.html if the compilation doesn't have a public html configured", (done) => {
    writeEntryPoint();
    createWebpackConfiguration(testDirectory.name, 'development').run(asyncWrapper(done, (_error, r) => {
        if (_error || r!.hasErrors()) {
            createCompilerErrorHandler(done)(_error, r);
        } else {
            expect(existsSync(join(testDirectory.name, "build", "index.html"))).toBe(false)
            done()
        }
    }));
});

it("Should have an index.html if the compilation does have a public html configured", (done) => {
    writeEntryPoint();
    writePublicHTML();
    createWebpackConfiguration(testDirectory.name, 'development').run(asyncWrapper(done, (_error, r) => {
        if (_error || r!.hasErrors()) {
            createCompilerErrorHandler(done)(_error, r);
        } else {
            expect(existsSync(join(testDirectory.name, "build", "index.html"))).toBe(true);
            done();
        }
    }));
});

it("Should be able to parse js files", (done) => {
    writeEntryPointWithJS();
    createWebpackConfiguration(testDirectory.name, 'development').run(createCompilerErrorHandler(done));
})

it("Should be able to parse tsx files", (done) => {
    writeEntryPointWithTSX();
    createWebpackConfiguration(testDirectory.name, 'development').run(createCompilerErrorHandler(done));
})

it("The babel should be customizable from the application that is using this lib", (done) => {
    writeEntryPointWithJS();
    writeBabelRC();
    createWebpackConfiguration(testDirectory.name, 'development').run(asyncWrapper(done, (_error, r) => {
        if (_error || r!.hasErrors()) {
            createCompilerErrorHandler(done)(_error, r);
        } else {
            expect(require.cache[join(testDirectory.name, ".babelrc.js")]).toBeDefined();
            done();
        }
    }));
})

function writeEntryPointWithStyle(styleType: "scss" | "css") {
    createNodeModulesFolder();
    mkdirSync(join(testDirectory.name, "src"));
    writeFileSync(
        join(testDirectory.name, 'src', `styles.${styleType}`),
        `
        ${styleType === "css" ? "" : "$someVar: blue;"}
        div {
            background-color: ${styleType === "css" ? "blue" : "$someVar"};
        }`
    )
    writeFileSync(
        join(testDirectory.name, 'src', 'component.tsx'),
        `import './styles.${styleType}';

export function Component() { return <h1>Some text</h1> }`
    )
    writeFileSync(
        join(testDirectory.name, 'src', 'index.ts'),
        `import React from 'react';
import ReactDOM from 'react-dom';
import { Component } from "./component";

ReactDOM.render(React.createElement(Component), document.body);
`,
    );
}

it.each([["scss", undefined], ["css", undefined]] as const)("Should be able to parse %s files", (styleType) => {
    writeEntryPointWithStyle(styleType);
    const promise = createAsyncCb();
    createWebpackConfiguration(testDirectory.name, 'development').run(createCompilerErrorHandler(promise.callback));
    return promise;
})
function writeEntryPointWithJSON() {
    createNodeModulesFolder();
    mkdirSync(join(testDirectory.name, "src"));
    writeFileSync(
        join(testDirectory.name, 'src', `somejson.json`),
        `{
            "some": "prop",
            "another": "property"
        }`
    )
    writeFileSync(
        join(testDirectory.name, 'src', 'component.tsx'),
        `import {some} from './somejson.json';

export function Component() { return <h1>{some}</h1> }`
    )
    writeFileSync(
        join(testDirectory.name, 'src', 'index.ts'),
        `import React from 'react';
import ReactDOM from 'react-dom';
import { Component } from "./component";

ReactDOM.render(React.createElement(Component), document.body);
`,
    );
}

it("Should be able to load json", (done) => {
    writeEntryPointWithJSON();
    createWebpackConfiguration(testDirectory.name, 'development').run(createCompilerErrorHandler(done));
});

/**
 * When experimenting with the microfrontends arhitecture, using this react predefined loader, it doesn't load the main class, making some styles break
 * Let's refactor this with help from the documentation
 */
it.todo("Should be able to load all css files when using the mini-css-extract-plugin")