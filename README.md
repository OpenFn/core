# OpenFn Core [![Build Status](https://travis-ci.org/OpenFn/core.svg?branch=master)](https://travis-ci.org/OpenFn/core)

Core is the central job processing program used in the OpenFn platform. It
creates an isolated Node VM, passes in `state` and an `expression`, then runs
the expression in this limited access Node VM.

## Getting Started

It's recommended to start by getting [openfn-devTools](https://github.com/OpenFn/openfn-devtools) 
setup for a quick development environment on your machine. 

After that you can use `core execute` to run your jobs.

**Install via NPM**

```sh
npm install @openfn/core
core
```

**Via git**

```sh
git clone git@github.com:OpenFn/core.git
cd core
./bin/core
```

### Execute

Used to convert an expression into an executable script.

**Options**:

```
-l, --language    resolvable language/adaptor path                [required]
-e, --expression  target expression to execute                    [required]
-s, --state       Path to initial state file.                     [required]
-o, --output      Path to write result from expression
-t, --test        Intercepts and logs all HTTP requests to console
```

**Examples**

Use a module in the parent folder, and pick out the `Adaptor` member.

```
core execute -l ../language-http.Adaptor -e exp.js -s state.json
```

Use a npm installed module, and pick out the `Adaptor` member.

```
core execute -l language-http.Adaptor -e exp.js -s state.json
```

## Using Programmatically

When creating your own runtimes, it makes more sense to call the execution
code directly in NodeJS instead of via the command line.

```js
const {
  Compile,
  Execute,
  transforms: { defaultTransforms, verify },
  sandbox: { buildSandbox, VMGlobals },
} = require('./lib');

const {
  modulePath,
  getModule,
  readFile,
  writeJSON,
  formatCompileError,
} = require('./lib/utils');

(async function () {
  const state = JSON.parse(await readFile('./test/fixtures/addState.json'));
  const code = await readFile('./test/fixtures/addExpression.js.expression');
  const Adaptor = getModule(modulePath('../language-common'));

  // Setup our initial global object, adding language packs and any other
  // objects we want on our root.
  const sandbox = buildSandbox({
    noConsole: false,
    testMode: false,
    extensions: [Adaptor],
  });

  // Apply some transformations to the code (including a verify step) to
  // check all function calls are valid.
  const compile = new Compile(code, [
    ...defaultTransforms,
    verify({ sandbox: { ...sandbox, ...VMGlobals} }),
  ]);

  if (compile.errors.length > 0) {
    throw new Error(
      compile.errors.map(err => formatCompileError(code, err)).join('\n')
    );
  }

  try {
    // Run the expression and get the resulting state
    const finalState = await Execute({
      expression: compile.toString(),
      state,
      sandbox,
    });

    writeJSON('/tmp/output.json', finalState);
  } catch (err) {
    console.error(err);
  }
})();
```

> **NOTE**  
> We add VMGlobals to the `verify` transform, and not into
> the sandbox that `Execute` uses, as VM2 provides it's own proxied copies
> of these functions for each invocation - but we still need the validation
> step to be aware that these generic functions are available

## Debugging

Note that only certain parts of Node are whitelisted for use in Core.
These are the [globals exposed by VM2](https://github.com/patriksimek/vm2/blob/a63bef73e7239f9d14e48280b3c6f6763a5145d5/lib/main.js#L240-L265)
and the `extensions` we add for each run:

```js
const extensions = Object.assign(
  {
    console: argv.noConsole ? disabledConsole : console, // --nc or --noConsole
    testMode: argv.test, // --t or --test
    setTimeout, // We allow as Erlang will handle killing long-running VMs.
  },
  Adaptor
);
```

This means that you'll have access to whatever is exposed by the
language-package (aka `Adaptor`), `console` (unless blocked by a project
administrator for OpenFn Platform projects), and `setTimeout`. The `testMode`
property is used to intercept HTTP requests for offline testing.

## Writing language-packages

### Canonical sync "operation" or "helper function" for a language-pacakge

```js
export function sample(arg1, arg2) {
  return state => {
    state.output = arg1 + arg2;
    return state;
  };
}
```

### Canonical async "operation" or "helper function" for a language-pacakge

```js
export function sample(arg1, arg2) {
  return state => {
    return new Promise((resolve, reject) => {
      try {
        state.output = arg1 + arg2;
        resolve(state);
      } catch (error) {
        reject(error);
      }
    });
  };
}
```

## Internal notes on how execute works

```js
(function(state) {
  execute(
    alterState(() => {}),
    alterState((state) => {}), // function(state) { }
    alterState(() => {})
  )(state);
})(state)

[
  (alterState(() => {}), alterState(() => {}), alterState(() => {}))
].reduce((acc, v) => {
  return v(state).then(acc)
}, new Promise);


f(state).then((state) => return state).then()
```
